// HTML Processor — with ES module bundling support (Option 1)
//
// When a <script type="module"> is encountered, the bundler:
//   1. Recursively resolves imports from the VFS
//   2. Strips export/import keywords
//   3. Wraps everything in an IIFE
//
// Limitations (by design — keep it simple):
//   - No export * from
//   - No bare specifiers (e.g. 'react') — left as-is, will fail at runtime
//   - Circular imports: detected and skipped (first visit wins)
//   - dynamic import() is rewritten to __vfs_module() which is injected
//     into the iframe by buildInterceptorScript() in app.js

class HTMLProcessor {
  constructor(vfs) {
    this.vfs = vfs;
  }

  process(html, basePath = '/', depth = 0) {
    if (depth > 5) return html; // Prevent infinite iframe recursion

    html = this.rewriteModuleScripts(html, basePath);
    html = this.rewriteScriptTags(html, basePath);
    html = this.rewriteLinkTags(html, basePath);
    html = this.rewriteStyleTags(html, basePath);
    html = this.rewriteImgTags(html, basePath);
    html = this.rewriteUseTags(html, basePath);
    html = this.rewriteSourceTags(html, basePath);
    html = this.rewriteIframeTags(html, basePath, depth);

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

  /**
   * Bundle a module script using a CommonJS-style module registry.
   *
   * Each file gets its own factory function scope inside a __modules object,
   * so module-level const/let/var declarations never collide across files —
   * even if multiple modules use the same variable name (e.g. TEMPLATE).
   *
   * The registry pattern:
   *   __modules['/path/to/file.js'] = function(exports, require) { ... };
   *
   * Imports are rewritten to:
   *   const { foo } = require('/resolved/path.js');
   *
   * Exports are rewritten to:
   *   exports.foo = foo;   (named)
   *   exports.default = x; (default)
   *
   * Entry point exports are also exposed on window for interop with
   * classic <script> tags on the same page.
   */
  bundleModuleScript(entryContent, basePath) {
    entryContent = entryContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    const visited  = new Set();
    const order    = []; // insertion order for registry entries
    const registry = {}; // path -> transformed source string

    const visit = (content, filePath) => {
      if (visited.has(filePath)) return;
      visited.add(filePath);

      content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

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
      `  __modules[${JSON.stringify(p)}] = function(exports, require) {\n` +
      this.indent(registry[p], 4) +
      `\n  };`
    ).join('\n\n');

    // -- Expose entry-point exports on window -----------------------------
    // We expose ALL named exports as window globals so classic <script> tags
    // on the same page can access them — mirrors native ES module behaviour.
    // For a default-only export that is an object, we spread its keys onto
    // window (e.g. export default { Greeter, greet, VERSION }).
    const windowExposure =
      `  var __entry = __require(${JSON.stringify(basePath)});\n` +
      `  if (__entry) {\n` +
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
    // Module not in registry — was not statically reachable.
    // Fall back to the iframe interceptor's __vfs_module if available,
    // but ONLY if it is the real async postMessage handler, not our alias.
    // We detect this by checking __vfs_module !== __require.
    if (typeof __vfs_module === 'function' && __vfs_module !== __require) {
      return __vfs_module(id);
    }
    console.warn('[FORGE bundler] Module not found in registry: ' + id);
    return {};
  }
  var exports = {};
  __moduleCache[id] = exports; // set before calling to handle circular deps
  __modules[id](exports, __require);
  return exports;
}
// __dynamic_import: resolves a relative specifier against a known base path,
// then calls __require. Used by dynamic import() calls inside bundled modules.
function __dynamic_import(base, specifier) {
  // If specifier is absolute, use it directly.
  if (typeof specifier === 'string' && (specifier.startsWith('/') || specifier.startsWith('http'))) {
    return Promise.resolve(__require(specifier));
  }
  // Resolve relative path against base file path.
  var dir = base.substring(0, base.lastIndexOf('/') + 1);
  var parts = (dir + specifier).split('/');
  var out = [];
  for (var i = 0; i < parts.length; i++) {
    if (parts[i] === '..') { out.pop(); }
    else if (parts[i] !== '.' && parts[i] !== '') { out.push(parts[i]); }
  }
  var resolved = '/' + out.join('/');
  return Promise.resolve(__require(resolved));
}

// -- Module definitions --------------------------------------------------------
${registryEntries}

// -- Boot & expose entry-point exports ----------------------------------------
${windowExposure}

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

  /**
   * Rewrite a module file for the CJS registry bundler.
   *
   * Imports  → require() calls
   * Exports  → exports.x = x assignments
   *
   * The result runs inside a factory function(exports, require) { ... }
   * so every module has its own scope — no name collisions possible.
   */
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
      const requireCall = `__require(${JSON.stringify(resolvedId)})`;

      let replacement;

      if (imp.namespaceName) {
        // import * as Foo from './foo'  →  var Foo = require('./foo')
        replacement = `var ${imp.namespaceName} = ${requireCall};`;

      } else if (imp.defaultName && imp.names.length > 0) {
        // import Foo, { bar, baz } from './foo'
        const named = imp.names.map(n =>
          n.imported === n.local ? n.local : `${n.imported}: ${n.local}`
        ).join(', ');
        replacement =
          `var __imp_${imp.defaultName} = ${requireCall};\n` +
          `var ${imp.defaultName} = __imp_${imp.defaultName}.default !== undefined ? __imp_${imp.defaultName}.default : __imp_${imp.defaultName};\n` +
          `var { ${named} } = __imp_${imp.defaultName};`;

      } else if (imp.defaultName) {
        // import Foo from './foo'  →  var Foo = require('./foo').default ?? require('./foo')
        replacement =
          `var __imp_${imp.defaultName} = ${requireCall};\n` +
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
      /^export\s+default\s+(function|class)\s+(\w+)/gm,
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
      }).filter(Boolean).join('\n');
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

    // -- Rewrite dynamic import() → __dynamic_import(__base, ...) ---------
    // We can't use bare __require() here because the specifier may be
    // relative (e.g. './config.js') while registry keys are absolute.
    // __dynamic_import is emitted into the bundle header and resolves
    // the path before calling __require, keeping everything synchronous.
    const escapedPath = JSON.stringify(filePath);
    result = result.replace(/\bimport\s*\(/g, `__dynamic_import(${escapedPath}, `);

    return result.trim();
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

    return result.trim();
  }

  /**
   * Generate a stable variable name for a file's default export.
   */
  defaultExportName(filePath) {
    return '__default_' + filePath.replace(/[^a-zA-Z0-9]/g, '_').replace(/^_+/, '');
  }

  isBareSpecifier(source) {
    // A bare specifier is a package name like 'react' or 'vue'.
    // Specifiers that look like filenames (contain a dot suggesting an
    // extension, e.g. 'pq.js', 'lib/foo.js') are treated as relative
    // paths missing the leading './' and resolved against the base path.
    // Absolute URLs (http/https) are also not bare specifiers.
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
        return `<script${before}${after}>\n${stripped}\n<\/script>`;
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

  /**
   * Find inline <style>...</style> blocks (not <link>-loaded stylesheets —
   * those go through rewriteLinkTags) and rewrite any url(...) references
   * inside them to VFS blob URLs, using the HTML page's own basePath since
   * an inline block has no separate file path of its own.
   *
   * Without this, a @font-face or background-image url() written directly
   * inside a <style> tag in the HTML is never touched by anything — it's
   * not a <link> stylesheet (handled by rewriteLinkTags) and not a JS
   * fetch() call (handled by the runtime interceptor) — so it silently
   * falls through to a real, failing network request.
   */
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
          // Rewrite any url(...) references inside the stylesheet (fonts,
          // background-images, etc.) to VFS blob URLs BEFORE inlining, using
          // the stylesheet's own resolved path as the base — not the HTML
          // page's basePath — so relative url()s resolve correctly.
          content = this.rewriteCssUrls(content, resolvedPath);
          return `<style${before}${after}>\n${content}\n</style>`;
        }
      }

      return match;
    });
  }

  /**
   * Scan CSS text for url(...) references — used in @font-face src,
   * background-image, list-style-image, cursor, etc. — and rewrite any
   * that resolve to a file in the VFS to use its blob URL instead.
   *
   * Without this, a stylesheet's url() references are left as literal
   * paths, and since url() triggers a real browser-level resource fetch
   * (not a JS fetch() call), FORGE's fetch interceptor never sees it —
   * the browser just 404s against the live server.
   *
   * data: URIs and absolute http(s)/protocol-relative URLs are left
   * untouched, since those already work without any VFS involvement.
   */
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