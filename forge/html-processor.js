class HTMLProcessor {
  constructor(vfs) {
    this.vfs = vfs;
  }
  process(html, basePath = '/', depth = 0) {
    if (depth > 5) return html; // Prevent infinite iframe recursion
    const scripts = [];
    html = html.replace(/<script\b[\s\S]*?<\/script>/gi,
      m => `<!--forge-script-${scripts.push(m) - 1}-->`);
    html = this.rewriteLinkTags(html, basePath);
    html = this.rewriteStyleTags(html, basePath);
    html = this.rewriteImgTags(html, basePath);
    html = this.rewriteUseTags(html, basePath);
    html = this.rewriteSourceTags(html, basePath);
    html = this.rewriteIframeTags(html, basePath, depth);
    html = html.replace(/<!--forge-script-(\d+)-->/g, (_, i) => scripts[i]);
    html = this.rewriteModuleScripts(html, basePath);
    html = this.rewriteScriptTags(html, basePath);
    return html;
  }
  // -- Module bundling -------------------------------------------------------
  /**
   * Find all <script type="module"> blocks and inline them.
   * Must run BEFORE rewriteScriptTags so we don't double-process.
   */
  rewriteModuleScripts(html, basePath) {
    return html.replace(
      /<script([^>]*?)type=["']module["']([^>]*?)>([\s\S]*?)<\/script>/gi,
      (match, before, after, inlineContent) => {
        const srcMatch = (before + after).match(/src=["']([^"']+)["']/i);
        let content;
        let scriptBasePath = basePath;
        if (srcMatch) {
          const resolvedPath = this.resolvePath(srcMatch[1], basePath);
          content = this.vfs.getFile(resolvedPath);
          if (content === undefined) return match;
          scriptBasePath = resolvedPath;
        } else {
          content = inlineContent;
        }
        try {
          const bundled = this.bundleModuleScript(content, scriptBasePath);
          return `<script>\n${bundled}\n<\/script>`;
        } catch (e) {
          console.warn('[FORGE] Module bundling failed:', e.message);
          return match;
        }
      }
    );
  }
  bundleModuleScript(entryContent, basePath, exposeEntry = true) {
    entryContent = entryContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const visited  = new Set();
    const order    = []; // insertion order for registry entries
    const registry = {}; // path -> transformed source string
    const sourceLines = {}; // path -> original source line count
    const visit = (content, filePath) => {
      if (visited.has(filePath)) return;
      visited.add(filePath);
      content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      sourceLines[filePath] = content.split('\n').length;
      const imports = this.parseImports(content);
      // Recurse into dependencies first (depth-first) so they are
      // registered before the files that depend on them.
      for (const imp of imports) {
        if (this.isBareSpecifier(imp.source)) continue;
        const depPath    = this.resolvePath(imp.source, filePath);
        const depContent = this.vfs.getFile(depPath);
        if (depContent !== undefined) {
          visit(depContent, depPath);
        }
      }
      registry[filePath] = this.stripModuleSyntaxCJS(content, filePath, imports);
      order.push(filePath);
    };
    visit(entryContent, basePath);
    // -- Build the registry object ----------------------------------------
    const registryEntries = order.map(p =>
      `  __modules[${JSON.stringify(p)}] = async function(exports, require, __forge_meta, __forge_done) { /*__FORGE_SOURCE__${encodeURIComponent(p)}:${sourceLines[p]}*/\n` +
      this.indent(registry[p], 4) +
      `\n    __forge_done();\n  };`
    ).join('\n\n');
    const windowExposure =
      `  var __entry = __require(${JSON.stringify(basePath)});\n` +
      `  if (__entry instanceof Promise) __entry = await __entry;\n` +
      `  if (${exposeEntry ? '__entry' : 'false'}) {\n` +
      `    Object.keys(__entry).forEach(function(k) {\n` +
      `      if (k === 'default') {\n` +
      `        var d = __entry.default;\n` +
      `        if (d != null && typeof d === 'object' && !Array.isArray(d)) {\n` +
      `          Object.keys(d).forEach(function(dk) { window[dk] = d[dk]; });\n` +
      `        }\n` +
      `      } else {\n` +
      `        window[k] = __entry[k];\n` +
      `      }\n` +
      `    });\n` +
      `  }`;
    return `(async function () {
'use strict';
// -- Module registry (FORGE bundler) ------------------------------------------
var __modules = {};
var __moduleCache = {};
function __require(id) {
  if (__moduleCache[id]) return __moduleCache[id];
  if (!__modules[id]) {
    if (typeof __vfs_module === 'function' && __vfs_module !== __require) {
      return __vfs_module(id);
    }
    console.warn('[FORGE bundler] Module not found in registry: ' + id);
    return {};
  }
  var exports = {};
  __moduleCache[id] = exports; // set before calling to handle circular deps
  var meta = Object.assign(Object.create(null), {
    url: 'forge-vfs://' + id.split('/').map(encodeURIComponent).join('/')
  });
  // Async factories still run immediately until their first await.
  // Keep synchronous modules synchronous for existing preview scripts.
  var complete = false;
  var completion = __modules[id](exports, __require, meta, function() {
    complete = true;
  });
  if (!complete) {
    var pending = completion.then(function() { return exports; });
    __moduleCache[id] = pending;
    return pending;
  }
  return exports;
}
// __dynamic_import: resolves a relative specifier against a known base path,
// then calls __require. Used by dynamic import() calls inside bundled modules.
function __dynamic_import(base, specifier, options) {
  return Promise.resolve().then(function() {
    var baseUrl = 'forge-vfs://' +
      base.split('/').map(encodeURIComponent).join('/');
    var reference = new URL(String(specifier), baseUrl);
    if (reference.protocol === 'forge-vfs:') {
      var resolved = decodeURIComponent(reference.pathname);
      if (__modules[resolved]) return __require(resolved);
    }
    if (typeof __vfs_module === 'function') {
      return __vfs_module(reference.href, base, options);
    }
    throw new Error('[FORGE] Dynamic module loader unavailable: ' + reference.href);
  });
}
// -- Module definitions --------------------------------------------------------
${registryEntries}
// -- Boot & expose entry-point exports ----------------------------------------
${windowExposure}
return __entry;
})();`;
  }
  /**
   * Parse import statements from module source.
   * Returns array of { raw, names, defaultName, namespaceName, source }
   */
  parseImports(content) {
    const imports = [];
    // Only match single-line import statements to avoid accidentally
    // spanning into dynamic import() calls deeper in the file.
    // [^\n] instead of [\s\S] ensures we never cross a line boundary.
    const importRe = /^[ \t]*import\s+([^\n]*?)\s+from\s+['"]([^'"]+)['"]\s*;?/gm;
    const sideEffectRe = /^[ \t]*import\s+['"]([^'"]+)['"]\s*;?/gm;
    // Non-anchored pass for minified bundles where import{} appears
    // mid-line with no leading whitespace or newline.
    // We run this first so the anchored pass can skip duplicates.
    const minifiedImportRe = /\bimport\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g;
    const seen = new Set();
  let m;
    while ((m = minifiedImportRe.exec(content)) !== null) {
      const key = m[0].trim();
      if (seen.has(key)) continue;
      seen.add(key);
      const source = m[2];
      const entry = { raw: m[0], source, names: [], defaultName: null, namespaceName: null };
      entry.names = this.parseNamedImports(m[1]);
      imports.push(entry);
    }
    while ((m = importRe.exec(content)) !== null) {
      if (seen.has(m[0].trim())) continue;
      const clause = m[1].trim();
      const source = m[2];
      const entry = { raw: m[0], source, names: [], defaultName: null, namespaceName: null };
      const defaultAndNamespace = clause.match(
        /^(\w+)\s*,\s*\*\s+as\s+(\w+)$/
      );
      if (defaultAndNamespace) {
        entry.defaultName = defaultAndNamespace[1];
        entry.namespaceName = defaultAndNamespace[2];
        imports.push(entry);
        continue;
      }
      const nsMatch = clause.match(/^\*\s+as\s+(\w+)$/);
      if (nsMatch) {
        entry.namespaceName = nsMatch[1];
        imports.push(entry);
        continue;
      }
      const defaultAndNamed = clause.match(/^(\w+)\s*,\s*\{([^}]*)\}$/);
      const namedOnly = clause.match(/^\{([^}]*)\}$/);
      const defaultOnly = clause.match(/^(\w+)$/);
      if (defaultAndNamed) {
        entry.defaultName = defaultAndNamed[1];
        entry.names = this.parseNamedImports(defaultAndNamed[2]);
      } else if (namedOnly) {
        entry.names = this.parseNamedImports(namedOnly[1]);
      } else if (defaultOnly) {
        entry.defaultName = defaultOnly[1];
      }
      imports.push(entry);
    }
    while ((m = sideEffectRe.exec(content)) !== null) {
      imports.push({ raw: m[0], source: m[1], names: [], defaultName: null, namespaceName: null });
    }
    return imports;
  }
  parseNamedImports(clause) {
    return clause.split(',').map(s => {
      s = s.trim();
      if (!s) return null;
      const asParts = s.split(/\s+as\s+/);
      return { imported: asParts[0].trim(), local: (asParts[1] || asParts[0]).trim() };
    }).filter(Boolean);
  }
  // Rewrite executable references while preserving strings, comments,
  // regular expressions, template text, and source line counts.
  rewriteModuleReferences(content, filePath) {
    const dynamic = '__dynamic_import.bind(null, ' +
      JSON.stringify(filePath) + ')';
    const isWord = c => !!c && /[\w$]/.test(c);
    const skipTrivia = start => {
      let i = start;
      while (i < content.length) {
        if (/\s/.test(content[i])) {
          i++;
        } else if (content.startsWith('//', i)) {
          const end = content.indexOf('\n', i + 2);
          i = end < 0 ? content.length : end;
        } else if (content.startsWith('/*', i)) {
          const end = content.indexOf('*/', i + 2);
          i = end < 0 ? content.length : end + 2;
        } else {
          break;
        }
      }
      return i;
    };
    const scan = (start, interpolation = false) => {
      let output = '';
      let i = start;
      let depth = 0;
      let previous = '';
      let regexAllowed = true;
      const parens = [];
      while (i < content.length) {
        const c = content[i];
        if (interpolation && c === '}' && depth === 0) break;
        if (/\s/.test(c)) {
          output += c;
          i++;
          continue;
        }
        if (content.startsWith('//', i) ||
            content.startsWith('/*', i)) {
          const line = content[i + 1] === '/';
          const end = content.indexOf(line ? '\n' : '*/', i + 2);
          const next = end < 0 ? content.length : end + (line ? 0 : 2);
          output += content.slice(i, next);
          i = next;
          continue;
        }
        if (c === '"' || c === "'") {
          const begin = i++;
          while (i < content.length) {
            if (content[i] === '\\') {
              i += 2;
            } else if (content[i++] === c) {
              break;
            }
          }
          output += content.slice(begin, i);
          previous = 'value';
          regexAllowed = false;
          continue;
        }
        if (c === '`') {
          output += content[i++];
          while (i < content.length) {
            if (content[i] === '\\') {
              output += content.slice(i, i + 2);
              i += 2;
            } else if (content[i] === '`') {
              output += content[i++];
              break;
            } else if (content.startsWith('${', i)) {
              const inner = scan(i + 2, true);
              output += '${' + inner.output;
              i = inner.end;
              if (content[i] === '}') output += content[i++];
            } else {
              output += content[i++];
            }
          }
          previous = 'value';
          regexAllowed = false;
          continue;
        }
        if (c === '/' && regexAllowed && content[i + 1] !== '=') {
          const begin = i++;
          let inClass = false;
          while (i < content.length) {
            const next = content[i++];
            if (next === '\\') i++;
            else if (next === '[') inClass = true;
            else if (next === ']') inClass = false;
            else if (next === '/' && !inClass) break;
          }
          while (/[a-z]/i.test(content[i] || '') && i < content.length) i++;
          output += content.slice(begin, i);
          previous = 'value';
          regexAllowed = false;
          continue;
        }
        if (/[A-Za-z_$]/.test(c)) {
          const begin = i++;
          while (isWord(content[i])) i++;
          const word = content.slice(begin, i);
          const next = skipTrivia(i);
          if (word === 'import' && previous !== '.') {
            if (content[next] === '.') {
              const member = skipTrivia(next + 1);
              if (content.slice(member, member + 4) === 'meta' &&
                  !isWord(content[member + 4])) {
                const end = member + 4;
                output += '__forge_meta' +
                  content.slice(i, end).replace(/[^\r\n]/g, ' ');
                i = end;
                previous = 'value';
                regexAllowed = false;
                continue;
              }
            } else if (content[next] === '(') {
              output += dynamic;
              previous = 'value';
              regexAllowed = false;
              continue;
            }
          }
          output += word;
          previous = word;
          regexAllowed =
            /^(return|throw|case|delete|void|typeof|new|yield|await|in|instanceof|else|do)$/.test(word);
          continue;
        }
        if (/[0-9]/.test(c)) {
          const begin = i++;
          while (/[\w.]/.test(content[i] || '') && i < content.length) i++;
          output += content.slice(begin, i);
          previous = 'value';
          regexAllowed = false;
          continue;
        }
        if (c === '(') {
          parens.push(/^(if|while|for|with|switch|catch)$/.test(previous));
          regexAllowed = true;
        } else if (c === ')') {
          regexAllowed = parens.pop() === true;
        } else {
          if (c === '{') depth++;
          if (c === '}') depth--;
          regexAllowed = c !== ']' && c !== '.';
          if ((c === '+' || c === '-') && content[i + 1] === c) {
            output += c + c;
            i += 2;
            previous = 'value';
            regexAllowed = false;
            continue;
          }
        }
        output += c;
        previous = c;
        i++;
      }
      return { output, end: i };
    };
    return scan(0).output;
  }
  stripModuleSyntaxCJS(content, filePath, imports) {
    let result = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    // -- Rewrite import statements → require() ----------------------------
    for (const imp of imports) {
      if (this.isBareSpecifier(imp.source)) {
        // Bare specifier (e.g. 'vue') — remove the import, warn at runtime
        result = result.replace(imp.raw, `/* [FORGE] bare specifier '${imp.source}' not supported */`);
        continue;
      }
      const resolvedId = this.resolvePath(imp.source, filePath);
      const call = `__require(${JSON.stringify(resolvedId)})`;
      const requireCall =
        `(${call} instanceof Promise ? await ${call} : ${call})`;
      let replacement;
      if (imp.namespaceName) {
        // import * as Foo from './foo'  →  var Foo = require('./foo')
        replacement = `var ${imp.namespaceName} = ${requireCall};`;
        if (imp.defaultName) {
          replacement +=
            ` var ${imp.defaultName} = ` +
            `${imp.namespaceName}.default !== undefined ? ` +
            `${imp.namespaceName}.default : ${imp.namespaceName};`;
        }
      } else if (imp.defaultName && imp.names.length > 0) {
        // import Foo, { bar, baz } from './foo'
        const named = imp.names.map(n =>
          n.imported === n.local ? n.local : `${n.imported}: ${n.local}`
        ).join(', ');
        replacement =
          `var __imp_${imp.defaultName} = ${requireCall}; ` +
          `var ${imp.defaultName} = __imp_${imp.defaultName}.default !== undefined ? __imp_${imp.defaultName}.default : __imp_${imp.defaultName}; ` +
          `var { ${named} } = __imp_${imp.defaultName};`;
      } else if (imp.defaultName) {
        // import Foo from './foo'  →  var Foo = require('./foo').default ?? require('./foo')
        replacement =
          `var __imp_${imp.defaultName} = ${requireCall}; ` +
          `var ${imp.defaultName} = __imp_${imp.defaultName}.default !== undefined ? __imp_${imp.defaultName}.default : __imp_${imp.defaultName};`;
      } else if (imp.names.length > 0) {
        // import { foo, bar as baz } from './foo'
        const named = imp.names.map(n =>
          n.imported === n.local ? n.local : `${n.imported}: ${n.local}`
        ).join(', ');
        replacement = `var { ${named} } = ${requireCall};`;
      } else {
        // import './foo'  (side-effect only)
        replacement = `${requireCall};`;
      }
      result = result.replace(imp.raw, replacement);
    }
    // -- Rewrite export statements → exports.x = x ------------------------
    // export default function/class Name → function/class Name + exports.default = Name
    result = result.replace(
      /^export\s+default\s+(async\s+function|function|class)\s+(\w+)/gm,
      (_, kw, name) => `${kw} ${name}`
    );
    // After stripping, we need to add the exports.default assignment.
    // We do a second pass below for default exports.
    // export default <expr> (not function/class)
    result = result.replace(
      /^export\s+default\s+(?!function|class)/gm,
      'exports.default = '
    );
    // export async function name → async function name  (+ exports assignment appended below)
    const exportedAsyncFns = [];
    result = result.replace(
      /^export\s+async\s+function\s+(\w+)/gm,
      (_, name) => { exportedAsyncFns.push(name); return `async function ${name}`; }
    );
    // export function/class name → declaration  (+ exports assignment appended below)
    const exportedFnsClasses = [];
    result = result.replace(
      /^export\s+(function|class)\s+(\w+)/gm,
      (_, kw, name) => { exportedFnsClasses.push(name); return `${kw} ${name}`; }
    );
    // export const/let/var name → declaration  (+ exports assignment appended below)
    // NOTE: only captures the first identifier — destructuring not supported
    const exportedVars = [];
    result = result.replace(
      /^export\s+(const|let|var)\s+(\w+)/gm,
      (_, kw, name) => { exportedVars.push(name); return `${kw} ${name}`; }
    );
  // export { foo, bar as baz } (no 'from') → exports.foo = foo; exports.baz = bar;
    // Two passes: anchored (normal source) + non-anchored (minified bundles).
    const rewriteExportClause = (clause) => {
      return clause.split(',').map(s => {
        s = s.trim();
        if (!s) return '';
        const parts = s.split(/\s+as\s+/);
        const local    = parts[0].trim();
        const exported = (parts[1] || parts[0]).trim();
        if (!local || !exported) return '';
        return `exports.${exported} = typeof ${local} !== 'undefined' ? ${local} : undefined;`;
      }).filter(Boolean).join(' ');
    };
    // Anchored pass — normal multi-line source files.
    result = result.replace(
      /^export\s+\{([^}]+)\}\s*;?$/gm,
      (_, clause) => rewriteExportClause(clause)
    );
    // Non-anchored pass — catches minified single-line bundles where the
    // export{} block is not at the start of a line (e.g. hyparquet/pq.js).
    // Only fires when the anchored pass left an export{ intact.
    result = result.replace(
      /\bexport\s*\{([^}]+)\}\s*;/g,
      (_, clause) => rewriteExportClause(clause)
    );
    // export { x } from './y'  — re-export (not fully supported, comment out)
    result = result.replace(
      /^export\s+\{[^}]*\}\s+from\s+['"][^'"]+['"]\s*;?/gm,
      '/* [FORGE] re-export from not supported */'
    );
    // Non-anchored fallback for minified re-exports.
    result = result.replace(
      /\bexport\s*\{[^}]*\}\s*from\s*['"][^'"]+['"]\s*;?/g,
      '/* [FORGE] re-export from not supported */'
    );
    // export * from './y'  — not supported
    result = result.replace(
      /^export\s+\*\s+from\s+['"][^'"]+['"]\s*;?/gm,
      '/* [FORGE] export * from not supported */'
    );
    // Non-anchored fallback.
    result = result.replace(
      /\bexport\s*\*\s*from\s*['"][^'"]+['"]\s*;?/g,
      '/* [FORGE] export * from not supported */'
    );
    // -- Append exports.x = x for all named exports -----------------------
    // These must come AFTER the declarations so the names are in scope.
    const namedAssignments = [
      ...exportedAsyncFns,
      ...exportedFnsClasses,
      ...exportedVars
    ].map(name => `exports.${name} = ${name};`);
    if (namedAssignments.length > 0) {
      result += '\n' + namedAssignments.join('\n');
    }
    // -- Add exports.default for named function/class default exports ------
    const defaultFnMatch = content.match(
      /^export\s+default\s+(?:async\s+)?(?:function|class)\s+(\w+)/m
    );
    if (defaultFnMatch) {
      result += `\nexports.default = ${defaultFnMatch[1]};`;
    }
    return this.rewriteModuleReferences(result, filePath);
  }
  /**
   * Strip import/export syntax from a module file.
   * Named imports become const aliases if the local name differs from imported.
   */
  stripModuleSyntax(content, filePath, imports) {
    let result = content;
    // Remove static import statements using exact string match on imp.raw.
    // We do NOT use a broad regex here to avoid accidentally consuming
    // dynamic import() calls that appear later in the file body.
    for (const imp of imports) {
      result = result.replace(imp.raw, () => {
        if (imp.namespaceName) {
          return `/* [FORGE bundler] namespace import of '${imp.source}' as ${imp.namespaceName} not fully supported */`;
        }
        const aliases = (imp.names || [])
          .filter(n => n.imported !== n.local)
          .map(n => `const ${n.local} = ${n.imported};`)
          .join('\n');
        return aliases || '';
      });
    }
    // export default function/class — keep declaration, drop 'export default'
    result = result.replace(/^export\s+default\s+(function|class)(\s)/gm, '$1$2');
    // export default <expr> → var __moduleDefault = <expr>
    result = result.replace(
      /^export\s+default\s+(?!function|class)/gm,
      `var ${this.defaultExportName(filePath)} = `
    );
    // export async function → strip export keyword
    result = result.replace(/^export\s+async\s+(function)\s+/gm, 'async $1 ');
    // export const/let/var/function/class → strip export keyword
    result = result.replace(/^export\s+(const|let|var|function|class)\s+/gm, '$1 ');
    // export { a, b as c } — strip entirely
    result = result.replace(/^export\s+\{[^}]*\}\s*;?/gm, '');
    // export { a } from '...' — not supported
    result = result.replace(
      /^export\s+\{[^}]*\}\s+from\s+['"][^'"]+['"]\s*;?/gm,
      '/* [FORGE bundler] re-export not supported */'
    );
    // export * from '...' — not supported
    result = result.replace(
      /^export\s+\*\s+from\s+['"][^'"]+['"]\s*;?/gm,
      '/* [FORGE bundler] export * not supported */'
    );
    // Rewrite dynamic import() → __vfs_module() so the iframe's injected
    // __vfs_module function handles it via the vfs-fetch postMessage channel.
    result = result.replace(/\bimport\s*\(/g, '__vfs_module(');
    return result;
  }
  /**
   * Generate a stable variable name for a file's default export.
   */
  defaultExportName(filePath) {
    return '__default_' + filePath.replace(/[^a-zA-Z0-9]/g, '_').replace(/^_+/, '');
  }
  isBareSpecifier(source) {
    if (source.startsWith('.') || source.startsWith('/')) return false;
    if (/^https?:\/\//.test(source)) return false;
    // If it contains a file extension (e.g. 'pq.js', 'vendor/lib.min.js')
    // treat it as a relative path, not a bare package name.
    if (/\.[a-zA-Z0-9]+$/.test(source)) return false;
    return true;
  }
  indent(code, spaces = 2) {
    const pad = ' '.repeat(spaces);
    return code.split('\n').map(line => pad + line).join('\n');
  }
  // -- Existing rewriters ----------------------------------------------------
  rewriteScriptTags(html, basePath) {
    const scriptRegex = /<script([^>]*?)src=["']([^"']+)["']([^>]*?)>[\s\S]*?<\/script>/gi;
    return html.replace(scriptRegex, (match, before, src, after) => {
      if (/type=["']module["']/i.test(before + after)) return match;
      const resolvedPath = this.resolvePath(src, basePath);
      const content = this.vfs.getFile(resolvedPath);
      if (content !== undefined) {
        const stripped = this.stripExportsForInlining(content);
        return `<script${before}${after}>${stripped}\n//# sourceURL=forge-vfs://${resolvedPath}\n<\/script>`;
      }
      return match;
    });
  }
  /**
   * Strip top-level export keywords from a JS file so it can be safely
   * inlined into a classic (non-module) <script> tag.
   */
  stripExportsForInlining(content) {
    let result = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    result = result.replace(/^export\s+default\s+(function|class)(\s)/gm, '$1$2');
    result = result.replace(/^export\s+default\s+(?!function|class)/gm, 'var __moduleDefault = ');
    result = result.replace(/^export\s+async\s+(function)\s+/gm, 'async $1 ');
    result = result.replace(/^export\s+(const|let|var|function|class)\s+/gm, '$1 ');
    result = result.replace(/^export\s+\{[^}]*\}\s*;?/gm, '');
    result = result.replace(
      /^export\s+(?:\{[^}]*\}|\*)\s+from\s+['"][^'"]+['"]\s*;?/gm,
      '/* [FORGE bundler] re-export not supported */'
    );
    result = result.replace(/\bimport\s*\(/g, '__vfs_module(');
    return result.trim();
  }
  rewriteStyleTags(html, basePath) {
    return html.replace(
      /<style([^>]*?)>([\s\S]*?)<\/style>/gi,
      (match, attrs, cssContent) => {
        const rewritten = this.rewriteCssUrls(cssContent, basePath);
        return `<style${attrs}>${rewritten}</style>`;
      }
    );
  }
  rewriteLinkTags(html, basePath) {
    const linkRegex = /<link([^>]*?)href\s*=\s*["']([^"']+)["']([^>]*?)>/gi;
    return html.replace(linkRegex, (match, before, href, after) => {
      if (match.includes('stylesheet')) {
        const resolvedPath = this.resolvePath(href, basePath);
        let content = this.vfs.getFile(resolvedPath);
        if (content !== undefined) {
          content = this.rewriteCssUrls(content, resolvedPath);
          return `<style${before}${after}>\n${content}\n</style>`;
        }
      }
      return match;
    });
  }
  rewriteCssUrls(css, cssBasePath) {
    return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (match, quote, url) => {
      if (/^(data:|https?:|\/\/)/.test(url)) return match;
      const resolvedPath = this.resolvePath(url, cssBasePath);
      const blobUrl = this.vfs.getDataUrl(resolvedPath);
      return blobUrl ? `url(${blobUrl})` : match;
    });
  }
  rewriteImgTags(html, basePath) {
    const imgRegex = /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi;
    return html.replace(imgRegex, (match, before, src, after) => {
      const resolvedPath = this.resolvePath(src, basePath);
      const blobUrl = this.vfs.getDataUrl(resolvedPath);
      if (blobUrl) {
        return `<img${before}src="${blobUrl}"${after}>`;
      }
      return match;
    });
  }
  rewriteUseTags(html, basePath) {
    const useRegex = /<use([^>]*?)(?:xlink:href|href)=["']([^"'#]+)(#[^"']*)?["']([^>]*?)>/gi;
    return html.replace(useRegex, (match, before, href, hash, after) => {
      const resolvedPath = this.resolvePath(href, basePath);
      const blobUrl = this.vfs.getDataUrl(resolvedPath);
      if (blobUrl) return `<use${before}href="${blobUrl}${hash || ''}"${after}>`;
      return match;
    });
  }
  rewriteSourceTags(html, basePath) {
    const sourceRegex = /<source([^>]*?)srcset=["']([^"']+)["']([^>]*?)>/gi;
    return html.replace(sourceRegex, (match, before, srcset, after) => {
      const resolvedPath = this.resolvePath(srcset, basePath);
      const blobUrl = this.vfs.getDataUrl(resolvedPath);
      if (blobUrl) {
        return `<source${before}srcset="${blobUrl}"${after}>`;
      }
      return match;
    });
  }
  rewriteIframeTags(html, basePath, depth) {
    // Use a robust regex that safely ignores '>' characters inside quoted attributes
    const iframeRegex = /<iframe\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi;
    return html.replace(iframeRegex, (match, attrs) => {
      // 1. Handle existing srcdoc
      const srcdocMatch = attrs.match(/srcdoc\s*=\s*(['"])([\s\S]*?)\1/i);
      if (srcdocMatch) {
        const quote = srcdocMatch[1];
        const rawSrcdoc = srcdocMatch[2];
        const unescaped = this.unescapeHtml(rawSrcdoc);
        const processed = this.process(unescaped, basePath, depth + 1);
        const escaped = this.escapeHtml(processed);
        const newAttrs = attrs.replace(srcdocMatch[0], `srcdoc=${quote}${escaped}${quote}`);
        return `<iframe${newAttrs}>`;
      }
      // 2. Handle local src (convert to srcdoc)
      const srcMatch = attrs.match(/src\s*=\s*(['"])([^'"]+)\1/i);
      if (srcMatch) {
        const src = srcMatch[2];
        if (!/^(https?:|data:|blob:|\/\/)/i.test(src)) {
          let cleanSrc = src;
          const hashIndex = cleanSrc.indexOf('#');
          const queryIndex = cleanSrc.indexOf('?');
          if (hashIndex > -1 || queryIndex > -1) {
            const splitIndex = hashIndex > -1 && queryIndex > -1 ? Math.min(hashIndex, queryIndex) : Math.max(hashIndex, queryIndex);
            cleanSrc = cleanSrc.substring(0, splitIndex);
          }
          const resolvedPath = this.resolvePath(cleanSrc, basePath);
          const content = this.vfs.getFile(resolvedPath);
          if (content !== undefined) {
            const processed = this.process(content, resolvedPath, depth + 1);
            const escaped = this.escapeHtml(processed);
            const newAttrs = attrs.replace(srcMatch[0], `srcdoc="${escaped}"`);
            return `<iframe${newAttrs}>`;
          }
        }
      }
      return match;
    });
  }
  escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  unescapeHtml(str) {
    return str
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  }
  resolvePath(path, basePath) {
    // Strip query strings and hashes before resolving
    const hashIndex = path.indexOf('#');
    const queryIndex = path.indexOf('?');
    if (hashIndex > -1 || queryIndex > -1) {
      const splitIndex = hashIndex > -1 && queryIndex > -1 ? Math.min(hashIndex, queryIndex) : Math.max(hashIndex, queryIndex);
      path = path.substring(0, splitIndex);
    }
    if (path.startsWith('/')) {
      return path;
    }
    const baseDir = basePath.substring(0, basePath.lastIndexOf('/') + 1);
    let resolved = baseDir + path;
    const parts = resolved.split('/');
    const normalized = [];
    for (let part of parts) {
      if (part === '..') {
        normalized.pop();
      } else if (part !== '.' && part !== '') {
        normalized.push(part);
      }
    }
    return '/' + normalized.join('/');
  }
}