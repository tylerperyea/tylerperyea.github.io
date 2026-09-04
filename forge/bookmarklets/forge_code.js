// FORGE Code - Bookmarklet for rapid prototyping with Elsa
// Built from source files in /src/
// To rebuild: node build-runner.js (Node.js) or use FORGE UI Build button (browser)

(function() {
'use strict';

// ============================================================================
// CONFIGURATION
// ============================================================================

const FORGE_CONFIG = {
  FORGE_IDE_URL: (window._forge_ide_url)?(window._forge_ide_url):('https://gsrs.preprod.fda.gov/quickshare/'),
  // Can be overridden at runtime via localStorage: 'forge-ide-url'
};

const FORGE_VERSION = '3.2.2';

// ©¤©¤ Workspace Prompt (built from PROTOCOL.md) ©¤©¤
const WORKSPACE_PROMPT_BUILTIN = `# FORGE Codebase Protocol v2.6 (20260724)

## Commandments

Restate these at the start of every response where you write code. You can abbreviate them.

0. **CRITICAL: DO NOT USE SERVER-SIDE TOOLS.** You may have access to built-in tools like \`GenerateDocument\`, \`QuantitativeAnalysis\`, or Python execution. **DO NOT USE THEM** to create files, write code, or analyze the codebase. You must ONLY use the raw text markdown protocol (\`#new\`, \`#patch\`, \`#execute\`) defined below. All file creation and execution must happen via the client-side bookmarklet protocol.
1. **ALWAYS Escape triple backticks (code fences) as HTML in markdown files and markdown patches** -- 
   Triple backticks MUST be written as the HTML entity (ampersand-hash-96-semicolon) repeated three times. Do not use literal backticks.
   The parser translates these automatically. If you use 3 normal backticks 
   it breaks the parser. 
   ?? REMINDER: Check every markdown file before submitting!
2. **Restate commandments** before each message where you're going to write code for the repo. **Wrap them in a \`<details><summary>FORGE Protocol Commandments</summary>...</details>\` block** so they don't clutter the chat UI.
3. **Follow the protocol** -- paths start with \`/\`, use \`#new\`, \`#replace\`, \`#patch\`, \`#delete\`, \`#move\`, \`#execute\`.
4. **Plan before coding** if the request is ambiguous.
5. **Increment operation and step numbers** -- never reuse them across the whole conversation. All steps and operations are numbers like step-12, never step-12a.
6. **Only one FIND/REPLACE section per patch operation, use multiple patch ops if you need more**
7. **End each message** with a brief status sentence explaining what was just done and what needs to happen next. Whatever needs to happen next, but it in BOLD. Then follow it by the next operation # and step #.
8. Don't write more than 1000 lines of code in a step. If you need more, break into smaller steps, and pause between them.
9. Only one step per response (though may have many operations). 
10. **Wait for execution confirmation** -- When using #execute operations, 
    wait for the user to provide results before proceeding to the next step.
    Don't assume execution succeeded.
11. Wrap every step with ~~~ inside <details>. ALWAYS place an empty blank line immediately after <summary>...</summary> and before </details>. (Without blank lines, Markdown parsers fail to enter code mode and render HTML files directly into chat).
---

## Overview

\`FORGE Code\` is a browser bookmarklet that lets an LLM build and modify a codebase in real-time inside an LLM chat. You write operation headers and content blocks; the bookmarklet parses and applies them to a virtual file system with full version history.

**Default tech stack** (unless told otherwise): HTML, CSS, JavaScript. Use Vue3.js for frontend interactivity, unpkg CDNs for libraries, USWDS conventions for government-style UI, and aim for 508 compliance.

**Coding conventions** (unless told otherwise): small files (less than 1000 lines in a file), few dependencies, few build steps, and whole codebase should be less than 1MB if possible (not counting binaries, and imports).

**Character encoding:** Use ASCII only in code and comments unless the feature explicitly requires otherwise (e.g. UI strings, emoji in user-visible labels). Do not use non-ASCII characters in variable names, function names, comments, or string literals that are not displayed to users. This avoids encoding surprises across editors, terminals, and diff tools.

**Supported operations:** \`#new\` ¡¤ \`#replace\` ¡¤ \`#patch\` ¡¤ \`#delete\` ¡¤ \`#move\` ¡¤ \`#execute\`

---

## Convention Note
The bookmarklet parser doesn't care about the language specified in the code fences. However, some LLM UIs do. And it honors things with 
\`\`\`SOMETHING
\`\`\`
much better than:
\`\`\`
\`\`\`
While we show \`javascript\` and \`patch\` and \`header\` below, they're not strictly necessary to be those languages. But they should have SOME value for the language.


## Operations


### Header Format

\`\`\`header
/path/to/file.ext #<id> #<operation>
\`\`\`

- Path must start with \`/\`. Never wrap it in backticks.
- \`#id\` is unique across the entire conversation -- never reuse.
- For \`#move\`: \`/old/path #5 #move /new/path\`
- For \`#execute\`: path is a label only, not stored.

A content block (code fence) must immediately follow the header for \`#new\`, \`#replace\`, \`#patch\`, and \`#execute\`. It's optional for \`#delete\` and \`#move\`.

---

### #new / #replace -- Create or Replace a File

**Use when:** creating new files, or replacing existing ones entirely. **Prefer this over \`#patch\`** for small files or significant changes -- it's clearer and less error-prone.

Each operation needs a matching line in the step runners:
\`\`\`javascript
repo.addFile('#1', '/path/to/file');    // for #new
repo.replaceFile('#2', '/path/to/file'); // for #replace
\`\`\`

---

### #patch -- Modify Part of a File

**Use when:** making small targeted changes to large files (300+ lines). Use exact string matching -- copy whitespace carefully. Include enough context in the FIND block to be unique (5-20 lines is ideal). Important: One FIND/REPLACE per operation.

**Standard Patch:**
\`\`\`patch
<<<FIND
old code here
>>>
<<<REPLACE
new code here
>>>
\`\`\`

**Range Patch (For deleting/replacing huge chunks):**
Use this when you want to replace a massive block of code without repeating all the middle lines.
\`\`\`patch
<<<FIND_BLOCK_START
start of the section
>>>
<<<FIND_BLOCK_END
end of the section
>>>
<<<REPLACE
new code here
>>>
\`\`\`

Step runner line:
\`\`\`javascript
//codebase #step-<N>
repo.patchFile('#3', '/path/to/file');
\`\`\`

---

### #delete -- Remove a File

No content block needed.

Step runner line:
\`\`\`javascript
//codebase #step-<N>
repo.deleteFile('#4', '/path/to/file');
\`\`\`

---

### #move -- Move or Rename a File

No content block needed.

Step runner line:
\`\`\`javascript
//codebase #step-<N>
repo.moveFile('#5', '/old/path', '/new/path');
\`\`\`

---

### #execute -- Run JavaScript Against the Repo

Runs JavaScript with access to the full \`repo\` API and browser environment. Results are returned via \`repo.sendBack()\`. As always, the user does the operations by clicking "apply steps". The user then clicks the green button **Send to Elsa** (or Send to Claude or Send to ChatGPT depending on usage) to return results if there are any.

\`#execute\` scripts run inside an async function. Top-level \`await\` is supported, and FORGE does not mark the operation or step complete until the script's asynchronous work settles. Await Promise-returning APIs such as \`repo.validate()\` before calling \`repo.sendBack()\`.

Step runner line:
\`\`\`javascript
//codebase #step-<N>
repo.execute('#6', '/script-label.js');
\`\`\`

---

## Step Block & Message Structure
Every step **must** end with a step runner with codebase comment containing all operations for that step. This is what actually gets executed it's not just documentation. It's also got to be at the END of the step.

All operation headers, code blocks, and the step runner should be wrapped in a \`<details>\` block to keep the chat clean.

### Using \`<details>\` Blocks for Agent Mode

Content outside \`<details>\` blocks is **user-facing** and will be displayed in agent mode. Content inside \`<details>\` blocks is **hidden** from agent mode but visible in the chat UI (collapsed by default).

**Use \`<details>\` blocks for:**
- **Codebase operations** (required) -- wrap all operation headers, code blocks, and step summaries
- **Extended thinking** (optional) -- hide verbose reasoning or exploration that doesn't need to be shown in agent mode
- **Debug output** (optional) -- hide technical details that clutter the main narrative

**Agent mode will display:**
- ? "I'm going to fix the upload bug..."
- ? Thinking (hidden)
- ? Operations (hidden, but executed)
- ? "The fix is ready..."

Users can expand any \`<details>\` block in the chat UI to see the hidden content.

<details>
<summary>Codebase Operations</summary>

\`\`\`header
/index.html #1 #new
\`\`\`
\`\`\`html
<h1>Hello</h1>
\`\`\`

\`\`\`javascript
//codebase #step-<N>
repo.addFile('#1', '/index.html');
\`\`\`
</details>

**Rules:**
- First line must be \`//codebase #step-<N>\`
- Must be inside a JavaScript code block
- Operation numbers must match the headers above
- Steps increment sequentially -- never skip or reuse
- The \`</details>\` tag must come AFTER the step runner.

---

## Working with a Shared Repo

The forge ecosystem supports wrapping up a repo as a JSON (called "forging out"). This can include all repo files, and the bookmarklet may send it to you this way. But it can also send the full repo as just a manifest with no content.

If you receive a repo json file that seems to have no file content, that's okay. It does have content, you just have to ask for it via execute.

Before editing a specific file (if you haven't seen it yet), fetch it:

\`\`\`header
/get-file.js #1 #execute
\`\`\`
\`\`\`javascript
repo.sendBack({ content: repo.getContent('/src/core/parsing.js').text() });
\`\`\`

Always check \`repo.fileExists(path)\` and look for missing \`contents\` before patching.

---

## #execute Cookbook

\`\`\`javascript
// List all files
repo.sendBack({ files: repo.listFiles() });

// Read a file
repo.sendBack({ content: repo.getContent('/src/app.js').text() });

// Search across codebase
repo.sendBack({ matches: repo.findContent('TODO', '/src') });

// Validate JavaScript recursively.
// "*.js" matches root-level files; "**/*.js" matches nested files too.
const validation = await repo.validate('**/*.js');
repo.sendBack({ validation });

// Read from localStorage
repo.sendBack({
  forgeUrl: localStorage.getItem('forge-ide-url'),
  workspacePrompt: localStorage.getItem('forge-workspace-prompt')
});

// Open a live preview of the project in a new browser tab
// Defaults to /index.html; pass a path to preview a different entry point.
// You can include a #hash in the path, and pass a message as the second argument.
repo.preview();
repo.preview('/dashboard.html');
repo.preview('settings.html#advanced', 'Check out the new settings!');
\`\`\`

---

## sendBack Queue

- Wiped at the start of each step.
- Populated by \`repo.sendBack()\` in \`#execute\` scripts, and auto-populated on errors.
- The user clicks Apply steps to run any step runner. If the queue has data, the user then clicks Send to Elsa to return the results to the chat.
- On patch errors: narrow the FIND block. On execute errors: check the stack trace.

---

## Repo API Reference

**Content:** \`repo.getContent(path)\` ¡ú \`.text()\`, \`.lines()\`, \`.lineCount()\`, \`.lineAt(n)\`

**Search:** \`repo.findContent(searchTerm, parentPath?)\` ¡ú \`[{ path, lineNum, content, context }]\`

**Modification:** \`repo.replaceLines()\` ¡¤ \`repo.replaceAll()\` ¡¤ \`repo.insertLines()\` ¡¤ \`repo.deleteLines()\` ¡¤ \`repo.applyPatch()\`

**Introspection:** \`repo.listFiles()\` ¡¤ \`repo.fileExists()\` ¡¤ \`repo.getMetadata()\` ¡¤ \`repo.getCurrentStep()\` ¡¤ \`repo.getSummary()\` ¡¤ \`repo.getHistory()\` ¡¤ \`repo.getChanges(stepNum)\`

**Step Diffs:** \`repo.getStepDiff(from?, to?)\` generates a ready-to-apply protocol step (with \`#new\`/\`#patch\`/\`#replace\`/\`#delete\`/\`#move\` ops and a step runner) representing the net change between two history snapshots. \`repo.getStepDiffSummary(from?, to?)\` returns the same range as a compact human-readable summary with op types and line counts but no code content. Both accept positive step numbers (must exist in history), negative indices (\`-1\` = last step, \`-2\` = second-to-last), or no arguments (defaults to the previous step ¡ú last step). A single argument means that step ¡ú current. Passing \`0\` as \`from\` means "before any steps existed." Explicit backwards ranges warn in the console but are honored.

**sendBack:** \`repo.sendBack(data)\` -- appends any JSON-serializable object to the queue.

**Validation:** \`await repo.validate(patterns?)\` ¡ú \`{ success, summary, results }\`. The method returns a Promise. Use \`*.js\` for root-level JavaScript files and \`**/*.js\` for recursive JavaScript validation.

**Preview:** \`repo.preview(target?, message?)\` -- opens a live in-browser preview of the project in a new tab. Defaults to \`/index.html\`. You can append a hash to the target (e.g., \`settings.html#advanced\`) to route the iframe, and pass a string as the second argument to display a floating message. Use this via \`#execute\` to let the user see the running app without leaving the chat.


These are available inside #execute scripts for programmatic file modification. Prefer #patch or #replace operations for most changes -- use these when you need conditional logic or bulk edits across multiple files.

repo.replaceLines(path, start, end, newContent) -- replace a range of lines (1-based, inclusive)
repo.replaceAll(path, searchTerm, replacement) -- replace all occurrences of a string
repo.insertLines(path, lineNum, newContent) -- insert before the given line number
repo.deleteLines(path, start, end) -- delete a range of lines (1-based, inclusive)
repo.applyPatch(path, findBlock, replaceBlock) -- exact string patch, same as #patch but from JS

---
## Full Example

Here's a full step example. Note that this one uses ~~~ wrapping the code, which is always
allowed, and is encouraged but not strictly necessary:
<example>
<details><summary>Forge Commandments Protocol</summary>
0. Don't use server side tools
1-2. Restate Commandments and follow protocol
3. Plan
4. HTML encoding for "inner code fences" "\`\`\`"
5. Never reuse an operation or step number, always increment by 1.
6. Use details tags for commandments, details of thinking, and the code sections.
7. Each response ends with what was done, what's next and the next step number and operation number.
8. 1000 lines of code max per step.
9. One step per response, may have multiple ops.
10. If you execute, wait for a response.
</details>
Oh! I see the issue! Let me add a log for this!
<details><summary>Codebase Operations</summary>

~~~
\`\`\`header
/js/app.js #27 #patch
\`\`\`
\`\`\`patch
<<<FIND
i=i-1;
myMethod(i);
>>>
<<<REPLACE
i=i-1;
if(i<0){
  i=0;
  console.log("i got to 0:"+i); 
  return;
}
myMethod(i);
>>>
\`\`\`
\`\`\`header
/README.MD #28 #patch
\`\`\`
\`\`\`patch
<<<FIND
We call myMethod with a number like:
\`\`\`
myMethod(i);
<<<REPLACE
We call myMethod with a number like:
\`\`\`
//i must be > 0
myMethod(i);
>>>
\`\`\`

\`\`\`javascript
//codebase #step-17
repo.patchFile('#27', '/README.MD');
repo.patchFile('#28', '/js/app.js');
\`\`\`
~~~

</details>
This prevents the counter from going below 0, and updates the README to explain how the myMethod works a little better. Let me know if you want anything else! Next op #29, next step is 18.
</example>



## Merge Request Format

Keep it short -- a busy human needs to scan it in under a minute.

- **Summary:** 2-3 paragraphs. What changed and why -- no deep dives.
- **Testing checklist:** 4 items max. Each a single concrete action.

## GitLab API (repo.gitlab)

When a project was imported from GitLab (or has a \`/.forgeconfig\` with a \`[gitlab]\` section),
the \`repo.gitlab\` API is available inside \`#execute\` scripts for autonomous GitLab operations.

**Always prefer \`confirm: true\`** so the human stays in the loop.
Use silent mode only when the user has explicitly asked for fully automated commits.

\`\`\`javascript
// Read the embedded GitLab config (from .forgeconfig)
const cfg = repo.gitlab.getConfig();
repo.sendBack({ cfg });
// Returns: { id, path_with_namespace, default_branch, _sourceBranch, _instanceUrl }
// or null if no [gitlab] section found.

// Open the push modal pre-filled ¡ª human confirms branch/message/MR
await repo.gitlab.push({ confirm: true });

// Silent push to a new branch
const result = await repo.gitlab.push({
  message: 'feat: add dashboard component',
  branch: 'forge/dashboard',
  sourceBranch: 'main',
  branchMode: 'new'
});
repo.sendBack({ result });
// Returns: { commitId, branch, fileCount, created, updated, mrUrl }

// Silent push + auto-open MR in one call
const result2 = await repo.gitlab.push({
  message: 'feat: add dashboard component',
  branch: 'forge/dashboard',
  mr: { title: 'Add dashboard component', description: 'Built via FORGE Code' }
});
repo.sendBack({ result: result2 });

// Open an MR between two existing branches
const mr = await repo.gitlab.createMR({
  sourceBranch: 'forge/dashboard',
  targetBranch: 'main',
  title: 'Add dashboard component',
  description: 'Built via FORGE Code'
});
repo.sendBack({ mrUrl: mr.mrUrl });

// Fetch a file from GitLab into the VFS
const fetched = await repo.gitlab.fetch({ path: 'src/config.js' });
repo.sendBack({ fetched });

// Fetch multiple files at once
const fetched2 = await repo.gitlab.fetch({
  path: ['src/app.js', 'src/styles.css'],
  branch: 'feature/new-ui'
});
repo.sendBack({ fetched: fetched2 });
\`\`\`

**Typical agentic workflow:**
1. LLM reads config: \`repo.gitlab.getConfig()\` ¡ª knows project + branch
2. LLM makes changes via normal \`#new\` / \`#patch\` operations
3. LLM pushes with confirmation: \`repo.gitlab.push({ confirm: true })\`
4. Human reviews pre-filled modal, adjusts if needed, clicks Push

## Troubleshooting

The bookmarklet is running right now, and you can use the #execute operations to explore its repo JS or even the DOM, which can be helpful if you're confused about how it works. Just use sendBack to get the info back.
`;

const FORGE_STYLES = `
.forge-textarea {
  width: 100%;
  height: 100%;
  background: #1e1e1e;
  color: #d4d4d4;
  border: none;
  outline: none;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
  padding: 0;
  margin: 0;
  resize: none;
  tab-size: 4;
}

.forge-import-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
}

.forge-import-dialog {
  background: #2d2d30;
  border: 1px solid #3e3e42;
  border-radius: 8px;
  padding: 30px;
  width: 600px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.forge-import-header {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #d4d4d4;
}

.forge-import-textarea {
  flex: 1;
  min-height: 300px;
  background: #1e1e1e;
  color: #d4d4d4;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 12px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  resize: vertical;
  margin-bottom: 15px;
}

.forge-import-textarea:focus {
  outline: none;
  border-color: #0e639c;
}

.forge-import-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.forge-import-file-btn {
  margin-right: auto;
}

.hidden {
  display: none !important;
}

#forge-quick-ui {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 400px;
  background: #252526;
  border: 2px solid #667eea;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  font-family: 'Segoe UI', sans-serif;
  z-index: 10000;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  color: #d4d4d4;
}

#forge-quick-ui.forge-ui-minimized {
  width: 380px;
  height: auto;
  max-height: 60px;
}

/* Explorer panel ¡ª hidden in normal/docked mode, shown as flex row in maximized */
.forge-explorer-panel {
  display: none;
  flex: 1;
  min-height: 0;
  flex-direction: row;
}

/* Control panel ¡ª full width in normal/docked, fixed width sidebar in maximized */
.forge-control-panel {
  overflow-y: auto;
}

#forge-quick-ui.forge-ui-maximized .forge-ui-body {
  display: flex;
  flex-direction: row;
}

#forge-quick-ui.forge-ui-maximized .forge-control-panel {
  width: 320px;
  flex-shrink: 0;
  overflow-y: auto;
  border-right: 1px solid #3e3e42;
  padding: 15px;
}

#forge-quick-ui.forge-ui-maximized .forge-explorer-panel {
  display: flex;
}

#forge-quick-ui.forge-ui-minimized .forge-ui-body {
  display: none;
}

#forge-quick-ui.forge-ui-maximized {
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  max-height: 100vh;
  border-radius: 0;
}

#forge-quick-ui.forge-ui-docked {
  top: 0;
  right: 0;
  bottom: 0;
  left: auto;
  width: 420px;
  height: 100vh;
  max-height: 100vh;
  border-radius: 0 !important;
  border-left: 2px solid #667eea;
  border-top: none;
  border-right: none;
  border-bottom: none;
  overflow-y: auto;
}

#forge-quick-ui.forge-ui-docked .forge-ui-header {
  border-radius: 0 !important;
}

#forge-quick-ui.forge-ui-docked .forge-ui-body {
  padding: 0 10px;
}

#forge-quick-ui.forge-ui-docked .forge-control-panel {
  padding-bottom: 20px;
}

.forge-file-icon {
  margin-right: 5px;
  font-size: 0.9em;
  flex-shrink: 0;
}

.forge-file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.forge-file-item-excluded {
  opacity: 0.7;
  font-style: italic;
}

.forge-file-item-binary {
  opacity: 0.85;
}

.forge-file-meta-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 12px;
  background: #1e1e1e;
  border-bottom: 1px solid #3e3e42;
  flex-shrink: 0;
}

.forge-meta-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 3px;
  background: #2d2d30;
  border: 1px solid #3e3e42;
  color: #858585;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}

.forge-meta-excluded { border-color: #f44336; color: #f44336; }
.forge-meta-binary   { border-color: #ff9800; color: #ff9800; }
.forge-meta-url      { border-color: #2196f3; color: #2196f3; }
.forge-meta-desc     { border-color: #858585; }

.forge-excluded-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #858585;
  text-align: center;
  gap: 10px;
}

.forge-excluded-icon  { font-size: 2.5em; }
.forge-excluded-title { font-size: 1.1em; font-weight: 600; color: #d4d4d4; }
.forge-excluded-desc  { font-size: 0.88em; line-height: 1.6; }
.forge-excluded-desc a { color: #4fc3f7; }

.forge-ui-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 15px;
  border-radius: 10px 10px 0 0;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

#forge-quick-ui.forge-ui-minimized .forge-ui-header {
  border-radius: 10px;
}

#forge-quick-ui.forge-ui-maximized .forge-ui-header {
  border-radius: 0;
}

.forge-ui-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.forge-ui-header-buttons {
  display: flex;
  gap: 8px;
}

.forge-ui-header-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.forge-ui-header-btn:hover {
  background: rgba(255,255,255,0.3);
}

.forge-ui-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

#forge-quick-ui.forge-ui-normal .forge-ui-body {
  padding: 12px;
  overflow-y: auto;
}

.forge-section {
  margin-bottom: 8px;
}

.forge-section-title {
  font-weight: 600;
  color: #858585;
  margin-bottom: 6px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.forge-project-title-container {
  background: #1e1e1e;
  padding: 6px 8px;
  border-radius: 4px;
  margin-bottom: 8px;
  border: 1px solid #3e3e42;
  display: flex;
  align-items: center;
  gap: 6px;
}

.forge-project-title-label {
  font-size: 9px;
  color: #858585;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  font-weight: 600;
}

.forge-project-title-input {
  flex: 1;
  background: transparent;
  border: none;
  padding: 0;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: #4fc3f7;
  font-weight: 600;
  min-width: 0;
}

.forge-project-title-input:focus {
  outline: none;
}

/* Compact temperature control */
.forge-temp-container {
  background: #1e1e1e;
  padding: 6px 8px;
  border-radius: 4px;
  margin-bottom: 8px;
  border: 1px solid #3e3e42;
  display: flex;
  align-items: center;
  gap: 8px;
}

.forge-temp-label {
  font-size: 9px;
  color: #858585;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
  white-space: nowrap;
}

.forge-temp-slider-inline {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: #3e3e42;
  outline: none;
  -webkit-appearance: none;
  min-width: 80px;
}

.forge-temp-slider-inline::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #667eea;
  cursor: pointer;
}

.forge-temp-slider-inline::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #667eea;
  cursor: pointer;
  border: none;
}

.forge-temp-value {
  font-weight: 600;
  color: #4fc3f7;
  font-size: 11px;
  min-width: 24px;
  text-align: center;
}

.forge-temp-status {
  font-weight: 600;
  font-size: 10px;
  min-width: 22px;
  text-align: center;
}

.forge-temp-toggle {
  background: #3e3e42;
  border: none;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 0;
  flex-shrink: 0;
}

.forge-temp-toggle:hover {
  opacity: 0.8;
}

/* Compact status display */
.forge-status {
  background: #1e1e1e;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 11px;
  border: 1px solid #3e3e42;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.forge-status-compact {
  display: flex;
  align-items: center;
  gap: 4px;
}

.forge-status-label {
  color: #858585;
  font-size: 10px;
}

.forge-status-value {
  font-weight: 600;
  color: #4fc3f7;
  font-size: 11px;
}

.forge-status-separator {
  color: #3e3e42;
  margin: 0 2px;
}

/* Next step controls */
.forge-next-step-control {
  display: flex;
  align-items: center;
  gap: 4px;
}

.forge-next-step-input {
  background: transparent;
  border: 1px solid #3e3e42;
  border-radius: 3px;
  color: #4fc3f7;
  font-weight: 600;
  font-size: 11px;
  width: 48px;
  text-align: center;
  padding: 2px 4px;
  font-family: 'Consolas', monospace;
}

.forge-next-step-input:focus {
  outline: none;
  border-color: #667eea;
}

.forge-next-step-btn {
  background: #3e3e42;
  border: none;
  color: #d4d4d4;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 10px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  padding: 0;
}

.forge-next-step-btn:hover {
  background: #505050;
}

.forge-next-step-btn:active {
  background: #667eea;
}

.forge-btn {
  width: 100%;
  padding: 7px;
  background: #0e639c;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 5px;
  font-size: 12px;
  transition: all 0.2s;
}

.forge-btn:hover {
  background: #1177bb;
}

.forge-status-bar {
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 11px;
  color: #858585;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.forge-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #28a745;
  display: inline-block;
  margin-right: 4px;
}

/* .forge-status-step base styles are defined in the Auto-Pilot activity strip section above */

.forge-next-step-label {
  font-size: 10px;
  color: #858585;
  white-space: nowrap;
}

.forge-welcome-banner {
  background: linear-gradient(135deg, #667eea22, #764ba222);
  border: 1px solid #667eea44;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 11.5px;
  color: #a0aec0;
  line-height: 1.5;
}

.forge-quick-start-input {
  width: 100%;
  padding: 8px;
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 4px;
  font-family: inherit;
  font-size: 13px;
  resize: vertical;
  background: rgba(30, 30, 30, 0.5);
  color: #d4d4d4;
  box-sizing: border-box;
}

.forge-quick-start-input:focus {
  outline: none;
  border-color: rgba(102, 126, 234, 0.6);
  background: rgba(30, 30, 30, 0.7);
}

.forge-more-menu {
  position: absolute;
  right: 0;
  background: #2d2d2d;
  border: 1px solid #444;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  z-index: 1000;
  margin-top: 2px;
  min-width: 180px;
}

.forge-more-menu-item {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-size: 13px;
  color: #d4d4d4;
  transition: background 0.2s;
}

.forge-more-menu-item:hover {
  background: #3d3d3d;
}

.forge-more-menu-item:first-child {
  border-radius: 4px 4px 0 0;
}

.forge-more-menu-item:last-child {
  border-radius: 0 0 4px 4px;
}

.forge-welcome-banner strong {
  color: #d4d4d4;
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
}

.forge-divider {
  height: 1px;
  background: #3e3e42;
  margin: 2px 0;
}

.forge-out-label {
  font-size: 10px;
  color: #858585;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 3px;
}

.forge-out-info-btn {
  background: transparent;
  border: none;
  color: #667eea;
  font-size: 13px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  opacity: 0.8;
}

.forge-out-info-btn:hover { opacity: 1; }

.forge-out-popover {
  background: #1e1e1e;
  border: 1px solid #667eea44;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 11px;
  color: #a0aec0;
  line-height: 1.6;
  margin-bottom: 6px;
}

.forge-out-popover strong { color: #d4d4d4; }

.forge-expander-btn {
  width: 100%;
  background: transparent;
  border: 1px dashed #3e3e42;
  border-radius: 6px;
  color: #858585;
  font-size: 11px;
  padding: 6px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
}

.forge-expander-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.forge-advanced-section {
  display: none;
  flex-direction: column;
  gap: 6px;
}

.forge-advanced-section.open {
  display: flex;
}

.forge-advanced-label {
  font-size: 10px;
  color: #858585;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 4px;
}

.forge-sendback-results-box {
  background: #1a2a1a;
  border: 1px solid #1a7a3a;
  border-radius: 4px;
  padding: 8px;
  font-size: 10px;
  font-family: 'Courier New', monospace;
  color: #4caf50;
  max-height: 150px;
  overflow-y: auto;
  line-height: 1.4;
  margin: 5px 0;
}



.forge-btn-send {
  background: #1a7a3a;
  color: #fff;
  border-color: #1a7a3a;
}

.forge-btn-send:hover:not(:disabled) {
  background: #22a04d;
  border-color: #22a04d;
}

.forge-btn-send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.forge-btn-secondary {
  background: #3e3e42;
  color: #d4d4d4;
}

.forge-btn-secondary:hover {
  background: #505050;
}

.forge-btn-small {
  padding: 5px 10px;
  font-size: 11px;
  width: auto;
  display: inline-block;
  margin-right: 4px;
  margin-bottom: 4px;
}

.forge-copy-group {
  display: flex;
  gap: 4px;
  margin-bottom: 5px;
}

.forge-btn-compact {
  flex: 1;
  padding: 7px 4px;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.forge-step-controls {
  display: flex;
  gap: 4px;
}

.forge-step-controls button {
  flex: 1;
}

.forge-log {
  background: #1e1e1e;
  padding: 6px;
  border-radius: 4px;
  font-size: 10px;
  font-family: 'Courier New', monospace;
  max-height: 50px;
  overflow-y: auto;
  color: #858585;
  border: 1px solid #3e3e42;
}

/* Explorer panel layout */
.forge-file-list-panel {
  width: 280px;
  border-right: 1px solid #3e3e42;
  overflow-y: auto;
  background: #252526;
  flex-shrink: 0;
}

.forge-content-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.forge-file-list {
  width: 100%;
  height: 100%;
}

.forge-file-item {
  padding: 10px 15px;
  cursor: pointer;
  border-bottom: 1px solid #3e3e42;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  transition: background 0.15s;
  color: #d4d4d4;
}

.forge-file-item:hover {
  background: #2d2d30;
}

.forge-file-item.selected {
  background: #0e639c;
  color: white;
}

.forge-file-item-changed {
  color: #f39c12;
  font-weight: bold;
}

.forge-file-item.selected.forge-file-item-changed {
  color: #ffe5b4;
}

.forge-file-item-full-repo {
  font-weight: bold;
  background: #2d2d30;
}

.forge-file-item-full-repo.selected {
  background: #0e639c;
  color: white;
}

.forge-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  overflow: hidden;
  min-width: 0;
}

.forge-content-header {
  background: #2d2d2d;
  color: #ccc;
  padding: 10px 15px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  border-bottom: 1px solid #3e3e3e;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.forge-content-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.forge-content-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.forge-copy-btn {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: #ccc;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s;
  white-space: nowrap;
}

.forge-copy-btn:hover {
  background: rgba(255,255,255,0.15);
}

.forge-source-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.forge-source-nav-btn {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: #ccc;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  padding: 0;
}

.forge-source-nav-btn:hover {
  background: rgba(102, 126, 234, 0.4);
}

.forge-source-nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.forge-source-nav-label {
  font-size: 11px;
  color: #aaa;
  white-space: nowrap;
  font-family: 'Segoe UI', sans-serif;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  transition: background 0.2s;
}

.forge-source-nav-label:hover {
  background: rgba(102, 126, 234, 0.3);
  color: #fff;
}

.forge-content-body {
  flex: 1;
  overflow: auto;
  padding: 15px;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.forge-content-body pre {
  margin: 0;
  color: #d4d4d4;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
  white-space: pre;
  tab-size: 4;
}

.forge-error-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10005;
}

.forge-error-dialog {
  background: #2d2d30;
  border: 2px solid #f44336;
  border-radius: 8px;
  padding: 25px;
  width: 700px;
  max-width: 90vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.forge-error-header {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #f44336;
  display: flex;
  align-items: center;
  gap: 10px;
}

.forge-error-body {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 20px;
}

.forge-error-section {
  margin-bottom: 15px;
}

.forge-error-section-title {
  font-size: 12px;
  color: #858585;
  text-transform: uppercase;
  margin-bottom: 8px;
  font-weight: 600;
}

.forge-error-code {
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 10px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre;
  color: #d4d4d4;
}

.forge-error-stats {
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 10px;
  font-size: 12px;
}

.forge-error-stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.forge-error-stat-item:last-child {
  margin-bottom: 0;
}

.forge-error-copy-row {
  padding: 0 0 10px 0;
  border-bottom: 1px solid #3e3e42;
  margin-bottom: 10px;
}

.forge-error-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.forge-btn-danger {
  background: #f44336;
}

.forge-btn-danger:hover {
  background: #d32f2f;
}

.forge-btn-warning {
  background: #ff9800;
}

.forge-btn-warning:hover {
  background: #f57c00;
}

#forge-progress-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10004;
  font-family: 'Segoe UI', sans-serif;
}

.forge-progress-dialog {
  background: #2d2d30;
  border: 2px solid #667eea;
  border-radius: 8px;
  width: 600px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.forge-progress-header {
  padding: 20px;
  border-bottom: 1px solid #3e3e42;
  font-size: 18px;
  font-weight: 600;
  color: #d4d4d4;
}

.forge-progress-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  min-height: 200px;
}

.forge-progress-status {
  color: #858585;
  margin-bottom: 15px;
  font-size: 14px;
}

.forge-progress-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.forge-progress-item {
  padding: 10px;
  margin-bottom: 8px;
  background: #1e1e1e;
  border-left: 3px solid #3e3e42;
  border-radius: 4px;
  font-family: 'Consolas', monospace;
  font-size: 13px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.forge-progress-item.pending {
  border-left-color: #858585;
  color: #858585;
}

.forge-progress-item.processing {
  border-left-color: #2196f3;
  color: #d4d4d4;
  animation: pulse 1.5s ease-in-out infinite;
}

.forge-progress-item.success {
  border-left-color: #4caf50;
  color: #d4d4d4;
}

.forge-progress-item.warning {
  border-left-color: #ffc107;
  color: #d4d4d4;
}

.forge-progress-item.error {
  border-left-color: #f44336;
  color: #d4d4d4;
}

.forge-progress-item-icon {
  margin-left: 10px;
  font-size: 16px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.forge-progress-footer {
  padding: 20px;
  border-top: 1px solid #3e3e42;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.forge-progress-btn {
  background: #0e639c;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.forge-progress-btn:hover {
  background: #1177bb;
}

.forge-progress-btn.secondary {
  background: #3e3e42;
}

.forge-progress-btn.secondary:hover {
  background: #505050;
}

.forge-progress-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Quick-access row (Sessions / Import / ZIP) */
.forge-quick-row {
  display: flex;
  gap: 4px;
  margin-bottom: 5px;
}

.forge-quick-btn {
  flex: 1;
  padding: 5px 6px;
  background: #2d2d30;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  color: #a0a0a0;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.forge-quick-btn:hover {
  background: #3e3e42;
  color: #d4d4d4;
  border-color: #667eea;
}

/* Sessions modal */

.forge-sessions-list {
  display: flex;
  flex-direction: column;
  max-height: 420px;
  overflow-y: auto;
}

.forge-sessions-empty {
  padding: 30px;
  text-align: center;
  color: #858585;
  font-size: 13px;
}

.forge-session-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid #3e3e42;
  transition: background 0.15s;
}

.forge-session-item:hover {
  background: #2d2d30;
}

.forge-session-item.forge-session-current {
  border-left: 3px solid #667eea;
  padding-left: 13px;
}

.forge-session-info {
  flex: 1;
  min-width: 0;
}

.forge-session-title {
  font-weight: 600;
  color: #d4d4d4;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.forge-session-meta {
  font-size: 10.5px;
  color: #858585;
  margin-top: 2px;
  font-family: 'Consolas', monospace;
}

.forge-session-url {
  font-size: 10px;
  color: #555;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 380px;
}

.forge-session-btns {
  display: flex;
  gap: 5px;
  flex-shrink: 0;
}

.forge-session-btn {
  padding: 4px 9px;
  border: none;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.forge-session-btn-go {
  background: #0e639c;
  color: #fff;
}
.forge-session-btn-go:hover { background: #1177bb; }

.forge-session-btn-load {
  background: #3e3e42;
  color: #d4d4d4;
}
.forge-session-btn-load:hover { background: #505050; }

.forge-session-btn-delete {
  background: transparent;
  color: #858585;
  border: 1px solid #3e3e42;
}
.forge-session-btn-delete:hover { color: #f44336; border-color: #f44336; }

/* Non-blocking resume banner */
.forge-resume-banner {
  background: linear-gradient(135deg, #1a2a1a, #1e2a1a);
  border: 1px solid #2a7a4a;
  border-radius: 8px;
  padding: 9px 11px;
  font-size: 11.5px;
  color: #a0c8a0;
  margin-bottom: 6px;
  animation: forge-strip-fadein 0.3s ease;
}

.forge-resume-banner-title {
  font-weight: 600;
  color: #d4d4d4;
  margin-bottom: 3px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.forge-resume-banner-meta {
  font-size: 10.5px;
  color: #7aaa7a;
  margin-bottom: 8px;
  font-family: 'Consolas', monospace;
}

.forge-resume-banner-btns {
  display: flex;
  gap: 5px;
}

.forge-resume-btn {
  flex: 1;
  padding: 5px 8px;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.forge-resume-btn-primary {
  background: #1a7a3a;
  color: #fff;
}

.forge-resume-btn-primary:hover { background: #22a04d; }

.forge-resume-btn-secondary {
  background: #3e3e42;
  color: #d4d4d4;
}

.forge-resume-btn-secondary:hover { background: #505050; }

.forge-resume-btn-dismiss {
  background: transparent;
  color: #858585;
  border: 1px solid #3e3e42;
  flex: 0;
  padding: 5px 8px;
}

.forge-resume-btn-dismiss:hover { color: #d4d4d4; border-color: #858585; }

/* Auto-Pilot activity strip */
.forge-autopilot-strip {
  background: #0e1f0e;
  border: 1px solid #1a7a3a;
  border-radius: 4px;
  padding: 5px 9px;
  font-size: 10.5px;
  font-family: 'Consolas', 'Courier New', monospace;
  color: #4caf50;
  margin-bottom: 5px;
  line-height: 1.4;
  animation: forge-strip-fadein 0.4s ease;
}

@keyframes forge-strip-fadein {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Status bar flash on auto-pilot apply */
.forge-status-step {
  color: #4fc3f7;
  font-weight: 600;
  transition: background 0.1s ease;
  border-radius: 3px;
  padding: 1px 4px;
}

.forge-status-step.forge-flash {
  background: #4caf50;
  color: #fff;
}



/* Upload row */
.forge-upload-row {
  margin-top: 4px;
  margin-bottom: 5px;
}

.forge-upload-label-wrap {
  display: flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  font-size: 12px;
  color: #d4d4d4;
  padding: 5px 0;
  user-select: none;
}

.forge-upload-label-wrap input[type="checkbox"] {
  width: 14px;
  height: 14px;
  cursor: pointer;
  flex-shrink: 0;
}

/* Heartbeat indicator */
.forge-heartbeat-indicator {
  display: none;
  font-size: 10px;
  color: #4caf50;
  align-self: center;
}

/* Toast notifications */
.forge-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%) translateY(20px);
  background: #2d2d30;
  color: #d4d4d4;
  border: 1px solid #3e3e42;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 12px;
  font-family: 'Segoe UI', sans-serif;
  z-index: 2147483647;
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  pointer-events: none;
}

.forge-toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

/* Paste / import confirmation modal */
.forge-confirm-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2147483646;
  font-family: 'Segoe UI', sans-serif;
}

.forge-confirm-dialog {
  background: #2d2d30;
  border: 2px solid #667eea;
  border-radius: 8px;
  width: 560px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
  overflow: hidden;
}

.forge-confirm-header {
  padding: 18px 20px;
  border-bottom: 1px solid #3e3e42;
  font-size: 16px;
  font-weight: 600;
  color: #d4d4d4;
}

.forge-confirm-body {
  flex: 1;
  overflow-y: auto;
  padding: 18px 20px;
  font-size: 13px;
  color: #d4d4d4;
  line-height: 1.5;
}

.forge-confirm-preview {
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 10px 12px;
  font-family: 'Consolas', monospace;
  font-size: 12px;
  margin: 10px 0;
  max-height: 200px;
  overflow-y: auto;
  color: #d4d4d4;
}

.forge-confirm-warning {
  background: #2a1e0e;
  border: 1px solid #b8860b;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 12px;
  color: #ffc107;
  margin-top: 10px;
}

/* Settings modal */
.forge-settings-section {
  margin-bottom: 20px;
}

.forge-settings-label {
  font-size: 12px;
  font-weight: 600;
  color: #858585;
  text-transform: uppercase;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
}

.forge-settings-input {
  width: 100%;
  background: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 10px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #4fc3f7;
  margin-bottom: 8px;
}

.forge-settings-input:focus {
  outline: none;
  border-color: #667eea;
}

.forge-settings-hint {
  font-size: 11px;
  color: #858585;
  line-height: 1.4;
}

.forge-settings-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid #3e3e42;
  margin-bottom: 16px;
}

.forge-settings-tab {
  flex: 1;
  padding: 10px 12px;
  background: #1e1e1e;
  border: none;
  border-bottom: 2px solid transparent;
  color: #858585;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.forge-settings-tab:hover {
  color: #d4d4d4;
  background: #252526;
}

.forge-settings-tab.active {
  color: #4caf50;
  border-bottom-color: #4caf50;
  background: #1e1e1e;
}

.forge-settings-tab-content {
  display: none;
}

.forge-settings-tab-content.active {
  display: block;
}

/* Confirmation modal */
.forge-confirm-footer {
  padding: 20px;
  border-top: 1px solid #3e3e42;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

/* Help / keyboard shortcuts modal */
.forge-help-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 10003;
  font-family: 'Segoe UI', sans-serif;
}

.forge-help-modal:not(.hidden) {
  display: flex;
}

.forge-help-dialog {
  background: #2d2d30;
  border: 2px solid #667eea;
  border-radius: 8px;
  width: 600px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.forge-help-header {
  padding: 20px;
  border-bottom: 1px solid #3e3e42;
  font-size: 18px;
  font-weight: 600;
  color: #d4d4d4;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.forge-help-close {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #d4d4d4;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.forge-help-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.forge-help-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  color: #d4d4d4;
}

.forge-help-section {
  margin-bottom: 20px;
}

.forge-help-section:last-child {
  margin-bottom: 0;
}

.forge-help-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #667eea;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.forge-help-shortcut {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #3e3e42;
}

.forge-help-shortcut:last-child {
  border-bottom: none;
}

.forge-help-shortcut-keys {
  font-family: 'Consolas', monospace;
  background: #1e1e1e;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #4fc3f7;
  border: 1px solid #3e3e42;
}

.forge-help-shortcut-desc {
  flex: 1;
  margin-right: 15px;
  font-size: 13px;
  color: #d4d4d4;
}

.forge-help-footer {
  padding: 15px 20px;
  border-top: 1px solid #3e3e42;
  text-align: center;
  font-size: 12px;
  color: #858585;
}`;

// FORGE Code - Domain Check
// Validates we're running on a supported domain before initializing.
// If not, shows a friendly message with links to supported platforms.

const SUPPORTED_DOMAINS = [
  { name: 'Elsa (FDA)', domains: ['elsa.fda.gov'], url: 'https://elsa.fda.gov' },
  { name: 'Elsa (PreProd)', domains: ['elsa.preprod.fda.gov'], url: 'https://elsa.preprod.fda.gov' },
  { name: 'Elsa (Dev)', domains: ['elsa-dev.preprod.fda.gov'], url: 'https://elsa-dev.preprod.fda.gov/' },
  { name: 'Claude HHS', domains: ['claude.hhs.gov'], url: 'https://claude.hhs.gov' },
  { name: 'ChatGPT', domains: ['chatgpt.com', 'chat.openai.com'], url: 'https://chatgpt.com/' },
  { name: 'FDA Gemini', domains: ['vertexaisearch.cloud.google'], url: 'https://gemini.hhs.gov/' },
  { name: 'Google Gemini', domains: ['gemini.google.com'], url: 'https://gemini.google.com/app' },
];

// Returns the human-readable name of the current platform for use in UI strings.
// Falls back to 'Elsa' when no adapter is active (Elsa uses legacy interceptors).
function getPlatformName() {
  return (window.forgeAdapter && window.forgeAdapter.platformName)
    ? window.forgeAdapter.platformName
    : 'Elsa';
}

// Export to global scope for use in other modules
window.getPlatformName = getPlatformName;

function isSupportedDomain() {
  const hostname = window.location.hostname.toLowerCase();
  return SUPPORTED_DOMAINS.some(platform => 
    platform.domains.some(d => hostname === d || hostname.endsWith('.' + d))
  );
}

/**
 * Check domain and show a "please open supported platform" message if not on a supported domain.
 * Returns true if we're good to proceed, false if we showed the error UI.
 */
function checkDomainOrShowError() {
  if (isSupportedDomain()) return true;

  // Inject minimal styles for the error UI
  const style = document.createElement('style');
  style.textContent = `
    #forge-domain-error {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 360px;
      background: #252526;
      border: 2px solid #f44336;
      border-radius: 12px;
      padding: 20px 24px;
      font-family: 'Segoe UI', sans-serif;
      color: #d4d4d4;
      z-index: 10000;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
      line-height: 1.5;
    }
    #forge-domain-error h3 {
      margin: 0 0 10px 0;
      color: #f44336;
      font-size: 15px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    #forge-domain-error p {
      margin: 0 0 14px 0;
      font-size: 13px;
      color: #858585;
    }
    #forge-domain-error .forge-platform-links {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    #forge-domain-error a {
      display: block;
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      text-align: center;
      transition: background 0.2s;
    }
    #forge-domain-error a.primary {
      background: #0e639c;
      color: white;
    }
    #forge-domain-error a.primary:hover { background: #1177bb; }
    #forge-domain-error a.secondary {
      background: #3e3e42;
      color: #d4d4d4;
    }
    #forge-domain-error a.secondary:hover { background: #505050; }
    #forge-domain-error button.forge-try-anyway {
      display: block;
      width: 100%;
      margin-top: 10px;
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      background: none;
      border: 1px solid #555;
      color: #858585;
      transition: color 0.2s, border-color 0.2s;
    }
    #forge-domain-error button.forge-try-anyway:hover { color: #d4d4d4; border-color: #d4d4d4; }
    #forge-domain-error .forge-dismiss {
      position: absolute;
      top: 10px;
      right: 12px;
      background: none;
      border: none;
      color: #858585;
      font-size: 18px;
      cursor: pointer;
      padding: 2px 6px;
      line-height: 1;
    }
    #forge-domain-error .forge-dismiss:hover { color: #d4d4d4; }
    #forge-domain-error .forge-current-domain {
      font-family: 'Consolas', monospace;
      font-size: 11px;
      color: #f44336;
      background: #1e1e1e;
      padding: 3px 8px;
      border-radius: 3px;
      display: inline-block;
      margin-bottom: 12px;
    }
  `;
  document.head.appendChild(style);

  const platformLinks = SUPPORTED_DOMAINS.map((platform, idx) => {
    const className = idx === 0 ? 'primary' : 'secondary';
    return `<a class="${className}" href="${platform.url}" target="_blank">${platform.name} ¡ú</a>`;
  }).join('');

  const el = document.createElement('div');
  el.id = 'forge-domain-error';
  setForgeHTML(el, `
    <button class="forge-dismiss" onclick="this.closest('#forge-domain-error').remove()">¡Á</button>
    <h3>?? FORGE Code</h3>
    <p>This bookmarklet only works on supported platforms. You're currently on:</p>
    <div class="forge-current-domain">${window.location.hostname}</div>
    <p>Open a supported platform and click the bookmarklet again:</p>
    <div class="forge-platform-links">
      ${platformLinks}
    </div>
    <button class="forge-try-anyway" id="forge-try-anyway-btn">?? Try anyway with generic adapter¡­</button>
  `);
  document.body.appendChild(el);

  el.querySelector('#forge-try-anyway-btn').addEventListener('click', () => {
    el.remove();
    if (typeof window.forgeInitWithFallback === 'function') {
      window.forgeInitWithFallback();
    }
  });

  // Auto-dismiss after 30 seconds
  setTimeout(() => { if (el.parentNode) el.remove(); }, 30000);

  return false;
}
// FORGE CODE - Reactive State Store
// A tiny (~40 line) framework-free reactive store.
// Call ForgeState.setState(patch) anywhere to update state;
// all subscribers (the render function) are notified synchronously.
// No deps, no bundler, CSP-safe.

const ForgeState = (() => {
  const _state = {
    // ©¤©¤ Repo-derived ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
    files: {},
    fileMeta: {},
    projectTitle: null,
    currentStep: 0,
    lastProcessedStep: 0,
    versions: [],
    repositoryRevision: 0,
    sendBackQueue: [],
    sendBackSent: false,
    // ©¤©¤ UI ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
    mode: 'normal',           // 'normal' | 'maximized' | 'minimized' | 'docked'
    agentModeActive: false,
    selectedPath: '<full repo>',
    autoPilotEnabled: false,
  welcomeMode: true, // Start in welcome mode by default
    heartbeatEnabled: false,
    uploadArmed: false,
    protocolInjectionArmed: false,
    summaryOnly: false,
    includeCodingPrompt: true,
    syncConnected: false,
    syncArmed: false,
    tempEnabled: false,
    currentTemp: 0,
    sourceNavIndex: 0,
    log: [],
    // ©¤©¤ Derived (auto-computed on every setState) ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
    hasProject: false,        // Object.keys(files).length > 0
  };

  const _subscribers = [];

  /**
   * Return a frozen top-level snapshot.
   *
   * Repository collections remain shared for performance, but callers cannot
   * overwrite properties on the store's internal state object.
   */
  function _createSnapshot() {
    return Object.freeze(Object.assign({}, _state));
  }

  function getState() {
    return _createSnapshot();
  }

  function setState(patch) {
    Object.assign(_state, patch);

    // Keep derived fields in sync automatically.
    _state.hasProject =
      Object.keys(_state.files || {}).length > 0;

    // Notify all subscribers synchronously with the same immutable snapshot.
    const snapshot = _createSnapshot();

    for (let i = 0; i < _subscribers.length; i++) {
      try {
        _subscribers[i](snapshot);
      } catch (err) {
        console.error('[ForgeState] Subscriber threw:', err);
      }
    }
  }

  function subscribe(fn) {
    _subscribers.push(fn);

    // Fire immediately so the subscriber can perform its initial render.
    try {
      fn(_createSnapshot());
    } catch (err) {
      console.error(
        '[ForgeState] Initial subscriber call threw:',
        err
      );
    }

    return function unsubscribe() {
      const index = _subscribers.indexOf(fn);
      if (index >= 0) _subscribers.splice(index, 1);
    };
  }

  function _shallowEqual(left, right) {
    if (Object.is(left, right)) return true;

    if (
      !left ||
      !right ||
      typeof left !== 'object' ||
      typeof right !== 'object'
    ) {
      return false;
    }

    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);

    if (leftKeys.length !== rightKeys.length) {
      return false;
    }

    for (let index = 0; index < leftKeys.length; index++) {
      const key = leftKeys[index];

      if (
        !Object.prototype.hasOwnProperty.call(right, key) ||
        !Object.is(left[key], right[key])
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Subscribe to a derived state slice.
   *
   * The listener runs immediately, then only when the selected value changes.
   * It receives both the selected value and the latest full state snapshot.
   */
  function subscribeSelector(selector, fn, equalityFn) {
    const isEqual =
      typeof equalityFn === 'function'
        ? equalityFn
        : _shallowEqual;

    let hasSelection = false;
    let previousSelection;

    return subscribe(state => {
      const nextSelection = selector(state);

      if (
        hasSelection &&
        isEqual(previousSelection, nextSelection)
      ) {
        return;
      }

      previousSelection = nextSelection;
      hasSelection = true;
      fn(nextSelection, state);
    });
  }

  return {
    getState,
    setState,
    subscribe,
    subscribeSelector
  };
})();

// ==== State / Repo contract ====
// ForgeState   ¡ª UI source of truth. All render subscriptions read from here.
// repo         ¡ª Operational source of truth for VFS logic (file ops, version history).
// ForgeActions ¡ª The bridge. Any write that affects both layers goes through an action,
//                which updates repo fields first, then calls ForgeState.setState() once.
//                Never write to both separately from a call site.
// ================================

/**
 * Named application actions.
 *
 * UI handlers should call these instead of separately mutating repo fields,
 * module variables, ForgeState, and DOM elements.
 */
const ForgeActions = {
  setMode(mode) {
    const validModes = ['normal', 'maximized', 'minimized', 'docked'];
    ForgeState.setState({
      mode: validModes.includes(mode) ? mode : 'normal'
    });
  },

  setSelectedPath(path) {
    ForgeState.setState({
      selectedPath: path || '<full repo>'
    });
  },

  setSourceNavIndex(index) {
    const numericIndex = Number(index);

    ForgeState.setState({
      sourceNavIndex: Number.isFinite(numericIndex)
        ? Math.max(0, Math.floor(numericIndex))
        : 0
    });
  },

  setAgentModeActive(active) {
    ForgeState.setState({
      agentModeActive: !!active
    });
  },

  setProjectTitle(title) {
    const value = String(title == null ? '' : title);

    if (typeof repo !== 'undefined') {
      repo.projectTitle = value;
    }

    ForgeState.setState({ projectTitle: value });
  },

  updateFileContent(path, content) {
    if (!path) return;

    const state = ForgeState.getState();
    const files = Object.assign(
      {},
      state.files || {},
      { [path]: String(content == null ? '' : content) }
    );

    if (typeof repo !== 'undefined') {
      repo.files = files;
    }

    ForgeState.setState({
      files,
      repositoryRevision:
        state.repositoryRevision + 1
    });
  },

  setCurrentStep(step) {
    const numericStep = Number(step);
    const value = Number.isFinite(numericStep)
      ? Math.max(0, Math.floor(numericStep))
      : 0;

    if (typeof repo !== 'undefined') {
      repo.currentStep = value;
    }

    ForgeState.setState({ currentStep: value });
  },

  setLastProcessedStep(step) {
    const numericStep = Number(step);
    const value = Number.isFinite(numericStep)
      ? Math.max(0, Math.floor(numericStep))
      : 0;

    if (typeof repo !== 'undefined') {
      repo.lastProcessedStep = value;
    }

    ForgeState.setState({ lastProcessedStep: value });
  },

  replaceRepository(snapshot) {
    const source = snapshot || {};
    const files = source.files || {};
    const fileMeta = source.fileMeta || {};
    const projectTitle = source.projectTitle || null;
    const currentStep = Math.max(0, Number(source.currentStep) || 0);
    const lastProcessedStep = Math.max(
      0,
      Number(source.lastProcessedStep) || 0
    );
    const versions = Array.isArray(source.versions)
      ? source.versions
      : [];

    if (typeof repo !== 'undefined') {
      repo.files = files;
      repo.fileMeta = fileMeta;
      repo.projectTitle = projectTitle;
      repo.currentStep = currentStep;
      repo.lastProcessedStep = lastProcessedStep;
      repo.versions = versions;
    }

    const state = ForgeState.getState();

    ForgeState.setState({
      files,
      fileMeta,
      projectTitle,
      currentStep,
      lastProcessedStep,
      versions,
      repositoryRevision:
        state.repositoryRevision + 1
    });
  },

  publishRepositoryState(source) {
    if (!source) return;

    const state = ForgeState.getState();

    ForgeState.setState({
      files: source.files || {},
      fileMeta: source.fileMeta || {},
      projectTitle: source.projectTitle || null,
      currentStep: Math.max(
        0,
        Number(source.currentStep) || 0
      ),
      lastProcessedStep: Math.max(
        0,
        Number(source.lastProcessedStep) || 0
      ),
      versions: Array.isArray(source.versions)
        ? source.versions
        : [],
      repositoryRevision:
        state.repositoryRevision + 1,
      sendBackQueue: source.getSendBackQueue
        ? source.getSendBackQueue()
        : [],
      sendBackSent: source.isSendBackSent
        ? source.isSendBackSent()
        : false
    });
  },

  syncRepository() {
    if (typeof repo === 'undefined') return;
    ForgeActions.publishRepositoryState(repo);
  },

  setSendBackState(queue, sent) {
    ForgeState.setState({
      sendBackQueue: Array.isArray(queue)
        ? queue.slice()
        : [],
      sendBackSent: !!sent
    });
  },

  removeSendBackEntry(index) {
    if (typeof repo !== 'undefined' && repo._sendBackQueue) {
      repo._sendBackQueue.splice(index, 1);
      ForgeActions.setSendBackState(
        repo._sendBackQueue,
        repo.isSendBackSent ? repo.isSendBackSent() : false
      );
    }
  },

  syncResults() {
    if (typeof repo === 'undefined') return;

    ForgeActions.setSendBackState(
      repo.getSendBackQueue
        ? repo.getSendBackQueue()
        : [],
      repo.isSendBackSent
        ? repo.isSendBackSent()
        : false
    );
  },

  setUploadArmed(armed) {
    console.log("setting armed to:" + armed);
    const enabled = !!armed;
    const patch = { uploadArmed: enabled };
    ForgeState.setState(patch);
  },

  setProtocolInjectionArmed(armed) {
    ForgeState.setState({ protocolInjectionArmed: !!armed });
  },

  setSummaryOnly(enabled) {
    ForgeState.setState({ summaryOnly: !!enabled });
  },

  setIncludeCodingPrompt(enabled) {
    const value = !!enabled;

    if (typeof repo !== 'undefined') {
      repo.includeCodingPrompt = value;
    }

    ForgeState.setState({ includeCodingPrompt: value });
  },

  setAutoPilotEnabled(enabled) {
    const value = !!enabled;

    ForgeState.setState({
      autoPilotEnabled: value,
      heartbeatEnabled: value
    });
  },

  setWelcomeMode(enabled) {
    ForgeState.setState({
      welcomeMode: !!enabled
    });
    try {
      localStorage.setItem('forge-welcome-mode-dismissed', enabled ? 'false' : 'true');
    } catch (e) {}
  },

  setSyncConnected(connected) {
    ForgeState.setState({ syncConnected: !!connected });
  },

  setSyncArmed(armed) {
    ForgeState.setState({ syncArmed: !!armed });
  },

  setTemperature(value, enabled) {
    const numericValue = Number(value);
    const currentTemp = Number.isFinite(numericValue)
      ? Math.max(0, Math.min(1, numericValue))
      : 0;

    ForgeState.setState({
      currentTemp,
      tempEnabled: !!enabled
    });
  }
};
// FORGE CODE - Helper Utilities
// General-purpose helper functions

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}`;
}

const adjectives = [
  'swift', 'bright', 'calm', 'bold', 'clever', 'gentle', 'happy', 'kind',
  'lively', 'merry', 'nice', 'proud', 'quiet', 'rapid', 'smart', 'warm',
  'wise', 'young', 'zesty', 'agile', 'brave', 'cool', 'daring', 'eager',
  'fair', 'glad', 'jolly', 'keen', 'lucky', 'neat', 'quick', 'rich',
  'safe', 'tidy', 'vivid', 'witty', 'zippy', 'amber', 'azure', 'coral',
  'crisp', 'fresh', 'golden', 'jade', 'noble', 'pearl', 'royal', 'silver',
  'smooth', 'stellar'
];

const nouns = [
  'cloud', 'river', 'mountain', 'forest', 'ocean', 'desert', 'valley', 'island',
  'meadow', 'canyon', 'glacier', 'volcano', 'prairie', 'lagoon', 'reef', 'delta',
  'summit', 'plateau', 'fjord', 'tundra', 'robot', 'rocket', 'engine', 'circuit',
  'beacon', 'portal', 'nexus', 'matrix', 'vector', 'prism', 'crystal', 'sphere',
  'comet', 'nebula', 'quasar', 'pulsar', 'galaxy', 'cosmos', 'aurora', 'eclipse',
  'phoenix', 'dragon', 'falcon', 'eagle', 'tiger', 'panther', 'wolf', 'bear',
  'hawk', 'lion'
];

function generateProjectName() {
  const adj1 = adjectives[Math.floor(Math.random() * adjectives.length)];
  const adj2 = adjectives[Math.floor(Math.random() * adjectives.length)];
  const adj3 = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return adj1 + adj2.charAt(0).toUpperCase() + adj2.slice(1) +
      adj3.charAt(0).toUpperCase() + adj3.slice(1) +
      noun.charAt(0).toUpperCase() + noun.slice(1);
}

/**
 * Convert a millisecond age to a human-readable "time ago" string.
 * @param {number} ageMs - Age in milliseconds
 * @returns {string} e.g. "just now", "5 min ago", "2 hr ago", "3 day(s) ago"
 */
function formatTimeAgo(ageMs) {
  if (ageMs < 60000)    return 'just now';
  if (ageMs < 3600000)  return Math.round(ageMs / 60000) + ' min ago';
  if (ageMs < 86400000) return Math.round(ageMs / 3600000) + ' hr ago';
  return Math.round(ageMs / 86400000) + ' day(s) ago';
}

/**
 * Extract text content from a <code> element, correctly handling both:
 *   - Standard <pre><code>: use textContent directly
 *   - Syntax-highlighted blocks that use <br> for newlines: convert <br> to \n
 * Cannot use innerText because it returns empty strings for elements
 * hidden inside collapsed <details> blocks.
 */
function getCodeText(el) {
  if (el.querySelector('br')) {
    const clone = el.cloneNode(true);
    clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
    return clone.textContent;
  }
  return el.textContent;
}

/**
 * Extract the //codebase #step-N number from a <code> element.
 * Returns the step number as an integer, or null if not a step summary.
 * A valid step summary has //codebase #step-N as the FIRST line of the block.
 */
function getStepNumber(el) {
  const text = getCodeText(el);
  const firstLine = text.split('\n')[0].trim();
  const match = firstLine.match(/^\/\/codebase\s+#step-(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function logToUI(message) {
  const timestamp = new Date().toLocaleTimeString();
  const logText = `[${timestamp}] ${message}`;

  const logEl = document.getElementById('forge-log');

  if (logEl) {
    logEl.textContent = logEl.textContent
      ? logEl.textContent + '\n' + logText
      : logText;
    logEl.scrollTop = logEl.scrollHeight;
  }

  console.log(message);
}
// FORGE CODE - Clipboard Utilities
// Functions for copying to clipboard

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      logToUI('\u2713 Copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy:', err);
      fallbackCopy(text);
    });
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    logToUI('\u2713 Copied to clipboard');
  } catch (err) {
    console.error('Failed to copy:', err);
    logToUI('\u2717 Failed to copy');
  }
  document.body.removeChild(textarea);
}
// FORGE CODE - Compression Utilities
// Functions for compressing data for FORGE IDE links

async function compress(text) {
    const stream = new CompressionStream('gzip');
    const writer = stream.writable.getWriter();
    writer.write(new TextEncoder().encode(text));
    writer.close();
    const buf = await new Response(stream.readable).arrayBuffer();
    
    // Convert to base64 in chunks to avoid stack overflow on large payloads
    const bytes = new Uint8Array(buf);
    const CHUNK_SIZE = 8192; // 8KB chunks
    let binary = '';
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      const chunk = bytes.slice(i, i + CHUNK_SIZE);
      binary += String.fromCharCode.apply(null, chunk);
    }
    return btoa(binary);
}
// FORGE Vendor Bundle ¡ª JSZip 3.10.1
// Auto-generated by src/build/build-vendor.js ¡ª do not edit by hand.
// Re-generate: node src/build/build-vendor.js
//
// Gzip-compressed, base64-encoded JSZip source.
// Decompressed and executed at runtime by src/utils/jszip-loader.js.
const JSZIP_BUNDLE = "H4sIAAAAAAACCuy9C3PburUwOvd1vpn+ClkzhyUqSBEl2bEpwRrHcdq02UlunHw93aq3h5YgizVN6pBUbMfS+e131sKDAEnZSrrb0/vdO92NRbyxsLCwsF548bu93/zmj+c/h8vG137H63a8Rrtx0vhj8DU4n6bhMm9MoyDLGvMkbVzzmKdBHsbXjSCeNVIezOD3t3DZmIcRz34zWuT50n/xIstXQZrfdKbJ7Yu/Zd/C5fFvfuNOSaPX7R61e13voHGOJRp/isPrRR7xh8ZI1GlMgvyiYdQ//s3rVRA1onDK4ymfNVbxjKeNfMEbP739LJIz3kjSxu8/vvva7zTOOW/AKDL/xYs0uOtch/lidYUjOc9XN2I4L26DMH7x7u3p2fvzs85tkN7Mkru4owCxyniGXUThVRqkD41lcJM0Uh7xINs6BP83qlujyziZ8WnwAuq/uIqSK6vj3/zuxW9+szdfxdM8TGKXk8dw7jaTq7/xad5kLH9Y8mTe4PfLJM0zx2lCv/Mw5rPmnsq8TWariBPxpyOLMu6SIY8y3oD2VPtFi6IVxxF/O8HtjIif7uSCclH10a3r7i6MZ8ndWPzx60pcR8lVEI3Fn9oSGY/mY/jHzxdhRjoIchjyZuNqWJDHlOerNG6olEbmBjShC/KoU1ZuSgXM9pJJeiF+Bfjra5A2clYz9ZT/5ypMuePIH0Oowx0nJ7K/3E3pXpdAeqTSIpkGrcYs5neNszRNUrd5GsRxkjfmYTyTK9H4bbOVtpq/bZJhvkiTu0bcmSYzzpo/fXj95d3Z5fsPny/ffPjy/nWTxhtoL2QwdvYol85/3GyGMIdJ96IzDaLIDdWqUhNRxASxoHcx4RdDOdSVm6/XnGxoSIuKGRWg28hC0KPK3MyT1IXWol3ARTnrDvlo0Yl4fJ0vhrzVIit3MeEXRI9g4z56/qQYLM1pSh6bq4w3sjwNp3kTATlj3G12XqzyMMqahE7FZ7ZawrCahC5Z8+TV6euzN7//w9s//undT+8/fPy/P51//vI///wff/k5uJrO+Px6Ef7tJrqNk+V/plm++np3//Ct6/X6g/2Dl4dHrResOUw7PMYFMIGnppzTlMY0VPBhkwu6Yl0aMS7nR+csolPWhHHH1809xmada55/fljyD3OXk+FqpIoOyZxF7RWN2XTs5oxPVq3WBU3ZahSNxYffpeYH8aFYZ7oI0tNkxk9yd9VqEVWjnK4qV9MJDVl+fNyjGXP7Tk5Go8E6PT4e0IB5o/nY9fadlIxGvXV8fHzgHwxownqj+fig78TwtegsV9nCXWLDJ7kbkpb+nRm/A+N3QvRqLzp/S8LYbTbJhqadGa/AugJn1qUL1qUr1pwFeeA3YafxTra6yvLU7dKVhCdhjK2I3EPFjnsbfw2icNa4CjJ+MGiE8XKV00aYN6IkuckaUXjDG0EDWm6s0qjTFJs2onPW/53LGe+kfBkFU+6+mPxy0v45aH/rtgFTLl5c02aTENn7i4EYlpywWuS2B8PScDgYEMeZt9u0WrBXX3D+794e6+46ratg1pgmcc7jvCHahQkB9kZs2lmFcX4YpGnwMIaWvsDnCXy63fWc+JBWfA4TA1NztuyE8YzffzDmmLRaBPHEDbdmE8CrlAFOhYhobvZU2R6NASczMhodrN1ge1EaTRat1gXL6cFgj7HMcVyZkhKRFBRJsUa+aLOhjwbR8PtdqkmK3+9tLmhvB0oUC9LD73OexkHUhB0liFGe8uD2xesgD/6cpDc8bRKaWVmn6bTf+5gmV7xJaFCp9Q4BLvOH+uBKxFBgT5BHOASBVVimPMv47Dz8xhmnmLqKS+m5SJ9CryylVtUwiVlMS62dCuxh4SbpLNMkT4Cus8drnsscMS/fOHcBIhwPudCNOx/T5DbMYNtkSfSVu/XtE9JZhstSbpjExgxER64qCe0HLpKAS4GWTUJozqAFtby8k8Ruk8ezJjXGF85FNwLMb+N50jFa2WMsr8Ctut9era4bfsMsJ2hGFn7jjdswuw3y6aJJNoTyDUVoqXJVgMnRfjfE7sJ8ca4n4TbtMTdpDWJUK5Wn2qzHnJreAIeaBj5tHxBwBBVcI5sNTTrTlAc5FzB5kya3rLzZ9FLqVc9sDKhMQONSp4Q6aQl3qvWengDZ0FxzyImgHHrP+we0dlf7vX26fU/7vQNaSyf83svNBe3vTnxkE7+HC1Y4VdRmmHbOP3/4dMYeb4PrcOo3/9r9a7dJbcBswcXYbWLdhgkFsqHlLflcdTjTzQbgnH999ubdyeczMfR5FOQcWn7UH/5Lum1Ofu9wc0EHu0NGMoiYlDBjsIqL4zQHzi1l3WE66u0fDNNWizxylg5ViZh1h/HocBi3WoQzz+Hj/tHhYe+o1z8c/MKPj489H/8d5sCKc8Um5xuXDAuUMQesQfU1CWeN7h5j3HHUATs2+MXY4hfH9qRpLMhtyBKasbiVDvkvrO3pcQcsHgajbBjguGGIh7+Ek97+vuPyX/JJcEEU39/2fuEbt7vOKaeaee0S/9fsz2Q9A/Js1115OJun8f4zy552BAPE9jyadq7COEgfxO9ZmIofguK8SaIZTzO214W8IOcsXkURZJunYSXpwxK6zoycWzgd5ecqDu8/8vQ2xLK61CzJyqkb+ri5oAc7ITGUH8as7iYsj4qx/OtztxmFwEkUSPeo8mIAZxRyvw+U5eVOXdf1WbCJ9QIFyPcOninQ72EBwSeBbKNgjNR9LniKrtGExeNmwcA2/ab4W/BIC7HNAnEJhtOHNt9E+rB50WxxIg6lSxiAWKzi+wRbUYwUJqnFl0zULc8D9rjZpB2kraz51yugrVknjBc8DfPMXdCAwP1I8U3wa8qz7HSxim+sS07RIMc/FEbDGCs6dxzxW6Dvx+Amcc3hi0tY1snTIM7mSXr7OXETypGzIXTPIxtrIPNolS1MWhiUMwuwkR8czOQCZB52v9OIB/GX5baeZbbZd2mF7OaMAZhNmnWAqZqUl/XCfUyDO3+vSyP+lUd+ZY07mL5et72NODgkY2nMMYnhuLZXUUz8Ee+lnMJC+jmu50Yce/bBadU1Ts6F23zNxTlIOV6Ly0cuqz9yF3APlBUfscvHJ05R66ZDYU5+H47Ww2dIg95hJ2KHAXhSGrNmE88BcYzmeIjGLXaOJ1lnnia3p5L8u3AgcELhfGCHilmPN7rhuLje0Ex0IOQrvANSYroCsUdBlGnEsj3GPnRW+fxQSGvonL219oI6UWnmLjpxcMsJSIy2lDFbKorP2EIRfLrc3vyMEHq7U8tQ8pJNO/riIbpSR+A1uy2yZir1ijWb9Cv88wD/3LEFHG30Bv4GOaf37BG5cb9Lbf4WBEBxOWkzzB1nL12v3Xt5KeTiL72vXClLCfS+er3k1XsD7p5z1oWO3PM1OyQ0Wq/3Lh1n73q9hpRed3Aoin1jXXrKusM7x3G/rZl3QGjzy/u3/9FkjIVj95S9PDqk39YlRgrxj3F96Vuv3ZTlY+/g8Kjv9/u97oBQ92B/vy/kWN7Bxl2Uj2p6R4jvnrJe125fb6+DvuPy9bpLoLJ9oBM4q26ATfvy+fQPySrNXEKD0Ygd0GCtM34K41XOVda+mXXOp0k8y1zyokcTnfpmFUV/4UHqkrZ3dNilyWjEBjQxWkzifOGSlodZ+2bW6yDnLqGXjuN+ZSeuRz3SOnFfuXNCB6Q1pVct1lwtm60T96vCqx5pfSX02nHcB7PGEmvcihpTqPFg1HgQ63YGe18C6qzFmn+N4SA8a7ET95z2CPxaiUNSJAYy8cRN9C+Jf3RQfNvoVmSUcUxnzYuhiYQrI+ERSMcnPk3Smf+p8+7D6cm7yzdv351d/uHs5PXZp9ZZa966orMw1WVOz95//lQqdeKewsTPWifu0gAE3qvwbtU6cb8ByE7cGP7MW1et5QYF9W+RoSkYnFB+b+FwPuji88Mmoa/kp7h2E/pJ1Q6v4yBfpZZ8KCvY9dDkf34Ol2/CiOs+8Di7esh59uc0zHMes65I+xYuTyVvm+uUj1GQA0FTgiNBxqDB98EtV7IjMR1IzRT3FEynq9sVnEvAgktBAEoxXq3mc57C7QtTNfQznTRdpSmP8/NklU75h/k847kaJI/zNOTZabKKdZosDt2bHF2G1aHVzduCP8toSGhm8mcWV6S1JIIn6yx5OuVxvl53acoqI6Axs/pSwtISBMbV6QuugYM8v7weLSZYOIVqYWmwxuJKrgOLC9bj0QCGX4YOlbPx07Gbt7xu93du2o7bHiEvUt/rdjcbQjYWcJIlj/lMLESVea1bp8p0qmskTnQ89ww+y0Qix9mThWZhCkJ1TfIFm6AxqjqACubW4S0RK2RwbmmnIBUSkgpYAJYNKkYriN21oTWNkmw7tKwdscvEqZ5u9++drpJ/FptNTD4tUgjNSRkqNYfip87rk88nl6/Pzk8/vf34+QOQR67puPgoU2pMraHgG5eTErAFFgo9NHCW37lOw5qdphUYuqmaQtkinOcuUQ2UKIq9zJWLlBYq1WE/sEGjMvAVnWi1KjAvFZ3kF/UgEvuh0mGb05iVJTigMoDy2TYeNXTjQj1XnIKv3346O/384dNfLs/ev7YPPA5HoP6Ti1VOxZ/MOCWzjVs/eZpSXj54dturcS1A7DVapnwZpPw9v8/L+1Fux2XKv4bJKitRcIkIYiQm+XOtWoYmQZYNs4/BKuOzsV1uCYku8e3UlGerW7BesAad8uswy3n6UQ2tQkP0MOXxYd5TLQUIAKpJSxdVQxLhctRT1CpLcouQufmWSZdPvXFehTpMvMPjmWv0BsqU8tAwUYwJ5lIGCwCrev/d2wsrpQwxguO4exbUlQSjNGy9sOWhgyjDXrf1uq4FmSrtnPgM1UVjIeSV5zuCANorrTjOu4b7sLpBc5OwXMtgAziRRid7hVhWXskVpYGbeZ4+POZoxaGgPQWNFfQqpdflAy1Kpjcm3MNSngHtYYkIqsFLAshNkscn+QXWdy31SoayC8Xu+gNq87p+r0+38s5CtiE5Z7/v0YLrFlLkox2EnyvFbxdyBmDapU6hxEgPU73iFdEODdQlVUijYjcwT3ma06CzVAd2UCZ4YOowhMXinXmSngXThWvffhetliT/tbfi9RoY09UkvUDMiSuazLTVbIRZA6yQgoawITCm3Ljl+SKZNfaapJDTuHknkWIyUwoTWNo9YIfrikkB23od1KY+bsAaBTmeDP4GOR/mncuyJo/GVWUdMANN+gispM/hIueHFOr7GZViGz9XApz1utmkJRmAn1ekAvZF389LN/+N1CcmQKsS+z6yKDZUUmwyZT+1UehtYpcPOF1CLR8kcl53V5Gc1G/v4T5shHGWB/EUhO6xIgtCNwfIEKTXK4CFIl1VJffnBQfzkSxPV9M8SRsA8cYySINbnvM0ayyCrHHFedxI+W3ylc8aYdwQ9o/9Tpc2lmjt2Jgu+PQGjR1Xy+s0mPHG9Sqc8U5TnuZo+Mk+oNGi1M64wGgRrTIudCyYkiZJDrIvkR0lsXUeFOYHsaZDOYwMSVNhoqb1EZA+yS8cxwVaxOSnxne+2bixYfuA+1+aWIK5TxLMTrKHWJqfwSeQiY40KSkbpcWdGZ8HqyiX2g71hVlfeYp6p6Ywo23S2Gi+TnuImuzYGARmbmjcUXrpimVKQWJjIR7WI/BRUV1SaON8fA9oqJq07wmNdmEzAyjq7UxTSwIQc3BaY4siDwmib+HyTOysilbIsp6RcwWD2b9lX6TSV++MuRvblhbKzsKto5txp9BaczTZs8xdXNOQAKj/NmYG2Zhaxio17U/wlENlr9UtJo9z1zQYTdJ0tcz5DG2m/cbpp9N+zzA4IT5wkqRgKsmmVgGdiJkuLHYxYStEnHjmJkiKH4U21d/zKO5i7A2+gLDfht/47BWqWIWQH4uZ2lVIEBZ96jzzYxSAi8QNoVEnzN4nM+448EtQc1Bzh4YVDCCdCQJBYaZB/Nu8EUynfAknlwBm427B4wbgLFqYa7vyDgBmpfg6uZRuEw20k2AmoSkOEA5X7KRTO0OaSP0y6eQLHrtVZg0NVNxEU48c9ybcbfPN1kqTsGL0wwkYJIj7PzJ9SadYAWLbJehrLZgnSB3U3E0n8UVxjyt6QC6N1A1GU0vG9dUnZbkYA63pS9oCQE80YyEWhFU+z1MasJWejJVDhgv8dAMaWuhOH4W+HtRyW/CrKw70UKg68IhHVkGd76IjeYE8z9Vgx+V0Hw+T8vkfPnf+h6Xzv4TtiW1bsCEUR7deu2rGpLOKs2DOP6ThdRgHEcpNM80W5Mb1Vw7dcVytdWJmPqELreEr0WyTAvre4Em7JINHNpSBNtX1+32g8LtbQu4q4y4JrEvC6vc4DbWz0aK1EcyCZc5T9CUxFPirpSh1Fs/4TMuYL6/CeCZpSk428ROCX6PolhvY0JVXGVGIE3Wbp09csivaYFuQSLZfgm0Jgn2dZNw3b8lb7u1FCxX4dIuLeElSAjWeu1xjIftubYJGwwWV/7/O3b1mlcfFXdq3ulcnn+i/eqN85spY3BK9XazvEMHBjSm4inhbtN0knU8yZVjWads4nisEXvBoyUGJKTYRIlw9XsE2iZXIZ72OVV0N9tRxUkHgtyBX3OG3Ya6ztqKQ7AVZcZB6mxu72EogT6SxuZUAGlVrDDnKQthVZkQt+lOGqO8dwIo8Z/VnmD0JvqLWf0iIeWnM78QvsDv1bQiHc1cKg8FwwXGMjz3GChMoTFE3K6MQtgLHdjNe3V7x1HDGqlyzfgvXLLHODXUna9yushwv5VfgjiAa+W1xB+d3sjfJ8AdRlExFil9yB5OjwhKlkWJaITk0WzUYmHkYRW4XGBgaZjV92G2qIi76EEmWrq48d5wafyFA+i0ZiOBb8gRabTbCrs7b3/W+nKls3Hc0ZCvD3DKHK4jmiFPkiOdkmAl7QfFnvQaogb4draTA98CUaziOaxvY29btefJlueTpaQA7l1AlgtcTy8ocCbZXNjNcBmnG38Z5NYseEjjnKo14B/3DgVPfOhpKdqGazexALaeaaNcIU7hGs2uXY8cWP+Q4bswuIcdxrgwiGGvXuIAVEGCh4+x5DOAp2MLiEznwYeo42nZWmXqu126mrT4DQt3clIFMHafL6sz71+tMMGp7oNzFIlIkgvMrTEqLxrsURRD24gqD5yYN9TyU1THacCbMHs56bX1H49xf6vvQsrgP5QT9cwRRqV5jAIPVwGi25eKiZiEGtMC9PoN7IM1MMcyEX7DFRh9s+ipeurlHT9pm2nd0MYk/IPlvEjqvyD2k5KRYkg9SuEJnWgCgkxKRpBgidPOrXvvprZn4QnCSSla4XOUngo1sgv2VSZqaLwDzeCcDl1y37RHEZuVcFsbXbpcarlyKcPJOFGT5W+ma1HxRCEu7o3xsV8+J32xu6HWNkVHzBRh8l3pvMWgPvEiu6g3Ic6a3QT7O/bm96ajYjNRaYsB3Q2OAlIs+wnVqr1u60+SbUt2NZWGrhz4RwqHGJ359dr+8ADBKiV7BGeSJNAbEvjnZCGbnEW7IvsUwVOSQYaYk0X+vzHFDpRzdr3UyRJGhFheKWRNp2SFAkF9QsC+Tq6QFkkqTqUkHcRxVqEvLxYgyp4U0x+Eo0d7QeRjl5umqDiY20f65YiS1qgDBDDiOZNyAB6QxNsr98nEYzl0PvOLKMmB1OBeja3FqYwvUxwkBfwM4oAbJ7THiXNw6nN3LxUkRd3KeCRmZpDkmnIsB6MnDmYB36nHoC138HPHUghjIv1NiDEWMMyVkx+E15PDSYnhDQ5uFY0ppzq4stZuy/0GBtFuwakJcnaOJCyyHwFtrxKnZsNmVgITQ3YBdo6AQqUUhUkUh7CqEcjQgmYUpmfGI57xhN6nNKgwt49NAQeNUhdGpgckpIBqKh3JTPFTtNp/EF9iMhc7gICfI+T+RCqgu38ZCdlLDqEqiwB43qIEL566bFvwgFxJSQ5WH8s+CHfAVO1DVcwn5ExBFv9mkSvvnN19/OG9qYRaWuQ1v+WcsFyyXUTgNoD6ciE1qawpBeqVNizeEdFBZkXYk5X2X3Ck+s+Tkkm7nSGlTcBUFUybaA6wT7Ws+h+6JlKoS6X3SSFY5CG8gv5Et+TSch3wG+p+VEGqeC1WCbJTQ5ixI78JY4LqCDnD+KedX2aySHoXx6r6Smq3iJLNTwTRYfzBhW0xo8y6M+z0xvaK+VRIWRoVvSAsloqmgApXiMGdJSRMsyAOSd60QdMVdK1J3cEIqGkLhophTAZL1WlvnpB2FEgYSo+7Hr9+2pvzIRnaXE8MQDc4L3SBwTJUdYeidOEP0J3J0LpfoAAzXFd7/lHXp9q7zxOTLoPvNsKKdqnCFPkonS0orzQ76R3QHts/3ek/LSWt9Jer4Wb939JwUVY27vw8304OdJRgcLbJQnKTJjC9YPWjo5e4OkOCnAgIpW+QaClmQeYQV+lLDUK2wPtX2GgwdOCb5xTahUEhjYtmqglXaSV5nWK87EQf+N54mLX6xsWob3PW5MgFh2zQXhpNhl6AOxUjxUMdopvRQSG2m9OHaj4ORjP5g2B2xbNhuZ0TbTsKAswvg4qQlkUhpeZCW2mk9SIvttD6khYojydp68top0gYBCMRO4tkpkstaGPwD5g+dAvK4g0IcBFfwSffCcVL85V04Toy/eheOE+Kv/kV17BVfKQVJPACE/SrcU+D2zSVYJhemZSwiosF0I6YIaztADVqX2DLkWEUimKWb8sewKn+0No3voRHG4ffrP0q7Tc9DGcYLBCuixRSD1Ib4PE1YdxOawRcMkPlVO2zIxM3iWnDY0CLHr1sIMYSRsQvXaz6qCTVyFs8aEAMKwh2kPJgu+Kzh4pdoosEazZbRZKtJG0F2g0zajN9jNm81SadhK7PHQOgynleHWJ6Yus8KSPENzW7CZbWGaqsMCEGMTF4TuPJg9jbOa/m/7lBbH5ewVaKmbLrtDfNjI2WYt9skZW46Gh2SlrbOPcndfAtapmIgUt1Z5x5Yb7Jr71YOloXqy55mHSWtAqJCaKpFXpe4dfN+JEBpEA0lInXhn86Xz6cueDS1XH583Nt3vN5LQvG353j7pO2BY6B34PTFD0/+2HcO+tTtew4HJy4Cus8ntjBs2KPdj8hCor/TQbnzuVdL+mow6b+R0FWm7vc8iHvT/QcwGL8mv2AeWQbRIt/JOlSaNUV5nBQH8/eex1qSwiqH6eb/bThSOQx73u7Y8c/aVjtwFI1ynKsaoK6uMJLAPwWu1rbzIC5D7++ystBmhlkN6JVcXpwuOlVK1OGyJDR3OmexlTbWmZRpCyg7wJ0+uKybfl4ou0BuvV6HZjQy8xoJ2wfVHwl4yIXloGULt3QkGjEhwBbeFwZZpUKlfDgylUWuHQrs6fWidXDzPbwSWlD2e92nSG3/2agmFXdV1vz4p//j/wRxQI2XKmT+b/+7mWk570D2//VvkP3z248Hg8tqIeju8wds59/+x1MFZWv/hq2VnMEg43/89aopdLK974jYU1Yohdu46qxMQ5qnSfyVp9JMs5EnhpXQjGeIl4xvQtMUKC75gD4Zo8Mw6QktnLK60IE30OiHqxAQNdYoFnrVBTrq7f/9cJM+wybcymAzDWlxKlvCfXW3EunvBGTZ+pWFrvRdrc0G13tarAB/3lnkecge/DCpfdKQrWTGVgr5VTJdW6bJEq0AeS3YOQD8KcO1rUAGjYHlQVRAdGL1fLFed4dPl2B5y3JD3oRbRmCf5j+E7i//aYuiy5Xju8BM32ZAoh+0LaF1Kb8N9E+8zReuCUIKKi9kl3k4vTmH+/EqEmaJvGp0m9vddWmuJQTYjxEWDBzPc9GFfcjSwtpvvc5Fvyfx7BNf8iAHW6ttDnZPolZNrJ5wh1g9GiK/ruOeDUxDmCZBp60ES0DvostFpBg6GzZURhkgNdaKdsmqQVtlcS3PT6kbCLM3YRxmC0gwBuBqP1Eje5dx1iNWxZUQC7CamJdbh1c4DUr/GURp9lOQLzq3YewqvDd2QwutiAp/ckyU8o/b4N7StqKd5jC7C0EDoncKeZwGGVeMoM9tNlyaTJjcNxlepTy4GWI1M/oX38rB19WUlfC3wWrarRSXK9XEpsLlq+AYTxj6KnCMi1ovVNrvvG5XWAL/EKk83N0rTJ26MR4163VTKlCa5dOWPW5onclxQeL4fZ4G59UKCrWYilBQIJexO94l0xvTRDsCJ+cYIvEJ8EH8+HiGf6Bff3KxobaLNpIW0yHrEaBflf4JI1dhPguHETRbuyOqW0BorMGzH+I3gqds0SBYySrPNEEBq5sZgkFoZZ9ZV1vcFi62YppVwcFeqU1F354xDHerQ6F1I6B13tDat1udEKV5SiqZxE+oGosVnfALZYgiHbllQ36ZlhroVzerWrQzgrsUOATYAhOtWvNWx0ZK3tHVwZvu0pVc8J02Dbk3FDzCag1dK7784mgDQaqdXiuXV3um3j1Tekf8VkjcW83fomlEEIGE5EGYSAC2aGdLA9Tc+FARDdNrbnCfJSxh/B8UYuBHggKgNXA19OyetUkc57ltpPfHtq1geTMI9qRERva+72Qtde8N6xT1AvPVYMXkawqA1c9e95nNXDhE8A1FqmaL88118usvvEA/7ZvJExSgtFPBpDR/Cr82tJTu14VT0SZ5peZJxcxwEWQf7uKPabLkaf5QbNJyTcq1a0lmj7Z+FmRDIU5B/SHya+7R4pR8Bjd12ISkrDFSCpmmFIRIhRyGWTLXSjVlByppNRvtY7ik+nxTdtQAxmMXxcqi/o5myWcKQWVZcqGiLwijZe0ZbIo4A5liuA9LO+tw7sYd4OsE4DHWRSJL15iGfEDrJG0SbATC0AxUJDxmTducqvtw4UcAwctAqX4ZSqMXlAllkCJMofAbYr1eKmOeXbx9aOI4ydOuPRjH+gmvsPRBIkZ5/SRrrlhyeGmo6esnOsBVJkqu3EWNGFUyz+DLlBLBX8tVU/VXMqgFqD0l31k0bTaIviwbN6M1LtlgYEhDcexnUiVbE9ckazEMayKTStNSNw1t0qjeHrHuBTJXOPgYF94kngZ5B+zwHiC4bU6q9xAYVchKWoaM0JqRhqCfdmGwIDiL7XEre9dh5Y5ie9uIMZmArVAgUQQfK5Cbh8+EKd5vUQ//WwjJLlQsARnmVigYRCVAKtuj3HCqN91nWK5veBYaFbBVk4DI0gXUzKuZQp1YmxZuNANubScVbtDYUeqY0ZuKpXRh6x1idYO+E2FajGcFMOwV5Yqo2vy7Ki+0Ccpsz2qrYFE2c/N2UljY1TGHhrSswlYXUb0kPgjyAPqssdUzVrD5JTz1UimHpkICTTbKVbK2HnlcKAkE1XbhNC1Yrir3o3exKbmQjYvSSnKhkp9h3xpWE4r3ElVse8Eyr1xa6GZB/8HC09hBeyqQdYE4lWO7XKCIkVNsoasHHKy0SG5axg6JDMkonCJ+QkfEp4ewody2aJhLMYDaECKKke3pvcNx5nsyUNJTai37UPZ7g20ih/5zRgHh3C1C8IOROO5w8VPsZyNZQKM2yDwSTkHjtgeRF+SVpp0CtOwJf8/U0B0+E9meGtmsZkwk7QBpA+4dn7or3nUzCoF2GWiXLAt6aPSwhIMUIiY85rV23RvSgUdkDAIkD208V1x4964DbbxaheD6sF5jyp/51Z/CvJr+U/KtJvHcSCPDEM40uIPFYBuuBxuCjBlHWxljeYgaHJvNRky52H5sb+9JF2mzFbOWhxrZekfgftn8ICuLvuS1IbH91hblcDxpnfPYky+q0FWxzm5v/wA42+4wxHdDQnjMbhKCfWxvxMLxgd8bHMKPfb836MKPgd/rDeBH3/eOsEzP94arSW9/cMHkH68Q3AVlPd0qn7cPGyJ8ijp/Ij7PP3zlQkZn8qy1dQUr1iSbzPAXqDNcWRjbapx2LG9pl8vmmsR/4q22wrAxkRybgFWAkNrf7x0dMOYeDPa9nuOWLFVDAh5UYcsbBY6zf9DvdYuiJRPWsOVhYTdlEOb7oOWmbWx8NPK6pOXGbaxPKPRKkxZLR17vcOz56Qhij497fjrCiuO+PxC2fmzxxOtoifk2WgIIAAxpNkr+O6cl5pRPMnz0zHfl3GSCd9SDN/2ODyBDzFXm9Hr42t+x1/NdlTToiqRDqqr3DmUh56BPyqkH5cSDvpMWNjEbFB9kRuCfZ9Etse8ZxtFJ0XFAXHfd53GwwMDA3La/kzEKc5aipXs2BMtuWIBJ3mpdEIAlCSYpvhanH0IdjNyQrTCsjswDSPZp3mJhW54E0GrssB5GrO97fh9/ePv+y6E3Ch0H+4pZDA/aHfQd0R8N223IHpvN+rFcKDUO343bAhOoTEJsgGcZva7jdXt9nQ54sYYUJ9Zai6B4TAAES4WeZBwwQ2nSpSnxVVl4PS8RN5435gMOAYTrZfYqWTum7mkWinapSaFxDPDOsYsyW4gdv7s/YYQxLCycBaGUYhT1qRzZBBdZNKQZ8KH01zFIgKrUqm2JiKudmUVBSofJKa2tI6NKMzuzuN/VkHrBddTcGRC33RzsqhT+k2NeRBTK9bbAAE9tDxwcUsfxeoeMud5Rz+HgQTgkabuttnE66o5zH/iCdJz7aWs1gTIXx/k49fMNyPhDlg/jvcJ5HkMXGWvkQmBHA8/i8vll5MaGH60vKkq/w7pamGVWIRW1nEl+3LBimBM8FdJ5B+RRgsRtPVp1VJzrzabuBEda+SWfH77GqjKeaGBunAigEP2IzZJ56LtbjJRE72ex0XsknLG+12Fq+6ua/bKZY1AjQkzK3Jpk37RQsJZ7W5WjCpb0oDqsoyXdywtRs5DV6CC1rVZK8Fk3dHoyD2jzjANvLZ6Ht7d8Foq4BIGSmjFbQhiULqooI5E3BSO6C94ScnVLSDekeiGI/1EXAm2zKe8FOUT4UZeB1JKN1D6LKWLz6cih6IELdcHxdrORcZMexX0wnD+8eijrHmhZlto1jnKg59mIaRfvmheGpJAOhYXSrW0YwskrjwaGNqdVM1OxVZ5rUBKckGrriLCV0owQMCfdtQlF6epaoWGLpcUqFA8kWyALbLVx4QPXbNISDqMKs/4tJkHpNR5THOVpEL/iXzI+8x8LAu6XBMkqaKRB4x0HQrQ8M/nSUerpN5ONm6BUmW02LqHFKm0dQVFkpxHIyEfymv7cADabkiWZgLLgxFIW2KZYMdvrYuAngyPBQzNmYccGrgE4v4SLKQbLqVQoChEaowJ76I3yITGAEXbK+8rlNAXBerFrhVnPPEqABX7R0yxiqW6A0kxb2LuVTCKK4euXEFxA41NQ5R5ZhhRgCn71UyUVktTAj2kJ10xRKacFD685GDi9C2lSXUXViQFv8D8WFTa0DsOrvRoYa3Zdh5x2ZRvZjLobOpXiMTX5TE4+fm5G5QHtOplKvecmULn3G8OWEjc1+JramVvpUK1WXfF5tbi14OAU9K520eN/9Lxr5gFwMASK5TWsnd8PIjCvW974x5bOkJX+I4dsdvRD+26+876LgX03boasavzDRMD3Pe0HlA9LbBhXj6gEVgA4Rcimk/Riwi8wRkKg4tpudUHPlhEYW71AFnVyURcbRUp0ISDKsNnBeGcwRBH3DGI5xY5jXqbaHoR/6YiS47SzTJYu8eXTUSHRJDyV3MKLJo5Uz6Uu3FQ52hzX7w77Op4TQn63cE5jpT+1z2MrJKDl2uPbrAM3g6EVy27f7ROT9pTqGLL3sa1vlGETqL3oZXv5vWRSCpVyUdEMPakKUvFCBOx/OvmPy/958u7L2aV38Ort53PkGPatjH4PM9oeXkB5nj+wWlGW/bYmhJ5pNol58sbw6t5f75st1y3FAEgJGXkH42a36TebpJUX0jPvgNjhXooXHmggNHpVMwGev1V3HNfgxhR7la7XwjBvvZ5cEHGzVtfW0r7UfEUKVkipoTI1kIxyIx1WIYUWRQSeStB/KoP1AKQ46w75qBzeashbLaIjfOlcMO7ZyYzIrIGhtgRiAcMmXhCAP8wsZb4kkAo5gxm8r5gDvIAk3zvVZhPVoOAl/4EipH2CGhjgGs0dAZcueMR2j7GJ3tIQMeiiSfU3FLpoXgjb5A9z95mNHqNQuk5/9gZf4wLHNpSYr54wkRGLWVRA8xeIA8dK4fM7eZBe8xy1yRFQXyhYfSknLUpiJhZEH93M1MjFoAKPtwdiD2p9F/OxbeqCd0XOgqccD30jkiW8fJqNObzQKqRBnPix4+wBmQ8xwuAW1jF5QgmhD0O/9nwGFoXAOFZPRNI/xXs6gAmv6BjDIZmDXUjaav6203ibNUKxUwxi98fga3A+TcOlDOgk77oU8YiaRJg2eD4lENeB6FDlpjp7l7jlhgjJlK/4+wOQIvV3941LEc/knzdJ4R6nlYPSFM14UFN5zMpY6A+Ft6yWSZWiIRoPmijDB8Bq9XI43ywqgTxqgixww65UDLje3xxj75mlcAu32cD0ajYakIR/ANLkkuDGDsWRpI2r1TWYDPH7JZ9CsgZLw222QnlauTmB6B66kJHDSatJQN4DQYBrpmgbuFgTGJopOogHJ0Zw7NpZwVazrBvLTaREBOALZq/Ayucsnn2Yn8KrPUFUsUmfhdnNewy7XOkQglv0lLdTmN38OcwXspnXYXqeB2n+ZJ2pLitfwfsQQ2y712F28331diyNTzPXFR1UipoPd24pXDxBIO5iWwYxLEUEkZkYAaG2HYimkjyr00lZye2WqkcBzSdrS/uuYz9CAiLMAgt+DpcHgydR4Vu5xFaAHhJqId5NuNRwewahBj+AUIMfRKjD70Kow90R6vB7EOqwQKiDwRmwdFl4FXGM6yC5OM3WqeCatUvRHkCErnhI+NYNsQ186RYE3T40MBB/DGc+p+Ks9XP6NYhWIKJ/CqneJdMgT9I643G14ljne5Y95VGQh1/l66/YW6mNJ+EO/crHyrb04o1KBav27T+tojxsf02i1S3P8OwIUm5fj5pytwEIIhEos8q5G0x7cYaaXHvOrDDEtJbAw2s70yD6AyYLsCiMtA/OrBpRAfSzepgfg1QqcEUXkLkI4lnEv3x+cwgmiUrndpLnaXglnnYX8yzAX5lnEUiqMvK6bUOGz7MAWV0ACDIkrmCxA/cRkdgv8HlT4UsI6RgDr5l7sSLqrVEdbKVMQpRto7mAQqJRX17GZC9XITtyKAbrUd9+q9lIxS9gZGV2Ax4NalwnuapmdS2WcduRUD3X6mIMGetiRctAyOmwasp1qKjWpXWoOa4w7fMwnjW4iMRmTIrDO30PDR9kFCiSKN7Aaowbb+fIz2e0kXHeWOT5MvNfvMjy1U3nOswXq6tOmLz4W/YtXL6YJVO8wwqbv0VylyfIO19+C5edRX4bNcXFo25xlALwyTE2yZNsXs740Aro8zxkC5JQ4e7c6hkM9o1lCY303dp2BD9R5akT+Huq7VYYz1+7pJAkVUrK47eubHEAIVUAu1x3J7x+JmgMIXVBA7cjCNw8scnt6ByJw7NZkJ0q1mwh888NtoQ0285t8J6r7NUdD2GaPRU+R/ugfedp/p2LY26Q5/oZdcmvu4Db9vqO4/neta0hBpV1dUXE+ZTVbphWzYYbFntFRF3vdWnaYl6vtZ0z1VfWdgqo2x3FpIpFtP4IVwEjJNAwEGhMtDFivMMuw1da4utGs4UK3+Aqc2PSajbwjXiMgi6lkUIIV3X+FH2zGDVm9jMNvHg6vWhB78PyAeoa6cXCmqkFd+jajhALITiqyG/8HvoulN+E3mp1RE1Bjt9H+dHg75IfZbXPmda8YyLFSDIME02sp1UWdjX5zvRqq5xJWivJN+mlXKkqaso3kSlqCrOzeJo+AG7UeN14YPYnDNuuwvxNFFyTDV1lyOzWFAfLYsZc+FOuZHHQdXa5yP+Im3GvZ7CWcDF/p8LhGle31P60yjNekinYDYE3F3aUEtr2FJdZfvqnyCk/C0RqzZuStDEtPcI6C2dADa953uBxsrpeNMIY5BOBsJtIk1skktWDzbU7bDDGGm2vsV43ymORWUScgaBjYYy5eb0KEjjdBVg076TUWKAmYwHvsN8G1+HUjJcIqVotBDanrgXDMIl/Qvcn8tyJAVZhxrPizVamRYj1DbaajVV8Eyd3ccMN4xjefAQm1seq24PgKgwQ0kcZz8l4ZJQJV78aTKC1OCCPHti5NKdlfCvhi30BrOwArCLfeP4pmPFXDzZuq20hsVxuqhr8r0BLlpGS0F4RicnYIsqRToZb41UpkjWZmgJl2FhF9FNIhghQcWvoS/8m5NEsq9vieuFsuSKvFbYK9l0w5NUSykMUDpLiZl5TUKkethZUk64IFGrKGMTVJXUBs2XmNvnIUK58bp6eBcz0qYoPvSHXU+RajzspAWgdXbSFrTrsQzH5ityz/M5cEXLFfgROeN0b92ILx4+PD+U2hGfi9lzvwHliBTBeK1c8camfg/7TVftG1fLgn6iI0aZROa/xLF2vxVs7FlGBF4X10zuKP5Ov34FLa3V16uR9xm6YeBdaH1qX2UHRoiRjle0Hj+GVb3XF9Lfu1UNSv+Gfau75xqr75Kn2ntpVusnydn+qwe2kYYC2WqUttc1jiHEZ26yebhXyOyNLIYKRxB43sKlFU4NROCT5k1xNbO7YlNAKKuRC6JwroXMqhc7xBmiHuk+FZEMLKWVVaLV6Tr2iKbbk/ZCa2RsAdDQlvwZ95lYI0fby6hXrwn9WC3hjY6G+xCHU+xjkEIpLcj6wLavjyoumUpaV40pY4xxWKz+vMTKUj7VjlDOyhhmTOojExUjD7SPVEKpr4rnxhmBoT7fCcos808S43uHLwyPx8JiO7OxyRZDUvQEt1BQie2QM8/ZLzDixCg1kIRstjMcLlMHbfmHUJp96ewLqu0xof3Dg/d0TUqvy68zJvOdGTz54ZF0PfbzoGtFut9+Oy5fhmneK4CK8/x2hBEW2EU5QH5oshX8N5jPFP9R8Jqt4PovWntNp5Q3bOk4gLSXIGBMYezQ3PsQbqPp9WGrdmh/Nx9qsZ9DqnmyzCsjEDVKF7Kn3TkMr04w7q8QCUg6QbBUfLJ7yRx9aoRDDZ16zEzxcqoOrqIft9r7z4TZBDA0bJ/RztmwnyXrdzPl9ju4MQ/slOeGDKrLhN7zLZrwlJ4+Cy+LiJt9SI9J3aK+8wkN4GTJG18a8COkSVDzZIIRh6DhbSpoed6T6XtvimffaMrBvo+ioEzzzIFv43ENs8dMPsNW3Yrs01b2wRi9tiG4LlIimYIYhYSLdHi/FyxvGg4FaZCB+WVFfRelrnp9qpLYWMt2+zpVmXqkHnoHKPL3CiXwCVySg8TtYV+L0y11tDUFTgcC4PCU04FQD9utrLYxaviF6wAT0LJIymxWbNIPsM2wI2gwyMVv8WTwwgJ+FCSB+GuZ2zQsasX/iM7oQ0mG0Ujr6OVghF6RosprMLy5YtPOLflUC6fde/gpP8sHpZgd6jwDTDZvUGpkv3AXADvmnlVCAfrjKePoV3CVz6VhZzjH4CuGtCHDn7gqofN5R2lSJmLDMsKwYeSzrJKINN6CPYLgdTHOe4tNNe90NXBWMNQ1EeO2QtVrhv/c2G6UNQNdybZm9Xmu75LzzE8+y4JqfLoI45hFJWVONpgkhFR2nmcQYiTDLg5xPF0F8zTGnPOqziCOD28zQ+rNJxlWm69k6aOhb7s6c4coVcUArZaTjJCgbYoReR6Du6SIUUhAuo44bg1A/5DCkP6uqsTE3f8bzz+EtT1a5u4Kg+wWPnuBalgE5TDqA1l4niW9FBlvZayUK9DrLJMtlXbdLBMuwgBedNVO1Muxg0H+w8LFbaCv/oRDw5mxBoTblrO0NWy0+SockB98UMiyKb2IIoBPVPtMCPO5CGXKs1/F6nYLKhVixYqrW3ddRchVEY/HHrysBrsRj+Kc29y6MZ8ndWPzxH8E3AIJJ9ncJ+I9MlOFcbYMOIRpBIOqMTZqfzv54dvr57HXzggZs0nzz5d2bt+/e4XfMJs2PZ+9fv33/+6YB/kQa3DZVSjFoky0Cu3BJSaVBftq4XWV544o3goauqwPtAgMsg9T954qvuLYITlb5NLnl8t12yvcYWznOTEeCM02KDWZ7Key4GafFQLXvTq4EIUn8ZhXNwwgCw0tOGNbVSMRS+QL4NCOd1LWaFq1+QutxPmNp0ahOs9tUyZbvKApYyGPoVmyigAXlDI3zS/63jUgZref4OhQa3htppVU5DWIQrMrFaUh4NSBwbSPMATGbhPiRdqfARo1BTo1nNOHVBXASQLruOG5TOEsYzlLrdQ3AIKRs3eootsgKeyxcZngRbA9CB6rBzHB4Upyx55WDGCAjtNelFoSMuYSVUsWciby1LC0PHgwBuSFDyeOitA2QGMLOxm4mL8pFD0vThls+kZ2KUgx4WIz4BtVZM1tNQdTcNEN9qTwZxVTX1I5sG7dgHRJixucI4yCKDN+kfNvuza1X4E19vwpNkKQWp1lxC9FedRp+Lil7jxghJUpPbexWW1AYqIzhcYyAowCtrY/VYTMywoFdD3KqTpB11E1y9YJWMRaYOL1nkBarVFYDVTwhS5B1VyYpBGnYeK6i3+gex9zPLaooOWmkmOKQElcvwcGbvlQLC1QmiTNBZqC+QUQRZmYDVYJoq1bt2mVKW2nOoo7l4Yj9utNoatuoH4wqio1FNT6qxW5dulOIXgtIoTe72pGkTHq52pvF++f4iWJOMgM3XSnF5XJZId6oOuNyzcuE4OYIGjaxtDq6CsblkKmT8MJeSrd4dYNvNLErTUr1m9X2m0K/cbXfFC3GZb8ymL+CoeH5y2Fv1Tn8wsFgXvUwpr+qNDSgKLBP7RC4EogNW5mLltEURYe1ByHE5IqiSk0ZKxaWteS+u7eD+y6xPWe0r5hxwGpuB3wn4QZKFE7oMGshnFUgUIpL7QkoTC5EjcyIxgZBwOA5JVinxJo8BrhotXJYqYULD47TYmGSoc0nwaGy1VGSk0dUonDaagVAitbrcL12Q/twTCD8ik3CrVIIkwRPUNApJZ00mNY9wv3ftAxpsQyxWob0yWWQe7IG5iFcKwIGOxLt4kW9oAauMTxdZMMxE6HetpbCSYlCYhyBWtQM3AQLL78+Bvvc7eHtx83Q7VKUlEbhlRBvg7DhFnjyTpCBoRhx46LEjM8jEapJJ4VxJekb/IOnWhDnWRN0k2WJhtmY30fpg9mYP+jSukH5A4/Wd+IP0DptlzD7ykPRnpAZ9lTDQMmRRaoQthp2a9iEvMoa7pCY/E1HUl5tx2AasS6dA0ZNWZfO2OHQ5BWFSyOeXCbVXBLzaVYoN7Rk9IlcOfcx4l955M+pEGD5MzqF4DagjvbxISoqbpavwjzzvX16y2/fYY1DiJoU5Pz6wZ/SPPGbzQ3l6/Xjxnr7VfY3zDtpcOc43VHeKdobmx+sbX75eef6W7gs13Ac82vkHcBFykhpMe9AqXnTVL8rl13rx+N4PDPeScK5Fj6lWZ7eiljkxXcn+BqEEYSUZl0dy0KixNs4zHv6qYtbjJT3lUfwxBxCk5pjw1QBPAhZKIGH7EK6x1hU0RSEGEIKpVALVEA5ju75nOdCzW/1vtBONbMQMSRIZbhFvHCZmgXFhBolxwsZ0Kd3tYJOjTZKgSuEYBTDV6ykeMMsXfaptpsyv6hrQPOc5691jjGvmJAn4CPlvuE0vwR7h72ucdmzuDOxEQR/JgN8cHh+hmKIedl6CsiyXocTTNQ2eql0lN8szeiAVjxD80kFiNmoh59ZO6Gjt1dhxgUoWTxnEzMwyfiv/8rHub+HssbxwO/SmrAi8NzqcgVBdY11488vFie6aiUAj69yOA07Mb/PL0N8IUJugxCiZ2EBxfHNEqBAIrC13iqO44YdoeXCLpLOq9X8EF5skI3idqJGDZYRChI0EyHw6kwcR2wP88BN4rN4BhYde665q7tkiM7/1kDMlDBerwciCkwP7Qgg+osRUcBcqFyqJpIYlc0LCLDTuwIai9aASSdbpGF882o113M1ZgdB68zqzxff3C3CiLtud2SOtgRY4jgApSKY4ADCn49NqAFkNPYRasPLghYFd52I+D3BublG0QhAay4PvoVoYr+YV93j6kBSi/eN7DpnsX3ngstqBHKgZxZBbD9m9qDC9/lmgaQDMMh5jCHaMteooM2zbJoP5wQvzomC7t9m1xt4fVlAlS1pqiDM4uL3p+CO1WkSRXCkR3jgI7jD5zLFMyw0xYPtmTpYpKgk+KE6LsdmOvyBMMe3OKfBAa2wIf6+R8tMiL/f31zQQXcH7mhq8DAFbzer5Y6W9dzRrdGEwQaqIPFlrims5ZpMXur620I9sH65nZkyY8Bv450Ci3cKKrzTTPNOT7BK3e/gidj3sDg2n0SFMsqsXirt7YNy3n2uF7Jeo3C2SASCYLFW/R6h3v5T/NjgEN1OXW/fSielQa2Zt/9rcGnhk1zatCNRs8qlGUNT7Ndt5+fLD3+q8BhxwWMspNMOsoe68d/XMWJFcUOwm5SZkWBHZiTexowEOzIj8GYATejCYEpWW5gSGtkZBqs2l3ffHXkWAOibt+/fnv/Bh5/vP1y+effl/A91fMxCshzLjj5en2VlLjUrs9jKyiw0K7MwWJlFwcostrEyC4uDWJiszEywMiuiGhWsjFGDrQjwtRpF3AU1IUAgoAomnJ29vnz99vSz48ARmFS582i8NFm76Hl4RBXmOyI+WCbp0WzjshNCkB+Akb368uby7NOnD58gmhJjbI6vJYgtgnhAqNoz558/nZ38BL6Bgk+T+2g3Zq2AoOTTLLjXdWGVAv4oloUEqongfljpL+9PJbyf5vHckC3RvvAqSWEbq8U2lhcOmuKrHdIAUHU170lWUFcJLaTIbKRoZzRznJkItHfOc7MnVZ9mtKtZNuQbgxIfOTP4yLqhQngqE4PDWEQCsDF6jqb1muFclBjOhcVwVtehUBewmiWKjQWBA91coLG5Mb6TU5Wo5VeX2OZdZTm65y7KDGzwAwxs8CwDKzr8FbnY2a/Oxb4VEGcBTRX0WVL83pmLTTQXu4qRSU1+hDe1RHK0wsH5g5e0zF76g6PvYmO9nYSbTz9Xtf2JLO/giQJv47zfw/xhKlnFLSFNy08hohNMKSQi9chQn1BaIdHJFuFcGsWnQg8pNel6GGmtjUXa0nLuOInbshLRah2Ic9iAh7hsl0Y3BiaOT+ILlsJLLRtDfZQWJKkWiRpKfC4C/PlFlPYxNx+uyImvTboZKmRUSHtFMkuh7IG3EcaVuhlgYdVvwsV7IUUfKU1bMaGhdPdWcxbPDMXDrNUifBK2sgt4NLKVXcC7vsY+fOpNJvnuDTAYhb5gmI/SYS7iiIKaRRv1JakblBkWeIGDhfX1M6xOA5xQBudM2GJZ6VXLYAOWOk8D6++asuhnclF5shNiIA8xAAEgWolAjt0UWSZmvS33ajX3Dpixl0Rav8eK7UPV9nFTGsKDJbIhuw27dqUiqp6KsYE5DBpIDXo7v7ZbXGZRZZWBKRmYZTwTDn/SvTBMb0CDt9mhVjWMf9FGBm0Upq2owRfsKL6YJuIhw4tpMb6YFssX02L1YlqsXkyL1YtpsXoxLcYX08re8LC38Lmkl7D7jV2Wrdd75ndIdnw2YmHwL8LyoFAoN5sqpDNOIN32skJsxn4tPfKmH0QEjpn9r/mImrHu//8zac8+kwZvL5qS221RYbkRp8q+iG45vY1lMN996kJQPU2aR7HxhMO2V27kECvjq9zizaenpFJfPb0WEBnKOsZg1oF4ei2EdyP002vJJAYghebTaxmDpxWJyhNPr6UtlplPr4Xi6bVMPb2WqafXMscRfbFQP70G/dEMn17LxmazfigXX43Dd0P19JpMEk+vhcXTayq9eHot1KYrkZuAbR0wo/r+9q/xbpc2yZfsMJw3zwXVzWusiqk07yyMfdCf2uFrfLnnuHCxXnfB2gPVH8qkOW2zgPV4f5SOe7zvp8OMZS03ZGErR6Cuu2Tdpe12MCTD8N+h5Z5HM/lDv12yzkYj72Dd3chjc7DzNB4LmYffpT9ffjz59PktROPBFI+aNzi/R3++fPPlncrtUy09GtCfL1+9+3D6J3+f/nz5+dPZ2bl/QOHGha0WV09sUgtVsMWzT5/ef/DbnlEOxBp+GzJfn3w+Ud/Qn5Z6+G3o6f2Hy9MPP338dHZ+/vbDe+zr1dn558vzj2dnoi/8NMscQatnb06+vLPTcQBv3r77fPZJVv3Dlzdvfjp5f/nh/bu/4Eg/vTuTk/6Ps9c4Z9XQ+edPJ5/Pfv8XMYK3708+iZ+fz/7jM7b15f2f3n/483ts5vXZm3cnn89e+4dqvfZ3YHMS077eCBCKz94jOQGmAugYWBQXdwU8rA/xsObMc/i4f3R42Dvq9Q8HvyBy+vjvUFC/TfFyJXkS2wWmJ2BB00qH/BewyFd9BiweBqNsGGCf0PzhL+EE3hBz+S/5JLggSk7a9n7hCggHu/B6VKg1KhoMGTMoTzmqIqSaI5hFPMW4Q0s7DJHUYBjKC2HAMaC3rEsvWbtHr8Ga44oNaMh69Cs7pA/siGasd3hAA9bv0oR5R/SO9X6XtTx6w7x9es/69Jz19g/pN3beum959JQNevSMeV6fnjCPvmU9+oH16Ss2KLi4T6VrGIgGYjT3KsTSn4tj0OWjkUfa7mDEx0d+15Bdvy4/xSGPt+6Itdv5kMDthHWL8m8Mk29hRQiEtQNeIqCESY+5JY4CLqWQONGufEtzWsjKuBJ16UYur1Zz4ytZAfJwQ2ZX/G6Bcb1ZEhJAJ5QHUfGpB9A2i8OH0LHIBNRlGG2hYElP/L2A+KpzmaeX+OLh5RUESnM57Y4Y7+DHZQaxFMbWF9AIAFWKX20rj+JsjARWlKRvXC7kZ8Ugvij7TQNUE/0Fx6mx/h+fLwybzOnt79MnCsEONFp9V7aHAD/G+8vpIgjjS8m/ZOY0gB9fpvzrpWZueCcOp/zyFi4/YGOlyx7zzt0lPJTd/jY2QOYWycTvwq6Veh4awc/L2yC7oXPZDex1XbV1TmdsNclaQdu7oEvx82JoDeiY8c51kszEeMC+4fiY9QhNgJFIkpsAZFcoxTe+iVQprCZuynLSCi4YY0vHWU1S7IsxNsMv+LWaZBfw0WqpzxaEMclarEfTVguakhJbKJOJMlBYVPpvSMhGUxGVgZ233Wk7Azn5tH1Og1Es7Hg7CCyJszlNRgzEHoRcpTy4GdbAfLNRQumczSe5E12QYxHmtt0ONcMcjEwgj+GRTf1VoODfai59oAWjKxohHghskUsUanQROGQ02TbQ1MBCNm+58/Y3IgijRask3ukfczoHub4Fjzabmxsev4wtDgnwjDLGFluIkcINDQY0abfzCyp/5xdsDtf3uD33gZtLh8UbzHOsAlisquDvuiphi803UvvFTZVqGMvlCuduILNwd8q5mTuzZUCNrlhII+WMFbFAt0dXI9B3RaAnSxl0GI27vlsUaLOIGvBM8LEbIP6BUuPRiC4IhQhzgTheOndpsBwHHTyV2cyVv2iCJf1eqSQ+1CzKLktlSdFLi0XwBBYeE+IrgkXUUxTnRvEJkWkyDqhxj6/hmASurTIp/rhcaAhOsgud5sofo5FadxDz/lIUBZLgyDwgaEPVLMpndm3kvl1qRmFG5ihKeaFwTTam8U19s4xmrRZV/bfbdM+tA8bonpAhGcp9bZQYfRPxq8vYVuzgn0svI9J4OJSExWgFU/6Gnqp24zkzzMZOhhq5C/KMiA1YD7d2I+OY3X8HPA38rwI2VRuwKPUdMC4qaa7IQKl0xIozDwcs6IsUocMZDH77djIgJ9JswaPk4POF0g8DUw0yVardvrfA3GZ2dqn0SB77UfDtQR2cNpjF6pb6aA8NkLbov9Q6UDyL7AEPiTVg4T1upDwNJES9EkkoKl/8yPQrRAIGVF7xLq3rzl7eNjUnhme947jA5IINQOWsQAW02nBaQyQJgQHE0X3bM1g3/77tUdit87Fou1vf9viD/4rAYR9k+WUU5s8NZXzivy2oyZ8r1ISG/1+mJxZ7W0VRzMQ09hRBYLB2mjQZLY7qtv73ka4KNdl3HNdTK43m8yDRs2oyAPWge3Qw2kbRSLW7+7ZHSgDBJatSM6OEQKVwC/vTvqdPkFivbQLY7rmGxJq5Xqk060G0gmJriafP/uWOrnbbGvZQPNgg4YtbNriKOG6bCnpZp8F3ECAl5a50g1vc3YkgAlSI46geSweTSSlrB2OPpTpf74kWCwJaqoU2NjuOndbAmNB/FZr8k6mbRqMVvGMrmiQNWiQZUXEXUCwgi6RFEZQtqMgQ0AMLi47+oIKvCuNRHXFVustLE1RDumGUMVKRYJVLCwNAM0l9wlVD/RbWLUaz198wjqU2fxURh7/KsJ8ATpQfgahQNGZ1fnd5Bea9+gs2pf5CRDC6Mi62eqQp/2qUKI1NUA9ZVF9ArQSze00z7CpAa1SKKb1SM7aZID0seepYpUwKodaxpjErSW8lq3G7v7JQykwvji7dIjhvGSPAI0gvsJYOqZRCfqVSZg/xZQSCZFTdTYUFg9v73R0p8mc1+aDfA32sguVlfZkEy7x27b6slJmVIltSsWYvZzybmvGIywlXUU3KFN+6Mgdz0/KIxqtlaZwZZMr+IdsoCYugUQi+bwO9P2Z8mS+eaArz9URgB6tFC3P4NBFYESvdtlk+WebmOIBChFMzBVeUa+SXlFTheWi2dRVefg2icGbKxn+v5VLaF16wRkHOxy7X8gZmSKjxXIQQVZcYjzCkrhasE5PolGkSUqBRV9jfAzFqi78EPRCR9ImE8al/BjJwFIn0hE8BJHd9D7waC2oUUXHwhHGYQzSSW+KDluHSuLb/qRD+/9587hUsJR3Hsg2yKFPvd4olpK9dwU6I48vaiosJF/vwQudQUzRrFjAOE2qKk80yxmlCq0LqcneYZ5zZuDA2beMW4eEFfpQ4G5v/FnxOHTskafHGVQtuam/+Uhyg8MSxCDkpAX4pPZmF1T5jDHUXDAyFRt2xG6ClQjsmvrc/Aq4qYD0at9GDNhx56/XDKFyvwfj363odjw7Xayi3Xuej7np9NMrX6wx+XY10eAaBCMNDhg52bsyOyLCI9PWHodIyybgSCRGnMTzIi8gZ0MQ6JhN1ysX4E5HEG41UMibiqaNyIdKBcTqFrZfqu6irs1WWbEEXKxoRB9h//ZfrGtWAUSYv7iEcojpnFU06BBIshwL5YiYGxTJ6IRhaBs5gK7+obJItbzQKWwdQo8yKDH5nlbSLmCOr1oVOBOHzKo0IAtqvpuMBmNOkOP0AjpJ3SSls/c2CTaDjn9wuFf+ri5WCRgvCYuWYV8bW3pdawWoGqbmzM6+4tJfu5Ltf222BTSHHtvazjsth7PkWRiksJOeYCBfTQlUgrGeNhgwm3SInMd3tbiOfe6lVFx7bV+sflNZ0d+f+XUs3Z4zE6L3SMz0hG0IFogzogB7SAf25SNin3gE9NFMOaL8H//1s1vIO4L8/q6RD+BLF7DSvd4j/N1L7PUzp7Rv1ddoh9bq9gZUBifB/EC7QP5OLwgcUHMzqLZ8Fef5KvX16CNEP7To99hfDkZSD+/qfSgl/4nzJfl8kar//LZbWBSfRk6J1rRy59BXlVUQ2h9P70hjUdtMzDHrChdFnjqEw9+EEyEddHZtnLMi/fylUgkrvv6dU91gZ9ThK7l84nRwcHMChoQOj5XuMzc1jRSBfgXftff9S6B7VGZKy2OBTqPnBcqqaZoydgvi7h90hK6S4ni794sa07xH86/WPxI9DQmMJsLELCa767ECc5bHnozWkSltM0+m4Z6dhuHRw4jcTIcb3+NBOkxG8x96B3yWie9CrFx2G8BoAJFtJUj1fm+MdbM3qDYqsI4QHkvdxzwd7YEPEJjNGPZxDdVhJVsBITNZx7O/C1q5S2cwvDdPMUnM0egJQI1lVijz5i8aWjYj+ol1ZW927NVIcHBEfRyZn99Sf74VUnxT9nBnvMgTsK6y8YGXah6PRgIxGh8NgzdytjXZ99ftg7PkH1kj6ZDQ6QElsXIjrHDdYo99u0GJ9rx38e98zRkM/ujENSLUSpEtgookhwZLS9FCko7xUAN4DiffBkbGBUcFkraISlurFGOqFGLmi4XqMAD5S1cFhljkCCIBkY4Qucxx+D3q0Q3AyAHsasKkusObp7kG5WY/TEz3DCwPtWq3hrzrcAp9hdPV7rhbnX/aJEEoaKUBQX/a3LSRQLPBjKNZQmE7ob1YHINn/P2F9WP36PGbMGwoWL2MF1lnTkrAaW6uIGYbFtrGGYGAEq54pJ0rYQhn5dZcWzrxs2/IdeeXlO8J73pG3bfnk4fK/4ArKmdUuosr7l1hHuVJet7L3vC5uPq/bt/igEl9RLFSrd1y3UAhao9CofjkVwVK0HGGgCb5kJgq+yDi/iG98yINDdoBXsDfFFayiBIlLUu1braAxK4DD8mc3JyP22U1JDSsIV0A4cEoso81S1lQo85xi8PpKtl5DT5HjHBwc7BlbSMYq78nOxKE8thllrVOWd9PKHbT2akqEf5V9PdUq5IqRQPp36+9p+k+5Dn6nMsiNwfOzvxN8DectMfU6YcB5vQafnX+XCr/GSMPW53cNDTNKu4KJqQwG5RtYnU1arfDCceLa30DaTDtUw8gzfrby3/c7HGVgtmJN8rztZu2wYjFko3JFjFkArwq3Y3YPLv825nrfbVS0sykNOIn+3fuE/CtvlMUkVgJp2CSYCIicQBRUx4E/r5AnVnebgwMIXMnYyXoNfz6ooZeoNB42FoEm9BYbZoy9lYYX+VjANojAuTYm/j482OU4rkjO8iTlM2nxHqPsD6YEexsKvXZjKdXvMov2ysNRi9Tjkkg91sAlin8onzHbDxmlfoBzZHzri1v/iHXHnm+IAca7HYpWmnm31onmrVo0pxQ6qqD6LjVaJNvtFumyaeLveEETgBrFyuQ1ljogKfiwj+/xre+ZAqpyoIutGiutiVIn5h5jp45zcCRQ42Vf/D3yxF+vKxNgQc7UcZsr6ZHWDggVI2PsDLPafeKXpFVWJJvnYh+B1XfhllmSZhUaEykacjPx8pbUsCG41mtPMHIqpDfMc71ODfqnm4EDS5bW7OJMs4s5jVAWkSoDgeiYpVJkCyFuZMXXbiq3S2pujrS0OdJic9CVKfJPtTbBMKZeQe9tlUX1Dwg7wwBGRa3AYJeEP4Y0vl4wKcijRQEWUW4EWZIFWE7/hp6u1tkp/RNjVsyLhswo03ZByTJMlRVTqqyYUtOKKVVkPZbGS6lpvCRMl2In1RZLApqTVFkslb5ZTONWi7bb4RC6NkTyxshQTwdT0u8pGGeTUa60SsZE9XLZpU2dYWofamlFUZjWKgoV9BMN/YW5QIHCt4zeWoLoecKay+AmaciUhotPq8NbQNMAnvuAECGkiT6t9ZFelC+cP7BeUNynph+cDNYi3Oj8fXgfcfDy+31ipR0PyF6Vlh3Emer3/TwKrrVuPtG/UCRi2C3gt6nVxzcXVfw59aii+obblzYWSGIOcRika+HhD7n1bqFQdE6ndEaX9JZe0mt6Rb/SB3pHb+g9Paff6OlQEyUMva825De9IUMWt9xi0dv7GCRRe8LRU6Y96QKWtV1QHRk6mQQ8hE1XuN7+SwhwnXZmt8E9XQF1yESYuLRztwi+cjqHX9A+nTK1I+kMNlsSzegS34jMM3oL+M7xQTl6iQ9aZjl+XDPXg40d8RgKEvSMFElQRqYNuT9LHpcjDxSDsxb7hh7Mo9GSLlvskFZSCP3Kbicz5/pimPsYe11cFGbHx8fsgX09htOULtvsATkJVyTJg5ecimAC4jz9KmS2GCrSO3AeiLriuQcD/IKepAzzK2m5MwdG/0DaHrkYTpM4D+MVb+TAG/d7zgPE079NZpx5PXHZa/CN8MxshjEaizSiMOdpEL0QO74BYIKXXLBWv6tr3akBUvfBgZCKjuMuRw91ACL0rsWKgVEBBpw/od8H1cvJzLm6GKbPQBVhVQJrFXCXzwMuLUMHsAIidW6FSzh3bzRolqMCONZ8XJzQFnARuhi5NybICFir1I8jT5LGPEgbV8H0Zst4DHhT94Fl7YCMbhAc0ch9YDftB4J8RRDzv6ufczal7j3rws1zju3ft9iq/UAfRnfi0L1rs4ehxO/p5B5CNbTbD0MyvGdZ+4aes9Pi9bv56EG30Zq3YehtNifPNgVVwOXZLMjmz/Wqu71vsfl3DhlxsTe6G6qtey7KPfV112b94Z3juHayN6qkESGtw8Fgn2o0p1a7tV+9EYy/Dy5QRrunNX2dqr6ECEL9kdKAUQj+lgkZxm12x5bHx306c5BOuss2uxuN+oSgCZHiAmLDARqfcNGMQDwKx2E7bu37+203Fvd9Iw73KBkn7azV23/p9/ZfgkQgAQ4UyDlDvgZMa5bq+NvlMYW39X71H8qO9K9sR/pP4jOM5/Mggwd7P+sE5Yv/mnn0DevR96C9Bc/6jwwepTnc79GQ7R/1hqZDcuHmfqzvUi38OHQO9nuHoIp18YfDQRcHn3iDI6NRb2AYuGWKCcEdaNgU6oi1puEvnJIQRlVnWhzKzDBxxGdBNVMD1z7DGNI0z72zbH8ts2DoTX/EBpNUMQrGBdV2ikV7tiFsMp+DXYLFRRUFgQSb9qLyUDeS5LGupyuPdM11TQ0QxiY7BiVNEOoMmJPVvnho5a20ocKYRGLGSXpjZfUOD4muNXuISyO3U4AWa/AExbrcBZlpzRnsdjemW+w6c73OXAdAVtd1rV91CqNNxLiP0iQTLTw1esEHYlO/9/LgUL4GISekF1uvtF69XANDQarfw1h0xWrmBXiMMiEakQKUwEQUQdT26Hvif9nYT0BuhY5pxKqxuEBhjb8AY6vZhcVC1zVd2J/kYOuYioeQchQPei03Pz4eEJpjwGo3R/6AUHzrUdo55mT8xceIZSgjEZsHFEG49aTQKzY3FehdcNuDOkhs0BzCZRJ76Kv6ocOIRWTpQgBCrD3rpkxMG+Qr70U4Ni0oITSFXvDBTrhD4GOnliN8OHenaingHIustdz3eoTOrSSwGoBg2vnIGwzgRS/YaZMcTqpD8ZpRjlFhrJwjnXPYtXNeFjmHda19dl+LCFwZ7dLe4SGISEBwm6Q39BGg6R9t1ID6PbuF/eFn901Ru98Dd3u78v6GAFS8DdeIH4kauFJHYF6t0H0uPzBnv+SObESokQEsglw/SwZLgQ88KnxxFXn2RiNJtmlBlwtynZm2pG/lYxmiKuj4j5n8GLtvC1GOqgSDassCVP3tkpqOVJO+G4/cUH22ZUFgkUMWE7qtD7ysyrLUjdssJNsHFNPYHERcMwiZ12K6WQE8KQfT4yeq7sjKhJQWCzHi8aYIZYt2dGZsW0josUUpBS3rjHC4JSM+bVIHG9bbR8moGU8eXiXWkXR/hZs969Izc/UHhJ6wCVguvqTeIe3SQ/qSHtED6nXBNtID28ce7VOvT3vUG1CPevsXVSu9HazvlNTyy9BD0ach94TTBgxx5YW1L2SCWpgQFsKEhSmML0QOYYxyCiGbSEx54kpJCCIlIZizhE7Zgt6z90OubpfZXQixL8UIyOMUXk//6Eu9nZBnFRfqvtSeYt1o5B0U2tiEyFvSMGm36arFYmS6R6OIRi12CHennpPKk7e/f+DtQ5wT8ng2SRVbJmLcrOjZxLtgKx0TR+W/cuUvekZ7gPkRWwlZHoytVyh2U80ACgEkAhh1/FKyBJGrPTkYCF4uuNCVZElXx8eHhPx73zMuitMkTSEovIifLJ6Xr9wQoe/DPXycYVXcZlfxTZzcxQ31fDwQOmHOXdtA1GYDesMOW9AMjOWYDaSJQyroG5F/2Y2OMnhzrPLKd1tBLxqwp6vdCaETkM4bbYygoO2p0hC6cjX2ur7XExAXlYeIKT3/x1BBLdGKAsAA+jLlh+G2/7I/GOhWyo3IdcPMRsbzOljYqILiT0AFxyMUYCCbdhz3bPK9qFrC1b4AXl8BD47bXYFXGSeIZle7D/Fs0hOfQmZEzyZ98S3ua7VTGFSnMBBTGPzI+penICXKYrgyLckQ+L866PfFuPd9tAXqGRjzQxORV7lVhdIU0u/VrzYHIb+p7UnwqEM5yQMxyYPyJCF61sidsdSw/ZyxhNCiOcdxb1h5Dm1VgZo58Ea3NQQdK7Vcn1gcj5lLY5rRGb0hZSBVQRHTGYSapkmbzWjWQkmJ8tBHDZ6ck16ztLhoS7i8FHB5CXCB6LnF4lcWHLABvFFucM1nIEtSALoBQaIMWIChVYu1ABVHfUxlmOGN48xGiRDfff9sb4gWZtehAWpXFBaUJ34oJn4IEwfvil994lKd8980d6VMsjbBkZjzkW/3+EMbHSLMwdN5QuYtx1kcVYorSKeN2zBDzWH1gBFbuDx01HvJoR0fHzketViVLqkczHpRlXpDzNPr/shpUm78HTy7YxFMz5PtewVTqCQi2jOlkIMGlqhzYYhLLQlpouSdKyXvjGhvuJUH8XpyED1cTbB2Wa/BOjHX8xP5fR+ZC5DdkEdknl46EY3a+Edxii9tLra/O7g0s4zCIc9ZQdMe7UtGDXQYOI6urwY+sNbIR7O5lOihdCnaZsgAcNhID9rUmivFZqn2Xprt9f0St4ca8QZ4MBv4t6k0K0cjDu8SlL4TgcAvT+yKFdljrmAsfsGUqkJHWC/JUQpCktUyc5qCyaZLKLlP69Z+XwNJnn8eHoDGcQeTSkYzdeot5M+FYK9nuj3jsArlCRWY5AhOHHD4sI4gzUfWbc6Xmk8afCefjCLb3v7Lltv3nBWhuFz7sFjALwghrrclE4Utg5a4kIjMAcULRu/wYCTaXq/73ZFsSC8YKMJug/hBLlIjSQslWfZwe5VEWS0HLWQtCgTy1PEOxeRF/kiOa6gJcf87Ga5scjIRbbVaFxfspbMSU+vD1Pobsy/vaEjq6nSHCskQRKmU0FKtJGcv6TkTgi2dtqH37LPbFYVADOYd0ULlDukoDjsnRjPn4uZ9X9kKUEdtga0XEhuc8kDzjsrgjHjckiuooHrN3NPCHmCycsomABekuAJcyW12Svdc95Kd4mWAjFhEvgtXr+CRQ1yJS1iJSwmoAu7sSiv6PdjAV2Kw39hlqzeMRt++7zw2OipOpQqcr8JcIXHKlzyoAfQNswYK0VJnrN9y+3rTCNqp1afeS3vw/e8bPA75Bl8a77fcl/LsuCTEQmOtD4UeXv5wD57Xcr1epZOXSO0FhcHVmR3biPQjgETMm7Xbes8VK3+zQesMsVAoadIhT0Ualu/tH1zU75R2GzirLIyvGzyetZN5+/9p7lp43MaR9F9JGwtDjEoNSX5LYhtJpuc2i8sD6WSwO4IQyLbc1rUt90iy+xH7fvuiiqRE2e5MT2YWd7CSlkiK4qNIFotV9dEi8vTiIYXOTwzin+pBLKr94wO5qUryxFimUlUS7z7U2jlSUQcnn7qsKqUo7M+qsFVRqYe0TA7KXH3oyUKryfx7xa0YlOOl1q34G1dyhy6xNv2Ar9tttzcM+AK/+VdwhaiaOv2PikVJKJvXolh50MY0qpaB9v/JvHotIF/drt2+lr6Qt/wrPPBruOOTwyLdmYYhirU1Sa3m4mLLnirV1vzRctEsssVZZAuidUy+PZyXVcTXik/iE5qsryuRstuvaa7jtilCnXQesFJkBNvFJD+gzbXPpZTC6bWvK/ZbbitcV2wbNEPaRy4f/9jMq+ppckUaIk/LEfOufMbmUbeqkeTzPqcDcE3iIooqZYauFBrKXlczQEWJmkbff4AUn0GHVYn+fxLiSQL6vsLbPlc6GhM4SUVSFup2/zoqEh/8E1REJRG5XAgx/w+qvakNjSslp25PyQEWVS1olzW1kFjlJ2fCASTuvUSINWMXUqH1T+rh7W85Mit0cjk2ZlalHSs1Z60Z82SQNQNMWplpa1tBUpcVhyOCr1vxFG55bKkCQ52YZGLaZpG2f/rOLw1jZHJW4a1QnZv5zK/YGvHpar1kjeOT/onGFJlVE8DCsqBebfWXB4LexBHd7wt/dicG9NSi1VgD6phCLh7xVvf+oIQyUlg1ruV1KUwhtqbM+3AUxOjAUR33jDceCphQv0LJ0I6P2NAJ21MHbEqGJlpD7i/dYd0O7SMx3x8UZpCYr+uOuqP+wB2hrI8ag50oqFpunlNUuXdzR969srRWzFTH9u651TkIdDyJsSMnl47rzZJ5vFmWnjpN3v+l0jdDDp/dbnp2YLYmKhF07IqOA3ew23VJcsXa7V/J9a5kyDQ2bdpQfR+rMdBxwOoyz5hbOl82tRqcXKKhAsy/Q6Gq259PqXUBj0m2EccaHgFFQ5lS9jfuC2czGu84dlzhbMatdzmo6VQncHvodQaQFOcCM3q623WJvW630b0EKh3dczQpuNfVIQ4NxZ6wrfriN/CAKq+Ata5M2VSnahiCvdc++F9P+EASFtjHymDEFrSP7LlQwUvKuXnJ1OG7UGCrP/YMIzMN7e/422f8yJKs3Xacs6rZv3iOo3H4HwwHSlKdqaehsdXxhPJRBtkxpdYSb35UfM26R4b8tdY9SjnX6w5BV831evY+gp79DO3gn05rB//Mww6gH7A+DGAII1R8cRzUd3F6pBQzArcD7gA6DnR60O1Az4HeCPoDGHZgNAIH03UccPodcEY9cN0B+e+ywY7gvdCtOXkNtGuoXaP6cm3tcurL6cPAhcEwgi88dAAVdLAKqLmDBccCQKcD3RH0ezAagONidh1wewPoDHvQczow6GNd3R44vc4AXLs7go496KDfsQH0nW4PhviK47rDEVZu2AO32xsMRMU+HlRMr4ZedFFil64OXV26enT16RrQNaRrhFe/C/1u9B3sNqXzJMbGCcUnvha72gm3YcttQO+5d9wmcRDqQV9xGx65LfWhbHglhv9bbsMHOsL9Seryos3r66OQTyL5Z4noOkF1kIA7PX9imuxDOIlkxBY9+QWZv6VgRD7eRpFpUtwN7Ricnu8E/E5MhB/Cu8i/syw6H7wLbugY+k7I5e/UBJdK+FJ7NHB6rg2Hz6Lm3AFRhAfu+A9B9YGHyH8wTQHdc0NWKTdomzPhj7giV3VI58ZjEHAHjEeLY4VY5YHNIv8vNiIVCK8Gux1OM3esjsfMX+Ohvg0Tylbm+jqcmE7EX4eTyMRMj9oIpzHRSuhSKnxdN1nEt0xw2PTNsfGKf+IxOCPmOSrgZ3hr4SEBfOLv4bO4RcBiz3jFv8An/hHQ2HzCH2DKC7jiW45dv8RN9hy3bWjkcM9vyMCBMm23hz03eLPbueKpN3KDN6ofRDV9KWu+5RPrCr7yONxGwWxsIAYf3jMP/7+gkE/hZxOfIngVvhV3zDNWfNRHPa4Ffh8zeeAbvL3303BqGpcXF1eojmXxBYv4LZoI7FYElfl1Z5Np9UYiMckMHP+yvfDZAk/ilD+Sxdi4bHN06n9p8gXzsN5b00TCsizqXlxOJ0RmgreeUD9QGcnQKZigzkZ7jsvFUlQZO+Kq3Tau+A2Dqckf4FE24cS6Yv69eYVkd2YIEro3ryIWcJv57N40gagLi/fGpMo+q8HTcMkv2/OI31Az3FMzTK0CUUOVtwFh7W1g211GWBJK2u8KdFGmhscN2Psn1iJcUJzno4+6XitLEty3qeW7BY7XKso8iVcop22B7bVa0LKclteap8vkRZLn6xxD3FadUIV1Wl6LuP8qpNvyWmlWbObzdJomWflilazW+JmW1Wt5rclmPk/yOnmfkqPCWFymk2XyYpvkqDfWkrY0vecgkqenV8s1t5FQa6Xv7HmIjRILHmLujmDD0Rnmkm9Mx4xhjkiUU0Si/Mrdl0vTgWs825xxpw+3fAArSj3Bxy13BvDAnSHc8VB5fVU/R/5c+evIX1f+evJnR3BTv63eUCl7xAkgL4DcAPIDgiMQTIGDyrB4oUJsBPfHpTj8Yc6DCK7+sI4tPDZgl42l6TLmZ8aj8HX8phE7x5g3IuZSi0F9ez8zLkXMK/2dXh9jXjFpOVXHxBj+VoR/gNfwCT5rsXPm62idB6gK0ok5eY1PdANoaaegh8RFomAVkmWyKhSkAnnbFmLStPLy/7UQeRKuE0U2QECRS65cz+tfJ1/amukPFlC4li8bYJq1Z1M0NhhfhknkXeJJjDDcGrDoj8BeEkglPAfq8gAfE4diUnlzv5hZOXpqF77ed7xEeBUVKeCY4QvtOkUKVt3hBxBPUCWG+tbkOcqGfifbRnp2gLeJpcTi5qH7sozEH8SCamAiNvwpIbbvDpF7ISENEciJubADmiMqrGuUih7ZQQgej1g+jQ6v0SV/LNmsjDt+FvBrQgguwiziMY/NPMwsJwoCsVCneNwd8JLQ66WzrSR0X6amExGc9Rr3zhgQ8f8xinAdmSasGds3kJ100xZhJLL00ZNPUsMgUKPIgokkcy3J7HSSqUwigRJUgma2q4hwXBRwQNLEDKi9/CjnRUnDguwdln6odfW4QTuerVMBihGepN4T9GZrFKN/9O+HaMvuSzyfcl/WG+gwjYIkLKLdDm9x3SeAUsQPDngW5lED0kBQRI0MTf77b8M8Qs8e2NdpIMOwWZARCPTHvxslyFew46t7vBPIDu12appwhgmzE9EMTYLkJ3kdnfMUUmJp6tisAVVwQMq4exEKGMJKQvUdAToKOM1G85MHddN9uY6CYLh7MhbrlB69TG7WzXUEa8Hz8WyMAzlFP08G3hkFfxWmETM3pgMSA9CIOWJGsnYbx3pq8beIIBkzwBcK/t6wrAztwVTimzpxZvHPIjGDdVBXzmc+vryCkh1ACzSsWdAQUM7jEPOynrT19QXWjZhqjYBFI5yWFtgoaO9Ex/9IavCPrxJ/fEHo4+SdMXRf5tFYvhEi9pV6NeIbQuQkisCetplHyXFzI0a1X6cOXJ9hLEF4ncorcMemufFsJoa3yDWNqIByrFsWrCtTPDHiLR7L2UvisNZr3YYgtdQXEBjdCXju55bFcAQVkDM5JS58lTKsB4NTEXadiWVFIN51CHn88B2E3VKNGVHjnAjOoBDzq2hbE/9kkV5lo25U9C4v7rNoXAd7dSgzHaianfLCm1SrBo7kqtSuPjEQlOKJItYV+x1bK51GN7xufPL+dJpg508Q7LRJsBW/BLNTEXGRwG0jomaYEPndF4iwtl/gglioVYXAc8JC0eciRBQUvZOx+kS/NfGs4nvT8fPgKw2K28AoOL6H/wxt5mWmE9GFivQFv4UVurZbqA4pYINwHkajGKaJizfMAi4QQaZhZs0i3F8sFFFI0jf5+qVRmDGD+cEIoJil/IwZM1a531yxb7P1N9EQt5bjCydu2ud9VhD6pxZEvvnqZ8ySu3rQLSZZoQaUdOEarJhs7FtiIAq/sCwm+JHm18gBms82QT0HWFYeodHVQg7iM+XEq6q2UVgqklGbpxGoAI6e0C2L7fdEnvCrUcBGK6w2vf7zmIuyHJxWkcjFdm4AG9711ZY+brdRlNAZwoZ3GJTY27npYC+Lo2rIuI3sVk7sVspjyg1pQqQC01wHi3Y7xcx2O2MdbMY6Z5NGJl972Cbp2EhFxQ/iTdADJhF60F0H3LEbGW0j0/T0gAd8s+ApbLixFt5J4rGsTId5qXru45OBFe8yral++ZNN1WwXxPo+apozQ28cJnVxN2LVF2tyUqNlEZ4hmgvQ2WyzxYyj1GvLEovzRA/F9XhtdcBlqgnpze2pNB0m+YGH41jHgQFj/h9s3f0+Mz6LveRv/EyTG/yjZgw/EgMSBA5CFBDOATqzPxT5sm/vyOkwuRUm1E7887/ofzDVMdF1D8mJZihcb8dYfWvyfC8/cGazfV5BTjVOmn7b7QzNLxhWRpNDH2xK5IYkJ1qILYeIAcPe4r4khwTZ+sAJgrswi/zENNmrMEeuOqM3X4W55ZCPOJ5SFk6/yuEz5pDWOdyoHC7DtM4hRcVGPwvmB+8FwaD5qjWQL+M2V8tA7Ej4NW1JirDaqYiXudPt+OwR1w+cEYaQ4JgLh0qsjUncXk9LMpJJRo0kg5GWZCCTDBpJhoPvfehX4xFQWlQwWa05VeeNeqEHdIu7uQR6zJdyfeMR7gDZ3CVcV6J94w3cIIAQBn2SQXW32gzuwYYp3LK9weA3aZCiMOqSOxRB1Ds1+EBnpsextPeD10wMrka0HGzw6ck9FeDuE0/cDh2g8n/IQPJFKsOOR490JUB7ZtzqCTwH8kIp3cBWp7xyndWDjl10Qs679qjTd7vd7kCnm47jkw9oYQqCisLtXNmCNzfJSrC7rrdBdQJnGAnf2Y237FOB/SqnhSxIx/XLYEMEfCJr/dvVYep6jz404F+0Jxa9o55m8ik+4agUv/dPkarqf/V+xRQyqJPMZJLZYRLxrYn6dMmnluN3AvQAUvEvsvhXYYkcl1/iUVGl/1BxDp2XRonrTc/smV0o98IPfp2gYw4u0LGTUTRkCCqcCWzflBcMZ/WC52YPcrNLwRa5Vx3X07fXPQBKRuybdGzgrO7qEzrugR/hjXArm0D3+5M9kSu1LgnG0EEg9MRalFuOus2sLnSxcijbyUi081E1Y9VWKbYVdJj/y0E/lXgc9MtBz+SWw/bGiU40neNeMx1AvEyqW5MCagxMRiMXF6532ggmr9H8UAxf9eXp7X29k9ZEiPD7qXE6PC2TFJIBPV+yQteESVJiUI6bIyhH3suoBE2mCSVx0HoaXMwiFCkwwdHp8q/3RomhTBdbkRykxoGzHNVY5Aa6MfiIupByhDzhUSch9o3sKjRBl/GElLQ5wzJvGPDnysCEy2WRT5XhxQUuU1UOFh8iKbHvHTR1ftgzqXC9WjuSqp3i0mOl5qT7+dKehaLS4fsaxnCtQdXIQQtQjqSUYL3hoqtaOVyZnQB5UGdQ3eN6G3oXnlUPNB002gQ1f/LzIinfrlbJLEWFl2p5K0mw5sCCf9vDBhVtUMN9tp5u0DYWEv5hgooo59dJ+TFfl2ss4od5u30yGF0Ky0OHIik/p6sEfaonXg4pb4VregVVW6ZJUUQtzvm3/Xm5lsa/03i5NNCnLkWzsV47GUht/jmd3ujs5RQphu09LYgU+27XRflOOLltt8/y83SFdHE1zdPbUsJHoKksoMffdSbd4Vai9TpIJyRyMAuNvA08qnzZQguK+pUSkv3eYAjm2dLb/W8t811cLs7zOJutVwYzW39DHcB4NrvcJln532lRJlmSj4+DjJbMuwUzdN7u5edxWcbTBaUyWtW3WzBrDu5maWMzoeLuMQcZ+GYRZxkyN4aAC24Gs3NsN+dUgyTU+kS7bN/4aEkvuY1PYzd5y3a7tc7yJJ490BCYLuLsOmml2Yvl+TRPUG9tmayoSgV1VYuNjYIvK5KU0XDEWvAnM/DL8+NP8gMSgpOJaIAW53myWm+TN4t0OUNwXTEN7KE4j29xjlMRe+bpxarHgDFFx1dsD0ljGDZasqUeWmcch9N6/oI4S8HzqoStlonYVvUJsnYQmV9TCylXgbhaCyltrQhnmqxECWyVNkRpoETP/IZDELWnvQTi/Lrwyr0aD4twjZus1FgzFIpjRabLJM61qtRygTlWZ5YskzJ5sQgT7UBiKhURN+yobWoEthLBfclnElpjo8u0Mn/QJriqw5NzVWCSwWGR/drWWhrvSsvq0mBNm+rSyEM7aupVy0DIQ6cZ09Fj8ACvilbqtSWSwvLByCBHKRNKlNIMeZZv2Bo0s+732tnYTOAsF+tNPk1Qz7DdRs2GNLtu8ar7aWQpdhbvzwkf6cPciFm7PTVMGVos02liVNhsWIDWJpsl8zRLZnV+RbKcj7frdCYwJsa4zniJh8Fsz8QEjGGgvVzR4vVyPYmXY/HHO5WCssf/TsYKycJY/PG+7RktbPgfhI4dMcOx2Z75/wYxyDjVXn0BAA==";
// FORGE CODE - JSZip Loader
// Loads JSZip using the best available method for the current platform:
//
//   1. Already loaded ¡ª return immediately.
//   2. Bundled (JSZIP_BUNDLE constant) ¡ª decompress with DecompressionStream,
//      execute via nonce-bearing script. Works on all platforms with no
//      network request. Defined by /vendor/jszip-bundle.js at build time.
//      If the bundle is absent, log a clear error pointing to build-vendor.js.

// ©¤©¤ Strategy 1: bundle (preferred, all platforms) ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

function _loadJSZipFromBundle() {
  return new Promise((resolve, reject) => {
    // JSZIP_BUNDLE is injected at build time from /vendor/jszip-bundle.js.
    // If the vendor file was not included in the build, skip this path.
    if (typeof JSZIP_BUNDLE === 'undefined' || !JSZIP_BUNDLE) {
      reject(new Error('No bundle'));
      return;
    }

    // Decompress: DecompressionStream is a standard browser API, no CSP implications.
    const stream = new DecompressionStream('gzip');
    const writer = stream.writable.getWriter();
    writer.write(Uint8Array.from(atob(JSZIP_BUNDLE), c => c.charCodeAt(0)));
    writer.close();

    new Response(stream.readable).arrayBuffer().then(buf => {
      const src = new TextDecoder().decode(buf);
      return _execJSZipSrc(src);
    }).then(resolve).catch(reject);
  });
}

// ©¤©¤ Helpers ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

function _getCSPNonce() {
  const el = document.querySelector('script[nonce]');
  if (!el) return '';
  return el.nonce || el.getAttribute('nonce') || '';
}

/**
 * Execute JSZip source so that it is fully bound to the parent window context.
 *
 * The root cause of generateAsync hanging is that executing JSZip inside an
 * iframe sandbox gives it references to the iframe's setTimeout, Blob, etc.
 * When the iframe is removed those references become invalid, so any async
 * operation inside JSZip stalls silently.
 *
 * Solution: inject a nonce-bearing <script> directly into the parent
 * document's <head>. The script runs in the parent window context, so JSZip's
 * closure captures the real setTimeout/Blob/Worker. The nonce satisfies CSP
 * script-src without needing unsafe-eval or a sandbox.
 *
 * Falls back to new Function() on pages with no CSP nonce.
 */
function _execJSZipSrc(src) {
  return new Promise((resolve, reject) => {
    const nonce = _getCSPNonce();

    if (!nonce) {
      // No CSP ¡ª new Function() is fine and keeps JSZip in parent scope.
      try {
        // JSZip is a UMD module. Wrap so we can capture its export cleanly.
        const fn = new Function(
          'var module = { exports: {} };\n' +
          src + '\n' +
          'return typeof JSZip !== "undefined" ? JSZip : module.exports;'
        );
        const JSZip = fn();
        if (typeof JSZip === 'function') {
          window.JSZip = JSZip;
          resolve(JSZip);
        } else {
          reject(new Error('JSZip not returned from new Function execution'));
        }
      } catch (e) {
        reject(e);
      }
      return;
    }

    // CSP present ¡ª inject nonce-bearing <script> into the parent <head>.
    // This is the critical difference from the iframe approach: the script
    // runs in the parent window, so JSZip captures parent-scoped globals.
    const sentinelKey = '__forgeJSZipReady_' + Date.now();
    let settled = false;

    const finish = (ok, errMsg) => {
      if (settled) return;
      settled = true;
      delete window[sentinelKey];
      clearTimeout(timer);
      if (script.parentNode) script.parentNode.removeChild(script);
      if (ok) {
        if (window.JSZip) resolve(window.JSZip);
        else reject(new Error('JSZip not on window after nonce script execution'));
      } else {
        reject(new Error(errMsg || 'JSZip nonce script failed'));
      }
    };

    window[sentinelKey] = finish;

    const timer = setTimeout(
      () => finish(false, 'JSZip nonce script timed out'),
      5000
    );

    const script = document.createElement('script');
    script.setAttribute('nonce', nonce);
    script.textContent =
      'try {\n' +
      '  var module = { exports: {} };\n' +
      src + '\n' +
      '  window.JSZip = typeof JSZip !== "undefined" ? JSZip : module.exports;\n' +
      '  window[' + JSON.stringify(sentinelKey) + '](true);\n' +
      '} catch(e) {\n' +
      '  window[' + JSON.stringify(sentinelKey) + '](false, e.message);\n' +
      '}';

    try {
      (document.head || document.documentElement).appendChild(script);
    } catch (e) {
      finish(false, e.message);
    }
  });
}

// ©¤©¤ Public API ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

function loadJSZip() {
  if (window.JSZip) return Promise.resolve(window.JSZip);

  return _loadJSZipFromBundle().catch(bundleErr => {
    if (bundleErr.message !== 'No bundle') {
      console.warn('[FORGE] JSZip bundle failed:', bundleErr.message);
    }

    return Promise.reject(new Error(
      'JSZip unavailable: the vendor bundle is missing. ' +
      'Rebuild it with: node src/build/build-vendor.js'
    ));
  });
}
/**
 * Safe HTML setter that works with CSP Trusted Types (e.g., Gemini).
 * Strategy: Replace buttons with spans, inject HTML, then convert spans back to buttons.
 */
/**
 * Scan HTML string and log all unique tag names found.
 * Useful for identifying which elements might be getting stripped by CSP.
 */
window.logAllTagsInHTML = function(htmlString) {
  const tagRegex = /<(\w+)\b/g;
  const tags = {};
  let match;
  
  while ((match = tagRegex.exec(htmlString)) !== null) {
    const tagName = match[1].toLowerCase();
    tags[tagName] = (tags[tagName] || 0) + 1;
  }
  
  console.log('[FORGE] Tags found in HTML:');
  Object.entries(tags)
    .sort((a, b) => b[1] - a[1])
    .forEach(([tag, count]) => {
      console.log(`  <${tag}>: ${count}`);
    });
};

/**
/**
 * Replace restricted form elements with <span> placeholders to work around CSP restrictions.
 * Gemini's CSP blocks <button>, <input>, <textarea>, <select>, <form>, <label> in setHTML().
 * We use spans with data-real-tag attribute to track what they should become.
 */
window.replaceRestrictedElements = function(htmlString) {
  // List of elements that Gemini's CSP blocks
  const restrictedTags = ['button', 'input', 'textarea', 'select', 'form', 'label'];
  // Void elements that don't have closing tags
  const voidElements = ['input', 'br'];
  
  let result = htmlString;
  restrictedTags.forEach(tag => {
    if (voidElements.includes(tag)) {
      // For void elements: <input ...> becomes <span data-real-tag="input" ...></span>
      const voidRegex = new RegExp(`<${tag}\\b([^>]*)>`, 'gi');
      result = result.replace(voidRegex, `<span data-real-tag="${tag}"$1></span>`);
    } else {
      // For normal elements: <button ...> becomes <span data-real-tag="button" ...>
      const openRegex = new RegExp(`<${tag}\\b([^>]*)>`, 'gi');
      result = result.replace(openRegex, `<span data-real-tag="${tag}"$1>`);
      
      // Replace closing tags: </button> becomes </span>
      const closeRegex = new RegExp(`</${tag}>`, 'gi');
      result = result.replace(closeRegex, '</span>');
    }
  });
  
  return result;
};

/**
 * Extract opening tags and their attributes from an HTML string using regex.
 * Returns array of {tagName, attrs} objects in depth-first order.
 */
window.extractTagsAndAttributes = function(htmlString) {
  const tags = [];
  const tagRegex = /<(\w+)([^>]*)>/g;
  let match;
  
  while ((match = tagRegex.exec(htmlString)) !== null) {
    const tagName = match[1];
    const attrString = match[2];
    const attrs = {};
    
    const attrRegex = /([\w-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]*)))?/g;
    let attrMatch;
    
    while ((attrMatch = attrRegex.exec(attrString)) !== null) {
      const attrName = attrMatch[1];
      const attrValue = attrMatch[2] || attrMatch[3] || attrMatch[4] || '';
      if (attrName) {
        attrs[attrName] = attrValue;
      }
    }
    
    tags.push({ tagName, attrs });
  }
  
  return tags;
};

/**
 * Apply extracted attributes to DOM tree in depth-first order.
 * Walks the tree and applies attributes to each element.
 * Skips the btn="true" placeholder attribute.
 */
window.applyAttributesToTree = function(rootElement, tagsAndAttrs) {
  const walker = document.createTreeWalker(
    rootElement,
    NodeFilter.SHOW_ELEMENT,
    null,
    false
  );
  
  let index = 0;
  let node;
  
  while ((node = walker.nextNode()) && index < tagsAndAttrs.length) {
    const { attrs } = tagsAndAttrs[index];
    Object.entries(attrs).forEach(([name, value]) => {
      // Skip the data-real-tag placeholder attribute
      if (name === 'data-real-tag') return;
      
      try {
        node.setAttribute(name, value);
      } catch (e) {
        console.warn(`[FORGE] Failed to set attribute "${name}" on ${node.tagName}: ${e.message}`);
      }
    });
    index++;
  }
};

/**
 * Convert <span data-real-tag="..."> elements back to their real element types.
 * Called after setHTML() to restore form element functionality.
 * Tracks which elements should be converted based on extracted attributes.
 */
window.convertSpansToRealElements = function(rootElement, tagsAndAttrs) {
  // Build a map of indices to their real tag names (from data-real-tag attribute)
  const elementMap = new Map();
  tagsAndAttrs.forEach((tag, index) => {
    if (tag.attrs['data-real-tag']) {
      elementMap.set(index, tag.attrs['data-real-tag']);
    }
  });
  
  // Walk the DOM and convert spans to their real elements where needed
  const walker = document.createTreeWalker(
    rootElement,
    NodeFilter.SHOW_ELEMENT,
    null,
    false
  );
  
  let index = 0;
  let node;
  const nodesToReplace = [];
  
  while ((node = walker.nextNode()) && index < tagsAndAttrs.length) {
    if (elementMap.has(index)) {
      nodesToReplace.push({ span: node, realTag: elementMap.get(index), index });
    }
    index++;
  }
  
  // Replace spans with real elements
  nodesToReplace.forEach(({ span, realTag }) => {
    const realElement = document.createElement(realTag);
    
    // Copy all attributes from span to real element, skipping data-real-tag
    Array.from(span.attributes).forEach(attr => {
      if (attr.name !== 'data-real-tag') {
        try {
          realElement.setAttribute(attr.name, attr.value);
        } catch (e) {
          console.warn(`[FORGE] Failed to copy attribute "${attr.name}" to ${realTag}: ${e.message}`);
        }
      }
    });
    
    // Move all children from span to real element
    while (span.firstChild) {
      realElement.appendChild(span.firstChild);
    }
    
    // Replace span with real element
    span.replaceWith(realElement);
  });
};

/**
 * Safe HTML setter that works with CSP Trusted Types (e.g., Gemini).
 * Strategy: Replace buttons with spans, inject HTML, convert spans back to buttons, apply attributes.
 */
window.setForgeHTML = function(element, html) {
  if (!element) return;
  
  // Replace restricted elements with <span data-real-tag="..."> to work around CSP
  const modifiedHtml = replaceRestrictedElements(html);
  
  // Extract attributes from MODIFIED html (which has data-real-tag for restricted elements)
  const tagsAndAttrs = extractTagsAndAttributes(modifiedHtml);
  
  // Try setHTML with trustedTypes policy (Gemini, strict CSP)
  if (typeof element.setHTML === 'function' && typeof trustedTypes !== 'undefined') {
    try {
      const policy = trustedTypes.createPolicy('forge-html-policy', {
        createHTML: (str) => str
      });
      element.setHTML(policy.createHTML(modifiedHtml));
      convertSpansToRealElements(element, tagsAndAttrs);
      applyAttributesToTree(element, tagsAndAttrs);
      return;
    } catch (e) {
      console.warn('[FORGE] setHTML failed:', e.message);
    }
  }
  
  // Fallback: Direct innerHTML (standard browsers without strict CSP)
  try {
    element.innerHTML = modifiedHtml;
    convertSpansToRealElements(element, tagsAndAttrs);
    applyAttributesToTree(element, tagsAndAttrs);
  } catch (e) {
    console.warn('[FORGE] innerHTML blocked by CSP, using textContent');
    element.textContent = modifiedHtml.replace(/<[^>]*>/g, '');
  }
};

/**
 * Test suite for safe-html functions
 */
window.testSafeHTML = function() {
  const results = { passed: 0, failed: 0, tests: [] };
  
  // Test extractTagsAndAttributes
  const extractTests = [
    {
      name: 'Simple div with id and class',
      html: '<div id="my-id" class="my-class">content</div>',
      expected: [{ tagName: 'div', attrs: { id: 'my-id', class: 'my-class' } }]
    },
    {
      name: 'Nested elements',
      html: '<div id="outer"><span class="inner">text</span></div>',
      expected: [
        { tagName: 'div', attrs: { id: 'outer' } },
        { tagName: 'span', attrs: { class: 'inner' } }
      ]
    },
    {
      name: 'Data attributes with hyphens',
      html: '<div data-x="y" data-test="value">test</div>',
      expected: [{ tagName: 'div', attrs: { 'data-x': 'y', 'data-test': 'value' } }]
    }
  ];
  
  extractTests.forEach(test => {
    const result = extractTagsAndAttributes(test.html);
    const match = JSON.stringify(result) === JSON.stringify(test.expected);
    results.tests.push({ name: test.name, passed: match });
    if (match) results.passed++;
    else results.failed++;
  });
  
  return results;
};
// FORGE Glob Pattern Matcher
// Simple glob pattern matching for file paths (like .gitignore)
// Supports: *, **, ?, [abc], [!abc]

function globToRegex(pattern) {
  // Normalize pattern: remove leading slash if present
  pattern = pattern.replace(/^\/+/, '');
  
  // Handle ** FIRST (before escaping), replace with unique placeholder
  // ** should match zero or more path segments
  pattern = pattern.replace(/\*\*\//g, '\x00DS\x00');
  pattern = pattern.replace(/\/\*\*/g, '\x00DS\x00');
  pattern = pattern.replace(/\*\*/g, '\x00DS\x00');
  
  // Escape special regex characters except glob wildcards
  let regex = pattern
    .replace(/\./g, '\\.')
    .replace(/\//g, '\\/')
    .replace(/\?/g, '[^/]');

  // Handle * (match anything except /) - do this BEFORE replacing placeholder
  regex = regex.replace(/\*/g, '[^/]*');

  // Replace placeholder with .* (matches any characters including /)
  // But we need to handle the case where ** is followed by / or preceded by /
  regex = regex.replace(/\x00DS\x00\\\//g, '(?:.*/)?');  // **/ becomes optional path
  regex = regex.replace(/\\\x00DS\x00/g, '(?:/.*)?');    // /** becomes optional path
  regex = regex.replace(/\x00DS\x00/g, '.*');             // ** alone becomes .*

  return '^' + regex + '$';
}

function matchesGlobPattern(filePath, pattern) {
  try {
    // Normalize filePath: remove leading slash for matching
    const normalizedPath = filePath.replace(/^\/+/, '');
    const regex = new RegExp(globToRegex(pattern));
    return regex.test(normalizedPath);
  } catch (e) {
    return false;
  }
}

function matchesAnyPattern(filePath, patterns) {
  if (!patterns || patterns.length === 0) return false;
  return patterns.some(pattern => matchesGlobPattern(filePath, pattern.trim()));
}

// Export for browser
if (typeof window !== 'undefined') {
  window.globToRegex = globToRegex;
  window.matchesGlobPattern = matchesGlobPattern;
  window.matchesAnyPattern = matchesAnyPattern;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    globToRegex,
    matchesGlobPattern,
    matchesAnyPattern
  };
}
// FORGE CODE - Patience Diff Algorithm
// Produces a human-readable diff between two strings of text.
// Based on the patience diff algorithm used by git.
//
// Public API:
//   computeDiff(oldContent, newContent) -> { hunks, oldLines, newLines }
//
// A hunk is: { oldStart, oldCount, newStart, newCount, changes }
// A change is: { type: 'equal'|'delete'|'insert', oldLine, newLine, text }

const MAX_LCS_SIZE = 300; // fall back to simple LCS below this subproblem size

/**
 * Main entry point. Takes two strings, returns diff result.
 */
function computeDiff(oldContent, newContent) {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  const changes = _patienceDiff(oldLines, newLines, 0, oldLines.length, 0, newLines.length);
  const hunks = _buildHunks(changes, oldLines, newLines);

  return { hunks, oldLines, newLines };
}

/**
 * Patience diff ¡ª recursively diff old[oLo..oHi) vs new[nLo..nHi).
 * Returns array of change objects.
 */
function _patienceDiff(oldLines, newLines, oLo, oHi, nLo, nHi) {
  // Trim matching lines from top
  while (oLo < oHi && nLo < nHi && oldLines[oLo] === newLines[nLo]) {
    oLo++;
    nLo++;
  }
  // Trim matching lines from bottom
  while (oLo < oHi && nLo < nHi && oldLines[oHi - 1] === newLines[nHi - 1]) {
    oHi--;
    nHi--;
  }

  // Base cases
  if (oLo === oHi && nLo === nHi) return [];

  if (oLo === oHi) {
    // Pure insertion
    const result = [];
    for (let i = nLo; i < nHi; i++) {
      result.push({ type: 'insert', oldLine: oLo, newLine: i, text: newLines[i] });
    }
    return result;
  }

  if (nLo === nHi) {
    // Pure deletion
    const result = [];
    for (let i = oLo; i < oHi; i++) {
      result.push({ type: 'delete', oldLine: i, newLine: nLo, text: oldLines[i] });
    }
    return result;
  }

  // Find unique line matches (patience sort anchors)
  const anchors = _findUniqueAnchors(oldLines, newLines, oLo, oHi, nLo, nHi);

  if (anchors.length === 0) {
    // No unique anchors ¡ª fall back to simple LCS if small enough, else naive
    const oSize = oHi - oLo;
    const nSize = nHi - nLo;
    if (oSize <= MAX_LCS_SIZE && nSize <= MAX_LCS_SIZE) {
      return _simpleLCS(oldLines, newLines, oLo, oHi, nLo, nHi);
    } else {
      // Too large for LCS ¡ª treat whole block as delete+insert
      const result = [];
      for (let i = oLo; i < oHi; i++) {
        result.push({ type: 'delete', oldLine: i, newLine: nLo, text: oldLines[i] });
      }
      for (let i = nLo; i < nHi; i++) {
        result.push({ type: 'insert', oldLine: oHi, newLine: i, text: newLines[i] });
      }
      return result;
    }
  }

  // Recurse between anchors
  const result = [];
  let prevOld = oLo;
  let prevNew = nLo;

  for (const anchor of anchors) {
    // Diff the gap before this anchor
    const sub = _patienceDiff(oldLines, newLines, prevOld, anchor.oldIdx, prevNew, anchor.newIdx);
    result.push(...sub);
    // Emit the matching anchor line as equal
    result.push({ type: 'equal', oldLine: anchor.oldIdx, newLine: anchor.newIdx, text: oldLines[anchor.oldIdx] });
    prevOld = anchor.oldIdx + 1;
    prevNew = anchor.newIdx + 1;
  }

  // Diff the gap after the last anchor
  const tail = _patienceDiff(oldLines, newLines, prevOld, oHi, prevNew, nHi);
  result.push(...tail);

  return result;
}

/**
 * Find lines that appear exactly once in both old and new within the given ranges.
 * Returns them sorted by old position, with their LCS alignment applied
 * (patience sort: find LCS of the unique matches by new index).
 */
function _findUniqueAnchors(oldLines, newLines, oLo, oHi, nLo, nHi) {
  // Count occurrences in new
  const newCount = new Map();
  const newIndex = new Map();
  for (let i = nLo; i < nHi; i++) {
    const line = newLines[i];
    newCount.set(line, (newCount.get(line) || 0) + 1);
    newIndex.set(line, i);
  }

  // Find lines unique in both old and new
  const oldCount = new Map();
  for (let i = oLo; i < oHi; i++) {
    const line = oldLines[i];
    oldCount.set(line, (oldCount.get(line) || 0) + 1);
  }

  // Collect unique matches in old order
  const uniqueMatches = [];
  const seen = new Set();
  for (let i = oLo; i < oHi; i++) {
    const line = oldLines[i];
    if (seen.has(line)) continue;
    seen.add(line);
    if (oldCount.get(line) === 1 && newCount.get(line) === 1) {
      uniqueMatches.push({ oldIdx: i, newIdx: newIndex.get(line), text: line });
    }
  }

  // Find LCS of uniqueMatches by newIdx (patience sort)
  // This gives us the longest increasing subsequence by newIdx
  return _longestIncreasingSubsequence(uniqueMatches);
}

/**
 * Find the longest increasing subsequence of matches by newIdx.
 * Uses patience sorting ¡ª O(n log n).
 */
function _longestIncreasingSubsequence(matches) {
  if (matches.length === 0) return [];

  const piles = [];   // end element of each pile
  const pileIdx = []; // which pile each match went to
  const prev = [];    // previous match index for backtracking

  for (let i = 0; i < matches.length; i++) {
    const val = matches[i].newIdx;

    // Binary search for leftmost pile whose top >= val
    let lo = 0, hi = piles.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (piles[mid] < val) lo = mid + 1;
      else hi = mid;
    }

    piles[lo] = val;
    pileIdx[i] = lo;
    prev[i] = lo > 0 ? _lastInPile(pileIdx, lo - 1, i) : -1;
  }

  // Backtrack to find the actual subsequence
  const result = [];
  let idx = _lastInPile(pileIdx, piles.length - 1, matches.length);
  while (idx !== -1) {
    result.unshift(matches[idx]);
    idx = prev[idx];
  }

  return result;
}

function _lastInPile(pileIdx, pileNum, before) {
  for (let i = before - 1; i >= 0; i--) {
    if (pileIdx[i] === pileNum) return i;
  }
  return -1;
}

/**
 * Simple O(n*m) LCS diff for small subproblems.
 */
function _simpleLCS(oldLines, newLines, oLo, oHi, nLo, nHi) {
  const oLen = oHi - oLo;
  const nLen = nHi - nLo;

  // Build LCS table
  const dp = Array.from({ length: oLen + 1 }, () => new Int32Array(nLen + 1));

  for (let i = oLen - 1; i >= 0; i--) {
    for (let j = nLen - 1; j >= 0; j--) {
      if (oldLines[oLo + i] === newLines[nLo + j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // Backtrack
  const result = [];
  let i = 0, j = 0;
  while (i < oLen && j < nLen) {
    if (oldLines[oLo + i] === newLines[nLo + j]) {
      result.push({ type: 'equal', oldLine: oLo + i, newLine: nLo + j, text: oldLines[oLo + i] });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ type: 'delete', oldLine: oLo + i, newLine: nLo + j, text: oldLines[oLo + i] });
      i++;
    } else {
      result.push({ type: 'insert', oldLine: oLo + i, newLine: nLo + j, text: newLines[nLo + j] });
      j++;
    }
  }
  while (i < oLen) {
    result.push({ type: 'delete', oldLine: oLo + i, newLine: nHi, text: oldLines[oLo + i] });
    i++;
  }
  while (j < nLen) {
    result.push({ type: 'insert', oldLine: oHi, newLine: nLo + j, text: newLines[nLo + j] });
    j++;
  }
  return result;
}

/**
 * Group changes into hunks with context lines.
 * A hunk is a contiguous region of changes plus CONTEXT_LINES of equal lines on each side.
 */
function _buildHunks(changes, oldLines, newLines, contextLines = 3) {
  if (changes.length === 0) return [];

  // First reconstruct the full sequence including equal lines
  // We need to fill in the equal lines that were trimmed during recursion
  const full = _reconstructFull(changes, oldLines, newLines);

  // Find indices of non-equal changes
  const changeIndices = [];
  full.forEach((c, i) => {
    if (c.type !== 'equal') changeIndices.push(i);
  });

  if (changeIndices.length === 0) return [];

  // Group nearby changes into hunks
  const hunks = [];
  let hunkStart = Math.max(0, changeIndices[0] - contextLines);
  let hunkEnd = Math.min(full.length - 1, changeIndices[0] + contextLines);
  let group = [changeIndices[0]];

  for (let k = 1; k < changeIndices.length; k++) {
    const idx = changeIndices[k];
    if (idx - changeIndices[k - 1] <= contextLines * 2 + 1) {
      // Close enough ¡ª extend current hunk
      hunkEnd = Math.min(full.length - 1, idx + contextLines);
      group.push(idx);
    } else {
      // Gap too large ¡ª emit current hunk, start new one
      hunks.push(_sliceHunk(full, hunkStart, hunkEnd));
      hunkStart = Math.max(0, idx - contextLines);
      hunkEnd = Math.min(full.length - 1, idx + contextLines);
      group = [idx];
    }
  }
  hunks.push(_sliceHunk(full, hunkStart, hunkEnd));

  return hunks;
}

function _sliceHunk(full, start, end) {
  return full.slice(start, end + 1);
}

/**
 * Reconstruct the full change sequence including equal lines
 * that were skipped during the recursive diff.
 */
function _reconstructFull(changes, oldLines, newLines) {
  if (changes.length === 0) {
    return oldLines.map((text, i) => ({ type: 'equal', oldLine: i, newLine: i, text }));
  }

  const result = [];
  let oPos = 0;
  let nPos = 0;

  for (const change of changes) {
    if (change.type === 'equal') {
      // Fill equal lines before this match
      while (oPos < change.oldLine) {
        result.push({ type: 'equal', oldLine: oPos, newLine: nPos, text: oldLines[oPos] });
        oPos++;
        nPos++;
      }
      result.push(change);
      oPos = change.oldLine + 1;
      nPos = change.newLine + 1;
    } else if (change.type === 'delete') {
      while (oPos < change.oldLine) {
        result.push({ type: 'equal', oldLine: oPos, newLine: nPos, text: oldLines[oPos] });
        oPos++;
        nPos++;
      }
      result.push(change);
      oPos = change.oldLine + 1;
    } else if (change.type === 'insert') {
      while (nPos < change.newLine) {
        result.push({ type: 'equal', oldLine: oPos, newLine: nPos, text: oldLines[oPos] });
        oPos++;
        nPos++;
      }
      result.push(change);
      nPos = change.newLine + 1;
    }
  }

  // Fill remaining equal lines
  while (oPos < oldLines.length) {
    result.push({ type: 'equal', oldLine: oPos, newLine: nPos, text: oldLines[oPos] });
    oPos++;
    nPos++;
  }

  return result;
}
// FORGE CODE - Diff Formatter
// Formats diff hunks into FIND/REPLACE patch notation.
//
// Public API:
//   formatDiffAsPatches(oldContent, newContent, options) -> string

const DIFF_MAX_LINE_LENGTH = 120;
const DIFF_CONTEXT_LINES = 3;

/**
 * Given old and new content strings, return a string formatted
 * as one or more FIND/REPLACE blocks showing what changed.
 * Returns null if there are no differences.
 */
function formatDiffAsPatches(oldContent, newContent) {
  if (oldContent === newContent) return null;

  const { hunks } = computeDiff(oldContent, newContent);

  if (!hunks || hunks.length === 0) return null;

  const blocks = hunks.map(hunk => _formatHunk(hunk));
  return blocks.join('\n\n');
}

/**
 * Format a single hunk as a FIND/REPLACE block.
 * The FIND block contains old lines (equal + deleted).
 * The REPLACE block contains new lines (equal + inserted).
 */
function _formatHunk(hunk) {
  const findLines = [];
  const replaceLines = [];

  for (const change of hunk) {
    const text = _truncateLine(change.text);
    if (change.type === 'equal') {
      findLines.push(text);
      replaceLines.push(text);
    } else if (change.type === 'delete') {
      findLines.push(text);
    } else if (change.type === 'insert') {
      replaceLines.push(text);
    }
  }

  return '<<<FIND\n' + findLines.join('\n') + '\n>>>\n<<<REPLACE\n' + replaceLines.join('\n') + '\n>>>';
}

/**
 * Truncate a line that exceeds the max length, appending a note.
 */
function _truncateLine(line) {
  if (!line || line.length <= DIFF_MAX_LINE_LENGTH) return line;
  const remaining = line.length - DIFF_MAX_LINE_LENGTH;
  return line.substring(0, DIFF_MAX_LINE_LENGTH) + ' [...+' + remaining + ' chars]';
}

/**
 * Given old and new content, return a summary of what changed ¡ª no code content,
 * just counts. Used by getStepDiffSummary.
 *
 * Returns: { hunkCount, linesAdded, linesRemoved, isIdentical }
 */
function summarizeDiff(oldContent, newContent) {
  if (oldContent === newContent) {
    return { hunkCount: 0, linesAdded: 0, linesRemoved: 0, isIdentical: true };
  }

  const { hunks } = computeDiff(oldContent, newContent);

  if (!hunks || hunks.length === 0) {
    return { hunkCount: 0, linesAdded: 0, linesRemoved: 0, isIdentical: true };
  }

  let linesAdded = 0;
  let linesRemoved = 0;

  for (const hunk of hunks) {
    for (const change of hunk) {
      if (change.type === 'insert') linesAdded++;
      else if (change.type === 'delete') linesRemoved++;
    }
  }

  return { hunkCount: hunks.length, linesAdded, linesRemoved, isIdentical: false };
}
// FORGE CODE - Auto Send
// Injects text into the chat input and submits it.
// Delegates to the active adapter first; falls back to generic DOM heuristics.

/**
 * Attempt to send text to the platform's chat input and submit.
 * Tries the active adapter's autoSend() first, then generic textarea fallback.
 * @param {string} text - The text to send
 * @returns {boolean} true if send was attempted, false if no input found
 */
window.autoSendToElsa = function(text) {
  // ©¤©¤ Adapter-owned send (preferred) ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  if (window.forgeAdapter && typeof window.forgeAdapter.autoSend === 'function') {
    if (window.forgeAdapter.autoSend(text)) return true;
  }

  // ©¤©¤ Generic textarea fallback ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  const textarea = document.querySelector('textarea, [contenteditable="true"], input[type="text"], [role="textbox"]') ||
                   document.querySelector('[data-testid*="input"], [placeholder*="message"], [placeholder*="chat"]');

  if (!textarea) return false;

  // Inject text
  if (textarea.value !== undefined) {
    // Regular textarea
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    nativeSetter.call(textarea, text);
  } else {
    // Contenteditable
    textarea.textContent = text;
  }

  // Fire events so React/framework picks up the change
  ['input', 'change', 'keyup', 'paste'].forEach(eventType => {
    textarea.dispatchEvent(new Event(eventType, { bubbles: true }));
  });

  textarea.focus();
  if (textarea.setSelectionRange) {
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }

  // Find and click the send button
  setTimeout(() => _findAndClickSendBtn(textarea), 300);
  return true;
};

/**
 * Finds and clicks the send button near the given textarea (old UI fallback).
 * Tries: form submit ¡ú button[type=submit] ¡ú proximity search ¡ú keyboard fallback.
 */
function _findAndClickSendBtn(textarea) {
  // Form submit
  const form = textarea.closest('form');
  if (form) {
    form.dispatchEvent(new Event('submit', { bubbles: true }));
    return true;
  }

  // Submit button
  const submitBtn = textarea.parentElement.querySelector('button[type="submit"]') ||
                    textarea.parentElement.parentElement.querySelector('button[type="submit"]') ||
                    document.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.click();
    return true;
  }

  // Proximity search ¡ª find button nearest to bottom-right of textarea
  const rect = textarea.getBoundingClientRect();
  const allButtons = Array.from(document.querySelectorAll('button, [role="button"]'))
    .map(btn => {
      const r = btn.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return null;
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      return { btn, cx, cy, dist: Math.sqrt(Math.pow(cx - rect.right, 2) + Math.pow(cy - rect.bottom, 2)) };
    })
    .filter(Boolean)
    .sort((a, b) => a.dist - b.dist);

  const zoneBtn = allButtons.find(({ cx, cy }) =>
    cx >= rect.right - 100 && cx <= rect.right + 50 &&
    cy >= rect.bottom - 50 && cy <= rect.bottom + 50
  );

  if (zoneBtn) { zoneBtn.btn.click(); return true; }
  if (allButtons.length > 0 && allButtons[0].dist < 80) { allButtons[0].btn.click(); return true; }

  // Keyboard fallback
  setTimeout(() => {
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    textarea.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
  }, 100);

  return false;
}
// FORGE CODE - Storage Utilities
// Handles IndexedDB caching for seamless resumption.
// Sessions are stored by URL key so each chat has its own slot.
// 'currentState' is kept as a backwards-compat sentinel pointing to the latest save.

const DB_NAME = 'ForgeQuickIDE';
const DB_VERSION = 1;
const STORE_NAME = 'workspaceState';

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

// Internal helper: put one record
function _dbPut(store, record) {
  return new Promise((resolve, reject) => {
    const req = store.put(record);
    req.onsuccess = () => resolve(true);
    req.onerror   = () => reject(req.error);
  });
}

// Internal helper: get one record by key
function _dbGet(store, key) {
  return new Promise((resolve, reject) => {
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror   = () => reject(req.error);
  });
}

function _getWorkspaceUrlKey(
  url = window.location.href
) {
  if (
    typeof window.getEffectiveConversationUrl ===
      'function'
  ) {
    return window
      .getEffectiveConversationUrl(url);
  }

  return url;
}

async function saveWorkspaceState() {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const rawUrlKey =
      window.location.href;

    const urlKey =
      _getWorkspaceUrlKey(rawUrlKey);

    const base = {
      url: urlKey,
      timestamp: Date.now(),
      projectTitle: repo.projectTitle,
      currentStep: repo.currentStep,
      lastProcessedStep: repo.lastProcessedStep,
      files: repo.files,
      fileMeta: repo.fileMeta
    };

    // Save per effective URL so transient query parameters
    // do not create duplicate conversation sessions.
    store.put({ ...base, id: urlKey });

    // Remove the current legacy raw-URL record when its key
    // differs from the adapter's effective conversation URL.
    if (rawUrlKey !== urlKey) {
      store.delete(rawUrlKey);
    }

    // Keep 'currentState' in sync for backwards compatibility.
    store.put({ ...base, id: 'currentState' });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror    = () => reject(tx.error);
    });
  } catch (error) {
    console.error('[FORGE Storage] Failed to save state:', error);
    return false;
  }
}

async function loadWorkspaceState() {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const rawUrlKey =
      window.location.href;

    const urlKey =
      _getWorkspaceUrlKey(rawUrlKey);

    // Prefer the adapter-normalized record for this chat.
    const byUrl =
      await _dbGet(store, urlKey);

    if (byUrl) {
      return byUrl;
    }

    // Preserve access to records saved before effective URL
    // normalization was introduced.
    if (rawUrlKey !== urlKey) {
      const legacyByUrl =
        await _dbGet(store, rawUrlKey);

      if (legacyByUrl) {
        return legacyByUrl;
      }
    }

    // Fall back to 'currentState' for old or cross-tab saves.
    return await _dbGet(store, 'currentState');
  } catch (error) {
    console.error('[FORGE Storage] Failed to load state:', error);
    return null;
  }
}

/**
 * Returns all saved sessions, sorted newest-first.
 * Deduplicates by URL so the 'currentState' sentinel doesn't show up
 * as a duplicate when a URL-keyed record for the same chat already exists.
 * Old saves that only have 'currentState' are included under their real URL.
 */
async function loadAllSessions() {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const all = (req.result || [])
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        // Deduplicate by real URL (prefer URL-keyed records over the 'currentState' sentinel)
        const seen = new Set();
        const deduped = [];
        for (const s of all) {
          const url = s.url || s.id; // old saves may have url, new ones use id=url
          if (url && !seen.has(url)) {
            seen.add(url);
            deduped.push(s);
          }
        }
        resolve(deduped);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('[FORGE Storage] Failed to load sessions:', error);
    return [];
  }
}

/**
 * Delete a session by its key (URL string).
 * Also clears 'currentState' if it points to the same URL.
 */
async function renameSession(id, newTitle) {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const record = await _dbGet(store, id);
    if (!record) return false;
    record.projectTitle = newTitle;
    await _dbPut(store, record);
    return true;
  } catch (e) {
    console.error('[FORGE] renameSession failed:', e);
    return false;
  }
}

async function deleteSession(key) {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    store.delete(key);

    // Clear 'currentState' too if it matches
    const cs = await _dbGet(store, 'currentState');
    if (cs && cs.url === key) store.delete('currentState');

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror    = () => reject(tx.error);
    });
  } catch (error) {
    console.error('[FORGE Storage] Failed to delete session:', error);
    return false;
  }
}

async function clearWorkspaceState() {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const rawUrlKey =
      window.location.href;

    const urlKey =
      _getWorkspaceUrlKey(rawUrlKey);

    store.delete('currentState');
    store.delete(urlKey);

    if (rawUrlKey !== urlKey) {
      store.delete(rawUrlKey);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror    = () => reject(tx.error);
    });
  } catch (error) {
    console.error('[FORGE Storage] Failed to clear state:', error);
    return false;
  }
}
// FORGE Code - CSP-Safe Execution Utility
// Shared logic for executing code in CSP-restricted environments.
// Used by both #execute operations and validators.

/**
 * Try to execute code using new Function (fastest, works in most environments).
 * Returns { success: true } if it worked, { success: false, error } if CSP blocked it.
 */
function tryDirectExec(code, context = {}) {
  try {
    const fn = new Function(...Object.keys(context), code);
    const result = fn(...Object.values(context));
    return { success: true, result };
  } catch (error) {
    const isCSP = (error.name === 'EvalError') || (error.message && (
      error.message.includes('Content Security Policy') ||
      error.message.includes('unsafe-eval') ||
      error.message.includes('EvalError') ||
      error.message.includes('unsafe-inline') ||
      error.message.includes('Trusted Type') ||
      error.message.includes('TrustedScript')
    ));
    
    if (isCSP) {
      return { success: false, cspBlocked: true, error };
    }
    // Not a CSP error - it's a real syntax/runtime error
    throw error;
  }
}

/**
 * Execute code in a nonce-bearing iframe to bypass CSP restrictions.
 * This is the same approach used by #execute operations.
 * 
 * @param {string} code - JavaScript code to execute
 * @param {object} context - Variables to expose (e.g., { content: "..." })
 * @param {string} operationId - Unique ID for this execution
 * @returns {Promise<{ success: boolean, result?, error? }>}
 */
function execInNonceIframe(code, context = {}, operationId = 'validator') {
  return new Promise(resolve => {
    const nonceScript =
      document.querySelector('script[nonce]');

    const nonce =
      nonceScript
        ? nonceScript.nonce ||
          nonceScript.getAttribute('nonce') ||
          ''
        : '';

    if (!nonce) {
      resolve({
        success: false,
        error: 'No CSP nonce available'
      });

      return;
    }

    const safeOperationId =
      String(operationId).replace(
        /[^0-9a-z]/gi,
        ''
      );

    const uniqueSuffix =
      Date.now() +
      '-' +
      Math.random()
        .toString(36)
        .slice(2);

    const frameId =
      'forge-csp-exec-' +
      safeOperationId +
      '-' +
      uniqueSuffix;

    const resultKey =
      '__forgeExecResult_' +
      safeOperationId +
      '_' +
      uniqueSuffix;

    const iframe =
      document.createElement('iframe');

    iframe.id = frameId;
    iframe.setAttribute(
      'sandbox',
      'allow-scripts allow-same-origin'
    );
    iframe.setAttribute(
      'aria-hidden',
      'true'
    );
    iframe.style.display = 'none';
    iframe.src = 'about:blank';

    let settled = false;
    let timeoutId = null;
    let frameWindow = null;
    let frameErrorHandler = null;

    const cleanup = () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (
        frameWindow &&
        frameErrorHandler
      ) {
        frameWindow.removeEventListener(
          'error',
          frameErrorHandler
        );
      }

      delete window[resultKey];

      if (iframe.parentNode) {
        iframe.parentNode.removeChild(
          iframe
        );
      }
    };

    const finish = result => {
      if (settled) return;

      settled = true;
      cleanup();
      resolve(result);
    };

    window[resultKey] = finish;

    try {
      const frameParent =
        document.body ||
        document.documentElement;

      if (!frameParent) {
        throw new Error(
          'No document container available for iframe'
        );
      }

      frameParent.appendChild(iframe);

      const frameDocument =
        iframe.contentDocument;

      frameWindow =
        iframe.contentWindow;

      if (!frameDocument || !frameWindow) {
        throw new Error(
          'Could not access iframe document'
        );
      }

      frameErrorHandler = event => {
        if (
          event &&
          typeof event.preventDefault ===
            'function'
        ) {
          event.preventDefault();
        }

        const sourceError =
          event && event.error
            ? event.error
            : null;

        finish({
          success: false,
          error: {
            message:
              event && event.message
                ? event.message
                : 'JavaScript syntax error',
            stack:
              sourceError &&
              sourceError.stack
                ? sourceError.stack
                : '',
            name:
              sourceError &&
              sourceError.name
                ? sourceError.name
                : 'SyntaxError'
          }
        });
      };

      frameWindow.addEventListener(
        'error',
        frameErrorHandler
      );

      const script =
        frameDocument.createElement(
          'script'
        );

      script.setAttribute(
        'nonce',
        nonce
      );

      const contextSetup =
        Object.keys(context)
          .map(key =>
            `const ${key} = ${JSON.stringify(
              context[key]
            )};`
          )
          .join('\n');

      const resultKeyLiteral =
        JSON.stringify(resultKey);

      script.textContent = `
        (function() {
          const complete =
            parent.window[${resultKeyLiteral}];

          try {
            ${contextSetup}

            const result = (function() {
              ${code}
            })();

            if (typeof complete === 'function') {
              complete({
                success: true,
                result
              });
            }
          } catch (error) {
            if (typeof complete === 'function') {
              complete({
                success: false,
                error: {
                  message:
                    error.message ||
                    String(error),
                  stack:
                    error.stack || '',
                  name:
                    error.name || 'Error'
                }
              });
            }
          }
        })();
      `;

      const scriptTarget =
        frameDocument.head ||
        frameDocument.body ||
        frameDocument.documentElement;

      scriptTarget.appendChild(script);

      timeoutId = setTimeout(() => {
        finish({
          success: false,
          error:
            'Iframe execution did not complete within 1000ms'
        });
      }, 1000);
    } catch (error) {
      finish({
        success: false,
        error:
          error.message ||
          String(error)
      });
    }
  });
}

/**
 * Execute code with automatic CSP fallback.
 * Tries new Function first, falls back to nonce iframe if CSP blocks it.
 * 
 * @param {string} code - JavaScript code to execute
 * @param {object} context - Variables to expose to the code
 * @param {string} operationId - Unique ID for this execution
 * @returns {Promise<{ success: boolean, result?, error? }>}
 */
async function execWithCSPFallback(code, context = {}, operationId = 'exec') {
  // Try direct execution first (fastest)
  try {
    const directResult = tryDirectExec(code, context);
    if (directResult.success) {
      return directResult;
    }
    
    // CSP blocked - try iframe fallback
    if (directResult.cspBlocked) {
      console.log('[FORGE CSP] new Function blocked, trying nonce iframe...');
      return await execInNonceIframe(code, context, operationId);
    }
    
    return directResult;
  } catch (error) {
    // Real syntax/runtime error (not CSP)
    return {
      success: false,
      error: {
        message: error.message || String(error),
        stack: error.stack || '',
        name: error.name || 'Error'
      }
    };
  }
}

// Export for browser
if (typeof window !== 'undefined') {
  window.tryDirectExec = tryDirectExec;
  window.execInNonceIframe = execInNonceIframe;
  window.execWithCSPFallback = execWithCSPFallback;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { tryDirectExec, execInNonceIframe, execWithCSPFallback };
}
// FORGE Code - Base Adapter
// Abstract base class for platform adapters

class BaseAdapter {
  constructor() {
    if (new.target === BaseAdapter) {
      throw new Error('BaseAdapter is abstract and cannot be instantiated directly');
    }
  }

  // Platform detection ¡ª must return true if this adapter matches the current page
  static detect() {
    throw new Error('detect() must be implemented by subclass');
  }

  // Initialize the adapter ¡ª set up interceptors, extract IDs, etc.
  async initialize() {
    throw new Error('initialize() must be implemented by subclass');
  }

  // Get the latest response markdown
  async getLatestResponse() {
    throw new Error('getLatestResponse() must be implemented by subclass');
  }

  // Return the canonical URL used to identify the current conversation.
  // Adapters may remove platform-specific transient URL components.
  static getEffectiveConversationUrl(url = window.location.href) {
    return url;
  }

  getEffectiveConversationUrl(url = window.location.href) {
    return this.constructor.getEffectiveConversationUrl(url);
  }


  // Build the protocol appendix string appended to outgoing messages.
  // All three adapters use the same wrapper; centralising it here keeps
  // the wording and markup in sync.
  static buildProtocolAppendix(protocolText) {
    return '\n\nUse the Forge Protocol, please!\n<details>\n' +
           '<summary>?? FORGE Protocol Reference</summary>\n\n' +
           protocolText +
           '\n</details>';
  }

  static getFullProtocolText(){
    const state = ForgeState.getState();

    console.log("State is:");
    console.log(JSON.parse(JSON.stringify(state)));
    // Only append protocol when BOTH "attach repo" AND "append protocol" are enabled.
    // includeCodingPrompt alone is not enough ¡ª it must be paired with an active upload.
    const shouldAppendProtocol = state.includeCodingPrompt && state.uploadArmed;
    const protocolText = localStorage.getItem('forge-workspace-prompt') ||
        (typeof WORKSPACE_PROMPT_BUILTIN !== 'undefined' ? WORKSPACE_PROMPT_BUILTIN : '');
    const protocolAppendix = shouldAppendProtocol
        ? BaseAdapter.buildProtocolAppendix(protocolText)
        : '';
    return protocolAppendix;
  }

  // Build toForgeJSON options based on current state.
  // Centralizes the summary-only logic used by all adapters.
  static buildForgeJSONOptions(state) {
    const summaryOnly = !!(state && state.summaryOnly);
    const summaryPatterns = summaryOnly
      ? (localStorage.getItem('forge-summary-patterns') || '**/*.md')
          .split('\n')
          .filter(pattern => pattern.trim())
      : null;

    return {
      summaryOnly,
      summaryPatterns
    };
  }

  // Inject protocol into the conversation
  async injectProtocol(protocolText) {
    throw new Error('injectProtocol() must be implemented by subclass');
  }

  // Queue a hidden payload to be injected into the next outgoing message
  // Returns true if supported, false otherwise
  queueHiddenPayload(payloadText) {
    return false; // Default implementation does not support this
  }

  // Check if a response is complete
  isResponseComplete() {
    throw new Error('isResponseComplete() must be implemented by subclass');
  }

  // Return true if the platform is currently streaming / generating a response.
  // Auto-pilot calls this before applying steps; returning false means "go ahead".
  // Default: optimistic ¡ª assume generation is complete.
  isStillGenerating() {
    return false;
  }

  // Return the DOM element that is the best root for searching assistant code blocks.
  // Auto-pilot uses this to scope its querySelectorAll('code') search.
  // Return null to fall back to searching the full document.
  getAssistantMessageRoot() {
    return null;
  }

  // Attempt to send text to the platform's chat input and submit it.
  // Return true if handled by this adapter, false to fall through to the
  // generic textarea fallback in auto-send.js.
  autoSend(text) {
    return false;
  }

  // Human-readable name for this platform, used in UI labels and messages.
  get platformName() {
    return 'Elsa';
  }

  // Return the DOM element that should receive padding-right when docked.
  // Return null to fall back to FORGE's built-in Elsa detection logic.
  getDockTarget() {
    return null;
  }

  // Clean up resources ¡ª restore fetch, remove observers, etc.
  cleanup() {
    // Optional cleanup hook
  }

  // ©¤©¤ Upload feedback helpers ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  // Adapters call these instead of inline logToUI/showToast so feedback
  // wording stays consistent across platforms.

  onUploadComplete(fileName) {
    if (typeof logToUI === 'function') {
      logToUI('? Repo JSON attached' + (fileName ? ': ' + fileName : ''));
    }
    if (typeof showToast === 'function') {
      showToast('? Repo & protocol attached!', 3000);
    }
  }

  onUploadFailed(error) {
    const msg = error && error.message ? error.message : String(error);
    if (typeof logToUI === 'function') {
      logToUI('? Upload failed: ' + msg);
    }
    if (typeof showToast === 'function') {
      showToast('Upload failed: ' + msg, 4000);
    }
  }

  // ©¤©¤ Completion signal ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  // Call this when the LLM response is fully received.
  // Notifies the TUI agent mode and dispatches a 'forge:response-complete'
  // event that auto-pilot.js listens for ¡ª adapters never call auto-pilot
  // internals directly.

  signalResponseComplete() {
    window.dispatchEvent(new CustomEvent('forge:response-complete'));
  }
}
// FORGE Code - Claude HHS Adapter
// API-based adapter for claude.hhs.gov

// Note: BaseAdapter is defined in adapters/base-adapter.js (loaded before this)

class ClaudeHHSAdapter extends BaseAdapter {
  constructor() {
    super();
    this.orgId = null;
    this.conversationId = null;
    this.latestResponseText = '';
    this.responseComplete = false;
    this.originalFetch = null;
  }

  get platformName() {
    return 'Claude';
  }

  static _getHostname() {
    return window.location.hostname;
  }

  static detect() {
    return ClaudeHHSAdapter._getHostname() === 'claude.hhs.gov';
  }

  async initialize() {
    console.log('[FORGE] ?? Initializing Claude HHS adapter');
    
    // Extract conversation ID from URL
    const conversationMatch = window.location.pathname.match(/\/chat\/([a-f0-9\-]+)/);
    this.conversationId = conversationMatch?.[1];
    
    if (!this.conversationId) {
      console.warn('[FORGE] Could not extract conversation ID from URL');
    }

    // Set up fetch interceptor
    this.setupFetchInterceptor();
    
    console.log('[FORGE] ? Claude HHS adapter initialized');
    console.log('[FORGE]    - Conversation ID:', this.conversationId || 'not found');
    console.log('[FORGE]    - Fetch interceptor: active');
    console.log('[FORGE]    - Protocol injection: ready');
    console.log('[FORGE]    - Repo upload: ready');
  }

  setupFetchInterceptor() {
    if (this.originalFetch) return; // Already set up

    this.originalFetch = window.fetch;
    const self = this;

    window.fetch = async function(...args) {
      let [url, options] = args;
      
      // Intercept completion requests
      if (typeof url === 'string' && url.includes('/completion')) {
        console.log('[FORGE] Intercepted completion request');
        
        // Extract org ID from URL if we don't have it
        if (!self.orgId) {
          const orgMatch = url.match(/\/api\/organizations\/([a-f0-9\-]+)/);
          self.orgId = orgMatch?.[1];
        }

        // Check if we should inject protocol and/or repo
        if (options && options.body) {
          try {
            const body = JSON.parse(options.body);
            
            console.log('[FORGE] Checking injection flags...');
            console.log('[FORGE]   - Protocol armed:', !!ForgeState.getState().protocolInjectionArmed);
            console.log('[FORGE]   - Repo armed:', !!ForgeState.getState().uploadArmed);
            console.log('[FORGE]   - Repo exists:', typeof repo !== 'undefined');
            

                const protocolAppendix = BaseAdapter.getFullProtocolText();
      if(protocolAppendix){
        body.prompt = (body.prompt || '') + protocolAppendix;
      }
            
            // Inject repo file if armed
            if (
              ForgeState.getState().uploadArmed &&
              typeof repo !== 'undefined'
            ) {
              const forgeOptions = BaseAdapter.buildForgeJSONOptions(ForgeState.getState());

              const repoData = repo.toForgeJSON({
                includeCodingPrompt: !!repo.includeCodingPrompt,
                pathsOnly: forgeOptions.summaryOnly,
                summaryPatterns: forgeOptions.summaryPatterns
              });
              const repoJson = JSON.stringify(repoData, null, 2);
              const fileName = repo.projectTitle 
                ? `codebase-${repo.projectTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-forge.json`
                : 'codebase-forge.json';
              
              body.attachments = body.attachments || [];
              body.attachments.push({
                file_name: fileName,
                file_type: 'application/json',
                file_size: repoJson.length,
                extracted_content: repoJson,
                origin: 'user_upload',
                kind: 'file'
              });
              
              console.log('[FORGE] ? Injected repo file:', fileName);
              
              ForgeActions.setProtocolInjectionArmed(false);

              if (typeof consumeUploadArm === 'function') {
                consumeUploadArm();
              }

              self.onUploadComplete(fileName);
            }
            
            // Update the request body
            options = { ...options, body: JSON.stringify(body) };
            args[1] = options;
          } catch (err) {
            console.error('[FORGE] Error injecting protocol/repo:', err);
          }
        }

        // Reset state for new response
        self.latestResponseText = '';
        self.responseComplete = false;

        const response = await self.originalFetch.call(window, ...args);
        
        // Clone response for our processing
        const clone = response.clone();
        
        // Parse SSE stream in background
        self.parseSSEStream(clone).catch(err => {
          console.error('[FORGE] Error parsing SSE stream:', err);
        });

        return response; // Return original to page
      }
      
      return self.originalFetch.call(window, ...args);
    };
  }

  async parseSSEStream(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, {stream: true});
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          this.processSSELine(line);
        }
      }
    } catch (err) {
      console.error('[FORGE] SSE stream error:', err);
    }
  }

  processSSELine(line) {
    if (line.startsWith('event: ')) {
      this.currentEvent = line.slice(7).trim();
    } else if (line.startsWith('data: ')) {
      const data = line.slice(6);
      
      try {
        const parsed = JSON.parse(data);
        
        if (this.currentEvent === 'content_block_delta') {
          const text = parsed.delta?.text || '';
          this.latestResponseText += text;
        } else if (this.currentEvent === 'message_stop') {
          this.responseComplete = true;
          console.log('[FORGE] Response complete, fetching conversation');
          this.signalResponseComplete();

          this.fetchConversation();
        }
      } catch (err) {
        // Not JSON, ignore
      }
    }
  }

  async fetchConversation() {
    if (!this.orgId || !this.conversationId) {
      console.warn('[FORGE] Missing org or conversation ID, cannot fetch');
      return;
    }

    const url = `https://claude.hhs.gov/api/organizations/${this.orgId}/chat_conversations/${this.conversationId}?tree=True&rendering_mode=messages`;
    
    try {
      const response = await this.originalFetch.call(window, url, {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      // Extract latest assistant message
      const messages = data.chat_messages || [];
      const assistantMessages = messages.filter(m => m.sender === 'assistant');
      
      if (assistantMessages.length > 0) {
        const latest = assistantMessages[assistantMessages.length - 1];
        const content = latest.content || [];
        const textContent = content.find(c => c.type === 'text');
        
        if (textContent) {
          this.latestResponseText = textContent.text;
          console.log('[FORGE] Fetched latest response from conversation API');
          // Auto-pilot is now triggered by the SSE stream completion in processSSELine
        }
      }
    } catch (err) {
      console.error('[FORGE] Error fetching conversation:', err);
    }
  }

  autoSend(text) {
    const editor =
      document.querySelector('div[contenteditable="true"].ProseMirror') ||
      document.querySelector('div[contenteditable="true"][data-testid="composer-content"]') ||
      document.querySelector('fieldset div[contenteditable="true"]') ||
      document.querySelector('div[contenteditable="true"]');

    if (!editor) return false;

    editor.focus();
    document.execCommand('selectAll', false, null);
    document.execCommand('insertText', false, text);

    // If execCommand didn't take, fall back to direct DOM manipulation
    if (!editor.textContent.includes(text.slice(0, 20))) {
      editor.textContent = text;
      editor.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
    }

    setTimeout(() => {
      const sendBtn =
        document.querySelector('button[aria-label="Send message"]') ||
        document.querySelector('button[data-testid="send-button"]') ||
        document.querySelector('button[type="submit"]');
      if (sendBtn && !sendBtn.disabled) {
        sendBtn.click();
      }
    }, 300);

    return true;
  }

  async getLatestResponse() {
    // Wait a bit for response to complete if needed
    if (!this.responseComplete) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return this.latestResponseText;
  }

  isResponseComplete() {
    return this.responseComplete;
  }

  // Return the main content element that dock.js should push right
  getDockTarget() {
    return document.querySelector('div#main-content');
  }

  async injectProtocol(protocolText) {
    ForgeActions.setProtocolInjectionArmed(true);
    console.log('[FORGE] Protocol injection armed - will inject on next message');
    return true;
  }

  cleanup() {
    // Restore original fetch
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
      this.originalFetch = null;
    }
  }
}
// FORGE Code - ChatGPT Adapter
// API-based adapter for chatgpt.com

// Note: BaseAdapter is defined in adapters/base-adapter.js and loaded first.

class ChatGPTAdapter extends BaseAdapter {
  constructor() {
    super();

    this.latestResponseText = '';
    this.responseComplete = false;
    this.originalFetch = null;
    this.currentEvent = '';
    this.currentPatchPath = '';
    this.currentPatchOperation = '';
    this.pendingProtocolText = '';
    this.pendingHiddenPayload = '';

    // ChatGPT can either stream response deltas directly on the
    // conversation request or hand the response off to a separate topic.
    // The handoff transport is rendered by ChatGPT itself, so FORGE watches
    // the assistant DOM for completion instead of trying to duplicate
    // ChatGPT's private topic/WebSocket client.
    this.responseTransport = 'inline';
    this.handoffSeen = false;
    this.lastAssistantMessageId = null;
    this.domCompletionObserver = null;
    this.domCompletionTimer = null;

    this.sseDiagnostics = {
      eventCounts: {},
      dataLines: 0,
      deltaPayloads: 0,
      parseErrors: 0,
      samples: []
    };
  }

  get platformName() {
    return 'ChatGPT';
  }

  static getEffectiveConversationUrl(url = window.location.href) {
    try {
      const parsedUrl = new URL(
        url,
        window.location.href
      );

      return (
        parsedUrl.origin +
        parsedUrl.pathname
      );
    } catch (error) {
      return String(
        url || window.location.href
      ).split(/[?#]/)[0];
    }
  }

  getDockTarget() {
    // Primary: the main chat shell div ¡ª matches current ChatGPT DOM structure
    const chatShell = document.querySelector(
      'div.h-svh.flex-col, div.h-svh.w-screen.flex-col'
    );
    if (chatShell) return chatShell;

    // Fallback: largest visible .w-screen element (previous ChatGPT structure)
    const candidates = Array.from(
      document.querySelectorAll('.w-screen')
    ).filter(element => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden'
      );
    });

    return candidates.sort((first, second) => {
      const firstRect = first.getBoundingClientRect();
      const secondRect = second.getBoundingClientRect();
      return (
        secondRect.width * secondRect.height -
        firstRect.width * firstRect.height
      );
    })[0] || null;
  }

  static _getHostname() {
    return window.location.hostname;
  }

  static detect() {
    const hostname = ChatGPTAdapter._getHostname();

    return (
      hostname === 'chatgpt.com' ||
      hostname === 'chat.openai.com'
    );
  }

  async initialize() {
    console.log('[FORGE] ?? Initializing ChatGPT adapter');

    this.setupFetchInterceptor();

    console.log('[FORGE] ? ChatGPT adapter initialized');
    console.log('[FORGE]    Fetch interceptor: active');
    console.log('[FORGE]    Protocol injection: ready');
    console.log('[FORGE]    Response capture: ready');
  }

  getRequestUrl(input) {
    if (typeof input === 'string') {
      return input;
    }

    if (input && typeof input.url === 'string') {
      return input.url;
    }

    return '';
  }

  isConversationRequest(input, options) {
    const url = this.getRequestUrl(input);

    if (
      !url ||
      !options ||
      typeof options.body !== 'string'
    ) {
      return false;
    }

    try {
      const parsedUrl = new URL(
        url,
        window.location.href
      );

      return (
        parsedUrl.pathname ===
        '/backend-api/f/conversation'
      );
    } catch (error) {
      return false;
    }
  }

  isConversationSnapshotRequest(input) {
    const url = this.getRequestUrl(input);

    if (!url) {
      return false;
    }

    try {
      const parsedUrl = new URL(
        url,
        window.location.href
      );

      return /^\/backend-api\/conversation\/[^/]+$/.test(
        parsedUrl.pathname
      );
    } catch (error) {
      return false;
    }
  }


  interceptConversationRequest(options) {
    try {
      const body = JSON.parse(options.body);
      const message = body?.messages?.[0]?.content?.parts?.[0];
      const protocolArmed =
        !!ForgeState.getState().protocolInjectionArmed;
      const repoArmed =
        !!ForgeState.getState().uploadArmed;
      const hasHiddenPayload = 
        !!this.pendingHiddenPayload;

      if (
        (protocolArmed || repoArmed || hasHiddenPayload) &&
        typeof message !== 'string'
      ) {
        console.warn(
          '[FORGE] Could not find ChatGPT message text for injection'
        );

        return options;
      }

      const appendices = [];

      if (hasHiddenPayload) {
        // Replace the placeholder message entirely or append it
        if (message.trim() === 'Sending results...') {
          body.messages[0].content.parts[0] = this.pendingHiddenPayload;
        } else {
          appendices.push('\n\n' + this.pendingHiddenPayload);
        }
        console.log('[FORGE] ? Injected hidden payload into ChatGPT request');
        this.pendingHiddenPayload = '';
      }

      if (protocolArmed) {
        // Use the protocol text supplied to injectProtocol() if available;
        // fall back to the full workspace prompt for normal (non-test) flows.
        const protocolAppendix = this.pendingProtocolText
          ? BaseAdapter.buildProtocolAppendix(this.pendingProtocolText)
          : BaseAdapter.getFullProtocolText();
        appendices.push(protocolAppendix);
      }

      if (repoArmed) {
        if (typeof repo !== 'undefined') {
          // When attaching the repo, also append the protocol if includeCodingPrompt is set.
          // This mirrors Claude HHS behaviour ¡ª the user should not need to arm protocol
          // separately from the repo upload.
          const repoProtocol = BaseAdapter.getFullProtocolText();
          if (repoProtocol) {
            appendices.push(repoProtocol);
          }

          // For ChatGPT, we only send the paths to avoid 422 Payload Too Large errors
          // and browser freezing, since we can't easily hook into their complex 3-step file upload API.
          const repoData = repo.toForgeJSON({
            includeCodingPrompt: !!repo.includeCodingPrompt,
            pathsOnly: true,
            summaryPatterns: ['__MATCH_NOTHING__'] // Force exclusion of ALL file contents, even .md
          });

          const repoJson = JSON.stringify(repoData, null, 2);
          const fileName = repo.projectTitle
            ? (
              'codebase-' +
              repo.projectTitle
                .replace(/[^a-z0-9]/gi, '-')
                .toLowerCase() +
              '-forge.json'
            )
            : 'codebase-forge.json';

          appendices.push(
            '\n\n<forge-repository name="' +
            fileName +
            '" note="File contents omitted for size. Use #execute to read specific files.">\n' +
            repoJson +
            '\n</forge-repository>'
          );

          console.log(
            '[FORGE] ? Added repo manifest (paths only) to ChatGPT request:',
            fileName
          );

          this.onUploadComplete(fileName);
        } else {
          console.warn(
            '[FORGE] Repo upload was armed, but the repo API was unavailable'
          );
        }
      }

      if (appendices.length > 0) {
        body.messages[0].content.parts[0] =
          message + appendices.join('');
      }

      if (protocolArmed) {
        ForgeActions.setProtocolInjectionArmed(false);
        this.pendingProtocolText = '';
      }

      if (repoArmed) {
        if (typeof consumeUploadArm === 'function') {
          consumeUploadArm();
        }
      }

      return {
        ...options,
        body: JSON.stringify(body)
      };
    } catch (err) {
      console.error(
        '[FORGE] Error intercepting ChatGPT request:',
        err
      );

      return options;
    }
  }

  resetResponseState() {
    this.stopDomCompletionWatch();

    const previousAssistant =
      this.getAssistantMessageRoot();

    this.lastAssistantMessageId =
      previousAssistant?.getAttribute(
        'data-message-id'
      ) || null;

    this.latestResponseText = '';
    this.responseComplete = false;
    this.responseTransport = 'inline';
    this.handoffSeen = false;
    this.currentEvent = '';
    this.currentPatchPath = '';
    this.currentPatchOperation = '';

    this.sseDiagnostics = {
      eventCounts: {},
      dataLines: 0,
      deltaPayloads: 0,
      parseErrors: 0,
      samples: []
    };
  }

  setupFetchInterceptor() {
    if (this.originalFetch) {
      return;
    }

    this.originalFetch = window.fetch;
    const self = this;

    window.fetch = async function (...args) {
      let [input, options] = args;

      const isConversationRequest =
        self.isConversationRequest(input, options);

      const isConversationSnapshotRequest =
        self.isConversationSnapshotRequest(input);

      if (isConversationRequest) {
        console.log(
          '[FORGE] Intercepted ChatGPT conversation request'
        );

        options = self.interceptConversationRequest(options);
        args[1] = options;

        self.resetResponseState();
      }

      const response =
        await self.originalFetch.call(window, ...args);

      if (isConversationRequest) {
        try {
          const clone = response.clone();

          self.parseSSEStream(clone).catch(err => {
            console.error(
              '[FORGE] Error parsing ChatGPT SSE stream:',
              err
            );
          });
        } catch (err) {
          console.error(
            '[FORGE] Could not clone ChatGPT response:',
            err
          );
        }
      }

      if (
        isConversationSnapshotRequest &&
        response.ok
      ) {
        try {
          const clone = response.clone();

          self.parseConversationSnapshot(clone)
            .catch(err => {
              console.error(
                '[FORGE] Error parsing ChatGPT conversation snapshot:',
                err
              );
            });
        } catch (err) {
          console.error(
            '[FORGE] Could not clone ChatGPT conversation snapshot:',
            err
          );
        }
      }

      return response;
    };
  }

  extractLatestAssistantMessage(data) {
    const mapping = data?.mapping || {};
    let nodeId = data?.current_node || null;

    while (nodeId && mapping[nodeId]) {
      const node = mapping[nodeId];
      const message = node?.message;
      const role = message?.author?.role;

      if (role === 'assistant') {
        const parts = message?.content?.parts || [];

        const text = parts
          .map(part => {
            if (typeof part === 'string') {
              return part;
            }

            if (
              part &&
              typeof part.text === 'string'
            ) {
              return part.text;
            }

            return '';
          })
          .filter(Boolean)
          .join('\n');

        if (text) {
          return {
            nodeId,
            text,
            status: message?.status || null
          };
        }
      }

      nodeId = node?.parent || null;
    }

    return null;
  }

  async parseConversationSnapshot(response) {
    const data = await response.json();
    const assistantMessage =
      this.extractLatestAssistantMessage(data);

    this.conversationDiagnostics = {
      topLevelKeys:
        Object.keys(data || {}).sort(),
      mappingCount:
        Object.keys(data?.mapping || {}).length,
      currentNode:
        data?.current_node || null,
      assistantNode:
        assistantMessage?.nodeId || null,
      assistantStatus:
        assistantMessage?.status || null,
      assistantTextLength:
        assistantMessage?.text?.length || 0,
      ignoredForHandoff:
        this.responseTransport === 'handoff' ||
        this.handoffSeen
    };

    // A snapshot request can race with the new topic-based response stream
    // and contain the previous assistant turn. Once ChatGPT has announced a
    // stream handoff, the rendered assistant DOM is the source of truth for
    // completion. Do not let a stale snapshot overwrite the current response
    // or fire forge:response-complete early.
    if (
      this.responseTransport === 'handoff' ||
      this.handoffSeen
    ) {
      console.log(
        '[FORGE] Ignoring ChatGPT conversation snapshot during handoff',
        {
          assistantNode:
            assistantMessage?.nodeId || null,
          assistantTextLength:
            assistantMessage?.text?.length || 0
        }
      );

      return;
    }

    if (!assistantMessage?.text) {
      console.warn(
        '[FORGE] ChatGPT conversation snapshot did not contain assistant text'
      );

      return;
    }

    this.latestResponseText =
      assistantMessage.text;
    this.responseComplete = true;

    console.log(
      '[FORGE] Captured ChatGPT response from conversation snapshot:',
      this.latestResponseText.length,
      'characters'
    );

    this.signalResponseComplete();
  }

  async parseSSEStream(response) {
    if (!response.body) {
      console.warn(
        '[FORGE] ChatGPT response did not include a readable body'
      );
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const rawLine of lines) {
          this.processSSELine(rawLine.replace(/\r$/, ''));
        }
      }

      buffer += decoder.decode();

      if (buffer) {
        this.processSSELine(buffer.replace(/\r$/, ''));
      }
    } catch (err) {
      console.error('[FORGE] ChatGPT SSE stream error:', err);
    }
  }

  processSSELine(line) {
    if (line.startsWith('event:')) {
      this.currentEvent = line.slice(6).trim();

      const eventCounts =
        this.sseDiagnostics.eventCounts;

      eventCounts[this.currentEvent] =
        (eventCounts[this.currentEvent] || 0) + 1;

      return;
    }

    if (!line.startsWith('data:')) {
      return;
    }

    const data = line.slice(5).trimStart();
    this.sseDiagnostics.dataLines += 1;

    if (data === '[DONE]') {
      // With the topic handoff transport, [DONE] only closes the initial
      // bootstrap stream. The assistant response continues elsewhere.
      if (this.handoffSeen) {
        this.startDomCompletionWatch();
        return;
      }

      this.markResponseComplete();
      return;
    }

    if (this.currentEvent !== 'delta') {
      this.processTransportMetadata(data);

      if (this.sseDiagnostics.samples.length < 12) {
        this.sseDiagnostics.samples.push({
          event: this.currentEvent,
          rawData: data.slice(0, 1000)
        });
      }

      return;
    }

    try {
      const payload = JSON.parse(data);

      this.sseDiagnostics.deltaPayloads += 1;

      if (this.sseDiagnostics.samples.length < 12) {
        this.sseDiagnostics.samples.push({
          event: this.currentEvent,
          payload
        });
      }

      this.processDelta(payload);
    } catch (err) {
      this.sseDiagnostics.parseErrors += 1;

      if (this.sseDiagnostics.samples.length < 12) {
        this.sseDiagnostics.samples.push({
          event: this.currentEvent,
          rawData: data.slice(0, 500),
          error: err.message
        });
      }

      console.debug(
        '[FORGE] Ignoring unrecognized ChatGPT delta payload'
      );
    }
  }

  processDelta(payload) {
    if (Array.isArray(payload)) {
      for (const operation of payload) {
        this.processPatchOperation(operation);
      }

      return;
    }

    if (
      payload &&
      payload.o === 'patch' &&
      Array.isArray(payload.v)
    ) {
      for (const operation of payload.v) {
        this.processPatchOperation(operation);
      }

      return;
    }

    this.processPatchOperation(payload);
  }

  processPatchOperation(operation) {
    if (!operation || typeof operation !== 'object') {
      return;
    }

    if (typeof operation.p === 'string') {
      this.currentPatchPath = operation.p;
    }

    if (typeof operation.o === 'string') {
      this.currentPatchOperation = operation.o;
    }

    const path = operation.p || this.currentPatchPath;
    const action = operation.o || this.currentPatchOperation;

    if (
      action === 'append' &&
      path === '/message/content/parts/0' &&
      typeof operation.v === 'string'
    ) {
      this.latestResponseText += operation.v;
      return;
    }

    if (
      action === 'replace' &&
      path === '/message/status' &&
      operation.v === 'finished_successfully'
    ) {
      this.markResponseComplete();
    }
  }

  processTransportMetadata(data) {
    if (
      this.currentEvent !== 'delta_encoding' ||
      !data
    ) {
      return;
    }

    try {
      const payload = JSON.parse(data);

      if (
        payload &&
        payload.type === 'stream_handoff'
      ) {
        this.handoffSeen = true;
        this.responseTransport = 'handoff';

        console.log(
          '[FORGE] ChatGPT response handed off to topic:',
          payload.options
            ?.map(option => option.topic_id)
            .filter(Boolean)
            .join(', ') || 'unknown'
        );

        this.startDomCompletionWatch();
      }
    } catch (error) {
      // The first delta_encoding value is currently the JSON string "v1".
      // Other unknown metadata is intentionally ignored.
    }
  }

  stopDomCompletionWatch() {
    if (this.domCompletionObserver) {
      this.domCompletionObserver.disconnect();
      this.domCompletionObserver = null;
    }

    if (this.domCompletionTimer) {
      clearTimeout(this.domCompletionTimer);
      this.domCompletionTimer = null;
    }
  }

  startDomCompletionWatch() {
    if (
      this.responseComplete ||
      this.domCompletionObserver ||
      typeof MutationObserver === 'undefined' ||
      !document.body
    ) {
      return;
    }

    const inspect = () => {
      if (this.responseComplete) {
        this.stopDomCompletionWatch();
        return;
      }

      const assistant =
        this.getAssistantMessageRoot();

      if (!assistant) {
        return;
      }

      const messageId =
        assistant.getAttribute(
          'data-message-id'
        );

      // Ignore the assistant turn that existed before this request.
      if (
        this.lastAssistantMessageId &&
        messageId === this.lastAssistantMessageId
      ) {
        return;
      }

      const turn =
        assistant.closest(
          'section[data-turn="assistant"], ' +
          '[data-turn="assistant"], ' +
          '[data-testid^="conversation-turn-"]'
        ) || assistant.parentElement;

      const hasCompletionAction =
        !!turn?.querySelector(
          'button[data-testid="copy-turn-action-button"], ' +
          'button[aria-label="Copy response"]'
        );

      if (
        hasCompletionAction &&
        !this.isStillGenerating()
      ) {
        this.lastAssistantMessageId =
          messageId || null;

        console.log(
          '[FORGE] ChatGPT handoff response completed in DOM'
        );

        // Keep latestResponseText empty for handoff responses. parseAndApply()
        // will intentionally use its existing DOM parser, which preserves
        // rendered FORGE code blocks better than assistant.innerText would.
        this.markResponseComplete();
        this.stopDomCompletionWatch();
      }
    };

    this.domCompletionObserver =
      new MutationObserver(inspect);

    this.domCompletionObserver.observe(
      document.body,
      {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: [
          'aria-label',
          'data-testid',
          'data-message-id'
        ]
      }
    );

    this.domCompletionTimer =
      setTimeout(() => {
        this.stopDomCompletionWatch();

        console.warn(
          '[FORGE] Timed out waiting for ChatGPT handoff response completion'
        );
      }, 300000);

    inspect();
  }

  markResponseComplete() {
    if (this.responseComplete) {
      return;
    }

    this.responseComplete = true;

    console.log(
      '[FORGE] ChatGPT response complete:',
      this.latestResponseText.length,
      'characters',
      '(' + this.responseTransport + ' transport)'
    );

    this.signalResponseComplete();
  }

  isStillGenerating() {
    const composer =
      document.querySelector(
        'form[data-type="unified-composer"]'
      ) ||
      document.querySelector(
        'form.group\\/composer'
      );

    const buttons = Array.from(
      (composer || document).querySelectorAll(
        'button'
      )
    );

    return buttons.some(button => {
      const testId =
        button.getAttribute('data-testid') || '';

      const ariaLabel =
        button.getAttribute('aria-label') || '';

      return (
        testId === 'stop-button' ||
        /^stop\b/i.test(ariaLabel)
      );
    });
  }

  getAssistantMessageRoot() {
    const messages = document.querySelectorAll(
      '[data-message-author-role="assistant"]'
    );
    return messages.length > 0 ? messages[messages.length - 1] : null;
  }

  autoSend(text) {
    const performSend = () => {
      const editor = document.querySelector(
        'div#prompt-textarea[contenteditable="true"][role="textbox"]'
      );

      // For large payloads use the hidden-payload mechanism to avoid freezing the UI
      let textToInsert = text;
      if (
        text.length > 1000 &&
        typeof this.queueHiddenPayload === 'function' &&
        this.queueHiddenPayload(text)
      ) {
        textToInsert = 'Sending results...';
      }

      if (!editor) {
        console.warn('[FORGE] ChatGPT composer was not found');
        return;
      }

      const insertionStarted = performance.now();
      editor.focus();

      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editor);
      selection.removeAllRanges();
      selection.addRange(range);

      let inserted = false;
      try {
        inserted = document.execCommand('insertText', false, textToInsert);
      } catch (e) {
        inserted = false;
      }

      if (!inserted) {
        editor.replaceChildren();
        const p = document.createElement('p');
        p.textContent = textToInsert;
        editor.appendChild(p);
        editor.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText', data: null }));
        editor.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
      }

      console.log(
        '[FORGE] ChatGPT composer insertion completed in ' +
        Math.round(performance.now() - insertionStarted) + 'ms using ' +
        (inserted ? 'execCommand' : 'DOM fallback')
      );

      let attempts = 0;
      const maxAttempts = 200;
      let sawStopButton = false;

      const sendInterval = setInterval(() => {
        attempts += 1;

        const composerBtn = document.querySelector('button#composer-submit-button');
        const isStop =
          composerBtn &&
          (
            composerBtn.getAttribute('data-testid') === 'stop-button' ||
            composerBtn.getAttribute('aria-label') === 'Stop answering'
          );
        if (isStop) sawStopButton = true;

        const sendBtn = document.querySelector(
          'button#composer-submit-button[data-testid="send-button"], ' +
          'button[data-testid="send-button"][aria-label="Send prompt"]'
        );
        const canSend = sendBtn && !sendBtn.disabled && sendBtn.getAttribute('aria-disabled') !== 'true';

        if (canSend) {
          clearInterval(sendInterval);
          sendBtn.click();
          console.log('[FORGE] Sent message through ChatGPT composer after ' + attempts * 100 + 'ms');
          return;
        }

        if (attempts >= maxAttempts) {
          clearInterval(sendInterval);
          console.warn(
            sawStopButton
              ? '[FORGE] ChatGPT was still generating and the send button did not become available within 20 seconds'
              : '[FORGE] ChatGPT send button did not become available after text insertion'
          );
        }
      }, 100);
    };

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => setTimeout(performSend, 0));
    } else {
      setTimeout(performSend, 0);
    }

    return true;
  }

  async getLatestResponse() {
    if (!this.responseComplete) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return this.latestResponseText;
  }

  isResponseComplete() {
    return this.responseComplete;
  }

  async injectProtocol(protocolText) {
    this.pendingProtocolText =
      typeof protocolText === 'string' ? protocolText : '';

    ForgeActions.setProtocolInjectionArmed(true);

    console.log(
      '[FORGE] Protocol injection armed for the next ChatGPT message'
    );

    return true;
  }

  queueHiddenPayload(payloadText) {
    this.pendingHiddenPayload = typeof payloadText === 'string' ? payloadText : '';
    console.log('[FORGE] Hidden payload queued for the next ChatGPT message');
    return true;
  }

  cleanup() {
    this.stopDomCompletionWatch();

    if (this.originalFetch) {
      window.fetch = this.originalFetch;
      this.originalFetch = null;
    }

    this.resetResponseState();
    this.pendingProtocolText = '';
  }
}
// FORGE Code - Elsa Adapter
// Unified fetch interceptor for Elsa (FDA) and Elsa PreProd.
// Handles: completion detection, temperature modification, repo upload.
// upload.js and temperature.js only toggle state flags ¡ª this adapter acts on them.

class ElsaAdapter extends BaseAdapter {
  constructor() {
    super();
    this.originalFetch = null;
    this.latestResponseText = '';
    this.responseComplete = false;
  }

  get platformName() {
    return 'Elsa';
  }

  static detect() {
    const hostname = window.location.hostname.toLowerCase();
    return hostname.includes('elsa.fda.gov') || hostname.includes('elsa.preprod.fda.gov');
  }

  async initialize() {
    this._installFetchInterceptor();
  }

  _installFetchInterceptor() {
    if (this.originalFetch) return; // already installed
    this.originalFetch = window.fetch;
    const adapter = this;

    window.fetch = async function(...args) {
      const [url, options = {}] = args;
      const urlStr = (typeof url === 'string') ? url : (url && url.url) || '';

      // ©¤©¤ 1. Completion detection (/api/engine/result) ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
      if (urlStr.includes('/api/engine/result')) {
        const response = await adapter.originalFetch.apply(this, args);
        try {
          response.clone().json().then(data => {
            if (data && data.pixelReturn && data.pixelReturn.length > 0) {
              adapter.responseComplete = true;
              const text = data.pixelReturn[0]?.output?.responseMessage?.parts?.[0]?.text;
              if (text) {
                adapter.latestResponseText = text;
              }
              adapter.signalResponseComplete();
            }
          }).catch(() => {});
        } catch (e) {}
        return response;
      }

      // ©¤©¤ 2. Temperature modification (/api/engine/runPixel) ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
      // Temperature options are read from the central state store.
      const temperatureState = ForgeState.getState();

      if (
        temperatureState.tempEnabled &&
        urlStr.includes('/api/engine/runPixel') &&
        options.body &&
        typeof options.body === 'string'
      ) {
        try {
          const params = new URLSearchParams(options.body);
          const expression = params.get('expression');
          if (expression && (expression.includes('AskElsa2') || expression.includes('UpdateRoomOptions'))) {
            const modified = expression.replace(
              /"temperature":\d*\.?\d+/g,
              '"temperature":' + temperatureState.currentTemp
            );
            params.set('expression', modified);
            args = [url, { ...options, body: params.toString() }];
            console.log(
              '[FORGE] Modified temperature to',
              temperatureState.currentTemp
            );
          }
        } catch (e) {
          console.warn('[FORGE] Temperature mod error:', e);
        }
      }

      // ©¤©¤ 3. Upload interception (runPixelAsync + central state) ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
      const isAsyncPixel = (
        urlStr.includes('/Monolith/api/engine/runPixelAsync') &&
        options.body &&
        typeof isUploadArmed === 'function' &&
        isUploadArmed()
      );

      if (isAsyncPixel) {
        const bodyStr = options.body.toString();
        const isAskElsa2      = bodyStr.includes('AskElsa2');
        const isAskPlayground = bodyStr.includes('AskPlayground');

        if (isAskElsa2 || isAskPlayground) {
          console.log('[FORGE] Intercepted Elsa message ¡ª processing upload...');

          

          try {
            return await adapter._doUploadAndSend.call(this, url, options, args, isAskElsa2, adapter);
          } catch (e) {
            console.error('[FORGE] Upload interceptor error:', e);
            this.onUploadFailed(e);
          }
        }
      }

      return adapter.originalFetch.apply(this, args);
    };
  }
  // ©¤©¤ Upload + send logic (moved from upload.js _interceptAndUpload) ©¤©¤©¤©¤©¤©¤©¤©¤
  async _doUploadAndSend(url, options, originalArgs, isAskElsa2, adapter) {
    const body    = options.body.toString();
    const decoded = decodeURIComponent(body);

    const insightIdMatch = body.match(/insightId=([a-f0-9-]+)/i);
    if (!insightIdMatch) throw new Error('Could not find insightId in request body');
    const insightId = insightIdMatch[1];

    // Build repo JSON snapshot
    const forgeOptions = BaseAdapter.buildForgeJSONOptions(ForgeState.getState());
    
    const projectData = repo.toForgeJSON({
      includeCodingPrompt: false,
      pathsOnly: forgeOptions.summaryOnly,
      summaryPatterns: forgeOptions.summaryPatterns
    });
    const jsonString = JSON.stringify(projectData, null, 2);

    if (typeof logToUI === 'function') logToUI('Uploading repo JSON...');

    // Step 1: Upload file
    const projectName    = (repo.projectTitle || 'untitled').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename       = `codebase-${projectName}-forge.json`;
    const blob           = new Blob([jsonString], { type: 'application/json' });
    const file           = new File([blob], filename, { type: 'application/json', lastModified: Date.now() });
    const formData       = new FormData();
    formData.append('file', file);

    const uploadResp = await adapter.originalFetch.call(this,
      `/Monolith/api/uploadFile/baseUpload?insightId=${insightId}`,
      { method: 'POST', body: formData }
    );
    if (!uploadResp.ok) throw new Error(`Upload failed: ${uploadResp.status}`);
    const uploadResult = await uploadResp.json();
    const fileInfo = uploadResult[0];
    if (!fileInfo || !fileInfo.fileName) throw new Error('Upload response missing fileName');
    if (typeof logToUI === 'function') logToUI(`Uploaded: ${fileInfo.fileName}`);

    // Step 2: Token check
    if (typeof logToUI === 'function') logToUI('Running token check...');
    const tokenBody = new URLSearchParams({
      expression: `Py("<encode>token_check.check_upload_length(byod_files=[{'fileName': '${fileInfo.fileName}', 'fileLocation': '${fileInfo.fileLocation}', 'fileType': 'txt', 'fileKey': ROOT + \\"${fileInfo.fileLocation}\\", 'file': '[object File]'}], max_chars=3200000)</encode>")`,
      insightId
    });
    const tokenResp = await adapter.originalFetch.call(this,
      '/Monolith/api/engine/runPixel',
      { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: tokenBody }
    );
    if (!tokenResp.ok) throw new Error(`Token check failed: ${tokenResp.status}`);
    if (typeof logToUI === 'function') logToUI('Token check passed');

    // Step 3a: Old Elsa (AskElsa2) ¡ª inject filePath into expression
    if (isAskElsa2) {
      if (typeof logToUI === 'function') logToUI('Injecting filePath into expression...');
      const expressionMatch = decoded.match(/expression=(.+?)&insightId=/s);
      if (!expressionMatch) throw new Error('Could not parse expression from request');
      let expression = expressionMatch[1];
      const filePathMatch = expression.match(/filePath\s*=\s*\[(.*?)\]/);
      let newExpression;
      if (filePathMatch && filePathMatch[1].trim()) {
        newExpression = expression.replace(/filePath\s*=\s*\[.*?\]/, `filePath=[${filePathMatch[1]},"${fileInfo.fileName}"]`);
      } else {
        newExpression = expression.replace(/(,\s*command\s*=\s*\[)/, `, filePath=["${fileInfo.fileName}"]$1`);
      }
      adapter.onUploadComplete(fileInfo.fileName);
      const newBody = new URLSearchParams({ expression: newExpression, insightId });
      return adapter.originalFetch.call(this, url, { ...options, body: newBody.toString() });
    }

    // Step 3b: New Elsa (AskPlayground) ¡ª optionally append protocol to message
    // getFullProtocolText() reads ForgeState.includeCodingPrompt and returns '' if not set.
    const protocolAppendix = BaseAdapter.getFullProtocolText();

    const expressionMatch = decoded.match(/expression=(.+?)&insightId=/s);
    if (!expressionMatch) {
      adapter.onUploadComplete(null);
      return adapter.originalFetch.apply(this, originalArgs);
    }

    let expression = expressionMatch[1];
    const ENC_OPEN  = '<' + 'encode>';
    const ENC_CLOSE = '<' + '/encode>';
    const commandRe = new RegExp('command=\\["' + ENC_OPEN + '(.+?)' + ENC_CLOSE + '"\\]', 's');
    const commandMatch = expression.match(commandRe);
    if (commandMatch && protocolAppendix) {
      const newMessage = commandMatch[1] + protocolAppendix;
      expression = expression.replace(
        commandRe,
        'command=["' + ENC_OPEN + newMessage + ENC_CLOSE + '"]'
      );
      adapter.onUploadComplete(fileInfo.fileName);
    

      if (typeof consumeUploadArm === 'function') {
        ForgeActions.setProtocolInjectionArmed(false);
        consumeUploadArm();
      }
      const tz = new URLSearchParams(body).get('tz') || 'America/New_York';
      const newBody = new URLSearchParams({ expression, insightId, tz });
      return adapter.originalFetch.call(this, url, { ...options, body: newBody.toString() });
    }

    adapter.onUploadComplete(null);
    return adapter.originalFetch.apply(this, originalArgs);
  }

  autoSend(text) {
    const lexicalEditor = document.querySelector('[data-lexical-editor="true"]') || document.querySelector('.ProseMirror');
    const betaSendBtn = document.querySelector('button[aria-label="Ask the AI"]') || document.querySelector('button[type="submit"]');

    if (!lexicalEditor || !betaSendBtn) return false;

    let textToInsert = text;
    if (
      text.length > 1000 &&
      typeof this.queueHiddenPayload === 'function' &&
      this.queueHiddenPayload(text)
    ) {
      textToInsert = 'Sending results...';
    }

    lexicalEditor.focus();
    try {
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, textToInsert);
    } catch (e) {
      lexicalEditor.textContent = textToInsert;
      lexicalEditor.dispatchEvent(new Event('input', { bubbles: true }));
    }

    setTimeout(() => {
      if (!betaSendBtn.disabled) betaSendBtn.click();
    }, 300);

    return true;
  }

  async getLatestResponse() {
    return this.latestResponseText;
  }

  isResponseComplete() {
    return this.responseComplete;
  }

  async injectProtocol(protocolText) {
    ForgeActions.setProtocolInjectionArmed(true);
    return true;
  }

  cleanup() {
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
      this.originalFetch = null;
    }
  }
}
// FORGE Code - FDA Gemini Adapter
// Adapter for vertexaisearch.cloud.google (FDA's enterprise Gemini deployment).
//
// Completion detection: polls for the absence of a "stop generating" button
// and the presence of response content that has stabilized.
//
// Response capture: DOM scraping via querySelectorAllDeep (shadow DOM aware).
//
// Auto-send: finds the composer textarea and submit button through shadow roots.

// Note: BaseAdapter is defined in adapters/base-adapter.js and loaded first.

/**
 * Traverse a node and all its shadow roots, collecting elements matching selector.
 * De-duplicates results.
 */
function _geminiQueryDeep(selector, root) {
  root = root || document;
  const results = [];
  const seen = new Set();

  function traverse(node) {
    if (!node) return;

    if (node.querySelectorAll) {
      try {
        const matches = node.querySelectorAll(selector);
        for (const el of matches) {
          if (!seen.has(el)) {
            seen.add(el);
            results.push(el);
          }
        }
      } catch (e) {
        // Invalid selector or cross-origin ¡ª skip
      }
    }

    // Check all children for shadow roots
    if (node.querySelectorAll) {
      try {
        const all = node.querySelectorAll('*');
        for (const child of all) {
          if (child.shadowRoot) traverse(child.shadowRoot);
        }
      } catch (e) {}
    }

    // Also check the root itself for a shadow root
    if (node.shadowRoot) traverse(node.shadowRoot);
  }

  traverse(root);
  return results;
}

function _geminiQueryOneDeep(selector, root) {
  const results = _geminiQueryDeep(selector, root);
  return results.length > 0 ? results[0] : null;
}

class GeminiFDAAdapter extends BaseAdapter {
  constructor() {
    super();
    this.latestResponseText = '';
    this.responseComplete = false;
    this._domObserver = null;
    this._domWatchTimer = null;
    this._lastResponseSignature = '';
    this._stableCount = 0;
    this._pollInterval = null;
  }

  get platformName() {
    return 'Gemini';
  }

  static _getHostname() {
    return window.location.hostname;
  }

  static detect() {
    const h = GeminiFDAAdapter._getHostname().toLowerCase();
    return h.includes('vertexaisearch.cloud.google') ||
           h.includes('gemini.hhs.gov') ||
           h.includes('gemini.google.com');
  }

  static getEffectiveConversationUrl(url) {
    url = url || window.location.href;
    try {
      const parsed = new URL(url, window.location.href);
      // Strip transient query params, keep the session path
      return parsed.origin + parsed.pathname;
    } catch (e) {
      return String(url || window.location.href).split(/[?#]/)[0];
    }
  }

  async initialize() {
    console.log('[FORGE] ?? Initializing FDA Gemini adapter');
    this._setupFetchInterceptor();
    console.log('[FORGE] ? Gemini adapter initialized (DOM scraping + shadow root traversal)');
  }

  _setupFetchInterceptor() {
    if (this._originalFetch) return;
    this._originalFetch = window.fetch;
    const self = this;

    window.fetch = async function(...args) {
      let [url, options] = args;
      const urlStr = typeof url === 'string' ? url : (url && url.url) || '';

      if (urlStr.includes('widgetStreamAssist') && options && typeof options.body === 'string') {
        try {
          const body = JSON.parse(options.body);
          const parts = body?.streamAssistRequest?.query?.parts;

          if (parts && parts.length > 0 && typeof parts[0].text === 'string') {
            const appendices = [];

            // Append protocol if armed
            const protocolAppendix = BaseAdapter.getFullProtocolText();
            if (protocolAppendix) appendices.push(protocolAppendix);

            // Append repo if armed
            if (ForgeState.getState().uploadArmed && typeof repo !== 'undefined') {
              const forgeOptions = BaseAdapter.buildForgeJSONOptions(ForgeState.getState());
              const repoData = repo.toForgeJSON({
                includeCodingPrompt: false,
                pathsOnly: forgeOptions.summaryOnly,
                summaryPatterns: forgeOptions.summaryPatterns
              });
              const repoJson = JSON.stringify(repoData, null, 2);
              const fileName = repo.projectTitle
                ? 'codebase-' + repo.projectTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase() + '-forge.json'
                : 'codebase-forge.json';

              appendices.push(
                '\n\n<forge-repository name="' + fileName + '">\n' + repoJson + '\n</forge-repository>'
              );

              console.log('[FORGE] Gemini: injected repo into widgetStreamAssist');
              self.onUploadComplete(fileName);
              if (typeof consumeUploadArm === 'function') consumeUploadArm();
            }

            if (appendices.length > 0) {
              parts[0].text += appendices.join('');
              options = { ...options, body: JSON.stringify(body) };
              args = [url, options];
              console.log('[FORGE] Gemini: injected into widgetStreamAssist');
            }

            ForgeActions.setProtocolInjectionArmed(false);
          }

          // Capture the response stream for completion detection
          const response = await self._originalFetch.apply(this, args);
          console.log('[FORGE] Gemini: widgetStreamAssist response received, status:', response.status, 'bodyUsed:', response.bodyUsed);
          try {
            self._captureStreamAssistResponse(response.clone());
          } catch(cloneErr) {
            console.warn('[FORGE] Gemini: failed to clone response:', cloneErr.message);
          }
          return response;

        } catch (e) {
          console.error('[FORGE] Gemini fetch interceptor error:', e);
        }
      }

      return self._originalFetch ? self._originalFetch.apply(this, args) : fetch.apply(this, args);
    };
  }

  async _captureStreamAssistResponse(response) {
    console.log('[FORGE] Gemini: capturing response stream');

    if (!response.body) {
      console.warn('[FORGE] Gemini: response has no body, falling back to DOM poll');
      this._startCompletionWatch();
      return;
    }

    this.responseComplete = false;
    this.latestResponseText = '';

    try {
      // Read the full streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let raw = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        raw += decoder.decode(value, { stream: true });
      }

      console.log('[FORGE] Gemini: full response length:', raw.length);

      if (!raw.trim()) {
        console.warn('[FORGE] Gemini: empty response body, falling back to DOM poll');
        this._startCompletionWatch();
        return;
      }

      // Parse the JSON array and extract text from replies
      // Path: [].streamAssistResponse.answer.replies[].groundedContent.content.text
      // Skip entries where thought=true (Gemini's internal reasoning steps)
      let extracted = '';
      try {
        const arr = JSON.parse(raw);
        // Each item contains a small delta of the response ¡ª concatenate all
        // non-thought text chunks in order to reconstruct the full response.
        // The final SUCCEEDED item may contain the full text on its own, so
        // we track both the concatenated version and the last complete text,
        // then pick whichever is longer.
        const chunks = [];
        let lastCompleteText = '';
        for (const item of arr) {
          const answer = item?.streamAssistResponse?.answer;
          const replies = answer?.replies || [];
          for (const reply of replies) {
            const content = reply?.groundedContent?.content;
            if (!content) continue;
            if (content.thought === true) continue;
            const t = content.text || '';
            if (t) {
              chunks.push(t);
              lastCompleteText = t;
            }
          }
        }
        const concatenated = chunks.join('');
        // Pick whichever is longer ¡ª sometimes last item has full text,
        // sometimes we need to concatenate all deltas
        extracted = concatenated.length >= lastCompleteText.length
          ? concatenated
          : lastCompleteText;
        console.log('[FORGE] Gemini: extracted text length:', extracted.length, 'chunks:', chunks.length);
      } catch (parseErr) {
        console.warn('[FORGE] Gemini: JSON parse failed:', parseErr.message);
      }

      if (extracted) {
        this.latestResponseText = extracted;
        console.log('[FORGE] Gemini: response captured from stream:', extracted.length, 'chars');
      } else {
        console.warn('[FORGE] Gemini: no text extracted, falling back to DOM poll');
        this._startCompletionWatch();
        return;
      }

    } catch (e) {
      console.error('[FORGE] Gemini: stream read error:', e.message);
      console.log('[FORGE] Gemini: falling back to DOM poll');
      this._startCompletionWatch();
      return;
    }

    this.responseComplete = true;
    this._stopCompletionWatch();
    this.signalResponseComplete();
  }

  // ©¤©¤ DOM helpers ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  /**
   * Find the "stop generating" button via shadow DOM.
   * Gemini renders a stop button while generating.
   */
  _findStopButton() {
    // Try various selector patterns Gemini uses
    const candidates = [
      '[aria-label*="Stop"]',
      '[aria-label*="stop"]',
      'button[data-test-id="stop-button"]',
      '.stop-button',
      '[jsname="r4nke"]',
    ];
    for (const sel of candidates) {
      const el = _geminiQueryOneDeep(sel);
      if (el && el.offsetParent !== null) return el;
    }
    return null;
  }

  /**
   * Find the send/submit button.
   */
  _findSendButton() {
    // aria-label="Submit" is the Gemini send button
    // className has double spaces so avoid class selector, use aria-label
    const byAriaLabel = _geminiQueryDeep('button[aria-label="Submit"]')
      .find(b => !b.closest('#forge-quick-ui'));
    if (byAriaLabel && !byAriaLabel.disabled) return byAriaLabel;

    // Fallback: any non-FORGE filled-tonal icon button
    const allButtons = _geminiQueryDeep('button');
    return allButtons.find(b =>
      !b.closest('#forge-quick-ui') &&
      !b.disabled &&
      (b.className || '').includes('filled-tonal')
    ) || null;
  }

  _findStopButton() {
    const candidates = [
      'button[aria-label="Stop"]',
      'button[aria-label*="stop" i]',
      'button[aria-label*="Stop generating"]',
      '.icon-button.filled-tonal[aria-label*="stop" i]',
    ];
    for (const sel of candidates) {
      const el = _geminiQueryOneDeep(sel);
      if (el && el.offsetParent !== null) return el;
    }
    return null;
  }

  /**
   * Find the composer input area (textarea or contenteditable).
   */
  _findComposer() {
    // Search shadow DOM only ¡ª explicitly exclude FORGE's own UI elements
    const candidates = [
      '.ProseMirror',
      'rich-textarea',
      'div[contenteditable="true"][role="textbox"]',
      '[data-test-id="chat-input"]',
      '.ql-editor',
      '[jsname="YPqjbf"]',
    ];
    for (const sel of candidates) {
      const results = _geminiQueryDeep(sel);
      // Skip any element that lives inside the FORGE UI
      const el = results.find(r => !r.closest('#forge-quick-ui'));
      if (el) return el;
    }
    return null;
  }

  /**
   * Extract the latest assistant response text from the DOM.
   * Gemini renders responses in model-response or similar elements.
   */
  _extractLatestResponse() {
    // Try to find the last model/assistant response container
    const responseSelectors = [
      'model-response',
      '[data-chunk-index]',
      '.model-response-text',
      '[class*="model-response"]',
      '[class*="response-content"]',
      'message-content',
      '.markdown-main-panel',
    ];

    let bestEl = null;
    for (const sel of responseSelectors) {
      const els = _geminiQueryDeep(sel);
      if (els.length > 0) {
        bestEl = els[els.length - 1];
        break;
      }
    }

    if (!bestEl) {
      // Fallback: find the last large text block that looks like a response
      const allParagraphs = _geminiQueryDeep('[role="presentation"] p, .response-text p');
      if (allParagraphs.length > 0) {
        // Gather text from all paragraphs in last response
        return allParagraphs.map(p => p.innerText || p.textContent || '').join('\n');
      }
      return '';
    }

    return bestEl.innerText || bestEl.textContent || '';
  }

  // ©¤©¤ Response completion detection ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  isStillGenerating() {
    return !!this._findStopButton();
  }

  isResponseComplete() {
    return this.responseComplete;
  }

  /**
   * Watch the DOM for response completion after auto-send.
   * Polls every 400ms; detects completion when the stop button disappears
   * AND the response text stabilizes for 2 consecutive reads.
   */
  _startCompletionWatch() {
    this._stopCompletionWatch();
    this.responseComplete = false;
    this.latestResponseText = '';
    this._lastResponseSignature = '';
    this._stableCount = 0;

    this._pollInterval = setInterval(() => {
      const stillGenerating = this.isStillGenerating();

      if (stillGenerating) {
        // Still going ¡ª capture current text but don't signal complete yet
        this._stableCount = 0;
        return;
      }

      // Stop button gone ¡ª check if text has stabilized
      const currentText = this._extractLatestResponse();
      const sig = currentText.length + ':' + currentText.slice(-80);

      if (sig === this._lastResponseSignature) {
        this._stableCount++;
      } else {
        this._stableCount = 0;
        this._lastResponseSignature = sig;
      }

      if (this._stableCount >= 2 && currentText.length > 0) {
        this.latestResponseText = currentText;
        this.responseComplete = true;
        this._stopCompletionWatch();
        console.log('[FORGE] Gemini response complete:', currentText.length, 'chars');
        this.signalResponseComplete();
      }
    }, 400);

    // Safety timeout ¡ª 5 minutes
    this._domWatchTimer = setTimeout(() => {
      this._stopCompletionWatch();
      if (!this.responseComplete) {
        this.latestResponseText = this._extractLatestResponse();
        this.responseComplete = true;
        console.warn('[FORGE] Gemini completion watch timed out, using current DOM text');
        this.signalResponseComplete();
      }
    }, 300000);
  }

  _stopCompletionWatch() {
    if (this._pollInterval) { clearInterval(this._pollInterval); this._pollInterval = null; }
    if (this._domWatchTimer) { clearTimeout(this._domWatchTimer); this._domWatchTimer = null; }
  }

  // ©¤©¤ Adapter contract ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  async getLatestResponse() {
    if (!this.responseComplete) {
      // Give it a moment then grab whatever's there
      await new Promise(r => setTimeout(r, 500));
    }
    return this.latestResponseText || this._extractLatestResponse();
  }

  async injectProtocol(protocolText) {
    // Protocol is appended by autoSend before sending
    this._pendingProtocol = protocolText || '';
    ForgeActions.setProtocolInjectionArmed(true);
    console.log('[FORGE] Gemini: protocol injection armed');
    return true;
  }

  getDockTarget() {
    // The FDA Gemini outer column container lives inside a shadow root
    return _geminiQueryOneDeep('.ucs-standalone-outer-column-container') ||
           _geminiQueryOneDeep('main, [role="main"], .conversation-container') ||
           document.body;
  }

  /**
   * Find the shadow root that owns the dock target element.
   * Used by dockUI() to inject styles into the correct style scope.
   */
  getDockShadowRoot() {
    const el = _geminiQueryOneDeep('.ucs-standalone-outer-column-container');
    if (!el) return null;
    // Walk up to find the shadow root
    let node = el.parentNode;
    while (node) {
      if (node instanceof ShadowRoot) return node;
      node = node.parentNode;
    }
    return null;
  }

  getAssistantMessageRoot() {
    // ucs-fast-markdown elements contain the rendered response in their shadow root
    const markers = _geminiQueryDeep('ucs-fast-markdown');
    if (markers.length > 0) {
      return markers[markers.length - 1];
    }
    const els = _geminiQueryDeep('model-response, [class*="model-response"], .response-container');
    return els.length > 0 ? els[els.length - 1] : null;
  }

  /**
   * Return all code/pre surfaces auto-pilot should scan for step markers.
   * Called by _findLatestRenderedStepNumber when the adapter provides this method.
   * For Gemini, code blocks live inside ucs-fast-markdown shadow roots.
   */
  getCodeSurfaces() {
    const surfaces = [];
    const markers = _geminiQueryDeep('ucs-fast-markdown');
    for (const marker of markers) {
      if (marker.shadowRoot) {
        const codes = marker.shadowRoot.querySelectorAll('code, pre');
        surfaces.push(...codes);
      }
    }
    // Also include any regular DOM surfaces
    surfaces.push(...document.querySelectorAll('code, .cm-content'));
    return surfaces;
  }

  autoSend(text) {
    const self = this;

    const performSend = () => {
      const composer = self._findComposer();
      if (!composer) {
        console.warn('[FORGE] Gemini: composer not found');
        return false;
      }

      let textToInsert = text;

      // Append protocol if armed
      if (ForgeState.getState().protocolInjectionArmed && self._pendingProtocol) {
        textToInsert += BaseAdapter.buildProtocolAppendix(self._pendingProtocol);
        self._pendingProtocol = '';
        ForgeActions.setProtocolInjectionArmed(false);
      }

      composer.focus();

      // Try contenteditable insertion
      if (composer.contentEditable === 'true' || composer.getAttribute('contenteditable') === 'true') {
        try {
          document.execCommand('selectAll', false, null);
          document.execCommand('insertText', false, textToInsert);
        } catch (e) {
          composer.textContent = textToInsert;
          composer.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
        }
      } else if (composer.tagName === 'TEXTAREA') {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(composer, textToInsert);
        composer.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
      } else {
        // Shadow DOM rich-textarea or custom element ¡ª dispatch events
        composer.dispatchEvent(new InputEvent('input', {
          bubbles: true, composed: true, data: textToInsert, inputType: 'insertText'
        }));
      }

      // Reset state and start watching for completion
      self.responseComplete = false;
      self.latestResponseText = '';

      // Give the framework a moment to react, then click send
      setTimeout(() => {
        const sendBtn = self._findSendButton();
        if (sendBtn) {
          sendBtn.click();
          console.log('[FORGE] Gemini: send button clicked');
          self._startCompletionWatch();
        } else {
          // Keyboard fallback
          composer.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Enter', code: 'Enter', bubbles: true, composed: true
          }));
          self._startCompletionWatch();
        }
      }, 400);

      return true;
    };

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => setTimeout(performSend, 0));
    } else {
      setTimeout(performSend, 0);
    }

    return true;
  }

  cleanup() {
    this._stopCompletionWatch();
    this._pendingProtocol = '';
    if (this._originalFetch) {
      window.fetch = this._originalFetch;
      this._originalFetch = null;
    }
  }
}
// FORGE Code - Fallback Adapter
// Generic adapter for unsupported / unknown pages.
// Provides best-effort DOM scraping (including shadow DOM) so FORGE remains
// usable, and collects diagnostic observations that make it easy to write a
// real adapter later.

// Note: BaseAdapter is defined in adapters/base-adapter.js and loaded first.

/**
 * Traverse a node and all its shadow roots, collecting elements matching selector.
 * Works identically to the helper in gemini-fda.js but is scoped here so the
 * fallback adapter is self-contained.
 */
function _fallbackQueryDeep(selector, root) {
  root = root || document;
  const results = [];
  const seen = new Set();

  function traverse(node) {
    if (!node) return;

    if (node.querySelectorAll) {
      try {
        const matches = node.querySelectorAll(selector);
        for (const el of matches) {
          if (!seen.has(el)) { seen.add(el); results.push(el); }
        }
      } catch (e) {}
    }

    if (node.querySelectorAll) {
      try {
        const all = node.querySelectorAll('*');
        for (const child of all) {
          if (child.shadowRoot) traverse(child.shadowRoot);
        }
      } catch (e) {}
    }

    if (node.shadowRoot) traverse(node.shadowRoot);
  }

  traverse(root);
  return results;
}

function _fallbackQueryOneDeep(selector, root) {
  const r = _fallbackQueryDeep(selector, root);
  return r.length > 0 ? r[0] : null;
}

class FallbackAdapter extends BaseAdapter {
  constructor() {
    super();
    this._diagnostics = null;
  }

  get platformName() {
    return 'Generic (Fallback)';
  }

  // Never auto-detected ¡ª only installed explicitly via forgeInitWithFallback().
  static detect() {
    return false;
  }

  static getEffectiveConversationUrl(url) {
    return url || window.location.href;
  }

  // ©¤©¤ Initialization + DOM diagnostics ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  async initialize() {
    console.log('[FORGE] ?? Initializing FallbackAdapter ¡ª scanning page for known patterns (including shadow DOM)...');
    this._diagnostics = this._scanPage();
    this._logDiagnostics(this._diagnostics);
    console.log('[FORGE] ? FallbackAdapter initialized. Call window.forgeAdapter.getFallbackDiagnostics() to inspect findings.');
  }

  _probe(label, selectors) {
    const results = selectors.map(sel => {
      try {
        // Count in both regular DOM and shadow DOM
        const regular = (document.querySelectorAll(sel) || []).length;
        const deep = _fallbackQueryDeep(sel).length;
        return { selector: sel, count: regular, countDeep: deep };
      } catch (e) {
        return { selector: sel, count: 0, countDeep: 0, error: e.message };
      }
    });
    return { label, results };
  }

  _scanPage() {
    const composerProbes = this._probe('Composer (input) candidates', [
      'div[contenteditable="true"][role="textbox"]',
      '[data-lexical-editor="true"]',
      '.ProseMirror[contenteditable="true"]',
      'div[contenteditable="true"]',
      'textarea',
      'input[type="text"]',
      '[role="textbox"]',
      'rich-textarea',
    ]);

    const sendButtonProbes = this._probe('Send button candidates', [
      'button[type="submit"]',
      'button[aria-label*="send" i]',
      'button[aria-label*="submit" i]',
      'button[data-testid*="send" i]',
      '[role="button"][aria-label*="send" i]',
    ]);

    const responseProbes = this._probe('Response container candidates', [
      '[data-message-author-role="assistant"]',
      'model-response',
      'article',
      '[class*="message"][class*="assistant" i]',
      '[class*="response" i]',
      '.prose',
      '[class*="chat-message" i]',
      '[class*="turn" i]',
    ]);

    const codeBlockProbes = this._probe('Code block candidates', [
      'pre code',
      'code',
      '[class*="code-block" i]',
      'pre',
    ]);

    const meta = {
      url: window.location.href,
      hostname: window.location.hostname,
      title: document.title,
      timestamp: new Date().toISOString(),
      hasShadowRoots: document.querySelectorAll('*') ? (() => {
        let count = 0;
        try { document.querySelectorAll('*').forEach(el => { if (el.shadowRoot) count++; }); } catch(e) {}
        return count;
      })() : 0,
    };

    return { meta, composerProbes, sendButtonProbes, responseProbes, codeBlockProbes };
  }

  _logDiagnostics(diag) {
    const lines = [
      '[FORGE FallbackAdapter] Page diagnostic scan:',
      '  URL: ' + diag.meta.url,
      '  Title: ' + diag.meta.title,
      '  Shadow roots detected: ' + diag.meta.hasShadowRoots,
    ];

    for (const group of [diag.composerProbes, diag.sendButtonProbes, diag.responseProbes, diag.codeBlockProbes]) {
      lines.push('  ' + group.label + ':');
      for (const r of group.results) {
        const found = r.countDeep > 0
          ? `? ${r.count} (${r.countDeep} incl. shadow)`
          : '? 0';
        lines.push('    ' + found + '  ¡ú  ' + r.selector);
      }
    }

    console.log(lines.join('\n'));

    if (typeof logToUI === 'function') {
      logToUI('?? FallbackAdapter: page scan complete ¡ª check console or click "?? Copy Adapter Diagnostics" in the log panel.');
    }
  }

  /**
   * Returns the structured diagnostic object captured during initialize().
   * Useful from DevTools: window.forgeAdapter.getFallbackDiagnostics()
   */
  getFallbackDiagnostics() {
    return this._diagnostics;
  }

  // ©¤©¤ Adapter contract ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  isResponseComplete() {
    return true;
  }

  isStillGenerating() {
    return false;
  }

  getAssistantMessageRoot() {
    // Use shadow-DOM-aware search for the last visible response container
    const selectors = [
      '[data-message-author-role="assistant"]',
      'model-response',
      'article',
      '[class*="message"]',
      '.prose',
    ];
    for (const sel of selectors) {
      const els = _fallbackQueryDeep(sel);
      if (els.length > 0) return els[els.length - 1];
    }
    return null;
  }

  async getLatestResponse() {
    const root = this.getAssistantMessageRoot();
    return root ? (root.innerText || root.textContent || '') : '';
  }

  async injectProtocol(protocolText) {
    console.warn('[FORGE FallbackAdapter] injectProtocol() is not supported on unknown platforms.');
    if (typeof logToUI === 'function') {
      logToUI('?? Protocol injection not supported on this platform.');
    }
    return false;
  }

  autoSend(text) {
    // Shadow-DOM-aware composer search
    const editor =
      _fallbackQueryOneDeep('div[contenteditable="true"][role="textbox"]') ||
      _fallbackQueryOneDeep('[data-lexical-editor="true"]') ||
      _fallbackQueryOneDeep('.ProseMirror[contenteditable="true"]') ||
      _fallbackQueryOneDeep('rich-textarea') ||
      _fallbackQueryOneDeep('div[contenteditable="true"]') ||
      _fallbackQueryOneDeep('textarea');

    if (!editor) {
      console.warn('[FORGE FallbackAdapter] autoSend: no composer element found (including shadow DOM).');
      return false;
    }

    editor.focus();

    if (editor.tagName === 'TEXTAREA') {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      nativeSetter.call(editor, text);
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      try {
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, text);
      } catch (e) {
        editor.textContent = text;
        editor.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
      }
    }

    // Defer send to let frameworks react
    setTimeout(() => {
      const sendBtn =
        _fallbackQueryOneDeep('button[type="submit"]') ||
        _fallbackQueryOneDeep('button[aria-label*="send" i]') ||
        _fallbackQueryOneDeep('button[aria-label*="submit" i]');

      if (sendBtn && !sendBtn.disabled) {
        sendBtn.click();
      } else {
        // Last resort: keyboard Enter on the editor
        editor.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter', bubbles: true, composed: true
        }));
      }
    }, 300);

    return true;
  }

  cleanup() {
    // Nothing to restore ¡ª FallbackAdapter installs no interceptors.
  }
}
// FORGE Code - Adapter Registry
// Platform detection and adapter factory

// Note: In the built version, all adapters are in global scope
// Adapter classes are defined by the files loaded before this registry.

const ADAPTERS = [
  ClaudeHHSAdapter,
  ChatGPTAdapter,
  ElsaAdapter,
  GeminiFDAAdapter,
];

function detectPlatform() {
  for (const AdapterClass of ADAPTERS) {
    try {
      if (AdapterClass.detect()) {
        return AdapterClass;
      }
    } catch (err) {
      console.error(`[FORGE] Error detecting ${AdapterClass.name}:`, err);
    }
  }
  return null;
}

function getEffectiveConversationUrl(
  url = window.location.href
) {
  try {
    if (
      window.forgeAdapter &&
      typeof window.forgeAdapter
        .getEffectiveConversationUrl === 'function'
    ) {
      return window.forgeAdapter
        .getEffectiveConversationUrl(url);
    }

    const AdapterClass =
      detectPlatform();

    if (
      AdapterClass &&
      typeof AdapterClass
        .getEffectiveConversationUrl === 'function'
    ) {
      return AdapterClass
        .getEffectiveConversationUrl(url);
    }
  } catch (error) {
    console.warn(
      '[FORGE] Could not determine effective conversation URL:',
      error
    );
  }

  return url || window.location.href;
}

// Expose the adapter-owned conversation URL helper to storage,
// initialization code, and isolated execute contexts.
window.getEffectiveConversationUrl =
  getEffectiveConversationUrl;

async function createAdapter() {
  const AdapterClass = detectPlatform();

  if (!AdapterClass) {
    console.warn('[FORGE] No matching adapter for this platform ¡ª using FallbackAdapter.');
    const adapter = new FallbackAdapter();
    await adapter.initialize();
    return adapter;
  }

  const adapter = new AdapterClass();
  await adapter.initialize();
  return adapter;
}
// FORGE CODE - Temperature Control (State Only)
// Manages temperature state flags.
// The actual fetch modification lives in ElsaAdapter's unified interceptor.
// This file no longer monkey-patches window.fetch.

function enableTempControl() {
  const state = ForgeState.getState();
  if (state.tempEnabled) return;

  ForgeActions.setTemperature(state.currentTemp, true);
}

function disableTempControl() {
  const state = ForgeState.getState();
  ForgeActions.setTemperature(state.currentTemp, false);
}

/**
 * Compatibility helper retained for older callers.
 * Temperature rendering is owned by renderForge().
 */
function updateTempStatus() {
  const state = ForgeState.getState();

  ForgeActions.setTemperature(
    state.currentTemp,
    state.tempEnabled
  );
}
// Path and content validation for file operations
// Prevents corrupted VFS entries from invalid inputs

function validateFilePath(path) {
  if (typeof path !== 'string') {
    return { valid: false, error: 'Path must be a string' };
  }
  
  if (!path.startsWith('/')) {
    return { valid: false, error: 'Path must start with /' };
  }
  
  if (path.length > 500) {
    return { valid: false, error: 'Path is too long (max 500 characters)' };
  }
  
  if (path.includes('\n') || path.includes('\r')) {
    return { valid: false, error: 'Path cannot contain newlines' };
  }
  
  if (path.includes('//')) {
    return { valid: false, error: 'Path cannot contain double slashes' };
  }
  
  if (path.endsWith('/')) {
    return { valid: false, error: 'Path cannot end with /' };
  }
  
  return { valid: true };
}

function validateOperationId(operationId) {
  if (typeof operationId !== 'string') {
    return { valid: false, error: 'Operation ID must be a string' };
  }
  
  if (!/^#\d+$/.test(operationId)) {
    return { valid: false, error: 'Operation ID must match format #N (e.g., #1, #42)' };
  }
  
  return { valid: true };
}

function validateFileContent(content) {
  if (typeof content !== 'string') {
    return { valid: false, error: 'Content must be a string' };
  }
  
  if (content.length === 0) {
    return { valid: false, error: 'Content cannot be empty' };
  }
  
  if (content.startsWith('/') && content.split('\n').length === 1 && content.length < 200) {
    return { valid: false, error: 'Content looks like a file path, not actual file content' };
  }
  
  return { valid: true };
}

function validatePatchContent(findBlock, replaceBlock) {
  if (typeof findBlock !== 'string' || typeof replaceBlock !== 'string') {
    return { valid: false, error: 'FIND and REPLACE blocks must be strings' };
  }
  
  if (findBlock.length === 0) {
    return { valid: false, error: 'FIND block cannot be empty' };
  }
  
  if (findBlock.length > 5000) {
    return { valid: false, error: 'FIND block is too large (max 5000 characters)' };
  }
  
  if (replaceBlock.length > 5000) {
    return { valid: false, error: 'REPLACE block is too large (max 5000 characters)' };
  }
  
  return { valid: true };
}

// Make functions available globally in browser
if (typeof window !== 'undefined') {
  window.validateFilePath = validateFilePath;
  window.validateOperationId = validateOperationId;
  window.validateFileContent = validateFileContent;
  window.validatePatchContent = validatePatchContent;
}

// Export functions for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateFilePath,
    validateOperationId,
    validateFileContent,
    validatePatchContent
  };
}
// FORGE Code - Validator Registry
// Manages registration and orchestration of file validators.
// Validators can be sync or async; both are handled transparently.

class ValidatorRegistry {
  constructor() {
    this._validators = new Map();
  }

  register(ext, validator) {
    if (typeof validator !== 'function') {
      throw new Error('Validator must be a function');
    }
    this._validators.set(ext.toLowerCase(), validator);
  }

  getValidator(ext) {
    return this._validators.get(ext.toLowerCase()) || null;
  }

  hasValidator(ext) {
    return this._validators.has(ext.toLowerCase());
  }

  getRegisteredExtensions() {
    return [...this._validators.keys()];
  }
}

/**
 * Extract the file extension from a path.
 * e.g. '/src/app.js' -> 'js'
 */
function getFileExtension(path) {
  if (!path || typeof path !== 'string') return '';
  // Get just the filename (after last slash)
  const filename = path.split('/').pop();
  if (!filename) return '';
  const dotIdx = filename.lastIndexOf('.');
  // No dot, or dot is first character (dotfile like .gitignore)
  if (dotIdx <= 0) return '';
  return filename.slice(dotIdx + 1).toLowerCase();
}

/**
 * Main async validation orchestrator.
 * Validates all files in repo that match optional gitignore-like patterns.
 *
 * @param {object} repo - The FORGE repo object
 * @param {string|string[]} [patterns] - Optional glob patterns to filter files
 * @returns {Promise<{success, summary, results}>}
 */
async function validateRepo(repo, patterns) {
  const registry = repo._validatorRegistry;
  if (!registry) {
    return {
      success: true,
      summary: { total: 0, passed: 0, failed: 0, warnings: 0, skipped: 0 },
      results: []
    };
  }

  // Normalize patterns
  let patternList = null;
  if (patterns) {
    patternList = Array.isArray(patterns) ? patterns : [patterns];
  }

  const files = repo.listFiles();
  const results = [];
  let passed = 0, failed = 0, warnings = 0, skipped = 0;

  for (const path of files) {
    // Skip excluded/binary files
    const meta = repo.getMeta ? repo.getMeta(path) : {};
    if (meta.excluded || meta.encoding === 'base64') {
      skipped++;
      continue;
    }

    // Apply pattern filter if provided
    if (patternList) {
      const matches = typeof matchesAnyPattern === 'function'
        ? matchesAnyPattern(path, patternList)
        : patternList.some(p => path.endsWith(p.replace(/^\*/, '')));
      if (!matches) {
        skipped++;
        continue;
      }
    }

    const ext = getFileExtension(path);
    if (!registry.hasValidator(ext)) {
      skipped++;
      continue;
    }

    const validator = registry.getValidator(ext);
    const content = repo.getContent(path).text();

    let result;
    try {
      const raw = validator(path, content);
      // Handle both sync and async validators
      result = (raw && typeof raw.then === 'function') ? await raw : raw;
    } catch (err) {
      result = {
        valid: false,
        errors: [{ message: 'Validator threw: ' + (err.message || String(err)), type: 'exception' }],
        warnings: []
      };
    }

    const entry = {
      path,
      ext,
      valid: result.valid,
      errors: result.errors || [],
      warnings: result.warnings || []
    };

    results.push(entry);

    if (result.valid) {
      passed++;
    } else {
      failed++;
    }
    if ((result.warnings || []).length > 0) {
      warnings++;
    }
  }

  return {
    success: failed === 0,
    summary: {
      total: results.length,
      passed,
      failed,
      warnings,
      skipped
    },
    results
  };
}

// Export for browser
if (typeof window !== 'undefined') {
  window.ValidatorRegistry = ValidatorRegistry;
  window.getFileExtension = getFileExtension;
  window.validateRepo = validateRepo;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ValidatorRegistry, getFileExtension, validateRepo };
}
// FORGE CODE - Patching Logic
// Handles patch parsing and fuzzy matching

function parsePatchBlocks(patchContent) {
  const patches = [];
  const lines = patchContent.split('\n');
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    if (line === '<<<FIND_BLOCK_START') {
      const findStartLines = [];
      i++;
      while (i < lines.length && lines[i].trim() !== '>>>') {
        findStartLines.push(lines[i]);
        i++;
      }
      i++; // skip >>>
      
      while (i < lines.length && lines[i].trim() === '') i++;
      
      if (i < lines.length && lines[i].trim() === '<<<FIND_BLOCK_END') {
        const findEndLines = [];
        i++;
        while (i < lines.length && lines[i].trim() !== '>>>') {
          findEndLines.push(lines[i]);
          i++;
        }
        i++; // skip >>>
        
        while (i < lines.length && lines[i].trim() === '') i++;
        
        if (i < lines.length && lines[i].trim() === '<<<REPLACE') {
          const replaceLines = [];
          i++;
          while (i < lines.length && lines[i].trim() !== '>>>') {
            replaceLines.push(lines[i]);
            i++;
          }
          i++; // skip >>>
          
          patches.push({
            type: 'range',
            findStart: findStartLines.join('\n'),
            findEnd: findEndLines.join('\n'),
            replace: replaceLines.join('\n')
          });
        }
      }
    } else if (line === '<<<FIND') {
      const findLines = [];
      i++;
      
      while (i < lines.length && lines[i].trim() !== '>>>') {
        findLines.push(lines[i]);
        i++;
      }
      
      if (i >= lines.length) {
        console.error('Unclosed FIND block');
        break;
      }
      
      i++;
      
      while (i < lines.length && lines[i].trim() === '') {
        i++;
      }
      
      if (i >= lines.length || lines[i].trim() !== '<<<REPLACE') {
        console.error('FIND block without matching REPLACE block');
        break;
      }
      
      i++;
      
      const replaceLines = [];
      while (i < lines.length && lines[i].trim() !== '>>>') {
        replaceLines.push(lines[i]);
        i++;
      }
      
      if (i >= lines.length) {
        console.error('Unclosed REPLACE block');
        break;
      }
      
      i++;
      
      patches.push({
        find: findLines.join('\n'),
        replace: replaceLines.join('\n')
      });
    } else {
      i++;
    }
  }
  
  return patches;
}

function normalizeLine(line) {
  return line.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
}

function applyFuzzyPatch(fileContent, findBlock, replaceBlock) {
  const sourceLines = fileContent.split('\n');
  const findLines = findBlock.split('\n');
  
  const lineMap = new Map();
  sourceLines.forEach((line, i) => {
    const normalized = normalizeLine(line);
    if (!lineMap.has(normalized)) {
      lineMap.set(normalized, []);
    }
    lineMap.get(normalized).push(i);
  });
  
  const normalizedFindLines = findLines.map(l => normalizeLine(l));
  
  const anchors = normalizedFindLines
    .map((normLine, findIdx) => ({
      findIdx,
      sourceIndices: lineMap.get(normLine) || [],
      isUnique: (lineMap.get(normLine) || []).length === 1
    }))
    .filter(a => a.sourceIndices.length > 0);
  
  if (anchors.length === 0) {
    return { 
      success: false, 
      reason: 'No matching lines found between FIND block and file content'
    };
  }
  
  let bestMatch = null;
  let bestScore = 0;
  
  const uniqueAnchors = anchors.filter(a => a.isUnique);
  const searchAnchors = uniqueAnchors.length > 0 ? uniqueAnchors : anchors;
  
  for (const anchor of searchAnchors) {
    for (const sourceIdx of anchor.sourceIndices) {
      const startLine = sourceIdx - anchor.findIdx;
      const endLine = startLine + findLines.length - 1;
      
      if (startLine < 0 || endLine >= sourceLines.length) {
        continue;
      }
      
      let exactMatches = 0;
      let normalizedMatches = 0;
      
      for (let i = 0; i < findLines.length; i++) {
        const sourceLine = sourceLines[startLine + i];
        const findLine = findLines[i];
        
        if (sourceLine === findLine) {
          exactMatches++;
          normalizedMatches++;
        } else if (normalizeLine(sourceLine) === normalizeLine(findLine)) {
          normalizedMatches++;
        }
      }
      
      const normalizedScore = normalizedMatches / findLines.length;
      
      if (normalizedScore > bestScore) {
        bestScore = normalizedScore;
        bestMatch = {
          startLine,
          endLine,
          exactMatches,
          normalizedMatches,
          totalLines: findLines.length
        };
      }
    }
  }
  
  if (!bestMatch) {
    return {
      success: false,
      reason: 'Could not find a valid match position'
    };
  }
  
  const confidence = Math.round(bestScore * 100);
  
  if (confidence < 70) {
    return {
      success: false,
      reason: `Best match only ${confidence}% confident (threshold: 70%)`,
      bestMatch,
      confidence
    };
  }
  
  const beforeLines = sourceLines.slice(0, bestMatch.startLine);
  const afterLines = sourceLines.slice(bestMatch.endLine + 1);
  const replaceLines = replaceBlock.split('\n');
  
  const newContent = [
    ...beforeLines,
    ...replaceLines,
    ...afterLines
  ].join('\n');
  
  return {
    success: true,
    content: newContent,
    confidence,
    stats: {
      exactMatches: bestMatch.exactMatches,
      normalizedMatches: bestMatch.normalizedMatches,
      totalLines: bestMatch.totalLines,
      startLine: bestMatch.startLine,
      endLine: bestMatch.endLine
    }
  };
}

function applyRangePatch(fileContent, findStartBlock, findEndBlock, replaceBlock) {
  // Find the start block
  let startMatch = applyFuzzyPatch(fileContent, findStartBlock, '');
  if (!startMatch.success) {
    return { success: false, reason: 'Could not locate FIND_BLOCK_START: ' + startMatch.reason };
  }

  // Find the end block, but only search AFTER the start block's beginning
  const sourceLines = fileContent.split('\n');
  const remainingContent = sourceLines.slice(startMatch.stats.startLine).join('\n');
  
  let endMatch = applyFuzzyPatch(remainingContent, findEndBlock, '');
  if (!endMatch.success) {
    return { success: false, reason: 'Could not locate FIND_BLOCK_END: ' + endMatch.reason };
  }

  // Adjust endMatch coordinates to be relative to the original file
  const absoluteEndLine = startMatch.stats.startLine + endMatch.stats.endLine;

  const beforeLines = sourceLines.slice(0, startMatch.stats.startLine);
  const afterLines = sourceLines.slice(absoluteEndLine + 1);
  const replaceLines = replaceBlock.split('\n');

  const newContent = [
    ...beforeLines,
    ...replaceLines,
    ...afterLines
  ].join('\n');

  const avgConfidence = Math.round((startMatch.confidence + endMatch.confidence) / 2);

  return {
    success: true,
    content: newContent,
    confidence: avgConfidence,
    stats: {
      startLine: startMatch.stats.startLine,
      endLine: absoluteEndLine
    }
  };
}
// FORGE CODE - Execute Handler
// Handles #execute operations and manages sendBack queue
//
// Execution chain (simplified):
//   1. Nonce iframe  ¡ª works on all target platforms (Elsa, Claude, ChatGPT)
//                      fetch/XHR patched to enforce origin whitelist
//                      one-time consent modal shown before first use per session
//   2. Manual exec  ¡ª if no nonce available; copies script to DevTools clipboard

// ©¤©¤ Session state ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

// Set to true once the user has approved execute for this session
window._forgeExecuteConsented = window._forgeExecuteConsented || false;

// Set to true if the user declined ¡ª subsequent executes go to manual buffer
window._forgeExecuteDeclined = window._forgeExecuteDeclined || false;



// ©¤©¤ Manual exec buffer ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

window._forgeManualExecBuffer = window._forgeManualExecBuffer || [];
let _forgeManualFlushScheduled = false;

function _forgeBufferManualExec(operationId, scriptContent) {
  window._forgeManualExecBuffer.push({ id: operationId, script: scriptContent });

  if (_forgeManualFlushScheduled) return;
  _forgeManualFlushScheduled = true;
  setTimeout(_forgeFlushManualExec, 0);
}

function _forgeFlushManualExec() {
  _forgeManualFlushScheduled = false;
  const buffer = window._forgeManualExecBuffer;
  if (!buffer || buffer.length === 0) return;

  let body = '';
  buffer.forEach(item => {
    body += '\n  /* ==== execute #' + item.id + ' ==== */\n';
    body += '  try {\n' + item.script + '\n  } catch(e){ console.error("[FORGE manual] #' + item.id + '", e); }\n';
  });

  const combined =
    '(async function(){\n' +
    '  if (typeof repo === "undefined") { console.error("[FORGE] repo not found on window"); return; }\n' +
    body +
    '\n  if (typeof updateSendBackDisplay === "function") updateSendBackDisplay();\n' +
    '  console.log("[FORGE] Manual run complete. Click \\"Send Results\\" to return output.");\n' +
    '})();';

  window._forgeManualExecBuffer = [];

  if (typeof repo !== 'undefined' && repo.sendBack) {
    repo.sendBack({
      type: 'manual-execute',
      message: 'No CSP nonce is available on this platform. Copy the script below, paste it into your browser DevTools console, and run it.',
      script: combined
    });
    if (typeof updateSendBackDisplay === 'function') updateSendBackDisplay();
  }
}

// ©¤©¤ Fetch origin whitelist ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

/**
 * Default allowed origin patterns for fetch inside #execute scripts.
 * Stored in localStorage as 'forge-execute-allowed-origins' (newline-separated).
 * Defaults: localhost (any port) and any .gov domain.
 */
const FORGE_EXECUTE_DEFAULT_ORIGINS = [
  'localhost',
  '*.gov'
];

function _getExecuteAllowedOrigins() {
  try {
    const stored = localStorage.getItem('forge-execute-allowed-origins');
    if (stored && stored.trim()) {
      return stored.split('\n').map(s => s.trim()).filter(Boolean);
    }
  } catch(e) {}
  return FORGE_EXECUTE_DEFAULT_ORIGINS;
}

/**
 * Check whether a URL string matches an allowed origin pattern.
 * Patterns:
 *   'localhost'         ¡ª matches http://localhost and http://localhost:*
 *   '*.gov'            ¡ª matches any *.gov hostname
 *   'https://foo.com'  ¡ª exact origin match
 *   '*'                ¡ª allow all (escape hatch)
 */
function _isOriginAllowed(urlStr, patterns) {
  let hostname, origin;
  try {
    const parsed = new URL(urlStr);
    hostname = parsed.hostname;
    origin   = parsed.origin;
  } catch(e) {
    return false; // unparseable URL ¡ª block it
  }

  for (const pattern of patterns) {
    if (pattern === '*') return true;
    if (pattern === 'localhost' && hostname === 'localhost') return true;
    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(2); // e.g. 'gov'
      if (hostname === suffix || hostname.endsWith('.' + suffix)) return true;
    }
    // Exact origin match
    try {
      if (new URL(pattern).origin === origin) return true;
    } catch(e) {}
    // Plain hostname match
    if (pattern === hostname) return true;
  }
  return false;
}

/**
 * Build a guarded fetch function to inject as a variable into the user script.
 * Returns a JS expression string (an IIFE) that evaluates to a fetch function.
 * Requests to allowed origins pass through to parent.fetch; others are rejected.
 */
function _buildGuardedFetchExpr(allowedOrigins) {
  const originsJson = JSON.stringify(allowedOrigins);
  return `(function() {
  var _allowedOrigins = ${originsJson};

  function _isAllowed(urlStr) {
    var hostname, origin;
    try {
      var parsed = new URL(urlStr, 'https://localhost/');
      hostname = parsed.hostname;
      origin = parsed.origin;
    } catch(e) { return false; }
    for (var i = 0; i < _allowedOrigins.length; i++) {
      var p = _allowedOrigins[i];
      if (p === '*') return true;
      if (p === 'localhost' && hostname === 'localhost') return true;
      if (p.startsWith('*.')) {
        var suffix = p.slice(2);
        if (hostname === suffix || hostname.endsWith('.' + suffix)) return true;
      }
      try { if (new URL(p).origin === origin) return true; } catch(e) {}
      if (p === hostname) return true;
    }
    return false;
  }

  var _realFetch = parent.fetch ? parent.fetch.bind(parent) : null;

  return function guardedFetch(input, opts) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    if (!_isAllowed(url)) {
      parent.console.error('[FORGE] fetch blocked by origin whitelist:', url);
      return Promise.reject(new Error(
        '[FORGE] fetch blocked: "' + url + '" is not in the allowed origins list. ' +
        'Add it in \u2699\ufe0f Settings \u2192 Advanced \u2192 Allowed Fetch Origins.'
      ));
    }
    return _realFetch ? _realFetch(input, opts) : Promise.reject(new Error('fetch unavailable'));
  };
})()`;
}

// ©¤©¤ Consent modal ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

/**
 * Scan script for patterns that might be worth flagging to the user.
 * Not a security guarantee ¡ª just a best-effort heads-up.
 * Returns an array of plain-English warning strings, empty if nothing found.
 */
function _scanScriptForWarnings(scriptContent) {
  const warnings = [];
  const s = scriptContent;

  // Fetch / XHR to URLs that look external (not localhost / relative)
  if (/fetch\s*\(\s*['"`]https?:\/\/(?!localhost)/i.test(s) ||
      /XMLHttpRequest|\.open\s*\(\s*['"`](GET|POST)/i.test(s)) {
    warnings.push('Makes network requests to external URLs');
  }

  // Cookie access
  if (/document\.cookie/i.test(s)) {
    warnings.push('Reads or writes browser cookies');
  }

  // localStorage beyond normal repo use
  if (/localStorage\s*\.\s*(?:getItem|setItem|removeItem|clear)/i.test(s)) {
    warnings.push('Accesses browser local storage');
  }

  // postMessage to external targets
  if (/postMessage\s*\(/i.test(s) && !/parent\.postMessage/i.test(s)) {
    warnings.push('Sends messages to other windows or frames');
  }

  // eval / Function constructor
  if (/\beval\s*\(|\bnew\s+Function\s*\(/i.test(s)) {
    warnings.push('Dynamically evaluates code');
  }

  return warnings;
}

/**
 * Show a one-time consent modal explaining what #execute can do.
 * Clear, jargon-free language with an expandable details section.
 * Resolves to true (approved) or false (declined).
 */
function _showExecuteConsentModal(scriptContent) {
  return new Promise(function(resolve) {
    const existing = document.getElementById('forge-execute-consent-modal');
    if (existing) existing.remove();

    const allowedOrigins = _getExecuteAllowedOrigins();
    const warnings = _scanScriptForWarnings(scriptContent || '');

    // ©¤©¤ Overlay ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
    const overlay = document.createElement('div');
    overlay.id = 'forge-execute-consent-modal';
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:2147483647',
      'background:rgba(0,0,0,0.75)',
      'display:flex', 'align-items:center', 'justify-content:center',
      'font-family:Segoe UI,sans-serif'
    ].join(';');

    // ©¤©¤ Dialog ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
    const dialog = document.createElement('div');
    dialog.style.cssText = [
      'background:#252526',
      'border:2px solid ' + (warnings.length ? '#e67e22' : '#667eea'),
      'border-radius:10px', 'padding:24px 26px',
      'width:460px', 'max-width:92vw', 'max-height:88vh',
      'overflow-y:auto',
      'box-shadow:0 8px 32px rgba(0,0,0,0.5)',
      'color:#d4d4d4'
    ].join(';');

    // ©¤©¤ Title ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
    const title = document.createElement('div');
    title.style.cssText = 'font-size:15px;font-weight:700;margin-bottom:14px;color:' +
      (warnings.length ? '#e67e22' : '#9b89e8') + ';';
    title.textContent = warnings.length
      ? '?? The AI wants to run a script'
      : '?? The AI wants to run a script';

    // ©¤©¤ Main message ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
    const main = document.createElement('div');
    main.style.cssText = 'font-size:14px;line-height:1.6;color:#c8c8c8;margin-bottom:14px;';
    const mainText = document.createElement('p');
    mainText.style.cssText = 'margin:0 0 8px 0;';
    mainText.textContent = 'This is typically to look at your code in detail. ' +
      'It will run in a protected environment that blocks connections to outside websites.';
    main.appendChild(mainText);

    // ©¤©¤ Warnings (if any) ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
    if (warnings.length) {
      const warnBox = document.createElement('div');
      warnBox.style.cssText = [
        'background:#2a1e0a', 'border:1px solid #e67e22',
        'border-radius:6px', 'padding:10px 12px', 'margin-top:6px'
      ].join(';');

      const warnTitle = document.createElement('div');
      warnTitle.style.cssText = 'font-size:12px;font-weight:700;color:#e67e22;margin-bottom:6px;';
      warnTitle.textContent = '?? This script may do the following:';
      warnBox.appendChild(warnTitle);

      warnings.forEach(function(w) {
        const item = document.createElement('div');
        item.style.cssText = 'font-size:12px;color:#d4a96a;padding:2px 0;';
        item.textContent = '? ' + w;
        warnBox.appendChild(item);
      });

      main.appendChild(warnBox);
    }

    // ©¤©¤ Show more toggle ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
    const detailsWrap = document.createElement('div');
    detailsWrap.style.cssText = 'margin-top:12px;';

    const toggleBtn = document.createElement('button');
    toggleBtn.style.cssText = [
      'background:none', 'border:none', 'padding:0',
      'color:#667eea', 'font-size:12px', 'cursor:pointer',
      'text-decoration:underline', 'font-family:Segoe UI,sans-serif'
    ].join(';');
    toggleBtn.textContent = '? Show more info';

    const detailsBody = document.createElement('div');
    detailsBody.style.cssText = [
      'display:none', 'margin-top:10px',
      'background:#1e1e1e', 'border:1px solid #3e3e42',
      'border-radius:6px', 'padding:12px', 'font-size:11px'
    ].join(';');

    // Allowed origins section
    const originsLabel = document.createElement('div');
    originsLabel.style.cssText = 'color:#858585;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;font-size:10px;';
    originsLabel.textContent = 'Allowed external connections';
    detailsBody.appendChild(originsLabel);

    allowedOrigins.forEach(function(o) {
      const row = document.createElement('div');
      row.style.cssText = 'color:#4fc3f7;font-family:Consolas,monospace;padding:1px 0;';
      row.textContent = o;
      detailsBody.appendChild(row);
    });

    const originsHint = document.createElement('div');
    originsHint.style.cssText = 'color:#555;margin-top:4px;margin-bottom:12px;';
    originsHint.textContent = 'Change these in ?? Settings ¡ú Advanced ¡ú Allowed Fetch Origins';
    detailsBody.appendChild(originsHint);

    // Script preview
    const scriptLabel = document.createElement('div');
    scriptLabel.style.cssText = 'color:#858585;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;font-size:10px;';
    scriptLabel.textContent = 'Script to be run';
    detailsBody.appendChild(scriptLabel);

    const scriptPre = document.createElement('pre');
    scriptPre.style.cssText = [
      'margin:0', 'padding:8px', 'background:#141414',
      'border-radius:4px', 'color:#a0a0a0',
      'font-size:10px', 'font-family:Consolas,monospace',
      'max-height:160px', 'overflow-y:auto',
      'white-space:pre-wrap', 'word-break:break-word'
    ].join(';');
    scriptPre.textContent = (scriptContent || '').trim();
    detailsBody.appendChild(scriptPre);

    let detailsOpen = false;
    toggleBtn.addEventListener('click', function() {
      detailsOpen = !detailsOpen;
      detailsBody.style.display = detailsOpen ? 'block' : 'none';
      toggleBtn.textContent = detailsOpen ? '¨‹ Hide details' : '? Show more info';
    });

    detailsWrap.appendChild(toggleBtn);
    detailsWrap.appendChild(detailsBody);

    // ©¤©¤ Session note ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
    const sessionNote = document.createElement('div');
    sessionNote.style.cssText = 'font-size:11px;color:#666;margin-top:14px;margin-bottom:18px;line-height:1.5;';
    sessionNote.textContent = 'If you allow this, all AI scripts will run automatically for the rest of this browser session without asking again.';

    // ©¤©¤ Buttons ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
    const btns = document.createElement('div');
    btns.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Don\'t allow';
    cancelBtn.style.cssText = [
      'background:#3e3e42', 'border:none', 'color:#d4d4d4',
      'padding:9px 18px', 'border-radius:5px', 'cursor:pointer',
      'font-size:13px', 'font-weight:600', 'font-family:Segoe UI,sans-serif'
    ].join(';');

    const approveBtn = document.createElement('button');
    approveBtn.textContent = 'Allow for this session';
    approveBtn.style.cssText = [
      'background:#5a4fcf', 'border:none', 'color:#fff',
      'padding:9px 18px', 'border-radius:5px', 'cursor:pointer',
      'font-size:13px', 'font-weight:600', 'font-family:Segoe UI,sans-serif'
    ].join(';');

    btns.appendChild(cancelBtn);
    btns.appendChild(approveBtn);

    // ©¤©¤ Assemble ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
    dialog.appendChild(title);
    dialog.appendChild(main);
    dialog.appendChild(detailsWrap);
    dialog.appendChild(sessionNote);
    dialog.appendChild(btns);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const close = function(result) {
      overlay.remove();
      resolve(result);
    };

    approveBtn.addEventListener('click', function() { close(true); });
    cancelBtn.addEventListener('click', function() { close(false); });
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) close(false);
    });
  });
}

// ©¤©¤ Nonce iframe execution ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

/**
 * Execute script in a nonce-bearing same-origin iframe.
 * Fetch and XHR are patched to enforce the allowed origins whitelist.
 * Returns a Promise resolving to { success, cspBlocked?, error? } or false.
 */
function _forgeNonceIframeExec(scriptContent, operationId) {
  const nonceScript = document.querySelector('script[nonce]');
  const nonce = nonceScript
    ? nonceScript.nonce || nonceScript.getAttribute('nonce') || ''
    : '';

  // No nonce is fine ¡ª only needed on pages with strict CSP.
  // We still use the iframe for consistent fetch guardrails and scoping.
  if (!nonce) {
    console.log('[FORGE] No CSP nonce found ¡ª iframe will run without one (page has no strict CSP).');
  }

  const allowedOrigins = _getExecuteAllowedOrigins();

  const safeId      = String(operationId).replace(/[^0-9a-z]/gi, '');
  const suffix      = Date.now() + '-' + Math.random().toString(36).slice(2);
  const frameId     = 'forge-exec-frame-' + safeId + '-' + suffix;
  const sentinelKey = '__forgeExecRan_'      + safeId + '_' + suffix;
  const doneKey     = '__forgeExecDone_'     + safeId + '_' + suffix;

  const iframe = document.createElement('iframe');
  iframe.id = frameId;
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.display = 'none';
  iframe.src = 'about:blank';

  window[sentinelKey] = false;

  let resolveDone;
  const donePromise = new Promise(function(resolve) { resolveDone = resolve; });
  window[doneKey] = function(result) { resolveDone(result); };

  const cleanup = function() {
    delete window[sentinelKey];
    delete window[doneKey];
    const f = document.getElementById(frameId);
    if (f) f.remove();
  };

  try {
    const container = document.body || document.documentElement;
    if (!container) throw new Error('No document container available');

    container.appendChild(iframe);

    const fdoc = iframe.contentDocument;
    if (!fdoc) throw new Error('Could not access iframe document');

    // Single script: explicit globals + guarded fetch + user script.
    // No 'with (parent)' ¡ª fetch resolves to our guarded version, not parent's.
    const userEl = fdoc.createElement('script');
    const sentinelLiteral = JSON.stringify(sentinelKey);
    const doneLiteral     = JSON.stringify(doneKey);
    const opLiteral       = JSON.stringify(String(operationId));
    const frameIdLiteral  = JSON.stringify(frameId);
    const guardedFetchExpr = _buildGuardedFetchExpr(allowedOrigins);

    if (nonce) userEl.setAttribute('nonce', nonce);
    userEl.textContent =
      'parent.window[' + sentinelLiteral + '] = true;\n' +
      '(async function() {\n' +
      // Explicit bindings ¡ª user script resolves these as local vars,
      // not globals on the parent window.
      '  var repo             = parent.repo;\n' +
      '  var localStorage     = parent.localStorage;\n' +
      '  var console          = parent.console;\n' +
      '  var fetch            = ' + guardedFetchExpr + ';\n' +
      '  var XMLHttpRequest   = parent.XMLHttpRequest;\n' +
      '  var document         = parent.document;\n' +
      '  var window           = parent.window;\n' +
      '  var setTimeout       = parent.setTimeout.bind(parent);\n' +
      '  var clearTimeout     = parent.clearTimeout.bind(parent);\n' +
      '  var setInterval      = parent.setInterval.bind(parent);\n' +
      '  var clearInterval    = parent.clearInterval.bind(parent);\n' +
      '  var URL              = parent.URL;\n' +
      '  var Promise          = parent.Promise;\n' +
      '  var JSON             = parent.JSON;\n' +
      '  var Math             = parent.Math;\n' +
      '  var openInForgeIDE   = parent.openInForgeIDE;\n' +
      '  var logToUI          = parent.logToUI;\n' +
      '  var showToast        = parent.showToast;\n' +
      '  var ForgeState       = parent.ForgeState;\n' +
      '  var ForgeActions     = parent.ForgeActions;\n' +
      '  try {\n' +
           scriptContent + '\n' +
      '    const done = parent.window[' + doneLiteral + '];\n' +
      '    if (typeof done === "function") done({ success: true });\n' +
      '  } catch(err) {\n' +
      '    parent.console.error("[FORGE] #execute error:", err);\n' +
      '    if (parent.repo && parent.repo.sendBack) {\n' +
      '      parent.repo.sendBack({\n' +
      '        type: "error", operationId: ' + opLiteral + ',\n' +
      '        operation: "execute", stage: "execution",\n' +
      '        message: err.message || String(err),\n' +
      '        stack: err.stack || ""\n' +
      '      });\n' +
      '    }\n' +
      '    const done = parent.window[' + doneLiteral + '];\n' +
      '    if (typeof done === "function") done({ success: false, error: err.message || String(err) });\n' +
      '  } finally {\n' +
      '    if (typeof parent.updateSendBackDisplay === "function") parent.updateSendBackDisplay();\n' +
      '    parent.setTimeout(function() {\n' +
      '      const f = parent.document.getElementById(' + frameIdLiteral + ');\n' +
      '      if (f) f.remove();\n' +
      '    }, 0);\n' +
      '  }\n' +
      '})();';

    (fdoc.head || fdoc.documentElement).appendChild(userEl);

    if (window[sentinelKey] !== true) {
      // The script block failed to parse before the sentinel ran.
      // Distinguish syntax errors in the user's script from CSP/nonce problems.
      cleanup();
      try {
        // new Function() parses without executing ¡ª reveals syntax errors.
        // On strict CSP pages (e.g. Claude HHS), this throws a CSP error instead.
        new Function(scriptContent);
        // Parsed fine ¡ª must be a nonce/CSP issue
        console.warn('[FORGE] Nonce iframe exec failed: script did not start (possible nonce issue)');
        return false;
      } catch(e) {
        const msg = e.message || String(e);
        const isCSPBlock = /Content Security Policy|unsafe-eval|EvalError/i.test(msg);
        if (isCSPBlock) {
          // new Function() itself was blocked by CSP ¡ª can't determine if it's a
          // syntax error or a nonce issue. Fall through to manual exec buffer.
          console.warn('[FORGE] Nonce iframe exec failed: could not determine cause (CSP blocks eval)');
          return false;
        }
        // It's a genuine syntax error in the script content
        console.warn('[FORGE] Nonce iframe exec failed: syntax error in script:', msg);
        return { success: false, error: msg };
      }
    }

    console.log('[FORGE] Running #' + operationId + ' in nonce iframe (fetch restricted to: ' + allowedOrigins.join(', ') + ')');

    return donePromise.finally(cleanup);

  } catch(err) {
    cleanup();
    console.warn('[FORGE] Nonce iframe exec failed:', err);
    return false;
  }
}

// ©¤©¤ Main entry point ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

/**
 * Execute a #execute script.
 *
 * Chain:
 *   1. Nonce iframe with fetch guardrails (one-time consent modal on first use)
 *   2. Manual exec buffer (no nonce available)
 */
async function executeScript(scriptContent, operationId) {
  try {
      // If user already declined this session, go straight to manual
      if (window._forgeExecuteDeclined) {
        console.log('[FORGE] Execute declined for this session ¡ª queuing for manual execution');
        _forgeBufferManualExec(operationId, scriptContent);
        return { success: false, cancelled: true, manualRun: true };
      }

      // Show consent modal on first execute of the session
      if (!window._forgeExecuteConsented) {
        const approved = await _showExecuteConsentModal(scriptContent);
        if (!approved) {
          window._forgeExecuteDeclined = true;
          repo.sendBack({
            type: 'info',
            operationId,
            operation: 'execute',
            message: 'Script execution was declined. All #execute scripts this session will be sent to the manual exec buffer instead. Reload the page to re-enable.'
          });
          return { success: false, cancelled: true };
        }
        window._forgeExecuteConsented = true;
      }

      const result = await _forgeNonceIframeExec(scriptContent, operationId);

      if (result !== false) {
        if (result.success) {
          console.log('[FORGE] ? Script #' + operationId + ' executed successfully');
          const queue = repo.getSendBackQueue();
          console.log('[FORGE] sendBack queue now has ' + queue.length + ' entries');
        }
        return result;
      }

      // Iframe construction failed entirely ¡ª try IDE bridge before manual exec
    console.log('[FORGE] Iframe exec failed for #' + operationId + ' ¡ª trying IDE bridge...');

    if (typeof forgeIdeBridge !== 'undefined') {
      try {
        const bridgeResult = await forgeIdeBridge.execScript(scriptContent, operationId);
        if (bridgeResult.success) {
          // Merge the collected sendBack entries into the local queue
          if (bridgeResult.queue && bridgeResult.queue.length > 0) {
            bridgeResult.queue.forEach(entry => {
              if (typeof repo !== 'undefined' && repo.sendBack) {
                repo.sendBack(entry);
              }
            });
          }
          console.log('[FORGE] Bridge exec succeeded for #' + operationId,
            '(' + (bridgeResult.queue || []).length + ' sendBack entries)');
          return { success: true, viaBridge: true };
        }
        console.warn('[FORGE] Bridge exec failed for #' + operationId + ':', bridgeResult.error);
      } catch (e) {
        console.warn('[FORGE] Bridge exec threw for #' + operationId + ':', e.message);
      }
    }

    // Last resort: manual exec buffer
    console.log('[FORGE] Falling back to manual exec for #' + operationId);
    _forgeBufferManualExec(operationId, scriptContent);
    return { success: false, cspBlocked: true, manualRun: true };

  } catch(error) {
    const errorEntry = {
      type: 'error',
      operationId,
      operation: 'execute',
      stage: 'execution',
      message: error.message || String(error),
      stack: error.stack || ''
    };
    repo.sendBack(errorEntry);
    console.error('[FORGE] ? Script #' + operationId + ' failed:', error);
    return { success: false, error: error.message };
  }
}
// FORGE CODE - Repo Object
// Core data structure for managing files, metadata, and version history.
// Supports Forge Spec v1.0.0 fields: encoding, excluded, url, description.

const repo = {
  files: {},
  fileMeta: {},   // path -> { encoding, excluded, url, description }
  versions: [],
  currentStep: 0,
  lastProcessedStep: 0,
  projectTitle: null,
  _sendBackQueue: [],
  _sendBackSent: false,

  // ©¤©¤ Meta helpers ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  getMeta(path) {
    return this.fileMeta[path] || {};
  },

  setMeta(path, meta) {
    this.fileMeta[path] = Object.assign(this.fileMeta[path] || {}, meta);
  },

  isExcluded(path) {
    return !!(this.fileMeta[path] && this.fileMeta[path].excluded);
  },

  sendBack(data) {
    this._sendBackQueue.push(data);
    console.log('[FORGE] sendBack queued:', data);

    ForgeActions.setSendBackState(
      this._sendBackQueue,
      this._sendBackSent
    );

    // Keep legacy event+callback path for any external listeners
    try {
      window.dispatchEvent(new CustomEvent('forge:results-updated', { detail: data }));
      window.dispatchEvent(new CustomEvent('forge:queue-updated', { detail: this._sendBackQueue }));
    } catch (err) {
      console.warn('[FORGE] UI refresh warning on sendBack:', err);
    }
  },

  getSendBackQueue() {
    return [...this._sendBackQueue];
  },

  clearSendBackQueue() {
    this._sendBackQueue = [];
    this._sendBackSent = false;
    ForgeActions.setSendBackState([], false);
  },

  markSendBackSent() {
    this._sendBackSent = true;
    ForgeActions.setSendBackState(
      this._sendBackQueue,
      true
    );
  },

  isSendBackSent() {
    return this._sendBackSent;
  },

  getContent(path) {
    const content = this.files[path] || '';
    const lines = content.split('\n');
    
    return {
      text: () => content,
      lines: (start, end) => {
        if (start === undefined && end === undefined) return lines;
        const s = Math.max(0, (start || 1) - 1);
        const e = Math.min(lines.length, (end || lines.length));
        return lines.slice(s, e);
      },
      lineCount: () => lines.length,
      lineAt: (n) => lines[Math.max(0, n - 1)] || '',
    };
  },

  findContent(searchTerm, parentPath) {
    const matches = [];
    const isRegex = searchTerm instanceof RegExp;
    
    for (const [path, content] of Object.entries(this.files)) {
      if (parentPath && !path.startsWith(parentPath)) continue;
      
      const lines = content.split('\n');
      lines.forEach((line, lineNum) => {
        let found = false;
        if (isRegex) {
          found = searchTerm.test(line);
        } else {
          found = line.includes(searchTerm);
        }
        
        if (found) {
          const context = {
            before: lines.slice(Math.max(0, lineNum - 2), lineNum),
            after: lines.slice(lineNum + 1, Math.min(lines.length, lineNum + 3))
          };
          matches.push({
            path,
            lineNum: lineNum + 1,
            content: line,
            context
          });
        }
      });
    }
    
    return matches;
  },

  // ©¤©¤ File operations ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  addFile(id, path, content, meta) {
    this.files[path] = this._processContent(path, content || '');
    if (meta) this.setMeta(path, meta);
    // NOTE: ForgeState sync happens in the monkey-patched wrapper below
  },

  replaceFile(id, path, content, meta) {
    this.files[path] = this._processContent(path, content || '');
    if (meta) this.setMeta(path, meta);
    // NOTE: ForgeState sync happens in the monkey-patched wrapper below
  },

  _processContent(path, content) {
    // Parse backtick escapes for markdown files
    if (path.endsWith('.md')) {
      return content.replace(/&#96[;]/g, '`');
    }
    return content;
  },

  deleteFile(id, path) {
    delete this.files[path];
    delete this.fileMeta[path];
  },

  moveFile(id, pathOld, pathNew) {
    this.files[pathNew] = this.files[pathOld];
    this.fileMeta[pathNew] = this.fileMeta[pathOld] || {};
    delete this.files[pathOld];
    delete this.fileMeta[pathOld];
  },

  patchFile(id, path, patchContent) {

    if (!this.files.hasOwnProperty(path)) {
      console.error(`File not found: ${path}`);
      throw new Error(`File not found: ${path}`);
    }

    const oldContent = this.files[path];
    let fileContent = this.files[path];

    const patches = parsePatchBlocks(patchContent);

    if (patches.length === 0) {
      console.error('No valid FIND/REPLACE blocks found in patch');
      throw new Error('No valid FIND/REPLACE blocks found in patch');
    }

    for (let i = 0; i < patches.length; i++) {
      const patch = patches[i];

      if (patch.type === 'range') {
        console.log(`Patch ${i + 1}: Attempting range patch...`);
        const rangeResult = applyRangePatch(fileContent, patch.findStart, patch.findEnd, patch.replace);
      if (rangeResult.success) {
          fileContent = rangeResult.content;
          if (rangeResult.confidence < 100) {
            logToUI(`?? Patch ${i + 1} used fuzzy range matching (${rangeResult.confidence}% match)`);
          }
        } else {
          console.error(`Patch ${i + 1}: Range match failed`);
          throw new Error(`Patch ${i + 1} failed: ${rangeResult.reason}`);
        }
      } else {
        const { find, replace } = patch;

        if (fileContent.includes(find)) {
          fileContent = fileContent.replace(find, replace);
        } else {
          const fuzzyResult = applyFuzzyPatch(fileContent, find, replace);

          if (fuzzyResult.success) {
            fileContent = fuzzyResult.content;
            logToUI(`?? Patch ${i + 1} used fuzzy matching (${fuzzyResult.confidence}% match)`);
          } else {
            throw new Error(`Patch ${i + 1} failed: ${fuzzyResult.reason}`);
          }
        }
      }
    }

    this.files[path] = this._processContent(path, fileContent);
    this._trackChange('patch', id, path, this.files[path], oldContent);
  },

  // ©¤©¤ Version history ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  _trackChange(operation, id, path, newContent, oldContent, sourcePath) {
    if (!this.versions[this.currentStep]) {
      this.versions[this.currentStep] = {
        step: this.currentStep,
        changes: [],
        snapshot: {},
        metaSnapshot: {}
      };
    }

    this.versions[this.currentStep].changes.push({
      operation, id, path, newContent, oldContent, sourcePath
    });

    this.versions[this.currentStep].snapshot =
      JSON.parse(JSON.stringify(this.files));
    this.versions[this.currentStep].metaSnapshot =
      JSON.parse(JSON.stringify(this.fileMeta));
  },

  goToStep(stepNumber) {
    if (stepNumber < 0 || stepNumber >= this.versions.length) {
      console.error(`Step ${stepNumber} does not exist`);
      return;
    }
    this.files    = JSON.parse(JSON.stringify(this.versions[stepNumber].snapshot));
    this.fileMeta = JSON.parse(JSON.stringify(this.versions[stepNumber].metaSnapshot || {}));
    this.currentStep = stepNumber;
    console.log(`Restored to step ${stepNumber}`);
    ForgeActions.publishRepositoryState(this);
  },

  listFiles(parentPath) {
    const files = Object.keys(this.files);
    if (parentPath) {
      return files.filter(f => f.startsWith(parentPath));
    }
    return files;
  },

  getMetadata(path) {
    return this.getMeta(path);
  },

  fileExists(path) {
    return path in this.files;
  },

  getCurrentStep() {
    return {
      step: this.currentStep + 1,
      lastProcessedStep: this.lastProcessedStep,
      projectTitle: this.projectTitle
    };
  },

  getHistory() {
    return [...this.versions];
  },

  getChanges(stepNum) {
    const version = this.versions[stepNum - 1];
    return version ? version.changes : [];
  },

  getSummary() {
    const byExtension = {};
    let totalLines = 0;
    let excludedCount = 0;
    let binaryCount = 0;
    
    for (const [path, content] of Object.entries(this.files)) {
      const meta = this.getMeta(path);
      const ext = path.split('.').pop() || 'no-ext';
      byExtension[ext] = (byExtension[ext] || 0) + 1;
      
      if (meta.excluded) excludedCount++;
      if (meta.encoding === 'base64') binaryCount++;
      if (!meta.excluded && !meta.encoding) {
        totalLines += content.split('\n').length;
      }
    }
    
    return {
      fileCount: Object.keys(this.files).length,
      totalLines,
      byExtension,
      excludedCount,
      binaryCount
    };
  },

  replaceLines(path, startLine, endLine, newContent) {
    try {
      if (!this.files[path]) return { success: false, error: `File not found: ${path}` };
      
      const lines = this.files[path].split('\n');
      const s = Math.max(0, startLine - 1);
      const e = Math.min(lines.length, endLine);
      lines.splice(s, e - s, ...newContent.split('\n'));
      
      this.files[path] = lines.join('\n');
      return { success: true, newContent: this.files[path] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  replaceAll(path, searchTerm, replacement) {
    try {
      if (!this.files[path]) return { success: false, error: `File not found: ${path}` };
      
      const oldContent = this.files[path];
      const isRegex = searchTerm instanceof RegExp;
      
      let newContent;
      let count = 0;
      
      if (isRegex) {
        newContent = oldContent.replace(searchTerm, (match) => {
          count++;
          return replacement;
        });
      } else {
        count = (oldContent.match(new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        newContent = oldContent.replaceAll(searchTerm, replacement);
      }
      
      this.files[path] = newContent;
      this._trackChange('replaceAll', 'N/A', path, newContent, oldContent);
      
      return { success: true, count, newContent };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  insertLines(path, lineNum, newContent) {
    try {
      if (!this.files[path]) return { success: false, error: `File not found: ${path}` };
      
      const lines = this.files[path].split('\n');
      const insertPos = Math.max(0, Math.min(lineNum - 1, lines.length));
      lines.splice(insertPos, 0, ...newContent.split('\n'));
      
      this.files[path] = lines.join('\n');
      return { success: true, newContent: this.files[path] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  deleteLines(path, startLine, endLine) {
    try {
      if (!this.files[path]) return { success: false, error: `File not found: ${path}` };
      
      const lines = this.files[path].split('\n');
      const s = Math.max(0, startLine - 1);
      const e = Math.min(lines.length, endLine);
      const deleted = lines.splice(s, e - s);
      
      this.files[path] = lines.join('\n');
      return { success: true, deletedContent: deleted.join('\n'), newContent: this.files[path] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  applyPatch(path, findBlock, replaceBlock) {
    try {
      const fileContent = this.files[path];
      if (fileContent === undefined) {
        return { success: false, error: `File not found: ${path}` };
      }
      
      if (fileContent.includes(findBlock)) {
        const newContent = fileContent.replace(findBlock, replaceBlock);
        this.files[path] = newContent;
        return { success: true, confidence: 100, newContent };
      }
      
      const fuzzyResult = applyFuzzyPatch(fileContent, findBlock, replaceBlock);
      if (fuzzyResult.success) {
        this.files[path] = fuzzyResult.content;
        return { success: true, confidence: fuzzyResult.confidence, newContent: fuzzyResult.content };
      }
      
      return { success: false, error: fuzzyResult.reason, confidence: fuzzyResult.confidence };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ©¤©¤ Export helpers ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  /**
   * Build a spec 1.0.0 compliant file entry for a given path.
   */
  _buildFileEntry(path, pathsOnly, summaryPatterns) {
    const meta = this.getMeta(path);
    const entry = { path };

    if (meta.encoding)    entry.encoding    = meta.encoding;
    if (meta.excluded)    entry.excluded    = true;
    if (meta.url)         entry.url         = meta.url;
    if (meta.description) entry.description = meta.description;

    // Determine if we should include contents
    let includeContents = !meta.excluded;
    
    if (pathsOnly && includeContents) {
      // In pathsOnly mode, check if file matches summary patterns
      if (summaryPatterns && summaryPatterns.length > 0) {
        includeContents = matchesAnyPattern(path, summaryPatterns);
      } else {
        // Default: include markdown files
        includeContents = path.endsWith('.md');
      }
    }

    if (includeContents) {
      entry.contents = this.files[path];
    }

    return entry;
  },

  /**
   * Export full repo as spec 1.0.0 JSON object.
   * If includeCodingPrompt is true, adds codingPrompt field with the workspace prompt.
   */
  toForgeJSON(options) {
    let filePaths = Object.keys(this.files).sort();
    
    const json = {
      specVersion: '1.0.0',
      title: this.projectTitle || 'untitledProject',
      files: filePaths.map(p => this._buildFileEntry(p, options && options.pathsOnly, options && options.summaryPatterns))
    };
    if (options && options.includeCodingPrompt) {
      const prompt = (typeof getWorkspacePrompt === 'function') ? getWorkspacePrompt() : '';
      if (prompt) json.codingPrompt = prompt;
    }
    return json;
  },

  getChangesOnly() {
    if (!this.versions[this.currentStep]) {
      return { specVersion: '1.0.0', title: this.projectTitle || 'untitledProject', files: [] };
    }

    const version = this.versions[this.currentStep];
    const changedPaths = new Set();

    version.changes.forEach(change => {
      if (change.operation !== 'delete') changedPaths.add(change.path);
      if (change.sourcePath) changedPaths.add(change.sourcePath);
    });

    return {
      specVersion: '1.0.0',
      title: this.projectTitle || 'untitledProject',
      files: Array.from(changedPaths).sort().map(p => this._buildFileEntry(p))
    };
  },

  // ©¤©¤ Step diff helpers ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  /**
   * Return a sorted array of 1-based step numbers that have been recorded
   * in history (handles sparse arrays from skipped steps).
   */
  _getAvailableSteps() {
    return Object.keys(this.versions)
      .map(Number)
      .filter(n => this.versions[n] != null)
      .sort((a, b) => a - b)
      .map(n => n + 1); // convert 0-based index to 1-based step number
  },

  /**
   * Resolve a step argument (positive int, negative int) to a 1-based step number.
   * Throws if the step doesn't exist in history.
   *
   * @param {number} arg        - Positive: literal step #. Negative: offset from end of available list.
   * @param {string} role       - 'from' or 'to' (for error messages)
   * @param {number[]} available - Sorted available step numbers
   */
  _resolveStepArg(arg, role, available) {
    if (available.length === 0) {
      throw new Error(`getStepDiff: no step history available`);
    }

    let resolved;

    // 0 is the special "before start" sentinel ¡ª always valid
    if (arg === 0) return 0;

    if (arg < 0) {
      // Negative: -1 = last, -2 = second-to-last, etc.
      const idx = available.length + arg;
      if (idx < 0) {
        throw new Error(
          `getStepDiff: negative index ${arg} is out of range. ` +
          `Available steps: [${available.join(', ')}]`
        );
      }
      resolved = available[idx];
    } else {
      // Positive: must be an actual step in history
      if (!available.includes(arg)) {
        throw new Error(
          `getStepDiff: step ${arg} not found in history. ` +
          `Available steps: [${available.join(', ')}]`
        );
      }
      resolved = arg;
    }

    return resolved;
  },

  /**
   * Get the file snapshot for a given 1-based step number.
   * Step 0 means "before everything" ¡ª returns empty object.
   */
  _getSnapshot(stepNum) {
    if (stepNum === 0) return {};
    const version = this.versions[stepNum - 1];
    if (!version) return {};
    return JSON.parse(JSON.stringify(version.snapshot || {}));
  },

  /**
   * Compare two snapshots and produce an array of operations describing
   * the net difference. Detects moves (identical content, path changed),
   * adds, deletes, patches, and replaces.
   *
   * PATCH_THRESHOLD: if diff covers more than this fraction of lines ¡ú #replace
   *
   * Returns array of:
   *   { type: 'new'|'replace'|'patch'|'delete'|'move',
   *     path, oldPath?,         // oldPath only for move
   *     oldContent?, newContent?,
   *     diffStr?,               // formatted FIND/REPLACE blocks, if patch
   *     lineCount?,
   *     summary? }              // { hunkCount, linesAdded, linesRemoved }, if patch/replace
   */
  _diffSnapshots(fromSnap, toSnap) {
    const PATCH_THRESHOLD = 0.65; // >65% of lines changed ¡ú replace
    const ops = [];

    const fromPaths = new Set(Object.keys(fromSnap));
    const toPaths   = new Set(Object.keys(toSnap));

    const added    = [...toPaths].filter(p => !fromPaths.has(p));
    const deleted  = [...fromPaths].filter(p => !toPaths.has(p));
    const modified = [...toPaths].filter(p => fromPaths.has(p) && fromSnap[p] !== toSnap[p]);

    // Move detection: deleted path whose content exactly matches an added path
    const moveMap  = new Map(); // deletedPath ¡ú addedPath
    const usedAdded = new Set();

    for (const delPath of deleted) {
      const delContent = fromSnap[delPath];
      for (const addPath of added) {
        if (!usedAdded.has(addPath) && toSnap[addPath] === delContent) {
          moveMap.set(delPath, addPath);
          usedAdded.add(addPath);
          break;
        }
      }
    }

    // Moves
    for (const [oldPath, newPath] of moveMap.entries()) {
      ops.push({ type: 'move', path: newPath, oldPath });
    }

    // Deletes (not part of a move)
    for (const path of deleted) {
      if (!moveMap.has(path)) {
        const lineCount = (fromSnap[path] || '').split('\n').length;
        ops.push({ type: 'delete', path, oldContent: fromSnap[path], lineCount });
      }
    }

    // Adds (not the destination of a move)
    for (const path of added) {
      if (!usedAdded.has(path)) {
        const content = toSnap[path];
        const lineCount = (content || '').split('\n').length;
        ops.push({ type: 'new', path, newContent: content, lineCount });
      }
    }

    // Modified files ¡ª decide patch vs replace
    for (const path of modified) {
      const oldContent = fromSnap[path];
      const newContent = toSnap[path];
      const oldLineCount = (oldContent || '').split('\n').length;
      const newLineCount = (newContent || '').split('\n').length;

      if (typeof summarizeDiff !== 'function' || typeof formatDiffAsPatches !== 'function') {
        // Diff utilities not available ¡ª always replace
        ops.push({ type: 'replace', path, oldContent, newContent, lineCount: newLineCount });
        continue;
      }

      const diffSummary = summarizeDiff(oldContent, newContent);
      const changedLines = diffSummary.linesAdded + diffSummary.linesRemoved;
      const totalLines = Math.max(oldLineCount, newLineCount, 1);
      const changeRatio = changedLines / totalLines;

      if (changeRatio > PATCH_THRESHOLD) {
        ops.push({
          type: 'replace',
          path,
          oldContent,
          newContent,
          lineCount: newLineCount,
          summary: diffSummary
        });
      } else {
        const diffStr = formatDiffAsPatches(oldContent, newContent);
        ops.push({
          type: 'patch',
          path,
          oldContent,
          newContent,
          diffStr,
          lineCount: newLineCount,
          summary: diffSummary
        });
      }
    }

    return ops;
  },

  /**
   * Resolve from/to step numbers from getStepDiff / getStepDiffSummary arguments.
   * Handles: no args, one arg, two args, negative indices.
   * Returns { fromStep, toStep, warnBackwards }
   */
  _resolveStepRange(fromArg, toArg) {
    const available = this._getAvailableSteps();

    if (available.length === 0) {
      throw new Error('getStepDiff: no step history available');
    }

    let fromStep, toStep, warnBackwards = false;

    if (fromArg === undefined && toArg === undefined) {
      // No args: prev-available ¡ú last-available (shows what the last step changed)
      if (available.length === 1) {
        fromStep = 0; // before everything
        toStep   = available[0];
      } else {
        fromStep = available[available.length - 2];
        toStep   = available[available.length - 1];
      }
    } else if (toArg === undefined) {
      // One arg: from that step ¡ú currentStep (1-based)
      fromStep = this._resolveStepArg(fromArg, 'from', available);
      const currentStep1 = this.currentStep + 1;
      toStep = available.includes(currentStep1)
        ? currentStep1
        : available[available.length - 1]; // fall back to last available
    } else {
      // Two explicit args
      fromStep = this._resolveStepArg(fromArg, 'from', available);
      toStep   = this._resolveStepArg(toArg, 'to', available);
      if (fromStep > toStep) {
        warnBackwards = true;
      }
    }

    return { fromStep, toStep, warnBackwards };
  },

  /**
   * Generate a protocol-style markdown step showing the net diff between two steps.
   *
   * Signatures:
   *   repo.getStepDiff()       ¡ú diff of last step (prev ¡ú last available)
   *   repo.getStepDiff(3)      ¡ú step 3 ¡ú currentStep
   *   repo.getStepDiff(3, 9)   ¡ú explicit range
   *   repo.getStepDiff(-1)     ¡ú second-to-last ¡ú last
   *   repo.getStepDiff(9, 3)   ¡ú backwards (warns, still honored)
   *
   * Returns: markdown string in protocol format
   */
  getStepDiff(fromArg, toArg) {
    const { fromStep, toStep, warnBackwards } = this._resolveStepRange(fromArg, toArg);

    if (warnBackwards) {
      console.warn(`[FORGE] getStepDiff: going backwards (${fromStep} ¡ú ${toStep}). This is unusual.`);
    }

    const fromSnap = this._getSnapshot(fromStep);
    const toSnap   = this._getSnapshot(toStep);
    const ops      = this._diffSnapshots(fromSnap, toSnap);

    const label = fromStep === 0 ? '(start)' : String(fromStep);
    const tri   = '```';
    // Comment header (ignored by parser, useful for humans)
    let out = `# Step Diff: ${label} ¡ú ${toStep}\n\n`;

    if (ops.length === 0) {
      out += '_No differences between these steps._\n';
      return out;
    }

    let opNum = 1;
    const runnerLines = [];

    for (const op of ops) {
      if (op.type === 'new') {
        // Header fence ¡ª the parser looks for chunks starting with 'header'
        out += tri + 'header\n' + op.path + ` #${opNum} #new\n` + tri + '\n';
        out += tri + 'javascript\n' + (op.newContent || '') + '\n' + tri + '\n\n';
        runnerLines.push(`repo.addFile('#${opNum}', '${op.path}');`);
      } else if (op.type === 'replace') {
        out += tri + 'header\n' + op.path + ` #${opNum} #replace\n` + tri + '\n';
        out += tri + 'javascript\n' + (op.newContent || '') + '\n' + tri + '\n\n';
        runnerLines.push(`repo.replaceFile('#${opNum}', '${op.path}');`);
      } else if (op.type === 'patch') {
        out += tri + 'header\n' + op.path + ` #${opNum} #patch\n` + tri + '\n';
        out += tri + 'patch\n' + (op.diffStr || '[no diff]') + '\n' + tri + '\n\n';
        runnerLines.push(`repo.patchFile('#${opNum}', '${op.path}');`);
      } else if (op.type === 'delete') {
        out += tri + 'header\n' + op.path + ` #${opNum} #delete\n` + tri + '\n\n';
        runnerLines.push(`repo.deleteFile('#${opNum}', '${op.path}');`);
      } else if (op.type === 'move') {
        out += tri + 'header\n' + op.oldPath + ` #${opNum} #move ` + op.path + '\n' + tri + '\n\n';
        runnerLines.push(`repo.moveFile('#${opNum}', '${op.oldPath}', '${op.path}');`);
      }
      opNum++;
    }

    // Step runner ¡ª use toStep as the step number so the destination instance
    // only applies it if it hasn't already processed that step
    out += tri + 'javascript\n//codebase #step-' + toStep + '\n';
    out += runnerLines.join('\n') + '\n' + tri + '\n';

    return out;
  },

  /**
   * Generate a plain-text summary of what changed between two steps.
   * No code content ¡ª just operation types and line counts.
   *
   * Same argument signatures as getStepDiff.
   */
  getStepDiffSummary(fromArg, toArg) {
    const { fromStep, toStep, warnBackwards } = this._resolveStepRange(fromArg, toArg);

    if (warnBackwards) {
      console.warn(`[FORGE] getStepDiffSummary: going backwards (${fromStep} ¡ú ${toStep}). This is unusual.`);
    }

    const fromSnap = this._getSnapshot(fromStep);
    const toSnap   = this._getSnapshot(toStep);
    const ops      = this._diffSnapshots(fromSnap, toSnap);

    const label = fromStep === 0 ? '(start)' : String(fromStep);
    let out = `Step ${label}¡ú${toStep} diff summary`;

    if (ops.length === 0) {
      return out + ': no differences.\n';
    }

    out += ` (${ops.length} operation${ops.length !== 1 ? 's' : ''}):\n`;

    for (const op of ops) {
      const col = op.path.padEnd(50);
      if (op.type === 'new') {
        out += `  #new     ${col} (${op.lineCount} lines added)\n`;
      } else if (op.type === 'replace') {
        const s = op.summary;
        const detail = s
          ? `${op.lineCount} lines total; +${s.linesAdded} -${s.linesRemoved}`
          : `${op.lineCount} lines`;
        out += `  #replace ${col} (${detail})\n`;
      } else if (op.type === 'patch') {
        const s = op.summary;
        const detail = s
          ? `${s.hunkCount} hunk${s.hunkCount !== 1 ? 's' : ''}: +${s.linesAdded} -${s.linesRemoved} lines`
          : 'patched';
        out += `  #patch   ${col} (${detail})\n`;
      } else if (op.type === 'delete') {
        out += `  #delete  ${col} (${op.lineCount} lines removed)\n`;
      } else if (op.type === 'move') {
        out += `  #move    ${op.oldPath} ¡ú ${op.path}\n`;
      }
    }

    return out;
  },

  getLastDiffForLLM() {
    if (!this.versions[this.currentStep]) {
      return '# No changes in current step';
    }

    const version = this.versions[this.currentStep];
    const tick = '`';
    const tripleBacktick = tick.repeat(3);
    let output = '# Changes in Step ' + (this.currentStep + 1) + '\n\n';

    version.changes.forEach(change => {
      output += '## ' + change.path + ' #' + change.id + ' #' + change.operation + '\n';

      if (change.operation === 'patch') {
        // Generate a human-readable FIND/REPLACE diff from old vs new content
        if (change.oldContent != null && change.newContent != null &&
            typeof formatDiffAsPatches === 'function') {
          const diffStr = formatDiffAsPatches(change.oldContent, change.newContent);
          if (diffStr) {
            output += tripleBacktick + '\n' + diffStr + '\n' + tripleBacktick + '\n';
          } else {
            output += tripleBacktick + '\n[No differences detected]\n' + tripleBacktick + '\n';
          }
        } else {
          output += tripleBacktick + '\n[Patch applied]\n' + tripleBacktick + '\n';
        }
      } else if (change.operation === 'add' || change.operation === 'replace') {
        output += tripleBacktick + '\n' + (change.newContent || '') + '\n' + tripleBacktick + '\n';
      } else if (change.operation === 'delete') {
        output += '[File deleted]\n';
      } else if (change.operation === 'move') {
        output += '[Moved from ' + change.sourcePath + ']\n';
      }

      output += '\n';
    });

    return output;
  },

  // ©¤©¤ Preview ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  /**
   * Open a live in-browser preview in a new tab.
   * Defaults to /index.html. Inlines all relative src/href references
   * (scripts, stylesheets, images) as blob URLs so they resolve correctly.
   */
  preview(target, optionsOrMessage) {
    if (typeof openInForgeIDE === 'function') {
      let entryPoint = target;
      let options = {};

      // Parse hash directly from the target string (e.g., 'settings.html#advanced')
      if (typeof target === 'string' && target.includes('#')) {
        const [url, ...hashParts] = target.split('#');
        entryPoint = url || 'index.html'; // If they just pass '#advanced', default to index.html
        options.previewHash = '#' + hashParts.join('#');
      }

      // Handle the second argument as a simple string message or an object
      if (typeof optionsOrMessage === 'string') {
        options.context = { message: optionsOrMessage, from: 'Forge Code' };
      } else if (typeof optionsOrMessage === 'object' && optionsOrMessage !== null) {
        if (optionsOrMessage.previewHash || optionsOrMessage.context) {
          options.previewHash = optionsOrMessage.previewHash || options.previewHash;
          options.context = optionsOrMessage.context;
        } else {
          options.context = optionsOrMessage;
        }
      }

      openInForgeIDE(entryPoint, options);
    }
  },

  // ©¤©¤ Validator integration ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  _validatorRegistry: null,

  /**
   * Register a custom validator for a file extension.
   * Creates the registry lazily on first use.
   * @param {string} ext - File extension (e.g. 'js', 'css')
   * @param {Function} validator - Sync or async validator function
   */
  registerValidator(ext, validator) {
    if (!this._validatorRegistry) {
      this._validatorRegistry = new ValidatorRegistry();
    }
    this._validatorRegistry.register(ext, validator);
  },

  /**
   * List all extensions that have a registered validator.
   * @returns {string[]}
   */
  getValidatorExtensions() {
    if (!this._validatorRegistry) return [];
    return this._validatorRegistry.getRegisteredExtensions();
  },

  /**
   * Validate files in the repo.
   * @param {string|string[]} [patterns] - Optional glob patterns to filter files
   * @returns {Promise<{success, summary, results}>}
   */
  async validate(patterns) {
    if (!this._validatorRegistry) {
      return {
        success: true,
        summary: { total: 0, passed: 0, failed: 0, warnings: 0, skipped: 0 },
        results: []
      };
    }
    return validateRepo(this, patterns);
  },

  // ©¤©¤ ZIP download ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  async downloadZip(filename) {
    try {
      const JSZip = await loadJSZip();
      const zip = new JSZip();

      for (const [path, content] of Object.entries(this.files)) {
        if (this.isExcluded(path)) continue;
        const cleanPath = path.startsWith('/') ? path.substring(1) : path;
        const meta = this.getMeta(path);

        if (meta.encoding === 'base64' && content) {
          try {
            const bytes = Uint8Array.from(atob(content), c => c.charCodeAt(0));
            zip.file(cleanPath, bytes);
          } catch (e) {
            console.warn(`Could not decode base64 for ${path}, storing as text`);
            zip.file(cleanPath, content);
          }
        } else {
          zip.file(cleanPath, content);
        }
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `${this.projectTitle || 'project'}_${getTimestamp()}.zip`;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      console.log(`Downloaded ${a.download} successfully!`);
    } catch (error) {
      console.error('Error creating zip:', error);
    }
  }
};

// ©¤©¤ Wrap methods to track changes + sync ForgeState ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

/** Publish the repository model through the application action boundary. */
function _syncRepoToState(r) {
  ForgeActions.publishRepositoryState(r);
}

const _origAdd = repo.addFile.bind(repo);
repo.addFile = function(id, path, content, meta) {
  const pathCheck = validateFilePath(path);
  if (!pathCheck.valid) throw new Error(`addFile: invalid path ¡ª ${pathCheck.error}`);
  const contentCheck = validateFileContent(content);
  if (!contentCheck.valid) throw new Error(`addFile: invalid content ¡ª ${contentCheck.error}`);
  _origAdd(id, path, content, meta);
  this._trackChange('add', id, path, content);
  _syncRepoToState(this);
};

const _origReplace = repo.replaceFile.bind(repo);
repo.replaceFile = function(id, path, content, meta) {
  const pathCheck = validateFilePath(path);
  if (!pathCheck.valid) throw new Error(`replaceFile: invalid path ¡ª ${pathCheck.error}`);
  const contentCheck = validateFileContent(content);
  if (!contentCheck.valid) throw new Error(`replaceFile: invalid content ¡ª ${contentCheck.error}`);
  const oldContent = this.files[path];
  _origReplace(id, path, content, meta);
  this._trackChange('replace', id, path, content, oldContent);
  _syncRepoToState(this);
};

const _origDelete = repo.deleteFile.bind(repo);
repo.deleteFile = function(id, path) {
  const oldContent = this.files[path];
  _origDelete(id, path);
  this._trackChange('delete', id, path, null, oldContent);
  _syncRepoToState(this);
};

const _origMove = repo.moveFile.bind(repo);
repo.moveFile = function(id, pathOld, pathNew) {
  const oldContent = this.files[pathOld];
  _origMove(id, pathOld, pathNew);
  this._trackChange('move', id, pathNew, this.files[pathNew], oldContent, pathOld);
  _syncRepoToState(this);
};

// Also track the line-level helpers (previously missed by version tracking)
const _origReplaceLines = repo.replaceLines.bind(repo);
repo.replaceLines = function(path, startLine, endLine, newContent) {
  const oldContent = this.files[path];
  const result = _origReplaceLines(path, startLine, endLine, newContent);
  if (result.success) {
    this._trackChange('replaceLines', 'N/A', path, this.files[path], oldContent);
    _syncRepoToState(this);
  }
  return result;
};

const _origInsertLines = repo.insertLines.bind(repo);
repo.insertLines = function(path, lineNum, newContent) {
  const oldContent = this.files[path];
  const result = _origInsertLines(path, lineNum, newContent);
  if (result.success) {
    this._trackChange('insertLines', 'N/A', path, this.files[path], oldContent);
    _syncRepoToState(this);
  }
  return result;
};

const _origDeleteLines = repo.deleteLines.bind(repo);
repo.deleteLines = function(path, startLine, endLine) {
  const oldContent = this.files[path];
  const result = _origDeleteLines(path, startLine, endLine);
  if (result.success) {
    this._trackChange('deleteLines', 'N/A', path, this.files[path], oldContent);
    _syncRepoToState(this);
  }
  return result;
};

// Make repo available globally
window.repo = repo;
// FORGE CODE - Parsing Logic
// Parses codebase operations from page content

let elementPositionCache = new WeakMap();

/**
 * Returns true if the element has a <pre> ancestor OR is inside a new Elsa
 * beta syntax-highlighted code block container (div.p-3 with no <pre>).
 * Handles:
 *   - Old Elsa: pre>code
 *   - New Elsa beta (pre>div>div>code)
 *   - New Elsa beta HTML preview: div.relative.overflow-hidden>div.p-3>code
 */
function _hasPreAncestor(el) {
  let parent = el.parentElement;
  while (parent) {
    if (parent.tagName === 'PRE') return true;
    // New Elsa beta: syntax-highlighted blocks (including HTML preview)
    // are wrapped in <div class="p-3"> with no <pre> ancestor.
    if (parent.tagName === 'DIV' && parent.classList.contains('p-3')) return true;
    if (['SECTION', 'ARTICLE', 'MAIN', 'BODY', 'FORM'].includes(parent.tagName)) return false;
    parent = parent.parentElement;
  }
  return false;
}

/**
 * Walk up from el to find the best position anchor:
 *   - Outermost <pre> ancestor, OR
 *   - New Elsa beta outer container: div.relative.overflow-hidden.rounded-md
 * Falls back to el itself if neither is found.
 */
function _findPositionAnchor(el) {
  let positionAnchor = el;
  let ancestor = el.parentElement;
  while (ancestor) {
    const tag = ancestor.tagName ? ancestor.tagName.toLowerCase() : '';
    if (tag === 'pre') {
      positionAnchor = ancestor;
    } else if (
      tag === 'div' &&
      ancestor.classList.contains('relative') &&
      ancestor.classList.contains('overflow-hidden') &&
      ancestor.classList.contains('rounded-md')
    ) {
      positionAnchor = ancestor;
    }
    ancestor = ancestor.parentElement;
  }
  return positionAnchor;
}

/**
 * Extract the text content of a code element, correctly handling both:
 *   - Old Elsa / plain <pre><code>: use textContent (preserves \n)
 *   - New Elsa beta syntax-highlighted blocks: convert <br> to \n manually
 * 
 * We cannot use innerText because it returns empty strings for elements
 * hidden inside collapsed <details> blocks.
 */
function _getCodeContent(el) {
  // Use the same full-text source as operation/header parsing.
  // ChatGPT's CodeMirror DOM may only contain the currently rendered tile,
  // while cmTile.view.state.doc retains the complete code block.
  if (
    el &&
    el.classList &&
    el.classList.contains('cm-content')
  ) {
    return _getParsingText(el);
  }


  return getCodeText(el);
}
function _getParsingText(el) {
  if (
    el &&
    el.classList &&
    el.classList.contains('cm-content')
  ) {
    const documentText =
      el.cmTile?.view?.state?.doc
        ?.toString?.();


    if (
      typeof documentText === 'string' &&
      documentText.length > 0
    ) {
      return documentText;
    }


    return el.innerText || el.textContent || '';
  }

  // Preserve platform-specific code formatting such as Elsa's <br>-based
  // newlines when the surface is a traditional <code> element.
  if (
    el &&
    el.matches &&
    el.matches('code')
  ) {
    return getCodeText(el) || '';
  }

  return el?.textContent || '';
}
function _getParsingStepNumber(el) {
  const text =
    _getParsingText(el);

  const firstLine =
    text.split('\n')[0].trim();

  const match =
    firstLine.match(
      /^\/\/codebase\s+#step-(\d+)/
    );

  if (!match) {
    return null;
  }

  const stepNum =
    parseInt(match[1], 10);

  return Number.isFinite(stepNum)
    ? stepNum
    : null;
}


function _getHighestParsingStepNumber(el) {
  const text =
    _getParsingText(el);

  if (!text) {
    return null;
  }

  const fence =
    '`' + '``';

  const isWrappedProtocol =
    el?.classList
      ?.contains('cm-content') &&
    text.includes(
      fence + 'header'
    ) &&
    text.includes('//codebase');

  if (isWrappedProtocol) {
    const lines =
      text
        .replace(/\r\n/g, '\n')
        .split('\n');

    let insideFence = false;
    let firstContentLine = false;
    let highestStep = null;

    for (const line of lines) {
      const trimmed =
        line.trim();

      if (
        trimmed.startsWith(fence)
      ) {
        insideFence =
          !insideFence;

        firstContentLine =
          insideFence;

        continue;
      }

      if (
        !insideFence ||
        !firstContentLine ||
        !trimmed
      ) {
        continue;
      }

      firstContentLine = false;

      const match =
        trimmed.match(
          /^\/\/codebase\s+#step-(\d+)\b/
        );

      if (!match) {
        continue;
      }

      const stepNum =
        parseInt(
          match[1],
          10
        );

      if (
        Number.isFinite(stepNum) &&
        (
          highestStep === null ||
          stepNum > highestStep
        )
      ) {
        highestStep =
          stepNum;
      }
    }

    return highestStep;
  }

  // Normal code surfaces retain the historical rule: a real FORGE runner
  // must begin on the first line of the block.
  return _getParsingStepNumber(el);
}


function parseCodebase(root = document) {
  const fileBlocks = [];
  const operationsMap = new Map();
  const seenTexts = new Set();
  const allElements = [
    ...root.querySelectorAll(
      'code, p, .cm-content'
    )
  ];

  // ©¤©¤ Pass 1: find all operation headers ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  // Deduplicated by innermost element. Record DOM position for each.

  allElements.forEach(el => {
    const text =
      _getParsingText(el).trim();

    const match = text.match(/^(.+?)\s+#(\d+)\s+#(new|patch|replace|delete|move|execute)(?:\s+(.+))?$/);
    if (!match) return;

    // Skip outer wrappers ¡ª prefer the innermost element with this text.
    const hasMatchingChild = [
      ...el.querySelectorAll(
        'code, p, .cm-content'
      )
    ].some(child => {
      return (
        _getParsingText(child).trim() ===
        text
      );
    });
    if (hasMatchingChild) return;
    if (seenTexts.has(text)) return;
    seenTexts.add(text);

    const [, path, id, operation, destinationPath] = match;
    const pos = getElementPosition(el);

    operationsMap.set(id, {
      path,
      id,
      operation,
      destinationPath: destinationPath || null,
      element: el,
      type: el.tagName.toLowerCase(),
      position: pos,
    });
  });

  const operations = [...operationsMap.values()];
  // Sort operations by DOM position so we can compute boundaries
  operations.sort((a, b) => a.position - b.position);

  // ©¤©¤ Pass 2: find hard stop positions ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  // A hard stop is any //codebase step summary.
  // Content blocks after the LAST hard stop are trailing prose ¡ª ignore them.

  const hardStopPositions = [];
  allElements.forEach(el => {
    // Only treat a block as a hard stop if //codebase #step-N is on the
    // first line ¡ª same rule as parse-apply.js and Pass 3 below.
    if (
      _getParsingStepNumber(el) !== null
    ) {
      const positionAnchor =
        _findPositionAnchor(el);

      hardStopPositions.push(
        getElementPosition(positionAnchor)
      );
    }
  });

  hardStopPositions.sort((a, b) => a - b);
  const lastHardStop = hardStopPositions.length > 0
    ? hardStopPositions[hardStopPositions.length - 1]
    : null;

  // ©¤©¤ Pass 3: collect content blocks ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  // Accepts <code> elements that either:
  //   (a) have a <pre> ancestor (old Elsa / new Elsa beta pre>div>div>code), OR
  //   (b) are inside a div.p-3 (new Elsa beta syntax-highlighted / HTML preview blocks)
  // Exclude anything after the last hard stop.
  // Record position of the outermost container for matching.

  const contentBlocks = [];

  const allCodes = [
    ...root.querySelectorAll(
      'code, .cm-content'
    )
  ].filter(el =>
    _hasPreAncestor(el)
  );

  allCodes.forEach(el => {
    const text =
      _getParsingText(el).trim();

    // Skip operation headers and step summaries.
    const isOperationHeader = text.match(/^([\/\w\/\.\-]+)\s+#(\d+)\s+#(new|patch|replace|delete|move|execute)(?:\s+(\/[\w\/\.\-]+))?\s*$/);

    const isStepSummary =
      _getParsingStepNumber(el) !== null ||
      /^\/\/codebase\s+#step-\d+/.test(text.split('\n')[0].trim());

    if (
      isOperationHeader ||
      isStepSummary ||
      text.length === 0
    ) {
      return;
    }

    const positionAnchor = _findPositionAnchor(el);
    const anchorPos = getElementPosition(positionAnchor);

    // Skip if after last hard stop NOT ANYMORE THIS IS OLD
    if (lastHardStop !== null && anchorPos > lastHardStop) {
      console.log(`[FORGE] SKIP (after hard stop) code block @ ${anchorPos}: "${text.substring(0, 40)}"`);
    }

    // Use _getCodeContent to correctly handle <br>-based newlines in
    // new Elsa beta syntax-highlighted blocks.
    const content = _getCodeContent(el);
    
    contentBlocks.push({ element: el, content, positionAnchor, position: anchorPos });
  });



  // ©¤©¤ Pass 4: match each operation to its content block ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  // For each operation, only consider content blocks that fall BETWEEN
  // this operation's position and the NEXT operation's position.
  // This prevents cascade stealing where one op grabs another's block.

  const remainingBlocks = [...contentBlocks];

  operations.forEach((op, opIndex) => {
    const nextOp = operations[opIndex + 1] || null;
    const opPos = op.position;
    const nextOpPos = nextOp ? nextOp.position : Infinity;

    if (op.operation === 'delete' || op.operation === 'move') {
      fileBlocks.push({
        path: op.path,
        id: op.id,
        operation: op.operation,
        content: null,
        element: op.element,
        type: op.type,
        destinationPath: op.destinationPath
      });
      return;
    }

    // Find closest content block strictly between opPos and nextOpPos
    let bestBlock = null;
    let bestDistance = Infinity;
    let bestIndex = -1;

    remainingBlocks.forEach((block, i) => {
      const blockPos = block.position;
      if (blockPos > opPos && blockPos < nextOpPos) {
        const distance = blockPos - opPos;
        if (distance < bestDistance) {
          bestDistance = distance;
          bestBlock = block;
          bestIndex = i;
        }
      }
    });

    if (bestBlock) {
      remainingBlocks.splice(bestIndex, 1);
      fileBlocks.push({
        path: op.path,
        id: op.id,
        operation: op.operation,
        content: bestBlock.content,
        element: op.element,
        type: op.type,
        destinationPath: op.destinationPath
      });
    } else if (op.operation === 'execute') {
      fileBlocks.push({
        path: op.path,
        id: op.id,
        operation: op.operation,
        content: null,
        element: op.element,
        type: op.type,
        destinationPath: op.destinationPath
      });
    } else {
      console.warn(`[FORGE]   ? NO content block found between positions ${opPos} and ${nextOpPos === Infinity ? 'end' : nextOpPos}`);
      console.warn(`[FORGE]     Remaining blocks in that range: ${remainingBlocks.filter(b => b.position > opPos && b.position < nextOpPos).length}`);
      console.error(`[FORGE] ?? FILTERED OUT: ${op.path} #${op.id} #${op.operation} ¡ª no content found`);
    }
  });

  return fileBlocks;
}

function getElementPosition(element) {
  if (elementPositionCache.has(element)) {
    return elementPositionCache.get(element);
  }
  const allElements = document.querySelectorAll('*');
  const position = Array.prototype.indexOf.call(allElements, element);
  elementPositionCache.set(element, position);
  return position;
}

/**
 * Mark a step summary's parent <details> block with a status indicator.
 */
function markStepStatus(stepNum, status, message) {
  // Find the step summary code block
  const allCode = document.querySelectorAll('code');
  let stepEl = null;
  
  for (const codeBlock of allCode) {
    const text = getCodeText(codeBlock) || '';
    const firstLine = text.split('\n')[0].trim();
    if (getStepNumber(codeBlock) === stepNum) {
      stepEl = codeBlock;
      break;
    }
  }
  
  if (!stepEl) return;
  
  // Walk up to find the <details> block
  let detailsEl = stepEl.closest('details');
  if (!detailsEl) return;
  
  const existingId = 'forge-step-status-' + stepNum;
  const existing = document.getElementById(existingId);
  if (existing) existing.remove();

  const statusEl = document.createElement('div');
  statusEl.id = existingId;
  statusEl.className = 'forge-operation-status';

  const colors = {
    success: { bg: '#1e4620', color: '#4caf50', icon: '?' },
    warning: { bg: '#4a3c1e', color: '#ffc107', icon: '??' },
    error:   { bg: '#4a1e1e', color: '#f44336', icon: '?' },
    pending: { bg: '#1e2a4a', color: '#2196f3', icon: '?' },
  };

  const style = colors[status] || colors.pending;

  statusEl.style.cssText =
    'padding:4px 10px;' +
    'margin-top:4px;' +
    'margin-bottom:12px;' +
    'border-radius:4px;' +
    'font-size:0.85em;' +
    'font-family:Segoe UI,sans-serif;' +
    'background:' + style.bg + ';' +
    'color:' + style.color + ';' +
    'border-left:3px solid ' + style.color + ';' +
    'display:inline-block;';

  setForgeHTML(statusEl, '<strong>FORGE:</strong> ' + style.icon + ' ' + (message || status));
  
  // Insert immediately after the <details> block
  if (detailsEl.parentNode) {
    detailsEl.parentNode.insertBefore(statusEl, detailsEl.nextSibling);
  }
}

/**
 * Mark an operation element with a status indicator in the page DOM.
 */
function markOperationStatus(blockInfo, status, message) {
  if (!blockInfo || !blockInfo.element) {
    console.warn('Cannot mark status: invalid blockInfo', blockInfo);
    return;
  }

  const element = blockInfo.element;

  // Strategy: walk up to find the nearest <details> block that contains
  // this operation header. Insert the badge after that <details> so each
  // operation gets its own badge in the right place in the chat.
  // If there's no <details> ancestor, fall back to the nearest <pre> or
  // block-level container.
  let insertAfter = null;
  let parent = null;

  const detailsAncestor = element.closest('details');
  if (detailsAncestor) {
    insertAfter = detailsAncestor;
    parent = detailsAncestor.parentNode;
  } else {
    // Fallback: walk up to nearest pre or block container
    insertAfter = element;
    parent = element.parentNode;
    while (parent) {
      const tag = parent.tagName ? parent.tagName.toLowerCase() : '';
      if (['div', 'section', 'article', 'main', 'li', 'td', 'body'].includes(tag)) {
        break;
      }
      if (['pre', 'blockquote'].includes(tag)) {
        insertAfter = parent;
        parent = parent.parentNode;
        break;
      }
      insertAfter = parent;
      parent = parent.parentNode;
    }
  }

  if (!parent) {
    console.warn('[FORGE] Could not find insertion point for status marker');
    return;
  }

  const existingId = 'forge-status-' + blockInfo.id;
  const existing = document.getElementById(existingId);
  if (existing) existing.remove();

  const statusEl = document.createElement('div');
  statusEl.id = existingId;
  statusEl.className = 'forge-operation-status';

  const colors = {
    success: { bg: '#1e4620', color: '#4caf50', icon: '?' },
    warning: { bg: '#4a3c1e', color: '#ffc107', icon: '??' },
    error:   { bg: '#4a1e1e', color: '#f44336', icon: '?' },
    pending: { bg: '#1e2a4a', color: '#2196f3', icon: '?' },
  };

  const style = colors[status] || colors.pending;

  statusEl.style.cssText =
    'padding:5px 12px;' +
    'margin:4px 0;' +
    'border-radius:4px;' +
    'font-size:0.85em;' +
    'font-family:Segoe UI,sans-serif;' +
    'background:' + style.bg + ';' +
    'color:' + style.color + ';' +
    'border-left:3px solid ' + style.color + ';' +
    'display:block;' +
    'max-width:100%;' +
    'box-sizing:border-box;';

  setForgeHTML(statusEl, style.icon + ' <strong>FORGE:</strong> ' + (message || status));

  try {
    parent.insertBefore(statusEl, insertAfter.nextSibling);
  } catch (e) {
    console.warn('[FORGE] Could not insert status element:', e);
  }
}

// ©¤©¤ Pure-text parser (Shadow DOM / clipboard fallback) ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

/**
 * Parse codebase operations from raw text (e.g. clipboard content).
 * Works without DOM access ¡ª useful when the chat uses a closed Shadow DOM.
 *
 * Returns { fileBlocks, steps } in the same shape _applyParsedBlocks expects.
 * fileBlocks entries have no .element or .type (DOM-only fields).
 */
function _parseCodebaseFromRawText(fullText) {
  const fileBlocks = [];
  const steps      = [];

  if (!fullText || typeof fullText !== 'string') return { fileBlocks, steps };

  // Normalize CRLF to LF so all regexes work regardless of clipboard source
  fullText = fullText.replace(/\r\n/g, '\n');

  // ©¤©¤ Step summaries ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  const stepChunks =
    fullText.split('```');


  // Only fenced runner blocks may declare a FORGE step. Source files,
  // patches, diagnostics, and tests can legitimately mention step markers.
  for (
    let i = 1;
    i < stepChunks.length;
    i += 2
  ) {
    const chunk =
      stepChunks[i].trim();


    if (!chunk) {
      continue;
    }


    const lines =
      chunk.split('\n');


    let markerMatch = null;
    let markerIndex = null;


    // Depending on how the fence was captured, the marker is either the
    // first line or follows a language identifier such as "javascript".
    for (const index of [0, 1]) {
      const candidate =
        lines[index]?.trim() || '';


      const match =
        candidate.match(
          /^\/\/codebase\s+#step-(\d+)\b/
        );


      if (match) {
        markerMatch = match;
        markerIndex = index;
        break;
      }
    }


    if (
      !markerMatch ||
      markerIndex === null
    ) {
      continue;
    }


    const stepNum =
      parseInt(
        markerMatch[1],
        10
      );


    if (!Number.isFinite(stepNum)) {
      continue;
    }


    steps.push({
      stepNum,
      text:
        lines
          .slice(markerIndex)
          .join('\n')
          .trim()
    });
  }

  // ©¤©¤ Parse code blocks ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  // Split by ``` fences, process pairs: header + content
  const chunks = fullText.split('```');
  
  const pathLineRe = /^(\/[\w/.\-]+)\s+#(\d+)\s+#(new|patch|replace|delete|move|execute)(?:\s+(\/[\w/.\-]+))?\s*$/;
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i].trim();
    
    // Check if this is a header block
    if (chunk.startsWith('header')) {
      const lines = chunk.split('\n');
      const pathLine = lines[1]?.trim();
      if (!pathLine) continue;
      
      const pm = pathLine.match(pathLineRe);
      if (!pm) continue;
      
      const [, path, id, operation, destinationPath] = pm;
      
      // For delete/move, no content needed
      if (operation === 'delete' || operation === 'move') {
        fileBlocks.push({ path, id, operation, content: null, destinationPath: destinationPath || null, element: null, type: 'text' });
        continue;
      }
      
      // Look for the next non-empty chunk as content
      let content = null;
      for (let j = i + 1; j < chunks.length; j++) {
        const nextChunk = chunks[j].trim();
        if (!nextChunk) continue;

        // Skip the first line (language identifier like "javascript" or "patch")
        const contentLines = nextChunk.split('\n');
        const firstLine = contentLines[0] ? contentLines[0].trim() : '';

        // Skip step runner blocks ¡ª they are never file content
        if (/^\/\/codebase\s+#step-\d+/.test(firstLine)) break;

        // Skip operation headers
        if (/^\/[\w/.\\-]+\s+#\d+\s+#(new|patch|replace|delete|move|execute)/.test(firstLine)) break;

        contentLines.shift(); // remove language identifier line
        content = contentLines.join('\n').trim();
        break;
      }
      
      if (content || operation === 'execute') {
        fileBlocks.push({ path, id, operation, content, destinationPath: destinationPath || null, element: null, type: 'text' });
      } else {
        console.warn(`[FORGE] _parseCodebaseFromRawText: no content found for #${id} ${operation} ${path}`);
      }
    }
  }

  console.log(`[FORGE] _parseCodebaseFromRawText: ${fileBlocks.length} ops, ${steps.length} steps`);
  return { fileBlocks, steps };
}
// FORGE CODE - Toast Notifications
// Shows temporary notification messages

function showToast(message, duration = 2000) {
  const toast = document.createElement('div');
  toast.className = 'forge-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Remove after duration
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
// FORGE CODE - Dock Mode
// Docks the FORGE panel to the right side of the Elsa UI,
// pushing the chat content left to make room.
//
// Old Elsa (MUI) strategy:
//   1. Find .MuiDrawer-root.MuiDrawer-docked ¡ú nextElementSibling
//   2. Find .MuiContainer-root.MuiContainer-maxWidthMd inside it
//   3. Walk up to nearest MuiStack-root ancestor (absoluteStack)
//   4. Set absoluteStack position to 'relative'
//   5. Add paddingRight to drawerSibling equal to panel width
//
// New Elsa (beta 4.0) strategy:
//   1. Find div#root > :first-child
//   2. Add paddingRight equal to panel width

const DOCK_WIDTH = 420;
const DOCK_STORAGE_KEY = 'forge-docked';
const DOCK_STYLE_ID = 'forge-dock-style';

/**
 * Inject a persistent <style> rule for adapter-based dock targets.
 * Using a stylesheet survives DOM rebuilds that would wipe inline styles.
 */
function _injectDockStyle(selector, width, shadowRoot) {
  _removeDockStyle();
  const style = document.createElement('style');
  style.id = DOCK_STYLE_ID;
  style.textContent = selector + ' { padding-right: ' + width + 'px !important; box-sizing: border-box !important; }';
  // If a shadow root is provided, inject there; otherwise fall back to page head
  if (shadowRoot) {
    shadowRoot.appendChild(style);
    // Also store a reference so we can remove it later
    shadowRoot._forgeDockStyle = style;
  } else {
    document.head.appendChild(style);
  }
}

function _removeDockStyle() {
  // Remove from page head
  const existing = document.getElementById(DOCK_STYLE_ID);
  if (existing) existing.remove();
  // Also remove from any shadow root we injected into
  document.querySelectorAll('*').forEach(el => {
    if (el.shadowRoot && el.shadowRoot._forgeDockStyle) {
      el.shadowRoot._forgeDockStyle.remove();
      delete el.shadowRoot._forgeDockStyle;
    }
  });
}

/**
 * Detect which Elsa version we're running in.
 * Old Elsa (MUI): div#root > div has a class starting with 'css-'
 * New Elsa (beta 4.0): div#root > div has no such class
 * Returns 'old', 'new', or 'unknown'.
 */
function _detectElsaVersion() {
  const root = document.querySelector('div#root');
  if (!root) return 'unknown';
  const firstChild = root.firstElementChild;
  if (!firstChild) return 'unknown';
  const hasCssClass = [...firstChild.classList].some(c => c.startsWith('css-'));
  return hasCssClass ? 'old' : 'new';
}

let _dockState = {
  active: false,
  elsaVersion: null,
  // Old Elsa targets
  drawerSibling: null,
  absoluteStack: null,
  originalSiblingPadding: '',
  originalAbsoluteStackPosition: '',
  // New Elsa targets
  rootChild: null,
  originalRootChildPadding: '',
  // Claude HHS / adapter targets
  claudeMainContent: null,
  originalClaudePadding: '',
};

/**
 * Find the DOM elements needed for docking.
 */
function _findDockTargets() {
  // Ask the active adapter first ¡ª it knows its own DOM
  if (window.forgeAdapter && typeof window.forgeAdapter.getDockTarget === 'function') {
    const el = window.forgeAdapter.getDockTarget();
    if (el) {
      console.log('[FORGE Dock] Using adapter dock target:', el.id || el.className || el.tagName);
      return { adapterTarget: el, elsaVersion: 'adapter' };
    }

  }

  const version = _detectElsaVersion();
  console.log('[FORGE Dock] Detected Elsa version:', version);

  if (version === 'new') {
    const root = document.querySelector('div#root');
    const rootChild = root ? root.firstElementChild : null;
    if (!rootChild) {
      console.warn('[FORGE Dock] New Elsa: could not find div#root > :first-child');
      return null;
    }
    return { rootChild, elsaVersion: 'new' };
  }

  // Old Elsa ¡ª existing MUI strategy
  const drawer = document.querySelector('.MuiDrawer-root.MuiDrawer-docked');
  if (!drawer) {
    console.warn('[FORGE Dock] Could not find MuiDrawer-root.MuiDrawer-docked');
    return null;
  }

  const drawerSibling = drawer.nextElementSibling;
  if (!drawerSibling) {
    console.warn('[FORGE Dock] No sibling after drawer');
    return null;
  }

  const container = drawerSibling.querySelector(
    '.MuiContainer-root.MuiContainer-maxWidthMd'
  );

  let absoluteStack = null;
  if (container) {
    let el = container.parentElement;
    while (el && el !== drawerSibling) {
      if (el.classList.contains('MuiStack-root')) {
        absoluteStack = el;
        break;
      }
      el = el.parentElement;
    }
  }

  if (!absoluteStack) {
    console.warn('[FORGE Dock] Could not find absoluteStack ¡ª docking without position fix');
  }

  return { drawerSibling, absoluteStack, elsaVersion: 'old' };
}

/**
 * Dock the FORGE panel to the right side.
 */
function dockUI() {
  if (_dockState.active) return;

  const targets = _findDockTargets();
  if (!targets) {
    showToast('?? Could not dock ¡ª Elsa UI structure not recognized', 3000);
    return;
  }

  _dockState.elsaVersion = targets.elsaVersion;

  if (targets.elsaVersion === 'adapter') {
    const { adapterTarget } = targets;
    _dockState.claudeMainContent = adapterTarget;
    _dockState.originalClaudePadding = adapterTarget.style.paddingRight || '';
    _dockState.active = true;

    // Check if the adapter knows about a shadow root for style injection
    const shadowRoot = (window.forgeAdapter && typeof window.forgeAdapter.getDockShadowRoot === 'function')
      ? window.forgeAdapter.getDockShadowRoot()
      : null;

    // Build a CSS selector for the dock target
    const sel = adapterTarget.id
      ? '#' + adapterTarget.id
      : ('.' + (adapterTarget.className || '').trim().split(/\s+/).filter(c => c && !c.includes('[')).join('.'));

    if (sel && sel !== '.') {
      // Inject into shadow root if available, otherwise page head
      _injectDockStyle(sel, DOCK_WIDTH, shadowRoot);
    } else {
      // Fallback to inline style (works regardless of shadow DOM)
      adapterTarget.style.paddingRight = DOCK_WIDTH + 'px';
      adapterTarget.style.boxSizing = 'border-box';
      adapterTarget.style.transition = 'padding-right 0.3s ease';
    }
  } else if (targets.elsaVersion === 'new') {
    const { rootChild } = targets;
    _dockState.rootChild = rootChild;
    _dockState.originalRootChildPadding = rootChild.style.paddingRight || '';
    _dockState.active = true;

    rootChild.style.paddingRight = `${DOCK_WIDTH}px`;
    rootChild.style.boxSizing = 'border-box';
    rootChild.style.transition = 'padding-right 0.3s ease';
  } else {
    const { drawerSibling, absoluteStack } = targets;
    _dockState.drawerSibling = drawerSibling;
    _dockState.absoluteStack = absoluteStack;
    _dockState.originalSiblingPadding = drawerSibling.style.paddingRight || '';
    _dockState.originalAbsoluteStackPosition = absoluteStack ? absoluteStack.style.position || '' : '';
    _dockState.active = true;

    drawerSibling.style.paddingRight = `${DOCK_WIDTH}px`;
    drawerSibling.style.boxSizing = 'border-box';
    drawerSibling.style.transition = 'padding-right 0.3s ease';

    if (absoluteStack) {
      absoluteStack.style.position = 'relative';
    }
  }

  const ui = document.getElementById('forge-quick-ui');
  if (ui) {
    ui.style.position = 'fixed';
    ui.style.left = 'auto';
    ui.style.top = '0';
    ui.style.right = '0';
    ui.style.bottom = '0';
    ui.style.transform = '';
  }

  ForgeActions.setMode('docked');
  localStorage.setItem(DOCK_STORAGE_KEY, '1');
  _updateDockButton();
  console.log('[FORGE Dock] Docked successfully');
}

/**
 * Undock the FORGE panel, restoring original layout.
 * @param {boolean} silent - if true, don't show toast
 */
function undockUI(silent) {
  if (!_dockState.active) return;

  if (_dockState.elsaVersion === 'adapter') {
    _removeDockStyle();
    if (_dockState.claudeMainContent) {
      _dockState.claudeMainContent.style.paddingRight = _dockState.originalClaudePadding;
      _dockState.claudeMainContent.style.boxSizing = '';
      _dockState.claudeMainContent.style.transition = '';
    }
    _dockState.claudeMainContent = null;
  } else if (_dockState.elsaVersion === 'new') {
    if (_dockState.rootChild) {
      _dockState.rootChild.style.paddingRight = _dockState.originalRootChildPadding;
      _dockState.rootChild.style.boxSizing = '';
      _dockState.rootChild.style.transition = '';
    }
    _dockState.rootChild = null;
  } else {
    if (_dockState.drawerSibling) {
      _dockState.drawerSibling.style.paddingRight = _dockState.originalSiblingPadding;
      _dockState.drawerSibling.style.boxSizing = '';
      _dockState.drawerSibling.style.transition = '';
    }
    if (_dockState.absoluteStack) {
      _dockState.absoluteStack.style.position = _dockState.originalAbsoluteStackPosition;
    }
    _dockState.drawerSibling = null;
    _dockState.absoluteStack = null;
  }

  _dockState.active = false;
  _dockState.elsaVersion = null;

  const ui = document.getElementById('forge-quick-ui');
  if (ui) {
    // Clear inline position styles set during dockUI()
    ui.style.position  = '';
    ui.style.left      = '';
    ui.style.top       = '';
    ui.style.right     = '';
    ui.style.bottom    = '';
    ui.style.transform = '';
  }

  ForgeActions.setMode('normal');
  localStorage.removeItem(DOCK_STORAGE_KEY);
  _updateDockButton();

  if (!silent) showToast('?? Undocked', 2000);
  console.log('[FORGE Dock] Undocked');
}

/**
 * Toggle dock mode.
 */
function toggleDock() {
  if (_dockState.active) {
    undockUI(false);
  } else {
    dockUI();
  }
}

/**
 * Update the dock button appearance.
 */
function _updateDockButton() {
  const btn = document.getElementById('forge-dock-btn');
  if (!btn) return;
  btn.title = _dockState.active ? 'Undock panel' : 'Dock to right side';
  btn.style.background = _dockState.active
    ? 'rgba(102, 126, 234, 0.4)'
    : 'rgba(255,255,255,0.2)';
}

/**
 * Restore dock state from localStorage on init.
 * Called after UI is created.
 */
function restoreDockState() {
  if (localStorage.getItem(DOCK_STORAGE_KEY) === '1') {
    setTimeout(() => {
      dockUI();
    }, 300);
  }
}
// FORGE CODE - UI Update Functions
// Selective reactive render subscriptions + imperative explorer helpers.
//
// HOW IT WORKS
// ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
// Stable control regions subscribe to only the state slices they render.
// Repository publications and ForgeActions therefore update affected regions
// without re-running every DOM renderer.
//
// The file explorer remains imperative because it creates event-bound DOM and
// reads repository file content. A narrow updateSendBackDisplay() bridge remains
// for generated/manual scripts that execute outside the normal action path.
// a big-bang rewrite.

// ©¤©¤ Main reactive render function ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

/**
 * The single source of truth for UI rendering.
 * Called automatically whenever ForgeState.setState() is invoked.
 * Reads from `state` ¡ª never from `repo` directly.
 */
function renderForge(state) {
  console.log("is this called?");
  _renderMode(state);
  _renderStatusBar(state);
  _renderProjectTitle(state);
  _renderPreferences(state);
  _renderTemperature(state);
  _renderSendBackSection(state);
  _renderVisibilityToggles(state);
  _renderUndoRedo(state);
}

function _renderMode(state) {
  const ui = document.getElementById('forge-quick-ui');
  if (!ui) return;

  const mode = ['normal', 'maximized', 'minimized', 'docked'].includes(state.mode)
    ? state.mode
    : 'normal';

  ui.classList.remove(
    'forge-ui-normal',
    'forge-ui-maximized',
    'forge-ui-minimized',
    'forge-ui-docked'
  );
  ui.classList.add(`forge-ui-${mode}`);
}

function _renderPreferences(state) {
  const uploadCheckbox = document.getElementById('forge-upload-checkbox');
  const uploadLabel = document.getElementById('forge-upload-label');

  if (uploadCheckbox) {
    uploadCheckbox.checked = !!state.uploadArmed;
  }

  if (uploadLabel) {
    uploadLabel.textContent = state.uploadArmed
      ? '?? Armed ¡ª send a message to attach'
      : '?? Attach repo + protocol to next message';
    uploadLabel.style.color = state.uploadArmed ? '#4caf50' : '';
  }

  const summaryCheckbox = document.getElementById('forge-summary-only-checkbox');
  const summaryLabel = document.getElementById('forge-summary-only-label');

  if (summaryCheckbox) {
    summaryCheckbox.checked = !!state.summaryOnly;
    summaryCheckbox.disabled = !state.uploadArmed;
  }

  if (summaryLabel) {
    summaryLabel.style.opacity = state.uploadArmed ? '1' : '0.4';
    summaryLabel.style.color = state.summaryOnly ? '#4caf50' : '';
  }

  const codingCheckbox = document.getElementById('forge-coding-prompt-checkbox');
  const codingLabel = document.getElementById('forge-coding-prompt-label');

  if (codingCheckbox) {
    codingCheckbox.checked = !!state.includeCodingPrompt;
  }

  if (codingLabel) {
    codingLabel.style.color = state.includeCodingPrompt ? '#4caf50' : '';
  }

  const autoPilotBtn = document.getElementById('forge-autopilot-btn');
  if (autoPilotBtn) {
    autoPilotBtn.textContent = state.autoPilotEnabled ? '?? ON' : '?? OFF';
    autoPilotBtn.style.background = state.autoPilotEnabled ? '#4caf50' : '';
    autoPilotBtn.style.color = state.autoPilotEnabled ? 'white' : '';
  }

  document.querySelectorAll('.forge-heartbeat-indicator').forEach(element => {
    element.style.display = state.heartbeatEnabled ? 'inline' : 'none';
  });
}

function _renderTemperature(state) {
  const slider = document.getElementById('forge-temp-slider');
  const display = document.getElementById('forge-temp-display');

  if (slider && Number(slider.value) !== Number(state.currentTemp)) {
    slider.value = state.currentTemp;
  }

  if (display) {
    display.textContent = Number(state.currentTemp || 0).toFixed(1);
  }

  document.querySelectorAll('.forge-temp-status').forEach(element => {
    element.textContent = state.tempEnabled ? 'ON' : 'OFF';
    element.style.color = state.tempEnabled ? '#4caf50' : '';
  });

  document.querySelectorAll('.forge-temp-toggle').forEach(element => {
    element.textContent = state.tempEnabled ? '¡ñ' : '¡ð';
    element.style.background = state.tempEnabled ? '#4caf50' : '#3e3e42';
    element.title = state.tempEnabled
      ? 'Disable temperature control'
      : 'Enable temperature control';
  });
}

function _formatRepoSize(files) {
  let bytes = 0;
  for (const content of Object.values(files)) {
    bytes += (content || '').length;
  }
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function _renderStatusBar(state) {
  const currentStepEl = document.getElementById('forge-current-step');
  if (currentStepEl) currentStepEl.textContent = state.currentStep + 1;

  const fileCountEl = document.getElementById('forge-file-count');
  if (fileCountEl) {
    const count = Object.keys(state.files).length;
    const size = count > 0 ? ' ¡¤ ' + _formatRepoSize(state.files) : '';
    fileCountEl.textContent = count + ' files' + size;
    if (count > 0) {
      fileCountEl.style.cursor = 'pointer';
      fileCountEl.style.textDecoration = 'underline dotted';
      fileCountEl.style.color = '#4fc3f7';
      fileCountEl.title = 'Click to browse repo files';
      fileCountEl.onclick = () => {
        if (typeof showRepoExplorerModal === 'function') showRepoExplorerModal();
      };
    } else {
      fileCountEl.style.cursor = '';
      fileCountEl.style.textDecoration = '';
      fileCountEl.style.color = '';
      fileCountEl.title = '';
      fileCountEl.onclick = null;
    }
  }

  const nextStep = state.lastProcessedStep + 1;
  const nextStepInput = document.getElementById('forge-next-step-input');
  if (nextStepInput) {
    nextStepInput.value = nextStep;
    nextStepInput.title = `Tell ${getPlatformName()}: "Use step-${nextStep} for your changes"`;
  }
}

function _renderProjectTitle(state) {
  const title = state.projectTitle || (typeof generateProjectName === 'function' ? generateProjectName() : 'untitledProject');
  // Only write to DOM if value actually changed (avoids cursor-jump while user is typing)
  const el1 = document.getElementById('forge-project-title');
  if (el1 && el1.value !== title) el1.value = title;
}

function _renderUndoRedo(state) {
  const hasHistory = state.versions && state.versions.length > 1;
  const atStart = !hasHistory || state.currentStep === 0;
  const atEnd   = !hasHistory || state.currentStep >= state.versions.length - 1;

  const undoBtn = document.getElementById('forge-prev-step');
  const redoBtn = document.getElementById('forge-next-step');

  if (undoBtn) {
    undoBtn.disabled = atStart;
    undoBtn.style.opacity = atStart ? '0.4' : '';
    undoBtn.style.cursor  = atStart ? 'not-allowed' : '';
  }
  if (redoBtn) {
    redoBtn.disabled = atEnd;
    redoBtn.style.opacity = atEnd ? '0.4' : '';
    redoBtn.style.cursor  = atEnd ? 'not-allowed' : '';
  }
}

function _renderVisibilityToggles(state) {
  const hasProject = state.hasProject;
  const inWelcomeMode = state.welcomeMode && !hasProject;

  const welcomeBanner  = document.getElementById('forge-welcome-banner');
  const fullView       = document.getElementById('forge-full-view');
  const forgeOut       = document.getElementById('forge-out-section');
  const projectActions = document.getElementById('forge-project-actions');
  const quickDownload  = document.getElementById('forge-quick-download-btn');
  if (welcomeBanner)  welcomeBanner.style.display  = inWelcomeMode ? '' : 'none';
  if (fullView)       fullView.style.display       = inWelcomeMode ? 'none' : '';

  // These only make sense once a project exists
  if (forgeOut)       forgeOut.style.display       = hasProject ? '' : 'none';
  if (projectActions) projectActions.style.display = hasProject ? '' : 'none';
  if (quickDownload)  quickDownload.style.display  = hasProject ? '' : 'none';
}

function _renderSendBackSection(state) {
  const queue   = state.sendBackQueue || [];
  const isSent  = state.sendBackSent || false;
  const showSendBack = queue.length > 0;

  // sendBack section visibility
  const sb1 = document.getElementById('forge-sendback-section');
  if (sb1) sb1.style.display = showSendBack ? 'block' : 'none';

  // Send-to-LLM button
  const platformName = (typeof getPlatformName === 'function') ? getPlatformName() : 'LLM';
  const btn = document.getElementById('forge-send-to-elsa-btn');
  if (btn) {
    if (queue.length === 0) {
      btn.disabled = true;
      btn.textContent = `?? Send Results to ${platformName}`;
      btn.style.background = '';
      btn.style.borderColor = '';
      btn.style.color = '';
    } else if (isSent) {
      btn.disabled = true;
      btn.textContent = `? Sent to ${platformName}`;
      btn.style.background = '#1e4620';
      btn.style.borderColor = '#1e4620';
      btn.style.color = '#a5d6a7';
    } else {
      btn.disabled = false;
      btn.textContent = `?? Send Results to ${platformName}`;
      btn.style.background = '';
      btn.style.borderColor = '';
      btn.style.color = '';
    }
  }

  if (!showSendBack) return;

  _renderQueue('forge-sendback-results', queue);
}

function _renderQueue(containerId, queue) {
  const container = document.getElementById(containerId);
  if (!container) return;

  setForgeHTML(container, '');

  queue.forEach((entry, i) => {
    const itemDiv = document.createElement('div');
    itemDiv.style.marginBottom = '8px';
    itemDiv.style.borderBottom = i < queue.length - 1 ? '1px solid #1a7a3a' : 'none';
    itemDiv.style.paddingBottom = i < queue.length - 1 ? '8px' : '0';

    const headerDiv = document.createElement('div');
    headerDiv.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;';

    const titleSpan = document.createElement('span');
    titleSpan.style.cssText = 'font-weight:bold;color:#81c784;';
    let previewText = entry.status ? ` [${entry.status}]` : (entry.type ? ` [${entry.type}]` : '');
    titleSpan.textContent = `Result ${i + 1}${previewText}`;

    const btnGroup = document.createElement('div');
    btnGroup.style.cssText = 'display:flex;gap:4px;';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'forge-btn forge-btn-secondary forge-btn-small';
    toggleBtn.style.cssText = 'margin:0;padding:2px 6px;font-size:9px;';
    toggleBtn.textContent = '??? Show';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'forge-btn forge-btn-secondary forge-btn-small';
    copyBtn.style.cssText = 'margin:0;padding:2px 6px;font-size:9px;';
    copyBtn.textContent = '?? Copy';
    copyBtn.onclick = () => {
      copyToClipboard(JSON.stringify(entry, null, 2));
      showToast('?? Copied result to clipboard');
    };

    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'forge-btn forge-btn-secondary forge-btn-small';
    dismissBtn.style.cssText = 'margin:0;padding:2px 6px;font-size:9px;color:#858585;';
    dismissBtn.textContent = '¡Á';
    dismissBtn.title = 'Dismiss this result';
    dismissBtn.onclick = () => {
      ForgeActions.removeSendBackEntry(i);
    };

    btnGroup.appendChild(toggleBtn);
    btnGroup.appendChild(copyBtn);
    btnGroup.appendChild(dismissBtn);

    if (entry.script) {
      const runBtn = document.createElement('button');
      runBtn.className = 'forge-btn forge-btn-send forge-btn-small';
      runBtn.style.cssText = 'margin:0;padding:2px 6px;font-size:9px;';
      runBtn.textContent = '?? Copy Script';
      runBtn.title = 'Copy the runnable code ¡ª paste into DevTools console and run';
      runBtn.onclick = () => {
        copyToClipboard(entry.script);
        showToast('?? Script copied ¡ª paste into DevTools console and run');
      };
      btnGroup.appendChild(runBtn);
    }

    headerDiv.appendChild(titleSpan);
    headerDiv.appendChild(btnGroup);

    const pre = document.createElement('pre');
    pre.style.cssText = 'margin:4px 0 0 0;white-space:pre-wrap;word-break:break-word;color:#a5d6a7;display:none;';
    pre.textContent = JSON.stringify(entry, null, 2);

    toggleBtn.onclick = () => {
      if (pre.style.display === 'none') {
        pre.style.display = 'block';
        toggleBtn.textContent = '?? Hide';
      } else {
        pre.style.display = 'none';
        toggleBtn.textContent = '??? Show';
      }
    };

    itemDiv.appendChild(headerDiv);
    itemDiv.appendChild(pre);
    container.appendChild(itemDiv);
  });
}

// ©¤©¤ Selective render subscriptions ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

function _subscribeRenderer(selector, renderer) {
  return ForgeState.subscribeSelector(
    selector,
    (selection, state) => {
      renderer(state, selection);
    }
  );
}

_subscribeRenderer(
  state => state.mode,
  _renderMode
);

_subscribeRenderer(
  state => [
    Object.keys(state.files || {}).length,
    state.currentStep,
    state.lastProcessedStep
  ],
  _renderStatusBar
);

_subscribeRenderer(
  state => state.projectTitle,
  _renderProjectTitle
);

_subscribeRenderer(
  state => [
    state.autoPilotEnabled,
    state.heartbeatEnabled,
    state.uploadArmed,
    state.summaryOnly,
    state.includeCodingPrompt
  ],
  _renderPreferences
);

_subscribeRenderer(
  state => [
    state.tempEnabled,
    state.currentTemp
  ],
  _renderTemperature
);

_subscribeRenderer(
  state => [
    state.sendBackQueue,
    state.sendBackSent
  ],
  _renderSendBackSection
);

_subscribeRenderer(
  state => [state.hasProject,state.welcomeMode],
  _renderVisibilityToggles
);

_subscribeRenderer(
  state => [state.syncConnected, state.syncArmed],
  (state) => {
    const { syncConnected, syncArmed } = state;
    const statusEl  = document.getElementById('forge-sync-status');
    const checkbox  = document.getElementById('forge-sync-checkbox');
    const pullBtn   = document.getElementById('forge-sync-pull-btn');
    const pushBtn   = document.getElementById('forge-sync-push-btn');
    const labelEl   = document.getElementById('forge-sync-label');

    if (!statusEl) return;

    if (!syncConnected) {
      statusEl.textContent   = 'offline';
      statusEl.style.background = '#3e3e42';
      statusEl.style.color   = '#858585';
      if (checkbox) checkbox.checked = false;
      if (pullBtn)  pullBtn.style.display  = 'none';
      if (pushBtn)  pushBtn.style.display  = 'none';
    } else if (syncArmed) {
      statusEl.textContent   = 'syncing';
      statusEl.style.background = '#1e4620';
      statusEl.style.color   = '#4caf50';
      if (checkbox) checkbox.checked = true;
      if (pullBtn)  pullBtn.style.display  = '';
      if (pushBtn)  pushBtn.style.display  = '';
    } else {
      statusEl.textContent   = 'paused';
      statusEl.style.background = '#2a2a1e';
      statusEl.style.color   = '#ffc107';
      if (checkbox) checkbox.checked = false;
      if (pullBtn)  pullBtn.style.display  = '';
      if (pushBtn)  pushBtn.style.display  = '';
    }

    if (labelEl) {
      labelEl.style.color = syncArmed ? '#4caf50' : '';
    }
  }
);

_subscribeRenderer(
  state => [
    state.currentStep,
    Array.isArray(state.versions)
      ? state.versions.length
      : 0
  ],
  _renderUndoRedo
);

_subscribeRenderer(
  state => {
    const active = state.mode === 'maximized';

    if (!active) {
      return { active: false };
    }

    const files = state.files || {};
    const fileMeta = state.fileMeta || {};
    const fileSignature = Object.keys(files)
      .sort()
      .map(path => {
        const meta = fileMeta[path] || {};

        return [
          path,
          meta.excluded ? '1' : '0',
          meta.encoding || '',
          meta.url || '',
          meta.description || ''
        ].join('\u0000');
      })
      .join('\u0001');

    const version = Array.isArray(state.versions)
      ? state.versions[state.currentStep]
      : null;

    const changedSignature =
      version && Array.isArray(version.changes)
        ? version.changes
            .map(change => change.path)
            .sort()
            .join('\u0001')
        : '';

    return {
      active: true,
      fileSignature,
      changedSignature,
      selectedPath: state.selectedPath
    };
  },
  updateFileList
);



// ©¤©¤ Manual execution compatibility bridge ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
// Generated/manual execution scripts still call this global name after running.
// Normal repository and queue operations publish their own state changes.
function updateSendBackDisplay() {
  ForgeActions.syncResults();
}

// ©¤©¤ Non-reactive helpers (still read from DOM/state directly) ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

/**
 * Update the Auto-Pilot activity strip with the result of the latest auto-pilot run.
 */
function updateAutoPilotStrip(stepNum, opCount, errCount) {
  const strip = document.getElementById('forge-autopilot-strip');
  if (!strip) return;

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const icon = errCount > 0 ? '??' : '?';
  const errNote = errCount > 0 ? ` ¡¤ ${errCount} error(s)` : '';
  strip.textContent = `?? Step ${stepNum} applied ${icon} ${opCount} op${opCount !== 1 ? 's' : ''}${errNote} ¡¤ ${timeStr}`;
  strip.style.display = '';
  strip.style.borderColor = errCount > 0 ? '#b8860b' : '#1a7a3a';
  strip.style.color = errCount > 0 ? '#ffc107' : '#4caf50';
  strip.style.background = errCount > 0 ? '#1a1400' : '#0e1f0e';

  // Re-trigger the fade-in animation
  strip.style.animation = 'none';
  strip.offsetHeight; // reflow
  strip.style.animation = '';
}

/**
 * Flash the "Step X applied" text in the status bar briefly green.
 */
function flashStepCounter() {
  const els = document.querySelectorAll('.forge-status-step');
  els.forEach(el => {
    el.classList.add('forge-flash');
    setTimeout(() => el.classList.remove('forge-flash'), 900);
  });
}

function updateSourceNav() {
  const nav = document.getElementById('forge-source-nav');
  const label = document.getElementById('forge-source-nav-label');
  const prevBtn = document.getElementById('forge-source-nav-prev');
  const nextBtn = document.getElementById('forge-source-nav-next');
  if (!nav) return;

  const ops = (typeof getSourceOpsList === 'function') ? getSourceOpsList() : [];

  if (!ops || ops.length === 0) {
    nav.style.display = 'none';
    return;
  }

  const idx = ForgeState.getState().sourceNavIndex;
  const clamped = Math.max(0, Math.min(ops.length - 1, idx));

  if (clamped !== idx) {
    ForgeActions.setSourceNavIndex(clamped);
  }

  nav.style.display = 'flex';
  label.textContent = '?? ' + (clamped + 1) + '/' + ops.length;
  prevBtn.disabled = clamped === 0;
  nextBtn.disabled = clamped === ops.length - 1;
}

// ©¤©¤ File list + content viewer (maximized view) ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

/**
 * Return a status icon for a file path based on its metadata.
 */
function getFileIcon(path) {
  const meta = repo.getMeta(path);
  if (meta.excluded)              return '??';
  if (meta.encoding === 'base64') return '??';
  if (meta.url)                   return '??';
  if (meta.description)           return '??';
  return '';
}

/**
 * Return a tooltip string for a file path based on its metadata.
 */
function getFileTooltip(path) {
  const meta = repo.getMeta(path);
  const parts = [];
  if (meta.excluded)    parts.push('Excluded stub');
  if (meta.description) parts.push(meta.description);
  if (meta.url)         parts.push(`URL: ${meta.url}`);
  if (meta.encoding)    parts.push(`Encoding: ${meta.encoding}`);
  return parts.join(' ¡¤ ') || path;
}

function updateFileList(state) {
  if (!state || state.mode !== 'maximized') return;

  const fileList =
    document.getElementById('forge-file-list');

  if (!fileList) return;

  setForgeHTML(fileList, '');

  const files = state.files || {};
  const fileMeta = state.fileMeta || {};
  const requestedPath =
    state.selectedPath || '<full repo>';

  const selectedPath =
    requestedPath === '<full repo>' ||
    Object.prototype.hasOwnProperty.call(
      files,
      requestedPath
    )
      ? requestedPath
      : '<full repo>';

  const changedFiles = new Set();
  const version = Array.isArray(state.versions)
    ? state.versions[state.currentStep]
    : null;

  if (version && Array.isArray(version.changes)) {
    version.changes.forEach(change => {
      if (change && change.path) {
        changedFiles.add(change.path);
      }
    });
  }

  const fullRepoItem = document.createElement('div');
  fullRepoItem.className =
    'forge-file-item forge-file-item-full-repo';
  fullRepoItem.textContent = '<full repo>';
  fullRepoItem.dataset.path = '<full repo>';

  if (selectedPath === '<full repo>') {
    fullRepoItem.classList.add('selected');
  }

  fullRepoItem.addEventListener('click', () => {
    ForgeActions.setSelectedPath('<full repo>');
  });

  fileList.appendChild(fullRepoItem);

  Object.keys(files)
    .sort()
    .forEach(path => {
      const item = document.createElement('div');
      const meta = fileMeta[path] || {};
      const isExcluded = !!meta.excluded;
      const isBinary = meta.encoding === 'base64';

      item.className = 'forge-file-item';

      if (changedFiles.has(path)) {
        item.classList.add(
          'forge-file-item-changed'
        );
      }

      if (isExcluded) {
        item.classList.add(
          'forge-file-item-excluded'
        );
      }

      if (isBinary) {
        item.classList.add(
          'forge-file-item-binary'
        );
      }

      if (selectedPath === path) {
        item.classList.add('selected');
      }

      item.dataset.path = path;
      item.title = getFileTooltip(path);

      const icon = getFileIcon(path);

      setForgeHTML(
        item,
        icon
          ? `<span class="forge-file-icon">${icon}</span><span class="forge-file-name">${escapeHtml(path)}</span>`
          : `<span class="forge-file-name">${escapeHtml(path)}</span>`
      );

      item.addEventListener('click', () => {
        ForgeActions.setSelectedPath(path);
      });

      fileList.appendChild(item);
    });
}
// FORGE CODE - Modal Functions
// All modal dialogs (import, help, error, progress, confirmation)

/**
 * Build a human-readable patch failure message suitable for sending back to Elsa.
 * Uses dynamically constructed triple-backtick to avoid breaking Elsa's code fence parser.
 */
function _buildPatchFailureMessage(errorInfo) {
  const TB = '`' + '`' + '`';

  const lines = [];
  lines.push('The patch for operation #' + errorInfo.id + ' on `' + errorInfo.path + '` failed to apply.');
  lines.push('');
  lines.push('**Error:** ' + errorInfo.message);
  lines.push('');

  if (errorInfo.fuzzyStats) {
    lines.push(
      '**Fuzzy match attempt:** ' + errorInfo.fuzzyStats.confidence + '% confidence ' +
      '(' + errorInfo.fuzzyStats.normalizedMatches + '/' + errorInfo.fuzzyStats.totalLines + ' lines matched)'
    );
    if (errorInfo.fuzzyStats.startLine !== undefined) {
      lines.push('Best match was at lines ' + errorInfo.fuzzyStats.startLine + '\u2013' + errorInfo.fuzzyStats.endLine + ' of the file.');
    }
    lines.push('');
  }

  lines.push('**The FIND block that could not be located:**');
  lines.push(TB);
  lines.push(errorInfo.findBlock.trim());
  lines.push(TB);
  lines.push('');

  const currentContent = repo.files[errorInfo.path];
  if (currentContent) {
    const contentLines = currentContent.split('\n');
    lines.push(
      '**Current file has ' + contentLines.length + ' lines.** ' +
      'Here are the first 30 lines for context:'
    );
    lines.push(TB);
    lines.push(contentLines.slice(0, 30).join('\n'));
    if (contentLines.length > 30) {
      lines.push('... (' + (contentLines.length - 30) + ' more lines)');
    }
    lines.push(TB);
    lines.push('');
  }

  lines.push('Please provide a corrected patch for this file that matches the current content.');
  return lines.join('\n');
}

function showHelpModal() {
  document.getElementById('forge-help-modal').classList.remove('hidden');
  showToast('\u2328\ufe0f FORGE Keyboard shortcuts');
}

function hideHelpModal() {
  document.getElementById('forge-help-modal').classList.add('hidden');
}



function showImportModal() {
  const modal    = document.getElementById('forge-import-modal');
  const textarea = document.getElementById('forge-import-textarea');
  textarea.value = '';
  modal.classList.remove('hidden');
  textarea.focus();
}

function hideImportModal() {
  document.getElementById('forge-import-modal').classList.add('hidden');
}

function importFromTextarea() {
  const textarea   = document.getElementById('forge-import-textarea');
  const jsonString = textarea.value.trim();

  if (!jsonString) { logToUI('\u2717 No JSON provided'); return; }

  try {
    importProjectFromJSON(jsonString);
    hideImportModal();
  } catch (error) {
    logToUI('\u2717 Invalid JSON format');
    alert('Invalid JSON format. Please check your input and try again.');
  }
}

function importFromFile() {
  const input  = document.createElement('input');
  input.type   = 'file';
  input.accept = '.json,.txt';

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text     = await file.text();
      const textarea = document.getElementById('forge-import-textarea');
      textarea.value = text;
      logToUI('\u2713 File loaded into textarea');
    } catch (error) {
      logToUI('\u2717 Failed to read file');
    }
  };

  input.click();
}

/**
 * Show a confirmation dialog before importing pasted JSON.
 */
function showPasteConfirmation(jsonText) {
  try {
    const json = JSON.parse(jsonText);
    let files;
    let title;
    let specVersion = null;

    if (Array.isArray(json)) {
      files = json;
      title = 'Imported Project';
    } else if (json.files && Array.isArray(json.files)) {
      files = json.files;
      title = json.title || 'Imported Project';
      specVersion = json.specVersion || null;
    } else {
      throw new Error('Unrecognized JSON format');
    }

    if (!files || files.length === 0) throw new Error('No files found in JSON');

    const excludedFiles = files.filter(f => f.excluded || f.ignored);
    const binaryFiles   = files.filter(f => f.encoding === 'base64');
    const normalFiles   = files.length - excludedFiles.length - binaryFiles.length;

    const specBadge = specVersion
      ? '<span style="font-size:10px; background:#1e1e1e; padding:2px 6px; border-radius:3px; color:#4fc3f7; margin-left:6px;">spec v' + escapeHtml(specVersion) + '</span>'
      : '';

    const summaryParts = [normalFiles + ' text'];
    if (binaryFiles.length)   summaryParts.push(binaryFiles.length + ' binary');
    if (excludedFiles.length) summaryParts.push(excludedFiles.length + ' excluded stubs');

    document.querySelectorAll('.forge-confirm-modal').forEach(m => m.remove());

    const modal = document.createElement('div');
    modal.className = 'forge-confirm-modal';

    const fileListHtml = files.slice(0, 8).map(f => {
      const icon = (f.excluded || f.ignored) ? '\ud83d\udeab '
                 : f.encoding === 'base64'   ? '\ud83d\udce6 '
                 : '';
      return icon + escapeHtml(f.path);
    }).join('<br>');

    const moreHtml = files.length > 8
      ? '<br><em style="color:#858585">... and ' + (files.length - 8) + ' more</em>'
      : '';

    const warningHtml = Object.keys(repo.files).length > 0
      ? '<div class="forge-confirm-warning">\u26a0\ufe0f This will replace your current project (' + Object.keys(repo.files).length + ' files)</div>'
      : '';

    const currentStepVal = repo.lastProcessedStep || 0;
    const preserveCheckId = 'forge-paste-preserve-steps';

    setForgeHTML(modal,
      '<div class="forge-confirm-dialog">' +
        '<div class="forge-confirm-header">\ud83d\udce5 Confirm Import</div>' +
        '<div class="forge-confirm-body">' +
          '<p>You are about to import:</p>' +
          '<div class="forge-confirm-preview">' +
            '<strong>Title:</strong> ' + escapeHtml(title) + specBadge + '<br>' +
            '<strong>Files:</strong> ' + files.length + ' (' + summaryParts.join(', ') + ')<br><br>' +
            fileListHtml + moreHtml +
          '</div>' +
          warningHtml +
          '<div style="margin-top:10px; font-size:11px; color:#d4d4d4;">' +
            '<label style="display:flex; align-items:center; gap:6px; cursor:pointer;">' +
              '<input type="checkbox" id="' + preserveCheckId + '" checked>' +
              '<span>Preserve current step counter (step ' + (currentStepVal + 1) + ')</span>' +
            '</label>' +
          '</div>' +
        '</div>' +
        '<div class="forge-confirm-footer">' +
          '<button class="forge-progress-btn secondary" id="forge-paste-cancel">Cancel</button>' +
          '<button class="forge-progress-btn" id="forge-paste-confirm">Import</button>' +
        '</div>' +
      '</div>');

    document.body.appendChild(modal);

    const closeModal = () => {
      modal.remove();
      showToast('\u274c Import cancelled');
    };

    const confirmImport = () => {
      const cbEl = document.getElementById('forge-paste-preserve-steps');
      const preserveSteps = cbEl ? cbEl.checked : true;
      modal.remove();
      importProjectFromJSON(jsonText, preserveSteps);
      showToast('\u2713 Imported ' + files.length + ' files');
    };

    document.getElementById('forge-paste-cancel').addEventListener('click', closeModal);
    document.getElementById('forge-paste-confirm').addEventListener('click', confirmImport);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);

  } catch (error) {
    showToast('\u274c Invalid JSON format');
    logToUI('\u2717 Failed to parse clipboard JSON: ' + error.message);
  }
}

function createProgressModal() {
  const existing = document.getElementById('forge-progress-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'forge-progress-modal';
  setForgeHTML(modal,
    '<div class="forge-progress-dialog">' +
      '<div class="forge-progress-header">\ud83d\ude80 FORGE Bookmarklet</div>' +
      '<div class="forge-progress-body">' +
        '<div class="forge-progress-status" id="forge-progress-status">Initializing...</div>' +
        '<ul class="forge-progress-list" id="forge-progress-list"></ul>' +
      '</div>' +
      '<div class="forge-progress-footer" id="forge-progress-footer">' +
        '<button class="forge-progress-btn secondary" id="forge-progress-cancel">Cancel</button>' +
      '</div>' +
    '</div>');

  document.body.appendChild(modal);

  return {
    setStatus(text) {
      document.getElementById('forge-progress-status').textContent = text;
    },

    addOperation(op) {
      const list = document.getElementById('forge-progress-list');
      const item = document.createElement('li');
      item.className = 'forge-progress-item pending';
      item.id = 'forge-op-' + op.id;
      setForgeHTML(item,
        '<span>' + escapeHtml(op.path) + ' #' + op.id + ' #' + op.operation + '</span>' +
        '<span class="forge-progress-item-icon">\u23f3</span>');
      list.appendChild(item);
    },

    updateOperation(id, status, message) {
      const item = document.getElementById('forge-op-' + id);
      if (!item) return;

      item.className = 'forge-progress-item ' + status;

      const icons = {
        processing: '\u23f3',
        success:    '\u2713',
        warning:    '\u26a0\ufe0f',
        error:      '\u2717'
      };

      const icon = item.querySelector('.forge-progress-item-icon');
      icon.textContent = icons[status] || '\u2022';

      if (message) {
        const text = item.querySelector('span:first-child');
        text.textContent += ' \u2014 ' + message;
      }
    },

    setButtons(buttons) {
      const footer = document.getElementById('forge-progress-footer');
      setForgeHTML(footer, '');

      buttons.forEach(btn => {
        const button = document.createElement('button');
        button.className = 'forge-progress-btn' + (btn.secondary ? ' secondary' : '');
        button.textContent = btn.text;
        button.onclick = btn.onClick;
        if (btn.disabled) button.disabled = true;
        footer.appendChild(button);
      });
    },

    close() {
      modal.remove();
    }
  };
}

function showRepoExplorerModal() {
  const state = ForgeState.getState();
  const files = state.files || {};
  const fileMeta = state.fileMeta || {};
  const allPaths = Object.keys(files).sort();

  const existing = document.getElementById('forge-explorer-modal');
  if (existing) existing.remove();

  // ©¤©¤ Overlay ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  const overlay = document.createElement('div');
  overlay.id = 'forge-explorer-modal';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:10010',
    'background:rgba(0,0,0,0.85)',
    'display:flex', 'align-items:center', 'justify-content:center',
    'font-family:Segoe UI,sans-serif'
  ].join(';');

  // ©¤©¤ Dialog ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  const dialog = document.createElement('div');
  dialog.style.cssText = [
    'background:#252526', 'border:2px solid #667eea',
    'border-radius:10px',
    'width:820px', 'max-width:96vw', 'height:580px', 'max-height:92vh',
    'display:flex', 'flex-direction:column',
    'box-shadow:0 8px 32px rgba(0,0,0,0.5)', 'overflow:hidden'
  ].join(';');

  // ©¤©¤ Header ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  const header = document.createElement('div');
  header.style.cssText = 'padding:11px 16px;border-bottom:1px solid #3e3e42;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;gap:10px;';

  const titleEl = document.createElement('span');
  titleEl.style.cssText = 'font-size:14px;font-weight:600;color:#d4d4d4;white-space:nowrap;';
  titleEl.textContent = '?? Repository Explorer';

  const headerRight = document.createElement('div');
  headerRight.style.cssText = 'display:flex;align-items:center;gap:8px;flex:1;justify-content:flex-end;';

  // Search input in header
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Filter files¡­';
  searchInput.style.cssText = [
    'background:#1e1e1e', 'border:1px solid #3e3e42', 'border-radius:4px',
    'color:#d4d4d4', 'font-size:12px', 'padding:5px 9px',
    'width:200px', 'font-family:Segoe UI,sans-serif', 'outline:none'
  ].join(';');

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '¡Á';
  closeBtn.style.cssText = 'background:none;border:none;color:#858585;font-size:20px;cursor:pointer;padding:0 2px;line-height:1;flex-shrink:0;';
  closeBtn.onclick = () => overlay.remove();

  headerRight.appendChild(searchInput);
  headerRight.appendChild(closeBtn);
  header.appendChild(titleEl);
  header.appendChild(headerRight);

  // ©¤©¤ Body (two panes) ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  const bodyRow = document.createElement('div');
  bodyRow.style.cssText = 'flex:1;display:flex;min-height:0;overflow:hidden;';

  // Left: file list
  const fileListPane = document.createElement('div');
  fileListPane.style.cssText = [
    'width:260px', 'flex-shrink:0', 'border-right:1px solid #3e3e42',
    'overflow-y:auto', 'background:#1e1e1e', 'padding:4px 0'
  ].join(';');

  // Right: content pane
  const contentPane = document.createElement('div');
  contentPane.style.cssText = 'flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden;';

  const contentHeader = document.createElement('div');
  contentHeader.style.cssText = [
    'padding:7px 12px', 'border-bottom:1px solid #3e3e42',
    'font-size:11px', 'font-family:Consolas,monospace',
    'color:#858585', 'background:#252526', 'flex-shrink:0',
    'display:flex', 'align-items:center', 'justify-content:space-between', 'gap:8px'
  ].join(';');

  const contentPathEl = document.createElement('span');
  contentPathEl.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#858585;';
  contentPathEl.textContent = 'Select a file to view its contents';

  const contentMetaEl = document.createElement('span');
  contentMetaEl.style.cssText = 'white-space:nowrap;flex-shrink:0;color:#555;font-size:10px;';

  const copyFileBtn = document.createElement('button');
  copyFileBtn.textContent = '?? Copy';
  copyFileBtn.style.cssText = [
    'background:#3e3e42', 'border:none', 'color:#d4d4d4',
    'font-size:10px', 'padding:3px 8px', 'border-radius:3px',
    'cursor:pointer', 'flex-shrink:0', 'display:none',
    'font-family:Segoe UI,sans-serif'
  ].join(';');

  // Unsaved indicator dot
  const dirtyDot = document.createElement('span');
  dirtyDot.title = 'Unsaved changes';
  dirtyDot.style.cssText = 'width:7px;height:7px;border-radius:50%;background:#f0a500;display:none;flex-shrink:0;';

  // Save button
  const saveBtn = document.createElement('button');
  saveBtn.textContent = '?? Save';
  saveBtn.title = 'Save changes (Ctrl+S)';
  saveBtn.style.cssText = [
    'background:#1a7a3a', 'border:none', 'color:#fff',
    'font-size:10px', 'padding:3px 9px', 'border-radius:3px',
    'cursor:pointer', 'flex-shrink:0', 'display:none',
    'font-weight:600', 'font-family:Segoe UI,sans-serif'
  ].join(';');
  saveBtn.onclick = () => {
    if (editDebounceTimer) { clearTimeout(editDebounceTimer); editDebounceTimer = null; }
    saveCurrentFile();
  };

  contentHeader.appendChild(contentPathEl);
  contentHeader.appendChild(contentMetaEl);
  contentHeader.appendChild(dirtyDot);
  contentHeader.appendChild(copyFileBtn);
  contentHeader.appendChild(saveBtn);

  const contentTextarea = document.createElement('textarea');
  contentTextarea.readOnly = true;
  contentTextarea.spellcheck = false;
  contentTextarea.style.cssText = [
    'flex:1', 'width:100%', 'background:#1e1e1e', 'color:#d4d4d4',
    'border:none', 'outline:none', 'resize:none',
    'font-family:Consolas,Courier New,monospace', 'font-size:12px',
    'line-height:1.5', 'padding:12px', 'box-sizing:border-box',
    'tab-size:2'
  ].join(';');
  contentTextarea.placeholder = 'Select a file from the list on the left.';

  const emptyPane = document.createElement('div');
  emptyPane.style.cssText = 'flex:1;display:flex;align-items:center;justify-content:center;color:#3e3e42;font-size:13px;';
  emptyPane.textContent = 'Select a file to preview';

  contentPane.appendChild(contentHeader);
  contentPane.appendChild(contentTextarea);

  bodyRow.appendChild(fileListPane);
  bodyRow.appendChild(contentPane);

  // ©¤©¤ Footer ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  const footer = document.createElement('div');
  footer.style.cssText = 'padding:9px 16px;border-top:1px solid #3e3e42;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;font-size:11px;color:#555;';

  const footerStats = document.createElement('span');
  const totalSize = Object.values(files).reduce((s, c) => s + (c || '').length, 0);
  const sizeStr = totalSize < 1024 ? totalSize + ' B'
    : totalSize < 1048576 ? (totalSize / 1024).toFixed(1) + ' KB'
    : (totalSize / 1048576).toFixed(2) + ' MB';
  footerStats.textContent = allPaths.length + ' files ¡¤ ' + sizeStr + ' total';

  const footerBtns = document.createElement('div');
  footerBtns.style.cssText = 'display:flex;gap:8px;align-items:center;';

  const openIDEBtn = document.createElement('button');
  openIDEBtn.textContent = '?? Open in FORGE IDE';
  openIDEBtn.title = 'Open the full repo in FORGE IDE for editing and preview';
  openIDEBtn.style.cssText = 'background:#5a4fcf;border:none;color:#fff;padding:6px 14px;border-radius:4px;cursor:pointer;font-size:12px;font-weight:600;font-family:Segoe UI,sans-serif;';
  openIDEBtn.onmouseenter = () => { openIDEBtn.style.background = '#6a5fdf'; };
  openIDEBtn.onmouseleave = () => { openIDEBtn.style.background = '#5a4fcf'; };
  openIDEBtn.onclick = () => {
    if (typeof openInForgeIDE === 'function') {
      openInForgeIDE();
    } else {
      if (typeof showToast === 'function') showToast('?? FORGE IDE not available ¡ª rebuild required');
    }
  };

  const closeFooterBtn = document.createElement('button');
  closeFooterBtn.textContent = 'Close';
  closeFooterBtn.style.cssText = 'background:#3e3e42;border:none;color:#d4d4d4;padding:6px 16px;border-radius:4px;cursor:pointer;font-size:12px;font-weight:600;font-family:Segoe UI,sans-serif;';
  closeFooterBtn.onclick = () => {
    if (editDirty) {
      if (!confirm('You have unsaved changes. Close anyway?')) return;
    }
    if (editDebounceTimer) clearTimeout(editDebounceTimer);
    overlay.remove();
  };

  footerBtns.appendChild(openIDEBtn);
  footerBtns.appendChild(closeFooterBtn);

  footer.appendChild(footerStats);
  footer.appendChild(footerBtns);

  // ©¤©¤ File list rendering ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  let selectedPath = null;

  function fileSize(content) {
    const b = (content || '').length;
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(2) + ' MB';
  }

  function fileIcon(path) {
    const meta = fileMeta[path] || {};
    if (meta.excluded) return '??';
    if (meta.encoding === 'base64') return '??';
    const ext = path.split('.').pop().toLowerCase();
    const icons = {
      js: '??', ts: '??', jsx: '??', tsx: '??',
      html: '??', htm: '??',
      css: '??', scss: '??', sass: '??',
      json: '??', md: '??', txt: '??',
      py: '??', sh: '??', bat: '??',
      png: '???', jpg: '???', jpeg: '???', gif: '???', svg: '???',
      zip: '??', gz: '??'
    };
    return icons[ext] || '??';
  }

  function renderFileList(filter) {
    fileListPane.textContent = '';
    const filtered = filter
      ? allPaths.filter(p => p.toLowerCase().includes(filter.toLowerCase()))
      : allPaths;

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'color:#555;font-size:11px;padding:16px 12px;font-style:italic;';
      empty.textContent = filter ? 'No files match "' + filter + '"' : 'No files in repo.';
      fileListPane.appendChild(empty);
      return;
    }

    filtered.forEach(path => {
      const item = document.createElement('div');
      const isSelected = path === selectedPath;
      item.style.cssText = [
        'display:flex', 'align-items:center', 'gap:6px',
        'padding:5px 10px', 'cursor:pointer', 'font-size:11px',
        'font-family:Consolas,monospace',
        'background:' + (isSelected ? '#0e639c' : 'transparent'),
        'color:' + (isSelected ? '#fff' : '#c8c8c8'),
        'transition:background .1s',
        'white-space:nowrap', 'overflow:hidden'
      ].join(';');

      const icon = document.createElement('span');
      icon.style.cssText = 'flex-shrink:0;font-size:12px;';
      icon.textContent = fileIcon(path);

      const label = document.createElement('span');
      label.style.cssText = 'overflow:hidden;text-overflow:ellipsis;flex:1;';
      label.textContent = path;
      label.title = path;

      const sizeEl = document.createElement('span');
      sizeEl.style.cssText = 'flex-shrink:0;font-size:10px;color:' + (isSelected ? '#a0c8ff' : '#555') + ';margin-left:4px;';
      const meta = fileMeta[path] || {};
      sizeEl.textContent = meta.excluded ? 'stub' : meta.encoding === 'base64' ? 'binary' : fileSize(files[path]);

      item.appendChild(icon);
      item.appendChild(label);
      item.appendChild(sizeEl);

      if (!isSelected) {
        item.addEventListener('mouseenter', () => {
          if (path !== selectedPath) item.style.background = '#2a2a2a';
        });
        item.addEventListener('mouseleave', () => {
          if (path !== selectedPath) item.style.background = 'transparent';
        });
      }

      item.addEventListener('click', () => {
        selectedPath = path;
        renderFileList(searchInput.value);
        selectFile(path);
      });

      fileListPane.appendChild(item);
    });
  }

  // ©¤©¤ Edit state ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  let editDirty = false;
  let editDebounceTimer = null;

  function setDirty(isDirty) {
    editDirty = isDirty;
    saveBtn.style.display = isDirty ? '' : 'none';
    dirtyDot.style.display = isDirty ? '' : 'none';
  }

  function saveCurrentFile() {
    if (!selectedPath || !editDirty) return;
    const meta = fileMeta[selectedPath] || {};
    if (meta.excluded || meta.encoding === 'base64') return;
    try {
      // Use replaceFile so version history is tracked; keep currentStep unchanged
      repo.replaceFile('manual-edit', selectedPath, contentTextarea.value);
      // Patch local mirror so filter/re-render sees new content
      files[selectedPath] = contentTextarea.value;
      setDirty(false);
      const lines = contentTextarea.value.split('\n').length;
      contentMetaEl.textContent = lines + ' lines ¡¤ ' + fileSize(contentTextarea.value);
      if (typeof showToast === 'function') showToast('? Saved ' + selectedPath, 1800);
    } catch (e) {
      if (typeof showToast === 'function') showToast('? Save failed: ' + e.message, 3000);
    }
  }

  function selectFile(path) {
    // Prompt if switching away from unsaved edits
    if (editDirty && selectedPath && path !== selectedPath) {
      if (!confirm('You have unsaved changes to ' + selectedPath + '. Discard them?')) return;
    }
    if (editDebounceTimer) { clearTimeout(editDebounceTimer); editDebounceTimer = null; }
    setDirty(false);

    const meta = fileMeta[path] || {};
    const content = files[path] || '';

    contentPathEl.textContent = path;
    contentPathEl.style.color = '#4fc3f7';

    if (meta.excluded) {
      contentTextarea.readOnly = true;
      contentTextarea.style.opacity = '0.5';
      contentTextarea.value = '(excluded stub ¡ª no content)';
      contentMetaEl.textContent = 'stub';
      copyFileBtn.style.display = 'none';
    } else if (meta.encoding === 'base64') {
      contentTextarea.readOnly = true;
      contentTextarea.style.opacity = '0.5';
      contentTextarea.value = '(binary file ¡ª base64 encoded, ' + fileSize(content) + ')';
      contentMetaEl.textContent = 'binary';
      copyFileBtn.style.display = 'none';
    } else {
      contentTextarea.readOnly = false;
      contentTextarea.style.opacity = '1';
      contentTextarea.value = content;
      const lines = content.split('\n').length;
      contentMetaEl.textContent = lines + ' lines ¡¤ ' + fileSize(content);
      copyFileBtn.style.display = '';
      copyFileBtn.onclick = () => {
        if (typeof copyToClipboard === 'function') copyToClipboard(content);
        copyFileBtn.textContent = '? Copied';
        setTimeout(() => { copyFileBtn.textContent = '?? Copy'; }, 2000);
      };
    }
  }

  // Debounced dirty tracking on textarea input
  contentTextarea.addEventListener('input', () => {
    if (!selectedPath) return;
    const meta = fileMeta[selectedPath] || {};
    if (meta.excluded || meta.encoding === 'base64') return;
    setDirty(true);
    if (editDebounceTimer) clearTimeout(editDebounceTimer);
    // Auto-save after 2s of inactivity
    editDebounceTimer = setTimeout(() => {
      saveCurrentFile();
    }, 2000);
  });

  // Ctrl+S / Cmd+S to save
  contentTextarea.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (editDebounceTimer) { clearTimeout(editDebounceTimer); editDebounceTimer = null; }
      saveCurrentFile();
    }
  });

  // ©¤©¤ Search wiring ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  searchInput.addEventListener('input', () => renderFileList(searchInput.value));

  // ©¤©¤ Assemble ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  dialog.appendChild(header);
  dialog.appendChild(bodyRow);
  dialog.appendChild(footer);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => {
    if (e.target !== overlay) return;
    if (editDirty) {
      if (!confirm('You have unsaved changes. Close anyway?')) return;
    }
    if (editDebounceTimer) clearTimeout(editDebounceTimer);
    overlay.remove();
  });

  closeBtn.onclick = () => {
    if (editDirty) {
      if (!confirm('You have unsaved changes. Close anyway?')) return;
    }
    if (editDebounceTimer) clearTimeout(editDebounceTimer);
    overlay.remove();
  };

  // Auto-select first file
  if (allPaths.length > 0) {
    selectedPath = allPaths[0];
    renderFileList('');
    selectFile(allPaths[0]);
  } else {
    renderFileList('');
  }

  searchInput.focus();
}

function showErrorModal(errorInfo) {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'forge-error-modal';

    let statsHtml = '';
    if (errorInfo.fuzzyStats) {
      const conf = errorInfo.fuzzyStats.confidence;
      const confColor = conf >= 70 ? '#4caf50' : '#f44336';
      const locationRow = errorInfo.fuzzyStats.startLine !== undefined
        ? '<div class="forge-error-stat-item"><span>Match Location:</span><span>Lines ' +
          errorInfo.fuzzyStats.startLine + '\u2013' + errorInfo.fuzzyStats.endLine + '</span></div>'
        : '';
      statsHtml =
        '<div class="forge-error-section">' +
          '<div class="forge-error-section-title">Fuzzy Match Attempt</div>' +
          '<div class="forge-error-stats">' +
            '<div class="forge-error-stat-item"><span>Confidence:</span>' +
              '<span style="color:' + confColor + '">' + conf + '%</span></div>' +
            '<div class="forge-error-stat-item"><span>Exact Matches:</span>' +
              '<span>' + errorInfo.fuzzyStats.exactMatches + '/' + errorInfo.fuzzyStats.totalLines + '</span></div>' +
            '<div class="forge-error-stat-item"><span>Normalized Matches:</span>' +
              '<span>' + errorInfo.fuzzyStats.normalizedMatches + '/' + errorInfo.fuzzyStats.totalLines + '</span></div>' +
            locationRow +
          '</div>' +
        '</div>';
    }

    const findBlockHtml = escapeHtml(errorInfo.findBlock.substring(0, 500)) +
      (errorInfo.findBlock.length > 500 ? '\n...' : '');

    setForgeHTML(modal,
      '<div class="forge-error-dialog">' +
        '<div class="forge-error-header">' +
          '?? Patch #' + errorInfo.id + ' failed on ' + escapeHtml(errorInfo.path) +
        '</div>' +
        '<div class="forge-error-body">' +
          '<div class="forge-error-section">' +
            '<div style="color:#f48771;margin-bottom:6px;">' + escapeHtml(errorInfo.message) + '</div>' +
            '<div style="color:#858585;font-size:11px;line-height:1.5;">' +
              'The patch was automatically skipped and added to the sendBack queue. ' +
              'Click <strong style="color:#d4d4d4;">Send Results to Elsa</strong> and she\'ll fix it.' +
            '</div>' +
          '</div>' +
          statsHtml +
          '<div class="forge-error-section">' +
            '<div class="forge-error-section-title">FIND block that could not be located</div>' +
            '<div class="forge-error-code">' + findBlockHtml + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="forge-error-buttons">' +
          '<button class="forge-btn" id="forge-error-skip">OK, continue</button>' +
        '</div>' +
      '</div>');

    document.body.appendChild(modal);

    if (ForgeState.getState().mode === 'maximized') {
      ForgeActions.setSelectedPath(errorInfo.path);
    }

    if (errorInfo.element && errorInfo.type) {
      scrollToOperation({ element: errorInfo.element, type: errorInfo.type });
    }

    document.getElementById('forge-error-skip').onclick = () => { modal.remove(); resolve('skip'); };
  });
}
// FORGE CODE - Event Handlers
// All event handlers and keyboard shortcuts

function setupUIHandlers() {
  setupKeyboardShortcuts();
  setupDraggableWindow();

  // ©¤©¤ Checkbox handlers ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  const syncToggle = document.getElementById('forge-sync-toggle');
  const syncBody = document.getElementById('forge-sync-body');
  const syncCaret = document.getElementById('forge-sync-caret');
  if (syncToggle && syncBody) {
    const _toggleSyncBody = () => {
      const isHidden = syncBody.style.display === 'none';
      syncBody.style.display = isHidden ? '' : 'none';
      if (syncCaret) syncCaret.style.transform = isHidden ? 'rotate(90deg)' : '';
    };
    syncToggle.addEventListener('click', _toggleSyncBody);
    syncToggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        _toggleSyncBody();
      }
    });
  }

  const syncCheckbox = document.getElementById('forge-sync-checkbox');
  if (syncCheckbox) {
    syncCheckbox.addEventListener('change', () => {
      if (typeof toggleAutoSync === 'function') toggleAutoSync();
    });
  }

  const syncPullBtn = document.getElementById('forge-sync-pull-btn');
  if (syncPullBtn) {
    syncPullBtn.addEventListener('click', () => {
      if (typeof manualSyncPull === 'function') manualSyncPull();
    });
  }

  const syncPushBtn = document.getElementById('forge-sync-push-btn');
  if (syncPushBtn) {
    syncPushBtn.addEventListener('click', () => {
      if (typeof manualSyncPush === 'function') manualSyncPush();
    });
  }

  const syncInfoBtn = document.getElementById('forge-sync-info-btn');
  if (syncInfoBtn) {
    syncInfoBtn.addEventListener('click', () => {
      const pop = document.getElementById('forge-sync-popover');
      if (pop) pop.style.display = pop.style.display === 'none' ? '' : 'none';
    });
  }

  const syncPortInput = document.getElementById('forge-sync-port-input');
  if (syncPortInput) {
    // Initialize from localStorage
    const savedPort = localStorage.getItem('forge-sync-port');
    if (savedPort) syncPortInput.value = savedPort;

    syncPortInput.addEventListener('change', () => {
      const port = parseInt(syncPortInput.value, 10);
      if (port >= 1024 && port <= 65535) {
        localStorage.setItem('forge-sync-port', String(port));
        if (typeof setSyncPort === 'function') setSyncPort(port);
        if (typeof logToUI === 'function') logToUI('? Sync port set to ' + port);
      }
    });
  }

  const syncReconnectBtn = document.getElementById('forge-sync-reconnect-btn');
  if (syncReconnectBtn) {
    syncReconnectBtn.addEventListener('click', async () => {
      if (typeof retryAutoSyncDetection === 'function') {
        syncReconnectBtn.textContent = '...';
        syncReconnectBtn.disabled = true;
        await retryAutoSyncDetection();
        syncReconnectBtn.textContent = '? Reconnect';
        syncReconnectBtn.disabled = false;
      }
    });
  }

  const uploadCheckbox = document.getElementById('forge-upload-checkbox');
  if (uploadCheckbox) {
    uploadCheckbox.addEventListener('change', (event) => {
      handleUploadCheckbox(event.target.checked);
    });
  }
  
  const summaryCheckbox = document.getElementById('forge-summary-only-checkbox');
  if (summaryCheckbox) {
    summaryCheckbox.addEventListener('change', (e) => {
      if (typeof handleSummaryOnlyCheckbox === 'function') {
        handleSummaryOnlyCheckbox(e.target.checked);
      }
    });
  }
  
  const codingCheckbox = document.getElementById('forge-coding-prompt-checkbox');
  if (codingCheckbox) {
    codingCheckbox.addEventListener('change', (e) => {
      if (typeof handleCodingPromptCheckbox === 'function') {
        handleCodingPromptCheckbox(e.target.checked);
      }
    });
  }

  // ©¤©¤ Advanced toggle ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  


  // ©¤©¤ Window controls ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤



  document.getElementById('forge-dock-btn').addEventListener('click', () => {
    toggleDock();
  });

  document.getElementById('forge-help-btn').addEventListener('click', () => {
    showHelpModal();
  });

  // Quick-start input handler
  const quickStartBtn = document.getElementById('forge-quick-start-btn');
  const quickStartInput = document.getElementById('forge-quick-start-input');
  if (quickStartBtn && quickStartInput) {
    quickStartBtn.addEventListener('click', () => {
      const text = quickStartInput.value.trim();
      if (!text) {
        showToast('Please enter a description of what you want to build');
        return;
      }

      // Enable auto-pilot with one-time condition
      if (!isAutoPilotEnabled()) {
        ForgeActions.setAutoPilotEnabled(true);
      }
      
      // Set condition to turn off after first step
      if (typeof setAutoPilotContinueCondition === 'function') {
        setAutoPilotContinueCondition(() => false);
      }

      // Exit welcome mode
      if (typeof ForgeActions !== 'undefined' && typeof ForgeActions.setWelcomeMode === 'function') {
        ForgeActions.setWelcomeMode(false);
      }
      
      // Send the text to the LLM
      if (typeof autoSendToElsa === 'function') {
        autoSendToElsa(text);
        showToast('?? Building...');
        quickStartInput.value = '';
      } else {
        showToast('Unable to send message - autoSendToElsa not available');
      }
    });
    
    // Allow Enter key to submit (Shift+Enter for new line)
    quickStartInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        quickStartBtn.click();
      }
    });
  }

  // More menu toggle
  const moreBtn = document.getElementById('forge-more-btn');
  const moreMenu = document.getElementById('forge-more-menu');
  if (moreBtn && moreMenu) {
    moreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = moreMenu.style.display !== 'none';
      moreMenu.style.display = isVisible ? 'none' : 'block';
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (moreMenu && !moreMenu.contains(e.target) && e.target !== moreBtn) {
        moreMenu.style.display = 'none';
      }
    });
  }

  document.getElementById('forge-minimize-btn').addEventListener('click', () => {
    const currentMode = ForgeState.getState().mode;

    if (currentMode === 'minimized') {
      ForgeActions.setMode('normal');
      return;
    }

    if (
      typeof _dockState !== 'undefined' &&
      _dockState.active &&
      typeof undockUI === 'function'
    ) {
      undockUI(true);
    }

    ForgeActions.setMode('minimized');
  });



  document.getElementById('forge-close-btn').addEventListener('click', () => {
    if (_dockState && _dockState.active) undockUI(true);
    document.getElementById('forge-quick-ui').remove();
  });

  // ©¤©¤ Import modal ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  const importBtn = document.getElementById('forge-import-btn');
  if (importBtn) importBtn.addEventListener('click', showImportModal);

  document.getElementById('forge-import-cancel-btn').addEventListener('click', hideImportModal);
  document.getElementById('forge-import-submit-btn').addEventListener('click', importFromTextarea);
  document.getElementById('forge-import-file-btn').addEventListener('click', importFromFile);
  
  const zipBtn = document.getElementById('forge-import-zip-btn');
  if (zipBtn) {
    zipBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.zip';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          await importProjectFromZip(file);
          hideImportModal();
          showToast('? ZIP imported successfully');
        } catch (error) {
          alert('Failed to import ZIP: ' + error.message);
        }
      };
      input.click();
    });
  }

  const folderBtn = document.getElementById('forge-import-folder-btn');
  if (folderBtn) {
    folderBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;
      input.onchange = async (e) => {
        if (!e.target.files || e.target.files.length === 0) return;
        try {
          await importProjectFromFolder(e.target.files);
          hideImportModal();
          showToast('? Folder imported successfully');
        } catch (error) {
          alert('Failed to import folder: ' + error.message);
        }
      };
      input.click();
    });
  }

  const gitlabBtn = document.getElementById('forge-import-gitlab-btn');
  if (gitlabBtn) {
    gitlabBtn.addEventListener('click', () => {
      hideImportModal();
      if (typeof showGitLabImportModal === 'function') {
        showGitLabImportModal();
      } else {
        showToast('?? GitLab import not available ¡ª rebuild required');
      }
    });
  }

  document.getElementById('forge-import-modal').addEventListener('click', (e) => {
    if (e.target.id === 'forge-import-modal') hideImportModal();
  });

  // ©¤©¤ Explore / maximize ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤



  // ©¤©¤ Help modal ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  document.getElementById('forge-help-close').addEventListener('click', hideHelpModal);

  document.getElementById('forge-help-modal').addEventListener('click', (e) => {
    if (e.target.id === 'forge-help-modal') hideHelpModal();
  });

  // ©¤©¤ Settings modal ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  document.getElementById('forge-settings-btn').addEventListener('click', showSettingsModal);
  document.getElementById('forge-settings-close').addEventListener('click', hideSettingsModal);
  document.getElementById('forge-settings-save').addEventListener('click', saveSettings);
  document.getElementById('forge-settings-reset').addEventListener('click', resetSettings);
  document.getElementById('forge-settings-cancel').addEventListener('click', hideSettingsModal);

  document.getElementById('forge-settings-modal').addEventListener('click', (e) => {
    if (e.target.id === 'forge-settings-modal') hideSettingsModal();
  });

  // ©¤©¤ Sessions modal ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  const sessionsBtn = document.getElementById('forge-sessions-btn');
  if (sessionsBtn) sessionsBtn.addEventListener('click', showSessionsModal);
  updateSessionsCount();

  const quickImportBtn = document.getElementById('forge-quick-import-btn');
  if (quickImportBtn) quickImportBtn.addEventListener('click', showImportModal);

  const quickDownloadBtn = document.getElementById('forge-quick-download-btn');
  if (quickDownloadBtn) quickDownloadBtn.addEventListener('click', () => {
    logToUI('Generating ZIP...');
    repo.downloadZip().then(() => logToUI('? ZIP downloaded'));
  });

  document.getElementById('forge-sessions-close').addEventListener('click', hideSessionsModal);
  document.getElementById('forge-sessions-modal').addEventListener('click', (e) => {
    if (e.target.id === 'forge-sessions-modal') hideSessionsModal();
  });

  document.getElementById('forge-sessions-clear-all').addEventListener('click', async () => {
    if (!confirm('Clear all saved sessions from IndexedDB? This cannot be undone.')) return;
    const sessions = await loadAllSessions();
    for (const s of sessions) await deleteSession(s.id);
    await clearWorkspaceState();
    showToast('?? All sessions cleared');
    _renderSessionsList();
    updateSessionsCount();
  });

  // ©¤©¤ Next Step controls ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  const nextStepInput = document.getElementById('forge-next-step-input');
  const nextStepInc   = document.getElementById('forge-next-step-inc');
  const nextStepDec   = document.getElementById('forge-next-step-dec');

  nextStepInput.addEventListener('input', (event) => {
    let value = parseInt(event.target.value, 10);

    if (isNaN(value) || value < 1) {
      value = 1;
    }

    ForgeActions.setLastProcessedStep(value - 1);
    logToUI(`Next step set to ${value}`);
  });

  nextStepInput.addEventListener('blur', (event) => {
    const value = parseInt(event.target.value, 10);

    if (isNaN(value) || value < 1) {
      event.target.value = ForgeState.getState().lastProcessedStep + 1;
    }
  });

  nextStepInc.addEventListener('click', () => {
    const state = ForgeState.getState();
    ForgeActions.setLastProcessedStep(state.lastProcessedStep + 1);
    logToUI(`Next step incremented to ${state.lastProcessedStep + 2}`);
  });

  nextStepDec.addEventListener('click', () => {
    const state = ForgeState.getState();
    const nextStep = Math.max(0, state.lastProcessedStep - 1);
    ForgeActions.setLastProcessedStep(nextStep);
    logToUI(`Next step decremented to ${nextStep + 1}`);
  });

  // ©¤©¤ Project title inputs ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  const projectTitleInput = document.getElementById('forge-project-title');
  if (projectTitleInput) {
    projectTitleInput.addEventListener('input', (event) => {
      ForgeActions.setProjectTitle(event.target.value);
    });
  }

  // ©¤©¤ Temperature slider ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  const tempSlider = document.getElementById('forge-temp-slider');
  if (tempSlider) {
    tempSlider.addEventListener('input', (event) => {
      const state = ForgeState.getState();

      ForgeActions.setTemperature(
        parseFloat(event.target.value),
        state.tempEnabled
      );
    });
  }

  // ©¤©¤ Temperature toggle ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  const tempToggle = document.getElementById('forge-temp-toggle');
  if (tempToggle) {
    tempToggle.addEventListener('click', () => {
      const state = ForgeState.getState();

      if (state.tempEnabled) {
        disableTempControl();
        logToUI('Temperature control disabled');
      } else {
        enableTempControl();
        logToUI(
          `Temperature control enabled (${Number(state.currentTemp).toFixed(1)})`
        );
      }
    });
  }

  // ©¤©¤ Source nav buttons ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤



  // ©¤©¤ Content copy button ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤



  // ©¤©¤ Log copy buttons ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  const copyLogBtn = document.getElementById('forge-copy-log-btn');
  if (copyLogBtn) copyLogBtn.addEventListener('click', () => {
    const logEl = document.getElementById('forge-log');
    const text = logEl ? logEl.textContent : '';
    copyToClipboard(text);
    showToast('?? Log copied to clipboard');
  });

  // ©¤©¤ sendBack send-to-Elsa buttons ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  const sendToElsaBtn = document.getElementById('forge-send-to-elsa-btn');
  if (sendToElsaBtn) sendToElsaBtn.addEventListener('click', () => {
    const text = JSON.stringify(repo._sendBackQueue, null, 2);
    autoSendToElsa(text);
    if (repo.markSendBackSent) repo.markSendBackSent();
  });

  // ©¤©¤ Send Diff to Elsa buttons ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  const sendDiffBtn = document.getElementById('forge-send-diff-btn');
  if (sendDiffBtn) sendDiffBtn.addEventListener('click', () => {
    const diff = repo.getLastDiffForLLM ? repo.getLastDiffForLLM() : '';
    if (diff) {
      autoSendToElsa(diff);
    } else {
      showToast('?? No diff available yet');
    }
  });

  // ©¤©¤ Copy buttons ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  const copyFullBtn = document.getElementById('forge-copy-full-btn');
  if (copyFullBtn) copyFullBtn.addEventListener('click', copyFullRepoJSON);

  const copyChangesBtn = document.getElementById('forge-copy-changes-btn');
  if (copyChangesBtn) copyChangesBtn.addEventListener('click', copyChangesOnly);

  const copyDiffBtn = document.getElementById('forge-copy-diff-btn');
  if (copyDiffBtn) copyDiffBtn.addEventListener('click', copyLastDiff);

  // ©¤©¤ Parse buttons ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  const parseBtn = document.getElementById('forge-parse-btn');
  if (parseBtn) {
    parseBtn.addEventListener(
      'click',
      () => parseAndApply(false)
    );
  }

  const pasteBtn = document.getElementById('forge-paste-btn');
  if (pasteBtn) {
    pasteBtn.addEventListener('click', () => {
      pasteAndApplyStep();
      const moreMenu = document.getElementById('forge-more-menu');
      if (moreMenu) moreMenu.style.display = 'none';
    });
  }
  const autoPilotBtn = document.getElementById('forge-autopilot-btn');
  if (autoPilotBtn) autoPilotBtn.addEventListener('click', () => {
    if (typeof toggleAutoPilot === 'function') toggleAutoPilot();
  });

  const importExistingBtn = document.getElementById('forge-import-existing-btn');
  if (importExistingBtn) {
    importExistingBtn.addEventListener('click', () => {
      showImportModal();
    });
  }

  // Show full tool button (exit welcome mode)
  const showFullToolBtn = document.getElementById('forge-show-full-tool-btn');
  if (showFullToolBtn) showFullToolBtn.addEventListener('click', () => {
    if (typeof ForgeActions !== 'undefined' && typeof ForgeActions.setWelcomeMode === 'function') {
      ForgeActions.setWelcomeMode(false);
      showToast('Welcome mode dismissed');
    }
  });

  const heartbeatBtn = document.getElementById('forge-heartbeat-btn');
  if (heartbeatBtn) {
    heartbeatBtn.addEventListener('click', () => {
      const moreMenu = document.getElementById('forge-more-menu');
      if (moreMenu) moreMenu.style.display = 'none';
      
      const lastProcessedStep = Math.max(
        0,
        Number(repo.lastProcessedStep) || 0
      );

      const fileCount = repo.listFiles ? repo.listFiles().length : 0;
      const projectTitle = repo.projectTitle || 'untitled';
      
      // Get stats from last step if available
      const lastStats = repo.lastStepStats || {};
      const opsApplied = lastStats.opsApplied || 0;
      const linesChanged = lastStats.linesChanged || 0;
      const fuzzyMatches = lastStats.fuzzyMatches || 0;
      const errorCount = lastStats.errorCount || 0;
      
      // Build message with step details if available
      const messageParts = [
        `Manual ping from FORGE. Project "${projectTitle}" has ${fileCount} file(s).`
      ];
      
      if (lastStats.stepNum === lastProcessedStep && opsApplied > 0) {
        messageParts.push(`Step ${lastProcessedStep} applied ${opsApplied} operation(s).`);
        if (linesChanged > 0) messageParts.push(`~${linesChanged} line(s) changed.`);
        if (fuzzyMatches > 0) messageParts.push(`${fuzzyMatches} fuzzy match(es).`);
        if (errorCount > 0) messageParts.push(`${errorCount} error(s).`);
      } else {
        messageParts.push(`Last processed step: ${lastProcessedStep}.`);
      }
      
      messageParts.push(`Ready for step ${lastProcessedStep + 1}. What would you like to do next?`);
      
      const heartbeat = {
        type: 'heartbeat',
        stepNum: lastProcessedStep,
        nextStepNum: lastProcessedStep + 1,
        opsApplied: opsApplied,
        linesChanged: linesChanged,
        fuzzyMatches: fuzzyMatches,
        errorCount: errorCount,
        manual: true,
        projectTitle: repo.projectTitle || null,
        fileCount: fileCount,
        message: messageParts.join(' ')
      };

    repo.sendBack(heartbeat);

    showToast(
      '?? Ping queued ¡¤ ' + fileCount + ' files ¡¤ step ' +
      lastProcessedStep
    );

    logToUI(
      '?? Manual heartbeat queued ¡¤ last step ' +
      lastProcessedStep +
      ' ¡¤ next step ' +
      (lastProcessedStep + 1)
    );
    });
  }

  // ©¤©¤ Download buttons ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  const downloadBtn = document.getElementById('forge-download-btn');
  if (downloadBtn) downloadBtn.addEventListener('click', () => {
    logToUI('Generating ZIP...');
    repo.downloadZip().then(() => logToUI('? ZIP downloaded'));
  });

  // ©¤©¤ Step navigation ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  const prevStepEl = document.getElementById('forge-prev-step');
  if (prevStepEl) prevStepEl.addEventListener('click', () => {
    if (repo.currentStep > 0) {
      repo.goToStep(repo.currentStep - 1);
      logToUI(`Undid to step ${repo.currentStep + 1}`);
    } else {
      logToUI('Already at first step');
    }
  });

  const nextStepEl = document.getElementById('forge-next-step');
  if (nextStepEl) nextStepEl.addEventListener('click', () => {
    if (repo.currentStep < repo.versions.length - 1) {
      repo.goToStep(repo.currentStep + 1);
      logToUI(`Redid to step ${repo.currentStep + 1}`);
    } else {
      logToUI('Already at latest step');
    }
  });

  // ©¤©¤ Share / open in IDE ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  const shareBtn = document.getElementById('forge-share-btn');
  if (shareBtn) shareBtn.addEventListener('click', openInForgeIDE);

  const gitlabPushBtn = document.getElementById('forge-gitlab-push-btn');
  if (gitlabPushBtn) {
    gitlabPushBtn.addEventListener('click', () => {
      if (typeof showGitLabPushModal === 'function') {
        showGitLabPushModal();
      } else {
        showToast('?? GitLab push not available ¡ª rebuild required');
      }
    });
  }

  const forgeOutInfoBtn = document.getElementById('forge-out-info-btn');
  if (forgeOutInfoBtn) forgeOutInfoBtn.addEventListener('click', () => {
    if (typeof toggleForgeOutPopover === 'function') toggleForgeOutPopover();
  });
}

// ©¤©¤ Sessions modal ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

function showSessionsModal() {
  const modal = document.getElementById('forge-sessions-modal');
  modal.classList.remove('hidden');
  _renderSessionsList();
}

function hideSessionsModal() {
  document.getElementById('forge-sessions-modal').classList.add('hidden');
}

async function updateSessionsCount() {
  const btn = document.getElementById('forge-sessions-btn');
  if (!btn) return;
  const sessions = await loadAllSessions();
  btn.textContent = sessions.length > 0 ? `?? Sessions (${sessions.length})` : '?? Sessions';
}

async function _renderSessionsList() {
  const container = document.getElementById('forge-sessions-list');
  if (!container) return;
  setForgeHTML(container, '<div class="forge-sessions-empty">Loading...</div>');

  const sessions = await loadAllSessions();

  if (sessions.length === 0) {
    setForgeHTML(container, '<div class="forge-sessions-empty">No saved sessions found.</div>');
    return;
  }

  const currentUrl = window.location.href;
  setForgeHTML(container, '');

  sessions.forEach(session => {
    const isCurrent = session.url === currentUrl || session.id === currentUrl;
    const url = session.url || session.id;
    const ageMs = Date.now() - (session.timestamp || 0);
    const timeAgo = formatTimeAgo(ageMs);
    const fileCount = session.files ? Object.keys(session.files).length : 0;
    const stepLabel = 'Step ' + ((session.lastProcessedStep || 0) + 1);
    const urlDisplay = url.includes('#') ? '¡­' + url.substring(url.indexOf('#')) : url;
    const projectName = session.projectTitle || 'untitled';

    const item = document.createElement('div');
    item.className = 'forge-session-item' + (isCurrent ? ' forge-session-current' : '');

    // ©¤©¤ Info column ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
    const info = document.createElement('div');
    info.className = 'forge-session-info';

    // Title ¡ª click pencil icon to rename inline
    const titleEl = document.createElement('div');
    titleEl.className = 'forge-session-title';
    titleEl.style.cssText = 'display:flex;align-items:center;gap:4px;';

    const titleText = document.createElement('span');
    titleText.textContent = projectName;

    // Always create badge, only show if current
    const badge = document.createElement('span');
    badge.style.cssText = 'color:#667eea;font-size:10px;margin-left:2px;';
    badge.textContent = '(current)';

    const pencil = document.createElement('span');
    pencil.textContent = '??';
    pencil.style.cssText = 'font-size:10px;opacity:0.4;flex-shrink:0;pointer-events:none;';

    titleEl.appendChild(pencil);
    titleEl.appendChild(titleText);
    if (isCurrent) titleEl.appendChild(badge);

    titleEl.style.cursor = 'text';
    titleEl.title = 'Click to rename';

    // Inline rename on title click
    titleEl.addEventListener('click', (e) => {
      e.stopPropagation();
      const input = document.createElement('input');
      input.type = 'text';
      input.value = titleText.textContent;
      input.style.cssText = [
        'font-size:12px', 'font-weight:600', 'color:#d4d4d4',
        'background:#1a1a1a', 'border:1px solid #667eea',
        'border-radius:3px', 'padding:1px 5px', 'width:100%',
        'box-sizing:border-box', 'outline:none'
      ].join(';');

      titleEl.replaceChildren(input);
      input.focus();
      input.select();

      const restore = () => {
        titleEl.replaceChildren(titleText);
        if (isCurrent) titleEl.appendChild(badge);
        titleEl.appendChild(pencil);
      };

      const commit = async () => {
        const newName = input.value.trim() || titleText.textContent;
        titleText.textContent = newName;
        restore();
        if (newName !== projectName) {
          await renameSession(session.id, newName);
          if (isCurrent) {
            ForgeActions.setProjectTitle(newName);
          }
          showToast('? Session renamed');
        }
      };

      input.addEventListener('blur', commit);
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
        if (e.key === 'Escape') { e.preventDefault(); input.removeEventListener('blur', commit); restore(); }
      });
    });

    const meta = document.createElement('div');
    meta.className = 'forge-session-meta';
    meta.textContent = fileCount + ' files ¡¤ ' + stepLabel + ' ¡¤ ' + timeAgo;

    const urlEl = document.createElement('div');
    urlEl.className = 'forge-session-url';
    urlEl.title = url;
    urlEl.textContent = urlDisplay;

    info.appendChild(titleEl);
    info.appendChild(meta);
    info.appendChild(urlEl);

    // ©¤©¤ Buttons column ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
    const btns = document.createElement('div');
    btns.className = 'forge-session-btns';

    if (!isCurrent) {
      const goBtn2 = document.createElement('button');
      goBtn2.className = 'forge-session-btn forge-session-btn-go';
      goBtn2.textContent = '? Go to chat';
      goBtn2.addEventListener('click', () => {
        hideSessionsModal();
        _loadSession(session, false);
        window.location.href = url;
      });
      btns.appendChild(goBtn2);
    }

    const loadBtn = document.createElement('button');
    loadBtn.className = 'forge-session-btn forge-session-btn-load';
    loadBtn.textContent = isCurrent ? 'Reload' : 'Load here';
    btns.appendChild(loadBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'forge-session-btn forge-session-btn-delete';
    delBtn.textContent = '?';
    btns.appendChild(delBtn);

    item.appendChild(info);
    item.appendChild(btns);

    // "Load here" / "Reload" ¡ª load into current chat, reset steps
    loadBtn.addEventListener('click', () => {
      hideSessionsModal();
      _loadSession(session, true);
    });

    // Delete
    delBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await deleteSession(session.id);
      showToast('?? Session deleted');
      _renderSessionsList();
      updateSessionsCount();
    });

    container.appendChild(item);
  });
}

/**
 * Shared restore helper ¡ª used by both the sessions modal ("Load here" / "Reload")
 * and the init-time resume banner ("Resume" / "Load here").
 *
 * @param {object} session  - Object with files, fileMeta, projectTitle, currentStep, lastProcessedStep
 * @param {boolean} asNewChat - true: reset step counters; false: keep original steps
 */
function _restoreRepoFromSession(session, asNewChat) {
  const files = session.files || {};
  const fileMeta = session.fileMeta || {};
  const projectTitle = session.projectTitle || null;

  // Saved sessions do not currently persist local undo history. Start a new
  // local history baseline at index zero while preserving the protocol step
  // number for continuation flows.
  const currentStep = 0;
  const lastProcessedStep = asNewChat
    ? 0
    : (session.lastProcessedStep || 0);

  const versions = [{
    step: 0,
    changes: [],
    snapshot: JSON.parse(JSON.stringify(files)),
    metaSnapshot: JSON.parse(JSON.stringify(fileMeta))
  }];

  ForgeActions.replaceRepository({
    files,
    fileMeta,
    projectTitle,
    currentStep,
    lastProcessedStep,
    versions
  });

  if (asNewChat) {
    logToUI(
      '? Loaded "' +
      (projectTitle || 'untitled') +
      '" into current chat (steps reset)'
    );

    if (typeof armUploadInterceptor === 'function') {
      armUploadInterceptor();
    }
  } else {
    logToUI(
      '? Resumed "' +
      (projectTitle || 'untitled') +
      '" (Step ' +
      (lastProcessedStep + 1) +
      ')'
    );
  }

  const banner = document.getElementById('forge-resume-banner');
  if (banner) banner.remove();

}

/** Thin wrapper kept for call-site compatibility (sessions modal). */
function _loadSession(session, asNewChat) {
  _restoreRepoFromSession(session, asNewChat);
}

// ©¤©¤ Keyboard shortcuts ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

function setupDraggableWindow() {
  const ui = document.getElementById('forge-quick-ui');
  const header = ui ? ui.querySelector('.forge-ui-header') : null;
  if (!ui || !header) return;

  let dragging = false;
  let startX, startY;
  let baseLeft, baseTop;
  let pendingTx = 0, pendingTy = 0;
  let rafPending = false;

  header.style.cursor = 'grab';
  ui.style.willChange = 'transform';

  header.addEventListener('mousedown', (e) => {
    if (e.target.closest('button')) return;
    if (ui.classList.contains('forge-ui-docked') || ui.classList.contains('forge-ui-maximized')) return;

    dragging = true;
    header.style.cursor = 'grabbing';

    const rect = ui.getBoundingClientRect();
    baseLeft = rect.left;
    baseTop  = rect.top;

    ui.style.position = 'fixed';
    ui.style.left   = baseLeft + 'px';
    ui.style.top    = baseTop  + 'px';
    ui.style.right  = 'auto';
    ui.style.bottom = 'auto';
    ui.style.transform = '';

    // Disable pointer events on body during drag to stop hit-testing overhead
    ui.querySelector('.forge-ui-body').style.pointerEvents = 'none';

    startX = e.clientX;
    startY = e.clientY;
    pendingTx = 0;
    pendingTy = 0;

    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;

    let tx = e.clientX - startX;
    let ty = e.clientY - startY;

    // Clamp to viewport
    tx = Math.max(-baseLeft, Math.min(window.innerWidth  - ui.offsetWidth  - baseLeft, tx));
    ty = Math.max(-baseTop,  Math.min(window.innerHeight - ui.offsetHeight - baseTop,  ty));

    pendingTx = tx;
    pendingTy = ty;

    // Throttle to one DOM write per animation frame
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(() => {
        ui.style.transform = `translate(${pendingTx}px, ${pendingTy}px)`;
        rafPending = false;
      });
    }
  }, { passive: true });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    header.style.cursor = 'grab';

    // Re-enable pointer events
    ui.querySelector('.forge-ui-body').style.pointerEvents = '';

    // Bake transform into left/top
    const rect = ui.getBoundingClientRect();
    ui.style.left      = rect.left + 'px';
    ui.style.top       = rect.top  + 'px';
    ui.style.transform = '';
    rafPending = false;
  });
}

function handleSummaryOnlyCheckbox(checked) {
  ForgeActions.setSummaryOnly(!!checked);
}

function setupKeyboardShortcuts() {
  let pasteShortcutArmed = false;
  let pasteFallbackTimer = null;

  const clearPasteShortcut = () => {
    pasteShortcutArmed = false;

    if (pasteFallbackTimer) {
      clearTimeout(pasteFallbackTimer);
      pasteFallbackTimer = null;
    }
  };

  window.addEventListener('paste', (e) => {
    if (!pasteShortcutArmed) return;

    const text = e.clipboardData
      ? e.clipboardData.getData('text/plain')
      : '';

    clearPasteShortcut();
    e.preventDefault();
    e.stopPropagation();

    if (text) {
      showPasteConfirmation(text);
    } else {
      showImportModal();
      showToast('?? Clipboard text unavailable ¡ª use import dialog');
    }
  }, true);

  window.addEventListener('keydown', (e) => {
    // Esc closes modals
    if (e.key === 'Escape') {
      const modalsToClose = [
        { id: 'forge-help-modal', hideFn: hideHelpModal },
        { id: 'forge-settings-modal', hideFn: hideSettingsModal },
        { id: 'forge-sessions-modal', hideFn: hideSessionsModal },
        { id: 'forge-import-modal', hideFn: hideImportModal }
      ];

      for (const modal of modalsToClose) {
        const element = document.getElementById(modal.id);

        if (
          element &&
          !element.classList.contains('hidden')
        ) {
          if (modal.hideFn) {
            modal.hideFn();
          }

          e.preventDefault();
          return;
        }
      }
    }

    if (!e.ctrlKey || !e.shiftKey) return;

    let handled = false;
    let preserveNativePaste = false;

    switch (e.key.toUpperCase()) {
      case 'C':
        copyFullRepoJSON();
        handled = true;
        break;
      case 'V':
        clearPasteShortcut();
        pasteRepoJSON();
        handled = true;
        break;
      case 'P':
        parseAndApply();
        handled = true;
        break;
      case 'U':
        pasteAndApplyStep();
        handled = true;
        break;
      case 'E':
        handled = true;
        break;
      case 'D':
        repo.downloadZip();
        showToast('?? Downloading ZIP...');
        handled = true;
        break;
      case 'O':
        openInForgeIDE();
        handled = true;
        break;
      case 'X':
        copyChangesOnly();
        handled = true;
        break;
      case 'L':
        copyLastDiff();
        handled = true;
        break;
      case 'K':
        toggleDock();
        handled = true;
        break;
      case '?':
        showHelpModal();
        handled = true;
        break;

    }

    if (handled) {
      if (!preserveNativePaste) {
        e.preventDefault();
      }

      e.stopPropagation();
    }
  }, true);
}

// ©¤©¤ Paste Step fallback ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

/**
 * Read clipboard text, parse it as a FORGE codebase block, and apply it.
 * Useful when the chat uses a closed Shadow DOM that parseCodebase() can't reach.
 */
async function pasteAndApplyStep() {
  // Direct apply from clipboard ¡ª no modal
  if (!navigator.clipboard || !navigator.clipboard.readText) {
    showToast('Clipboard API not available ¡ª use the ?? Paste button instead');
    return;
  }
  let text;
  try {
    text = await navigator.clipboard.readText();
  } catch (e) {
    showToast('Clipboard access denied ¡ª use the ?? Paste button instead');
    return;
  }
  if (!text || !text.trim()) {
    showToast('Clipboard is empty');
    return;
  }
  const { fileBlocks, steps } = _parseCodebaseFromRawText(text);
  if (fileBlocks.length === 0 && steps.length === 0) {
    showToast('No FORGE operations found in clipboard');
    logToUI('Paste Step: no operations found in clipboard text');
    return;
  }
  logToUI(`Paste Step: found ${fileBlocks.length} ops in ${steps.length} step(s)`);
  await _applyParsedBlocks(fileBlocks, steps, false);
}

function showPasteStepModal() {
  const existing = document.getElementById('forge-paste-modal');
  if (existing) existing.remove();

  const BACKTICK = '\x60\x60\x60';
  const EXAMPLE = [
    BACKTICK + 'header',
    '/src/my-file.js #1 #new',
    BACKTICK,
    BACKTICK + 'javascript',
    'function hello() {',
    '  console.log("hello");',
    '}',
    BACKTICK,
    '',
    BACKTICK + 'javascript',
    '//codebase #step-1',
    "repo.addFile('#1', '/src/my-file.js');",
    BACKTICK
  ].join('\n');

  // Build DOM programmatically to avoid setForgeHTML mangling backticks
  const overlay = document.createElement('div');
  overlay.id = 'forge-paste-modal';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:999999',
    'background:rgba(0,0,0,0.6)',
    'display:flex', 'align-items:center', 'justify-content:center'
  ].join(';');

  const dialog = document.createElement('div');
  dialog.style.cssText = [
    'background:#252526', 'border:1px solid #3e3e42', 'border-radius:6px',
    'width:580px', 'max-width:95vw', 'max-height:90vh',
    'display:flex', 'flex-direction:column', 'font-family:Segoe UI,sans-serif'
  ].join(';');

  // Header
  const header = document.createElement('div');
  header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #3e3e42;';
  const title = document.createElement('span');
  title.style.cssText = 'font-size:13px;font-weight:600;color:#d4d4d4;';
  title.textContent = '\uD83D\uDCCB Paste & Apply Step';
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '\u00D7';
  closeBtn.style.cssText = 'background:none;border:none;color:#858585;font-size:18px;cursor:pointer;padding:0 4px;';
  header.appendChild(title);
  header.appendChild(closeBtn);

  // Body
  const body = document.createElement('div');
  body.style.cssText = 'padding:12px 16px;display:flex;flex-direction:column;gap:8px;overflow-y:auto;';

  const hint = document.createElement('div');
  hint.style.cssText = 'font-size:11px;color:#858585;';
  hint.textContent = 'Paste a FORGE codebase block below and click Apply. Useful when the DOM parser cannot reach the chat.';

  const textarea = document.createElement('textarea');
  textarea.id = 'forge-paste-modal-textarea';
  textarea.placeholder = EXAMPLE;
  textarea.spellcheck = false;
  textarea.style.cssText = [
    'width:100%', 'height:260px', 'background:#1a1a1a', 'color:#d4d4d4',
    'border:1px solid #3e3e42', 'border-radius:4px', 'padding:8px',
    'font-family:monospace', 'font-size:11px', 'resize:vertical',
    'box-sizing:border-box'
  ].join(';');

  body.appendChild(hint);
  body.appendChild(textarea);

  // Footer
  const footer = document.createElement('div');
  footer.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;padding:12px 16px;border-top:1px solid #3e3e42;';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.className = 'forge-progress-btn secondary';

  const applyBtn = document.createElement('button');
  applyBtn.textContent = 'Apply';
  applyBtn.className = 'forge-progress-btn';

  footer.appendChild(cancelBtn);
  footer.appendChild(applyBtn);

  dialog.appendChild(header);
  dialog.appendChild(body);
  dialog.appendChild(footer);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  const closeModal = () => overlay.remove();

  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

  applyBtn.addEventListener('click', async () => {
    const text = textarea.value;
    if (!text || !text.trim()) {
      showToast('Nothing to apply ¡ª paste a FORGE step first');
      return;
    }
    if (typeof _parseCodebaseFromRawText !== 'function' || typeof _applyParsedBlocks !== 'function') {
      showToast('Parser not loaded ¡ª please reload FORGE');
      return;
    }
    const { fileBlocks, steps } = _parseCodebaseFromRawText(text);
    if (fileBlocks.length === 0 && steps.length === 0) {
      showToast('No FORGE operations found ¡ª check the format');
      logToUI('Paste Step: no operations found in pasted text');
      return;
    }
    logToUI(`Paste Step: found ${fileBlocks.length} ops in ${steps.length} step(s)`);
    closeModal();
    await _applyParsedBlocks(fileBlocks, steps, false);
  });

  textarea.focus();
}

function hidePasteStepModal() {
  const modal = document.getElementById('forge-paste-modal');
  if (modal) modal.remove();
}

// ©¤©¤ Copy helpers ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

function copyFullRepoJSON() {
  const json = exportProjectToJSON();
  copyToClipboard(json);
  showToast('?? Copied full repo JSON');
  logToUI('? Copied full repo JSON to clipboard');
}

function copyChangesOnly() {
  const changesData = repo.getChangesOnly();
  copyToClipboard(exportChangesToJSON());
  showToast(`?? Copied ${changesData.files.length} changed file(s)`);
  logToUI(`? Copied ${changesData.files.length} changed file(s) to clipboard`);
}

function copyLastDiff() {
  const diff = repo.getLastDiffForLLM();
  copyToClipboard(diff);
  showToast('?? Copied last diff (LLM format)');
  logToUI('? Copied last diff to clipboard');
}

function pasteRepoJSON() {
  if (navigator.clipboard && navigator.clipboard.readText) {
    navigator.clipboard.readText().then(text => {
      showPasteConfirmation(text);
    }).catch(() => {
      showImportModal();
      showToast('?? Clipboard access denied ¡ª use import dialog');
    });
  } else {
    showImportModal();
    showToast('?? Clipboard not supported ¡ª use import dialog');
  }
}

// ©¤©¤ Settings helpers ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

function showSettingsModal() {
  const modal = document.getElementById('forge-settings-modal');
  const urlInput      = document.getElementById('forge-settings-url-input');
  const promptInput   = document.getElementById('forge-settings-prompt-input');
  const patternsInput = document.getElementById('forge-settings-patterns-input');
  const originsInput  = document.getElementById('forge-settings-origins-input');
  const glUrlInput    = document.getElementById('forge-settings-gitlab-url');
  const glPatInput    = document.getElementById('forge-settings-gitlab-pat');

  urlInput.value    = localStorage.getItem('forge-ide-url') || FORGE_CONFIG.FORGE_IDE_URL;

  promptInput.value = localStorage.getItem('forge-workspace-prompt') ||
    (typeof WORKSPACE_PROMPT_BUILTIN !== 'undefined' ? WORKSPACE_PROMPT_BUILTIN : '');
  patternsInput.value = localStorage.getItem('forge-summary-patterns') || '**/*.md';
  originsInput.value  = localStorage.getItem('forge-execute-allowed-origins') || 'localhost\n*.gov';

  if (glUrlInput) glUrlInput.value = localStorage.getItem('forge-gitlab-url') || 'https://git.fda.gov';
  if (glPatInput) glPatInput.value = localStorage.getItem('forge-gitlab-pat') || '';

  modal.classList.remove('hidden');
  urlInput.focus();
  
  // Setup tab switching
  const tabs = modal.querySelectorAll('.forge-settings-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      
      // Hide all tab contents
      modal.querySelectorAll('.forge-settings-tab-content').forEach(content => {
        content.classList.remove('active');
      });
      
      // Remove active from all tabs
      tabs.forEach(t => t.classList.remove('active'));
      
      // Show selected tab content and mark tab as active
      document.getElementById('forge-settings-' + tabName).classList.add('active');
      tab.classList.add('active');
    });
  });
}

function hideSettingsModal() {
  document.getElementById('forge-settings-modal').classList.add('hidden');
}

function saveSettings() {
  const urlInput    = document.getElementById('forge-settings-url-input');
  const promptInput = document.getElementById('forge-settings-prompt-input');
  const patternsInput = document.getElementById('forge-settings-patterns-input');

  const newURL = urlInput.value.trim();
  if (!newURL) { alert('URL cannot be empty'); return; }

  try { new URL(newURL); } catch (e) {
    alert('Invalid URL format.');
    return;
  }

  localStorage.setItem('forge-ide-url', newURL);

  const customPrompt = promptInput.value.trim();
  if (customPrompt) {
    localStorage.setItem('forge-workspace-prompt', customPrompt);
    logToUI('? Custom workspace prompt saved');
  } else {
    localStorage.removeItem('forge-workspace-prompt');
    logToUI('? Workspace prompt reset to built-in default');
  }

  const patterns = patternsInput.value.trim() || '**/*.md';
  localStorage.setItem('forge-summary-patterns', patterns);
  logToUI('? Summary export patterns saved');

  const origins = originsInput.value.trim() || 'localhost\n*.gov';
  localStorage.setItem('forge-execute-allowed-origins', origins);
  logToUI('? Allowed fetch origins saved');
  window._forgeExecuteConsented = false;

  // GitLab credentials
  const glUrl = document.getElementById('forge-settings-gitlab-url');
  const glPat = document.getElementById('forge-settings-gitlab-pat');
  if (glUrl && glUrl.value.trim()) {
    localStorage.setItem('forge-gitlab-url', glUrl.value.trim().replace(/\/+$/, ''));
  }
  if (glPat && glPat.value.trim()) {
    localStorage.setItem('forge-gitlab-pat', glPat.value.trim());
  } else if (glPat && glPat.value === '') {
    // Explicitly cleared ¡ª remove it
    localStorage.removeItem('forge-gitlab-pat');
  }
  if (glUrl || glPat) logToUI('? GitLab credentials saved');

  hideSettingsModal();
  showToast('? Settings saved');
  logToUI(`? FORGE IDE URL updated: ${newURL}`);
}

function resetSettings() {
  document.getElementById('forge-settings-url-input').value    = FORGE_CONFIG.FORGE_IDE_URL;
  document.getElementById('forge-settings-prompt-input').value =
    (typeof WORKSPACE_PROMPT_BUILTIN !== 'undefined' ? WORKSPACE_PROMPT_BUILTIN : '');
  document.getElementById('forge-settings-patterns-input').value = '**/*.md';
  document.getElementById('forge-settings-origins-input').value  = 'localhost\n*.gov';

  localStorage.removeItem('forge-ide-url');
  localStorage.removeItem('forge-workspace-prompt');
  localStorage.removeItem('forge-summary-patterns');
  localStorage.removeItem('forge-execute-allowed-origins');
  window._forgeExecuteConsented = false;

  hideSettingsModal();
  showToast('? Settings reset to defaults');
  logToUI('? Settings reset to defaults');
}
// FORGE CODE - Main UI Creation
// Creates the main UI structure

function createForgeUI() {
  const existing = document.getElementById('forge-quick-ui');
  if (existing) existing.remove();

  ['forge-import-modal', 'forge-settings-modal', 'forge-sessions-modal', 'forge-help-modal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });

  const ui = document.createElement('div');
  ui.id = 'forge-quick-ui';
  ui.className = 'forge-ui-normal';

  // Inject styles
  const styleEl = document.createElement('style');
  styleEl.textContent = FORGE_STYLES;
  document.head.appendChild(styleEl);

  setForgeHTML(ui, `
    <div class="forge-ui-header">
      <div class="forge-ui-header-title">
        <span>??? FORGE Code <span style="font-size:0.7em; opacity:0.7; font-weight:400;">v${FORGE_VERSION}</span></span>
      </div>
      <div class="forge-ui-header-buttons">

        <button class="forge-ui-header-btn" id="forge-dock-btn" title="Dock to right side">??</button>
        <button class="forge-ui-header-btn" id="forge-settings-btn" title="Settings">??</button>
        <button class="forge-ui-header-btn" id="forge-help-btn" title="Keyboard Shortcuts (Ctrl+Shift+?)">?</button>
        <button class="forge-ui-header-btn" id="forge-minimize-btn" title="Minimize">?</button>

        <button class="forge-ui-header-btn" id="forge-close-btn" title="Close">¡Á</button>
      </div>
    </div>

    <div class="forge-ui-body">
      <div class="forge-control-panel">

        <!-- ©¤©¤ Welcome banner / Quick Start (shown when no project loaded) ©¤©¤ -->
        <div class="forge-welcome-banner" id="forge-welcome-banner">
          <strong>?? Welcome to FORGE Code</strong>
          <p style="margin: 8px 0; font-size: 13px;">Tell me what to build and I'll create it for you:</p>
          <textarea 
            id="forge-quick-start-input" 
            class="forge-quick-start-input" 
            placeholder="Example: Build a simple dashboard showing prime numbers up to 100"
            rows="3"
            style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit; font-size: 13px; resize: vertical;"
          ></textarea>
          <button class="forge-btn" id="forge-quick-start-btn" style="margin-top: 8px; width: 100%;">?? Build This</button>
          <button class="forge-btn forge-btn-secondary" id="forge-import-existing-btn" style="margin-top: 8px; width: 100%;">?? Import Existing Repository</button>
          <button class="forge-btn forge-btn-secondary" id="forge-show-full-tool-btn" style="margin-top: 8px; width: 100%;">?? See Full Tool</button>
        </div>
        <div id="forge-full-view" style="display:none">
        <!-- ©¤©¤ Project row (hidden when no project loaded) ©¤©¤ -->
        <div class="forge-project-title-container" id="forge-project-row">
          <span class="forge-project-title-label">Project:</span>
          <input type="text" class="forge-project-title-input" id="forge-project-title" placeholder="untitledProject">
        </div>

        <!-- ©¤©¤ Status bar (hidden when no project loaded) ©¤©¤ -->
        <div class="forge-status-bar" id="forge-status-bar">
          <span>
            <span class="forge-status-dot"></span>
            <span id="forge-file-count">0 files</span>
          </span>
          <span class="forge-status-step">
            Step <span id="forge-current-step">0</span> applied
          </span>
          <div class="forge-next-step-control">
            <span class="forge-next-step-label">Next:</span>
            <button class="forge-next-step-btn" id="forge-next-step-dec" title="Decrement">?</button>
            <input type="number" class="forge-next-step-input" id="forge-next-step-input" value="1" min="1" title="Tell the LLM which step number to use next">
            <button class="forge-next-step-btn" id="forge-next-step-inc" title="Increment">+</button>
          </div>
        </div>

        <!-- ©¤©¤ Primary action ©¤©¤ -->
        <div id="forge-main-controls" style="display:flex; gap:5px; margin-bottom:5px;">
          <button class="forge-btn" id="forge-parse-btn" style="margin-bottom:0;">? Apply Steps</button>
          <button class="forge-btn forge-btn-secondary" id="forge-autopilot-btn" style="margin-bottom:0; width:auto; padding:0 10px;" title="Toggle Auto-Pilot">?? OFF</button>
          <button class="forge-btn forge-btn-secondary" id="forge-more-btn" style="margin-bottom:0; width:auto; padding:0 10px;" title="More options">?</button>
          <span class="forge-heartbeat-indicator" style="display:none; font-size:10px; color:#4caf50; align-self:center;" title="Heartbeat active ¡ª status sent to LLM after each step">??</span>
        </div>
        
        <!-- ©¤©¤ More options menu (hidden by default) ©¤©¤ -->
        <div id="forge-more-menu" class="forge-more-menu" style="display:none;">
          <button class="forge-more-menu-item" id="forge-paste-btn" title="Paste &amp; Apply from clipboard (Ctrl+Shift+U)">?? Paste Manual Steps</button>
          <button class="forge-more-menu-item" id="forge-heartbeat-btn" title="Queue a diagnostic heartbeat without enabling Auto-Pilot">?? Add Ping</button>
        </div>
        <!-- ©¤©¤ Auto-Pilot activity strip (hidden until first run) ©¤©¤ -->
        <div class="forge-autopilot-strip" id="forge-autopilot-strip" style="display:none;"></div>

        <!-- ©¤©¤ sendBack results (shown only when queue has items) ©¤©¤ -->
        <div id="forge-sendback-section" style="display:none;">
          <button class="forge-btn forge-btn-send" id="forge-send-to-elsa-btn">?? Send Results</button>
          <div class="forge-sendback-results-box" id="forge-sendback-results">No results yet</div>
        </div>

        <!-- ©¤©¤ Secondary actions (hidden when no project loaded) ©¤©¤ -->
        <div id="forge-project-actions" style="display:none;">

          <button class="forge-btn forge-btn-secondary" id="forge-share-btn">?? Preview &amp; Share in FORGE IDE</button>
        </div>

        <!-- ©¤©¤ Quick-access row: Import + Sessions (always visible) ©¤©¤ -->
        <div class="forge-quick-row">
          <button class="forge-quick-btn" id="forge-sessions-btn" title="Browse all saved FORGE sessions">?? Sessions</button>
          <button class="forge-quick-btn" id="forge-quick-import-btn" title="Import a project from JSON or ZIP">?? Import</button>
          <button class="forge-quick-btn" id="forge-quick-download-btn" title="Download project as ZIP" style="display:none;">?? ZIP</button>
        </div>

        <div class="forge-divider"></div>

        <!-- ©¤©¤ Checkboxes ©¤©¤ -->
        <div class="forge-upload-row">
          <label class="forge-upload-label-wrap" title="Attach current repo JSON to your next message">
            <input type="checkbox" id="forge-upload-checkbox">
            <span id="forge-upload-label">?? Attach repo + protocol to next message</span>
          </label>
        </div>
        <div class="forge-upload-row">
          <label class="forge-upload-label-wrap" title="Only send file paths and metadata ¡ª no file contents. Saves tokens. Enable 'Attach repo' first.">
            <input type="checkbox" id="forge-summary-only-checkbox" disabled>
            <span id="forge-summary-only-label" style="opacity:0.4;">?? Token saver: Summary only (paths + metadata)</span>
          </label>
        </div>
        <!-- ©¤©¤ FORGE OUT (shown when project loaded) ©¤©¤ -->
        <div id="forge-out-section" style="display:none;">
          <div style="display:flex; align-items:center; gap:5px; margin-bottom:3px;">
            <div class="forge-out-label" style="margin-bottom:0;">FORGE OUT</div>
            <button class="forge-out-info-btn" id="forge-out-info-btn" title="What is FORGE OUT?">?</button>
          </div>
          <div class="forge-out-popover" id="forge-out-popover" style="display:none;">
            <strong>What is FORGE OUT?</strong><br><br>
            FORGE OUT copies your repo to the clipboard as a JSON snapshot.
            You can then <em>forge it in</em> locally using the FORGE CLI ¡ª
            it writes all your files to disk instantly.<br><br>
            <strong>Full</strong> ¡ª the complete repo JSON<br>
            <strong>Delta</strong> ¡ª only files changed in the last step<br><br>
            <a href="https://gsrs.preprod.fda.gov/quickshare/" target="_blank" style="color:#667eea;">
              Get the FORGE CLI &amp; Full IDE ¡ú
            </a>
          </div>
          <div class="forge-copy-group">
            <button class="forge-btn forge-btn-secondary forge-btn-compact" id="forge-copy-full-btn" title="Copy Full Repo JSON">?? Full</button>
            <button class="forge-btn forge-btn-secondary forge-btn-compact" id="forge-copy-changes-btn" title="Copy Changes Only">?? Delta</button>
            <a href="${localStorage.getItem('forge-ide-url') || FORGE_CONFIG.FORGE_IDE_URL}#cli" target="_blank" class="forge-btn forge-btn-secondary forge-btn-compact" title="Get CLI" style="text-decoration:none; display:inline-flex; align-items:center; justify-content:center; gap:4px;">?? CLI ¨J</a>
          </div>
          <button class="forge-btn forge-btn-compact" id="forge-gitlab-push-btn" title="Push current VFS to GitLab" style="background:#1a7a3a;margin-top:3px;">?? Push to GitLab</button>
        </div>

        <!-- ©¤©¤ Advanced expander ©¤©¤ -->
        <!-- ©¤©¤ Undo / Redo ©¤©¤ -->
        <div class="forge-step-controls" style="margin-bottom:5px;">
          <button class="forge-btn forge-btn-secondary forge-btn-small" id="forge-prev-step">? Undo</button>
          <button class="forge-btn forge-btn-secondary forge-btn-small" id="forge-next-step">? Redo</button>
        </div>

        <!-- ©¤©¤ Auto-sync section (experimental, collapsed by default) ©¤©¤ -->
        <div class="forge-divider"></div>
        <div class="forge-sync-experimental" id="forge-sync-experimental">
          <div id="forge-sync-toggle" role="button" tabindex="0" style="cursor:pointer;font-size:10px;color:#858585;text-transform:uppercase;letter-spacing:0.06em;display:flex;align-items:center;gap:6px;padding:2px 0;user-select:none;">
            <span id="forge-sync-caret" style="display:inline-block;transition:transform 0.15s;">?</span>
            <span>LOCAL SYNC</span>
            <span style="background:#4a3c1e;color:#ffc107;border:1px solid #b8860b;border-radius:3px;padding:0 5px;font-size:9px;letter-spacing:0.03em;">EXPERIMENTAL</span>
          </div>
          <div id="forge-sync-body" style="display:none;">
            <div style="display:flex;align-items:center;gap:5px;margin:6px 0 3px;">
              <button class="forge-out-info-btn" id="forge-sync-info-btn" title="What is Auto-sync?">? What is this?</button>
            </div>
            <div class="forge-out-popover" id="forge-sync-popover" style="display:none;">
              <strong>? Auto-sync with local disk (experimental)</strong><br><br>
              Run <code style="background:#1e1e1e;padding:1px 5px;border-radius:3px;">forge sync</code> in your project folder,
              then enable the toggle below. FORGE will automatically push changes to disk after
              each Apply Steps, and show a prompt when files change on disk.<br><br>
              <strong style="color:#ffc107;">?? Known issue:</strong> some <code style="background:#1e1e1e;padding:1px 5px;border-radius:3px;">/</code> characters
              may be written to disk as <code style="background:#1e1e1e;padding:1px 5px;border-radius:3px;">//</code> through auto-sync.
              The manual <code style="background:#1e1e1e;padding:1px 5px;border-radius:3px;">forge in</code> / <code style="background:#1e1e1e;padding:1px 5px;border-radius:3px;">forge out</code>
              workflow is unaffected ¡ª prefer it for now if you hit this.<br><br>
              <strong>Install the FORGE CLI</strong> to get <code style="background:#1e1e1e;padding:1px 5px;border-radius:3px;">forge sync</code>:<br>
              <a href="${localStorage.getItem('forge-ide-url') || FORGE_CONFIG.FORGE_IDE_URL}#cli" target="_blank" style="color:#667eea;">Get the CLI ¡ú</a><br><br>
              <strong>Custom port?</strong> Use <code style="background:#1e1e1e;padding:1px 5px;border-radius:3px;">forge sync --port 7332</code>
              and set the port below.
            </div>
            <div id="forge-sync-row" style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-bottom:3px;">
              <label class="forge-upload-label-wrap" style="flex:none;" title="Sync VFS with local disk via forge sync server">
                <input type="checkbox" id="forge-sync-checkbox">
                <span id="forge-sync-label">? Auto-sync</span>
              </label>
              <span id="forge-sync-status" style="font-size:10px;padding:2px 7px;border-radius:10px;background:#3e3e42;color:#858585;">offline</span>
              <button id="forge-sync-pull-btn" title="Pull from disk now" style="background:#0e639c;border:none;color:#fff;padding:2px 8px;border-radius:4px;cursor:pointer;font-size:11px;display:none;">¡ý Pull</button>
              <button id="forge-sync-push-btn" title="Push to disk now" style="background:#1a7a3a;border:none;color:#fff;padding:2px 8px;border-radius:4px;cursor:pointer;font-size:11px;display:none;">¡ü Push</button>
            </div>
            <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;">
              <span style="font-size:10px;color:#858585;white-space:nowrap;">Port:</span>
              <input type="number" id="forge-sync-port-input" value="7331" min="1024" max="65535"
                style="width:64px;background:#1e1e1e;border:1px solid #3e3e42;border-radius:3px;color:#4fc3f7;font-size:11px;padding:2px 5px;font-family:Consolas,monospace;"
                title="forge sync server port (default 7331)">
              <button id="forge-sync-reconnect-btn"
                style="background:#3e3e42;border:none;color:#d4d4d4;padding:2px 8px;border-radius:4px;cursor:pointer;font-size:10px;"
                title="Re-check for sync server">? Reconnect</button>
              <span id="forge-sync-unavailable" style="font-size:10px;color:#858585;display:none;">
                (not available on this platform)
              </span>
            </div>
          </div>
        </div>
        </div>
      </div>
      <div class="forge-explorer-panel">
        <div class="forge-file-list-panel">
          <div id="forge-file-list"></div>
        </div>
        <div class="forge-content-panel">
          <div id="forge-content-title"></div>
          <div id="forge-content-body"></div>
        </div>
      </div>

    </div>

    <div id="forge-import-modal" class="forge-import-modal hidden">
      <div class="forge-import-dialog">
              <div class="forge-import-header">Import Project to FORGE Code</div>
        <textarea
          id="forge-import-textarea"
          class="forge-import-textarea"
          placeholder='Paste your project JSON here...'
        ></textarea>
        <div class="forge-import-buttons">
          <button class="forge-btn forge-btn-secondary forge-import-file-btn" id="forge-import-file-btn" title="Load from JSON">?? JSON</button>
          <button class="forge-btn forge-btn-secondary forge-import-file-btn" id="forge-import-zip-btn" title="Load from ZIP">?? ZIP</button>
          <button class="forge-btn forge-btn-secondary forge-import-file-btn" id="forge-import-folder-btn" title="Load from folder">?? Folder</button>
          <button class="forge-btn forge-btn-secondary forge-import-file-btn" id="forge-import-gitlab-btn" title="Import from GitLab">?? GitLab</button>
          <button class="forge-btn forge-btn-secondary forge-import-file-btn" id="forge-import-cancel-btn">Cancel</button>
          <button class="forge-btn" id="forge-import-submit-btn">Import</button>
        </div>
      </div>
    </div>

    <div id="forge-settings-modal" class="forge-help-modal hidden">
      <div class="forge-help-dialog">
        <div class="forge-help-header">
          <span>?? Settings</span>
          <button class="forge-help-close" id="forge-settings-close">¡Á</button>
        </div>
        <div class="forge-settings-tabs">
          <button class="forge-settings-tab active" data-tab="general">General</button>
          <button class="forge-settings-tab" data-tab="advanced">Advanced</button>
        </div>
        <div class="forge-help-body">
          <div id="forge-settings-general" class="forge-settings-tab-content active">
            <div class="forge-settings-section">
              <div class="forge-settings-label">FORGE IDE URL</div>
              <input type="text" class="forge-settings-input" id="forge-settings-url-input" placeholder="https://example.com/quickshare/">
              <div class="forge-settings-hint">
                Used when clicking "Open in Full FORGE IDE"
              </div>
            </div>
            <div class="forge-settings-section">
              <div class="forge-settings-label">Custom Workspace Prompt</div>
              <textarea class="forge-settings-input" id="forge-settings-prompt-input" rows="6"
                placeholder="Leave blank to use the built-in prompt from prompts/workspace_forge_codebase.md"
                style="font-size:11px; font-family: monospace; resize: vertical;"></textarea>
              <div class="forge-settings-hint">
                Override the workspace system prompt. Leave blank to use the default built at compile time.
              </div>
            </div>
          </div>
          <div id="forge-settings-advanced" class="forge-settings-tab-content">
            <div class="forge-settings-section">
              <div class="forge-settings-label">Temperature</div>
              <div class="forge-temp-container">
                <span class="forge-temp-label">Temp</span>
                <input type="range" class="forge-temp-slider-inline" id="forge-temp-slider" min="0" max="1" step="0.1" value="0">
                <span class="forge-temp-value" id="forge-temp-display">0.0</span>
                <span class="forge-temp-status">OFF</span>
                <button class="forge-temp-toggle" id="forge-temp-toggle">¡ð</button>
              </div>
            </div>
            <div class="forge-settings-section">
              <div class="forge-settings-label">Summary Export Patterns</div>
              <textarea class="forge-settings-input" id="forge-settings-patterns-input" rows="4"
                placeholder="**/*.md&#10;*.txt&#10;README*&#10;CHANGELOG*"
                style="font-size:11px; font-family: monospace; resize: vertical;"></textarea>
              <div class="forge-settings-hint">
                When using "Summary only" export, files matching these glob patterns will include full contents. One pattern per line. Default: **/*.md
              </div>
            </div>
            <div class="forge-settings-section">
              <div class="forge-settings-label">Allowed Fetch Origins <span style="font-size:10px;color:#858585;font-weight:400;text-transform:none;">(for #execute scripts)</span></div>
              <textarea class="forge-settings-input" id="forge-settings-origins-input" rows="4"
                placeholder="localhost&#10;*.gov&#10;https://api.example.com"
                style="font-size:11px; font-family: monospace; resize: vertical;"></textarea>
              <div class="forge-settings-hint">
                #execute scripts can only fetch from these origins. One pattern per line. <code>localhost</code> matches any localhost port. <code>*.gov</code> matches any .gov domain. <code>*</code> allows all (not recommended). Default: localhost, *.gov
              </div>
            </div>
            <div class="forge-settings-section">
              <div class="forge-settings-label">GitLab Credentials</div>
              <div class="forge-settings-hint" style="margin-bottom:6px;">Used for ?? Import and Push to GitLab. Token needs <code style="background:#1e1e1e;padding:1px 4px;border-radius:3px;">read_api</code> + <code style="background:#1e1e1e;padding:1px 4px;border-radius:3px;">write_repository</code> scopes.</div>
              <input type="text" class="forge-settings-input" id="forge-settings-gitlab-url" placeholder="https://git.fda.gov" style="margin-bottom:6px;">
              <input type="password" class="forge-settings-input" id="forge-settings-gitlab-pat" placeholder="glpat-¡­ (leave blank to keep existing)">
              <div class="forge-settings-hint">Stored in localStorage. Leave PAT blank to keep the currently saved token.</div>
            </div>
            <div class="forge-settings-section">
              <div class="forge-settings-label">Export &amp; Tools</div>
              <div class="forge-upload-row" style="margin-bottom:8px;">
                <label class="forge-upload-label-wrap" title="Append the FORGE protocol to the message when attaching repo ¡ª helps the LLM understand how to respond">
                  <input type="checkbox" id="forge-coding-prompt-checkbox" checked>
                  <span id="forge-coding-prompt-label">?? Append protocol to message on attach</span>
                </label>
              </div>
              <div class="forge-copy-group">
                <button class="forge-btn forge-btn-secondary forge-btn-compact" id="forge-copy-diff-btn" title="Copy Last Diff">?? Diff</button>
                <button class="forge-btn forge-btn-secondary forge-btn-compact" id="forge-download-btn">?? ZIP</button>
                <button class="forge-btn forge-btn-secondary forge-btn-compact" id="forge-import-btn">?? Import</button>
                <button class="forge-btn forge-btn-secondary forge-btn-compact" id="forge-send-diff-btn" title="Send Diff to LLM">?? Send Diff</button>
              </div>
            </div>
            <div class="forge-settings-section">
              <div class="forge-settings-label" style="display:flex;align-items:center;justify-content:space-between;">
                <span>Log</span>
                <button class="forge-btn forge-btn-secondary forge-btn-small" id="forge-copy-log-btn" title="Copy log to clipboard" style="margin:0;padding:2px 7px;font-size:10px;">??</button>
              </div>
              <div class="forge-log" id="forge-log" style="max-height:160px;">Ready...</div>
            </div>
          </div>
        </div>
        <div class="forge-confirm-footer">
          <button class="forge-progress-btn secondary" id="forge-settings-reset">Reset to Default</button>
          <button class="forge-progress-btn secondary" id="forge-settings-cancel">Cancel</button>
          <button class="forge-progress-btn" id="forge-settings-save">Save</button>
        </div>
      </div>
    </div>

    <div id="forge-sessions-modal" class="forge-help-modal hidden">
      <div class="forge-help-dialog" style="width:660px; max-width:95vw;">
        <div class="forge-help-header">
          <span>?? Saved Sessions</span>
          <button class="forge-help-close" id="forge-sessions-close">¡Á</button>
        </div>
        <div class="forge-help-body" style="padding:0;">
          <div id="forge-sessions-list" class="forge-sessions-list">
            <div class="forge-sessions-empty">Loading sessions...</div>
          </div>
        </div>
        <div class="forge-help-footer" style="text-align:left; display:flex; justify-content:space-between; align-items:center;">
          <button class="forge-progress-btn secondary" id="forge-sessions-clear-all" style="font-size:11px; padding:6px 12px;">?? Clear All</button>
          <span>Click a session to load it, or navigate back to its original chat.</span>
        </div>
      </div>
    </div>

    <div id="forge-help-modal" class="forge-help-modal hidden">
      <div class="forge-help-dialog">
        <div class="forge-help-header">
          <span>?? Keyboard Shortcuts</span>
          <button class="forge-help-close" id="forge-help-close">¡Á</button>
        </div>
        <div class="forge-help-body">
          <div class="forge-help-section">
            <div class="forge-help-section-title">File Operations</div>
            <div class="forge-help-shortcut">
              <div class="forge-help-shortcut-desc">Copy full repo JSON to clipboard</div>
              <div class="forge-help-shortcut-keys">Ctrl+Shift+C</div>
            </div>
            <div class="forge-help-shortcut">
              <div class="forge-help-shortcut-desc">Paste/import repo JSON (with confirmation)</div>
              <div class="forge-help-shortcut-keys">Ctrl+Shift+V</div>
            </div>
            <div class="forge-help-shortcut">
              <div class="forge-help-shortcut-desc">Copy changes only (current step)</div>
              <div class="forge-help-shortcut-keys">Ctrl+Shift+X</div>
            </div>
            <div class="forge-help-shortcut">
              <div class="forge-help-shortcut-desc">Copy last diff (LLM-readable format)</div>
              <div class="forge-help-shortcut-keys">Ctrl+Shift+L</div>
            </div>
            <div class="forge-help-shortcut">
              <div class="forge-help-shortcut-desc">Download ZIP file</div>
              <div class="forge-help-shortcut-keys">Ctrl+Shift+D</div>
            </div>
          </div>
          <div class="forge-help-section">
            <div class="forge-help-section-title">Actions</div>
            <div class="forge-help-shortcut">
              <div class="forge-help-shortcut-desc">Parse &amp; Apply Steps</div>
              <div class="forge-help-shortcut-keys">Ctrl+Shift+P</div>
            </div>
            <div class="forge-help-shortcut">
              <div class="forge-help-shortcut-desc">Paste &amp; Apply from clipboard</div>
              <div class="forge-help-shortcut-keys">Ctrl+Shift+U</div>
            </div>
            <div class="forge-help-shortcut">
              <div class="forge-help-shortcut-desc">Toggle Explore (maximize/normal)</div>
              <div class="forge-help-shortcut-keys">Ctrl+Shift+E</div>
            </div>
            <div class="forge-help-shortcut">
              <div class="forge-help-shortcut-desc">Open in Full FORGE IDE</div>
              <div class="forge-help-shortcut-keys">Ctrl+Shift+O</div>
            </div>
            <div class="forge-help-shortcut">
              <div class="forge-help-shortcut-desc">Toggle dock mode</div>
              <div class="forge-help-shortcut-keys">Ctrl+Shift+K</div>
            </div>
          </div>
          <div class="forge-help-section">
            <div class="forge-help-section-title">Help</div>
            <div class="forge-help-shortcut">
              <div class="forge-help-shortcut-desc">Show this help panel</div>
              <div class="forge-help-shortcut-keys">Ctrl+Shift+?</div>
            </div>
          </div>
        </div>
        <div class="forge-help-footer">
          Press Esc or click outside to close
        </div>
      </div>
    </div>
  `);

  document.body.appendChild(ui);
  
  // Move modals out of the UI container so they behave correctly with position: fixed
  // when the UI container has transform/will-change applied during drag.
  ['forge-import-modal', 'forge-settings-modal', 'forge-sessions-modal', 'forge-help-modal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) document.body.appendChild(el);
  });

  setupUIHandlers();
  ForgeActions.syncRepository();

  if (!repo.projectTitle) {
    ForgeActions.setProjectTitle(
      typeof generateProjectName === 'function'
        ? generateProjectName()
        : 'untitledProject'
    );
  }

  // Auto-enable temperature control on startup
  enableTempControl();

  // Default protocol append to ON
  ForgeActions.setIncludeCodingPrompt(true);

  // Restore dock state if previously docked
  restoreDockState();

}



// ©¤©¤ Advanced expander ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

window.toggleForgeOutPopover = function toggleForgeOutPopover() {
  const popover = document.getElementById('forge-out-popover');
  if (popover) popover.style.display = popover.style.display === 'none' ? '' : 'none';
};

// ©¤©¤ Upload checkbox handlers ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

function handleUploadCheckbox(checked) {
  if (checked) {
    armUploadInterceptor();
  } else {
    disarmUploadInterceptor();
  }
}

function handleCodingPromptCheckbox(checked) {
  const enabled = !!checked;
  ForgeActions.setIncludeCodingPrompt(enabled);

  logToUI(
    enabled
      ? '?? Protocol will be appended to next attach'
      : '?? Protocol append disabled'
  );
}
// FORGE Code - JavaScript Validator
// Syntax checking for .js files using SAFE parsing (no execution).

/**
 * Safely check JavaScript syntax without executing code.
 * Tries CSP-safe iframe parsing first, falls back to Function constructor.
 *
 * @param {string} content - JavaScript code to validate
 * @returns {Promise<{success: boolean, error?: Error}>}
 */
async function _safeSyntaxCheck(content) {
  // Hashbangs are valid only at the beginning of a script. The validator
  // wraps source inside a function, so convert the hashbang to a comment
  // while preserving the original line count for error reporting.
  const normalizedContent =
    content.replace(
      /^#!([^\r\n]*)/,
      '//$1'
    );

  // Try 1: CSP-safe iframe parsing (preferred for testing).
  // Wrap the code in a function declaration, but do not call it.
  if (typeof execWithCSPFallback === 'function') {
    const wrappedCode =
      `(function() {\n${normalizedContent}\n});`;

    const result =
      await execWithCSPFallback(
        wrappedCode,
        {},
        'js-validator-parse-only'
      );

    if (!result.success && result.error) {
      return {
        success: false,
        error: result.error
      };
    }

    return { success: true };
  }

  // Try 2: Function constructor (fast, no execution, works in most CSP).
  try {
    new Function(normalizedContent);
    return { success: true };
  } catch (e) {
    // If it's a syntax error, that's what we want to catch
    if (e instanceof SyntaxError) {
      return { success: false, error: e };
    }
    // Otherwise re-throw
    throw e;
  }
}

/**
 * Validate JavaScript syntax using SAFE parsing (no execution).
 * Uses CSP-safe iframe parsing to check syntax without running code.
 * Falls back to Function constructor if CSP utility not available.
 *
 * @param {string} path - File path (used for error context)
 * @param {string} content - File content
 * @returns {Promise<{ valid: boolean, errors: Array, warnings: Array }>}
 */
async function jsValidator(path, content) {
  const errors = [];
  const warnings = [];

  if (!content || !content.trim()) {
    return { valid: true, errors, warnings };
  }

  // ©¤©¤ Syntax check (SAFE - no execution) ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  const syntaxResult = await _safeSyntaxCheck(content);
  
  if (!syntaxResult.success && syntaxResult.error) {
    const e = syntaxResult.error;
    // Try to extract line number from error message
    const lineMatch = e.message && e.message.match(/line (\d+)/i);
    errors.push({
      line: lineMatch ? parseInt(lineMatch[1]) : undefined,
      message: e.message || String(e),
      type: 'syntax'
    });
    return { valid: false, errors, warnings };
  }

  // Syntax is valid
  return {
    valid: true,
    errors,
    warnings
  };
}

// Export for browser
if (typeof window !== 'undefined') {
  window.jsValidator = jsValidator;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { jsValidator };
}
// FORGE Code - CSS Validator
// Regex-based validation for .css files.

const _CSS_TYPOS = [
  ['colr',        'color'],
  ['backround',   'background'],
  ['backgroundc', 'background-color'],
  ['fontt',       'font'],
  ['fontsize',    'font-size'],
  ['bordre',      'border'],
  ['marginn',     'margin'],
  ['paddingg',    'padding'],
  ['displayy',    'display'],
  ['positionn',   'position'],
  ['widthh',      'width'],
  ['heightt',     'height'],
  ['opactiy',     'opacity'],
  ['visiblity',   'visibility'],
  ['transfrom',   'transform'],
  ['transiton',   'transition'],
  ['animaiton',   'animation'],
  ['overfow',     'overflow'],
  ['alighn',      'align'],
  ['flexs',       'flex'],
];

/**
 * Strip comments from CSS source so we don't false-positive inside them.
 */
function _stripCSSComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, match => {
    return match.replace(/[^\n]/g, ' ');
  });
}

/**
 * Validate CSS source.
 *
 * @param {string} path - File path
 * @param {string} content - File content
 * @returns {{ valid: boolean, errors: Array, warnings: Array }}
 */
function cssValidator(path, content) {
  const errors = [];
  const warnings = [];

  if (!content || !content.trim()) {
    return { valid: true, errors, warnings };
  }

  const stripped = _stripCSSComments(content);

  // ©¤©¤ Brace balance ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  let depth = 0;
  let lineNum = 1;
  for (let i = 0; i < stripped.length; i++) {
    const ch = stripped[i];
    if (ch === '\n') { lineNum++; continue; }
    if (ch === '{') { depth++; continue; }
    if (ch === '}') {
      depth--;
      if (depth < 0) {
        errors.push({ line: lineNum, message: "Extra closing brace '}'", type: 'balance' });
        depth = 0;
      }
    }
  }
  if (depth > 0) {
    errors.push({ message: depth + " unclosed brace(s) '{'", type: 'balance' });
  }

  // ©¤©¤ Extract all rule blocks and check declarations inside them ©¤©¤©¤©¤©¤©¤©¤©¤©¤
  // Match everything between { and } at the top level
  // Use a simple state machine to extract declaration blocks
  const ruleBodyRe = /[^{]*\{([^}]*)\}/g;
  let match;
  while ((match = ruleBodyRe.exec(stripped)) !== null) {
    const selector = match[0].split('{')[0].trim();
    const body     = match[1];

    // Empty selector warning
    if (selector.length === 0) {
      // Count newlines before this match to get line number
      const before = stripped.slice(0, match.index);
      const ln = (before.match(/\n/g) || []).length + 1;
      warnings.push({ line: ln, message: "Empty selector before '{'", type: 'invalid-selector' });
    }

    // Split body into individual declarations by semicolon
    const decls = body.split(';');
    for (const rawDecl of decls) {
      const decl = rawDecl.trim();
      if (!decl || !decl.includes(':')) continue;

      const colonIdx = decl.indexOf(':');
      const prop = decl.slice(0, colonIdx).trim().toLowerCase();
      if (!prop) continue;

      // Calculate approximate line number for this declaration
      const declOffset = stripped.indexOf(rawDecl, match.index);
      const beforeDecl = stripped.slice(0, declOffset);
      const declLine = (beforeDecl.match(/\n/g) || []).length + 1;

      // Typo detection
      for (const [typo, correct] of _CSS_TYPOS) {
        if (prop === typo) {
          warnings.push({
            line: declLine,
            message: "Possible typo: '" + prop + "' ¡ª did you mean '" + correct + "'?",
            type: 'typo'
          });
        }
      }
    }

    // Missing semicolon: if body has a colon but doesn't end with ;
    // (after trimming), the last declaration is missing its semicolon
    const bodyTrimmed = body.trim();
    if (bodyTrimmed.length > 0 && bodyTrimmed.includes(':')) {
      const lastDecl = bodyTrimmed.split(';').pop().trim();
      if (lastDecl.length > 0 && lastDecl.includes(':')) {
        const ln = (stripped.slice(0, match.index + match[0].lastIndexOf(lastDecl)).match(/\n/g) || []).length + 1;
        warnings.push({
          line: ln,
          message: "Declaration may be missing semicolon: \"" + lastDecl.substring(0, 60) + "\"",
          type: 'missing-semicolon'
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// Export for browser
if (typeof window !== 'undefined') {
  window.cssValidator = cssValidator;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { cssValidator };
}
// FORGE Code - HTML Validator
// Tag matching, nesting, and attribute validation for .html files.

// Void elements ¡ª self-closing, never have a closing tag
const _VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

// Known valid HTML5 elements
const _KNOWN_ELEMENTS = new Set([
  'a', 'abbr', 'address', 'article', 'aside', 'audio',
  'b', 'blockquote', 'body', 'button',
  'canvas', 'caption', 'cite', 'code', 'col', 'colgroup',
  'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt',
  'em', 'embed',
  'fieldset', 'figcaption', 'figure', 'footer', 'form',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hr', 'html',
  'i', 'iframe', 'img', 'input', 'ins',
  'kbd',
  'label', 'legend', 'li', 'link',
  'main', 'map', 'mark', 'menu', 'meta', 'meter',
  'nav', 'noscript',
  'object', 'ol', 'optgroup', 'option', 'output',
  'p', 'picture', 'pre', 'progress',
  'q',
  's', 'samp', 'script', 'section', 'select', 'small', 'source', 'span',
  'strong', 'style', 'sub', 'summary', 'sup',
  'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead',
  'time', 'title', 'tr', 'track',
  'u', 'ul',
  'var', 'video',
  'wbr',
  // Void elements included for completeness
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

// Required attributes per element
const _REQUIRED_ATTRS = {
  'img':    ['alt'],
  'a':      ['href'],
  'input':  ['type'],
  'script': [],
  'link':   ['href'],
};

/**
 * Strip contents of script/style blocks and HTML comments
 * so we don't parse tags inside them.
 */
function _stripNonHTML(source) {
  // Remove HTML comments
  source = source.replace(/<!--[\s\S]*?-->/g, m => m.replace(/[^\n]/g, ' '));
  // Remove script block contents (keep the tags themselves)
  source = source.replace(/(<script[^>]*>)([\s\S]*?)(<\/script>)/gi, (_, open, body, close) => {
    return open + body.replace(/[^\n]/g, ' ') + close;
  });
  // Remove style block contents
  source = source.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gi, (_, open, body, close) => {
    return open + body.replace(/[^\n]/g, ' ') + close;
  });
  return source;
}

/**
 * Extract all tags from source with position info.
 * Returns array of { tag, isClosing, isSelfClosing, attrs, line }
 */
function _extractTags(source) {
  const tags = [];
  const lines = source.split('\n');
  let lineNum = 1;
  let pos = 0;

  // Build a pos->line lookup
  const posToLine = new Array(source.length + 1);
  for (let i = 0; i < source.length; i++) {
    posToLine[i] = lineNum;
    if (source[i] === '\n') lineNum++;
  }

  const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([^>]*?)(\/?)>/g;
  let m;
  while ((m = tagRe.exec(source)) !== null) {
    const isClosing    = m[1] === '/';
    const tagName      = m[2].toLowerCase();
    const attrsStr     = m[3];
    const isSelfClosing = m[4] === '/' || _VOID_ELEMENTS.has(tagName);

    // Parse attribute names
    const attrNames = [];
    const attrRe = /([a-zA-Z][a-zA-Z0-9-]*)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*))?/g;
    let am;
    while ((am = attrRe.exec(attrsStr)) !== null) {
      attrNames.push(am[1].toLowerCase());
    }

    tags.push({
      tag: tagName,
      isClosing,
      isSelfClosing,
      attrs: attrNames,
      line: posToLine[m.index] || 1,
      raw: m[0]
    });
  }

  return tags;
}

/**
 * Validate an HTML file.
 *
 * @param {string} path - File path
 * @param {string} content - File content
 * @returns {{ valid: boolean, errors: Array, warnings: Array }}
 */
function htmlValidator(path, content) {
  const errors = [];
  const warnings = [];

  if (!content || !content.trim()) {
    return { valid: true, errors, warnings };
  }

  const stripped = _stripNonHTML(content);
  const tags = _extractTags(stripped);

  // ©¤©¤ Tag matching & nesting ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  const stack = []; // stack of { tag, line }

  for (const token of tags) {
    const { tag, isClosing, isSelfClosing, attrs, line } = token;

    // Unknown element warning
    if (!_KNOWN_ELEMENTS.has(tag)) {
      warnings.push({
        line,
        message: `Unknown HTML element: <${tag}>`,
        type: 'unknown-element'
      });
    }

    if (isSelfClosing || _VOID_ELEMENTS.has(tag)) {
      // Self-closing / void ¡ª check required attrs, don't push to stack
      if (_REQUIRED_ATTRS[tag]) {
        for (const req of _REQUIRED_ATTRS[tag]) {
          if (!attrs.includes(req)) {
            warnings.push({
              line,
              message: `<${tag}> is missing required attribute '${req}'`,
              type: 'missing-attr'
            });
          }
        }
      }
      continue;
    }

    if (!isClosing) {
      // Opening tag ¡ª push to stack, check required attrs
      stack.push({ tag, line });
      if (_REQUIRED_ATTRS[tag]) {
        for (const req of _REQUIRED_ATTRS[tag]) {
          if (!attrs.includes(req)) {
            warnings.push({
              line,
              message: `<${tag}> is missing required attribute '${req}'`,
              type: 'missing-attr'
            });
          }
        }
      }
    } else {
      // Closing tag ¡ª check it matches the top of the stack
      if (stack.length === 0) {
        errors.push({
          line,
          message: `Unexpected closing tag </${tag}> ¡ª no matching opening tag`,
          type: 'unmatched-close'
        });
      } else if (stack[stack.length - 1].tag !== tag) {
        const expected = stack[stack.length - 1];
        errors.push({
          line,
          message: `Improper nesting: got </${tag}> but expected </${expected.tag}> (opened at line ${expected.line})`,
          type: 'bad-nesting'
        });
        // Pop anyway to keep scanning
        stack.pop();
      } else {
        stack.pop();
      }
    }
  }

  // Any unclosed tags left on the stack
  for (const unclosed of stack) {
    errors.push({
      line: unclosed.line,
      message: `Unclosed tag <${unclosed.tag}> (opened at line ${unclosed.line})`,
      type: 'unclosed-tag'
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// Export for browser
if (typeof window !== 'undefined') {
  window.htmlValidator = htmlValidator;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { htmlValidator };
}
// FORGE Code - Validator Auto-Initialization
// Registers the built-in JS, CSS, and HTML validators with the repo
// as soon as the DOM is ready (or immediately if it already is).

function initializeDefaultValidators() {
  const results = { registered: [], skipped: [] };

  // js
  if (typeof jsValidator === 'function') {
    repo.registerValidator('js', jsValidator);
    results.registered.push('js');
  } else {
    console.warn('[FORGE Validators] jsValidator not found ¡ª skipping');
    results.skipped.push('js');
  }

  // css
  if (typeof cssValidator === 'function') {
    repo.registerValidator('css', cssValidator);
    results.registered.push('css');
  } else {
    console.warn('[FORGE Validators] cssValidator not found ¡ª skipping');
    results.skipped.push('css');
  }

  // html
  if (typeof htmlValidator === 'function') {
    repo.registerValidator('html', htmlValidator);
    results.registered.push('html');
  } else {
    console.warn('[FORGE Validators] htmlValidator not found ¡ª skipping');
    results.skipped.push('html');
  }

  if (results.registered.length > 0) {
    console.log('[FORGE Validators] Registered validators:', results.registered.join(', '));
  }

  return results;
}

// Auto-run: immediately if DOM is already ready, otherwise wait for it
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDefaultValidators);
  } else {
    initializeDefaultValidators();
  }
}

// Export for Node.js (test environment)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initializeDefaultValidators };
}
// FORGE CODE - Upload State Manager
// Manages the armed/disarmed state for repo upload.
// The actual fetch interception and upload logic lives in ElsaAdapter._doUploadAndSend().
// All adapters read ForgeState.getState().uploadArmed directly.

function isUploadArmed() {
  return !!ForgeState.getState().uploadArmed;
}

function _setUploadArmed(armed) {
  const enabled = !!armed;

  // Note: We no longer reset summaryOnly when disarming.
  // The token saver checkbox should maintain its state independently.

  ForgeActions.setUploadArmed(enabled);
}

/**
 * Consume the one-shot upload arm after an adapter attaches the repository.
 */
function consumeUploadArm() {
  _setUploadArmed(false);
}

/**
 * Arm the upload interceptor.
 * The store is authoritative; the module and window flags are compatibility
 * mirrors for adapters that still run outside the view layer.
 */
function armUploadInterceptor() {
  if (isUploadArmed()) {
    if (typeof showToast === 'function') {
      showToast('Already armed ¡ª send a message to trigger upload', 2000);
    }
    return;
  }

  const adapterName = window.forgeAdapter && window.forgeAdapter.constructor
    ? window.forgeAdapter.constructor.name
    : null;

  if (window.forgeAdapter && adapterName !== 'ElsaAdapter') {
    console.log('[FORGE] Using adapter for upload:', adapterName);
    _setUploadArmed(true);

    if (typeof showToast === 'function') {
      showToast('Upload armed ¡ª send a message to attach repo', 3000);
    }
    return;
  }

  console.log('[FORGE] Upload armed (ElsaAdapter will intercept next message)');
  _setUploadArmed(true);

  if (typeof showToast === 'function') {
    showToast('Armed ¡ª send a message to attach repository', 3000);
  }

  if (typeof logToUI === 'function') {
    logToUI('Repository will be attached to your next message.');
  }
}

/**
 * Disarm without firing.
 */
function disarmUploadInterceptor() {
  if (!isUploadArmed()) return;

  _setUploadArmed(false);

  if (typeof showToast === 'function') {
    showToast('Upload interceptor disarmed', 2000);
  }

  if (typeof logToUI === 'function') {
    logToUI('Upload interceptor disarmed.');
  }
}
// FORGE CODE - Import/Export Features
// Handles importing forge JSON (spec 1.0.0 + legacy) and exporting.

/**
 * Import a project from a JSON string into the repo.
 * Supports:
 *   - Forge spec 1.0.0: { specVersion, title, files: [{path, contents, encoding, excluded, url, description}] }
 *   - Legacy FORGE IDE format: { title, files: [{path, contents}] }
 *   - Bare array: [{path, contents}]
 *
 * Excluded files are loaded as stubs (no content in repo.files,
 * metadata stored in repo.fileMeta).
 */
function importProjectFromJSON(jsonString, preserveSteps = false) {
  try {
    logToUI('Importing project...');

    const json = JSON.parse(jsonString);
    let fileEntries;
    let title;

    if (Array.isArray(json)) {
      fileEntries = json;
      title = generateProjectName();
      logToUI('Detected legacy array format, generated title: ' + title);
    } else if (json.files && Array.isArray(json.files)) {
      fileEntries = json.files;
      title = json.title || generateProjectName();

      const specNote = json.specVersion
        ? ` (spec v${json.specVersion})`
        : '';

      logToUI(`Detected FORGE format${specNote}, title: ${title}`);
    } else {
      throw new Error('Unrecognized JSON format');
    }

    if (fileEntries.length === 0) {
      throw new Error('No files found in JSON');
    }

    const nextFiles = {};
    const nextFileMeta = {};
    const lastProcessedStep = preserveSteps
      ? (repo.lastProcessedStep || 0)
      : 0;

    let loadedCount = 0;
    let excludedCount = 0;
    let binaryCount = 0;

    fileEntries.forEach((item, index) => {
      if (!item.path) {
        console.warn(`Skipping item at index ${index}: missing path`);
        return;
      }

      const contents = item.contents !== undefined
        ? item.contents
        : item.content !== undefined
          ? item.content
          : '';

      const isExcluded = !!(item.excluded || item.ignored);
      const meta = {};

      if (item.encoding) meta.encoding = item.encoding;
      if (isExcluded) meta.excluded = true;
      if (item.url) meta.url = item.url;
      if (item.description) meta.description = item.description;

      if (item.ignoreReason && !meta.description) {
        meta.description = item.ignoreReason;
      }

      if (isExcluded) {
        nextFiles[item.path] = '';
        nextFileMeta[item.path] = meta;
        excludedCount++;
        loadedCount++;
        console.log(`Stub (excluded): ${item.path}`);
        return;
      }

      if (item.encoding === 'base64') {
        nextFiles[item.path] = contents;
        nextFileMeta[item.path] = meta;
        binaryCount++;
        loadedCount++;
        console.log(`Binary (base64): ${item.path}`);
        return;
      }

      nextFiles[item.path] = repo._processContent(item.path, contents);

      if (Object.keys(meta).length > 0) {
        nextFileMeta[item.path] = meta;
      }

      loadedCount++;
    });

    const versions = [{
      step: 0,
      changes: [],
      snapshot: JSON.parse(JSON.stringify(nextFiles)),
      metaSnapshot: JSON.parse(JSON.stringify(nextFileMeta))
    }];

    ForgeActions.replaceRepository({
      files: nextFiles,
      fileMeta: nextFileMeta,
      projectTitle: title,
      currentStep: 0,
      lastProcessedStep,
      versions
    });

    // Disarm auto-sync when a new project is imported (unless called from sync pull)
    if (arguments[2] !== true && typeof disarmSyncOnImport === 'function') {
      disarmSyncOnImport();
    }

    const parts = [`? Imported ${loadedCount} files as "${title}"`];

    if (excludedCount > 0) {
      parts.push(`${excludedCount} excluded stubs`);
    }

    if (binaryCount > 0) {
      parts.push(`${binaryCount} binary`);
    }

    if (preserveSteps) {
      parts.push(`(continuing from step-${lastProcessedStep + 1})`);
    } else {
      parts.push('(Elsa: use step-1 for updates)');
    }

    logToUI(parts.join(' ¡¤ '));


  } catch (error) {
    console.error('Error importing project:', error);
    logToUI('? Failed to import project: ' + error.message);
    throw error;
  }
}

/**
 * Export the full repo as a spec 1.0.0 JSON string.
 */
function exportProjectToJSON() {
  return JSON.stringify(repo.toForgeJSON({ includeCodingPrompt: !!repo.includeCodingPrompt }), null, 2);
}

/**
 * Export only the changed files from the current step.
 */
function exportChangesToJSON() {
  return JSON.stringify(repo.getChangesOnly(), null, 2);
}

/**
 * Import a project from a folder selection (webkitdirectory input).
 * Each File has a webkitRelativePath like "myproject/src/app.js".
 * We strip the leading folder name so paths become /src/app.js.
 */
async function importProjectFromFolder(fileList) {
  try {
    logToUI('?? Reading folder...');

    const files = Array.from(fileList).filter(f => {
      const p = f.webkitRelativePath || f.name;
      return (
        !p.includes('/.git/') &&
        !p.includes('/.DS_Store') &&
        !p.includes('/__MACOSX/') &&
        !p.endsWith('.DS_Store') &&
        !p.includes('/Thumbs.db')
      );
    });

    if (files.length === 0) throw new Error('No usable files found in folder');

    // Derive project title from the top-level folder name
    const firstPath = files[0].webkitRelativePath || files[0].name;
    const topFolder = firstPath.split('/')[0];
    const title     = topFolder || 'importedFolder';

    const nextFiles    = {};
    const nextFileMeta = {};
    let loadedCount    = 0;
    let binaryCount    = 0;

    await Promise.all(files.map(async file => {
      const rel  = file.webkitRelativePath || file.name;
      // Strip the top-level folder name, prepend /
      const parts = rel.split('/');
      parts.shift(); // remove top folder
      if (parts.length === 0 || parts[parts.length - 1] === '') return;
      const path = '/' + parts.join('/');

      const arrayBuf = await file.arrayBuffer();
      const bytes    = new Uint8Array(arrayBuf);

      // Binary detection: look for null bytes in first 1KB
      let isBinary = false;
      const checkLen = Math.min(1024, bytes.length);
      for (let i = 0; i < checkLen; i++) {
        if (bytes[i] === 0) { isBinary = true; break; }
      }

      if (isBinary) {
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        nextFiles[path]    = btoa(binary);
        nextFileMeta[path] = { encoding: 'base64' };
        binaryCount++;
      } else {
        const text        = new TextDecoder('utf-8').decode(bytes);
        nextFiles[path]   = repo._processContent(path, text);
      }

      loadedCount++;
    }));

    if (loadedCount === 0) throw new Error('No files could be read from folder');

    const versions = [{
      step: 0,
      changes: [],
      snapshot:    JSON.parse(JSON.stringify(nextFiles)),
      metaSnapshot: JSON.parse(JSON.stringify(nextFileMeta))
    }];

    ForgeActions.replaceRepository({
      files: nextFiles,
      fileMeta: nextFileMeta,
      projectTitle: title,
      currentStep: 0,
      lastProcessedStep: 0,
      versions
    });

    const parts2 = ['? Imported ' + loadedCount + ' files from folder "' + title + '"'];
    if (binaryCount > 0) parts2.push(binaryCount + ' binary');
    logToUI(parts2.join(' ¡¤ '));

    if (typeof saveWorkspaceState === 'function') saveWorkspaceState();

  } catch (error) {
    console.error('Error importing folder:', error);
    logToUI('? Failed to import folder: ' + error.message);
    throw error;
  }
}

/**
 * Import a project from a ZIP file.
 */
async function importProjectFromZip(file) {
  try {
    logToUI('?? Loading ZIP file...');

    const JSZip = await loadJSZip();
    const zip = await JSZip.loadAsync(file);
    const title = file.name.replace(/\.zip$/i, '');
    const nextFiles = {};
    const nextFileMeta = {};

    let loadedCount = 0;
    let binaryCount = 0;

    const promises = [];

    zip.forEach((relativePath, zipEntry) => {
      if (zipEntry.dir) return;

      if (
        relativePath.includes('.DS_Store') ||
        relativePath.includes('__MACOSX') ||
        relativePath.startsWith('.git/')
      ) {
        return;
      }

      promises.push(
        zipEntry.async('uint8array').then(contentArray => {
          const path = '/' + relativePath;
          let isBinary = false;
          const checkLength = Math.min(1024, contentArray.length);

          for (let index = 0; index < checkLength; index++) {
            if (contentArray[index] === 0) {
              isBinary = true;
              break;
            }
          }

          if (isBinary) {
            let binary = '';

            for (let index = 0; index < contentArray.length; index++) {
              binary += String.fromCharCode(contentArray[index]);
            }

            nextFiles[path] = btoa(binary);
            nextFileMeta[path] = { encoding: 'base64' };
            binaryCount++;
          } else {
            const text = new TextDecoder('utf-8').decode(contentArray);
            nextFiles[path] = repo._processContent(path, text);
          }

          loadedCount++;
        })
      );
    });

    await Promise.all(promises);

    const versions = [{
      step: 0,
      changes: [],
      snapshot: JSON.parse(JSON.stringify(nextFiles)),
      metaSnapshot: JSON.parse(JSON.stringify(nextFileMeta))
    }];

    ForgeActions.replaceRepository({
      files: nextFiles,
      fileMeta: nextFileMeta,
      projectTitle: title,
      currentStep: 0,
      lastProcessedStep: 0,
      versions
    });

    const parts = [`? Imported ${loadedCount} files from ZIP`];

    if (binaryCount > 0) {
      parts.push(`${binaryCount} binary`);
    }

    logToUI(parts.join(' ¡¤ '));



    if (typeof saveWorkspaceState === 'function') {
      saveWorkspaceState();
    }
  } catch (error) {
    console.error('Error importing ZIP:', error);
    logToUI('? Failed to import ZIP: ' + error.message);
    throw error;
  }
}
// FORGE Code - Forge IDE Bridge
// postMessage-based proxy: lets the bookmarklet use the FORGE IDE window
// to (a) fetch URLs that CSP blocks on the current page, and
// (b) run #execute scripts when the page's own CSP blocks inline scripts.
//
// Protocol (IDE side must have forge-ide-bridge.js loaded):
//   forge-bridge-register      -> forge-bridge-registered
//   forge-proxy-fetch          -> forge-proxy-fetch-response
//   forge-bridge-eval          -> forge-bridge-eval-response
//
// Usage:
//   const ok = await forgeIdeBridge.ensure();
//   const data = await forgeIdeBridge.fetch('https://api.fda.gov/...');
//   const result = await forgeIdeBridge.eval('vfs.getAllPaths()');
//   const queue = await forgeIdeBridge.execScript(scriptSrc, '#42');

const forgeIdeBridge = (() => {
  // ©¤©¤ State ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  let _win       = null;   // cached IDE window handle
  let _origin    = null;   // IDE origin we registered with
  let _ready     = false;  // handshake complete

  const REGISTER_TIMEOUT = 10000;
  const FETCH_TIMEOUT    = 20000;
  const EVAL_TIMEOUT     = 15000;
  const POLL_MS          = 250;

  // ©¤©¤ Helpers ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  function _nonce() {
    return 'bridge-' + Math.random().toString(36).slice(2) + '-' + Date.now();
  }

  /** True if we have a live, non-closed window that matches our origin. */
  function _windowLive() {
    try {
      return _win && !_win.closed;
    } catch (e) {
      return false;
    }
  }

  /** Wait for the IDE window to finish loading (poll readyState). */
  async function _waitForLoad(win, timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      try {
        if (win.document && win.document.readyState === 'complete') return true;
      } catch (e) { /* cross-origin ¡ª keep waiting */ }
      await new Promise(r => setTimeout(r, POLL_MS));
    }
    return true; // best-effort
  }

  // ©¤©¤ Registration / handshake ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  /**
   * Ensure we have a registered bridge connection to an IDE window.
   * If the cached window is still live and registered, returns immediately.
   * Otherwise opens a new window and performs the handshake.
   *
   * @param {string} [ideUrl] - Override IDE URL; falls back to localStorage / config.
   * @returns {Promise<boolean>} true on success, false on timeout.
   */
  async function ensure(ideUrl) {
    if (_ready && _windowLive()) return true;

    _ready = false;

    const url = ideUrl
      || (typeof localStorage !== 'undefined' && localStorage.getItem('forge-ide-url'))
      || (typeof FORGE_CONFIG !== 'undefined' && FORGE_CONFIG.FORGE_IDE_URL)
      || '';

    if (!url) {
      console.warn('[ForgeBridge] No IDE URL configured');
      return false;
    }

    try {
      const parsed = new URL(url);
      _origin = parsed.origin;
    } catch (e) {
      console.warn('[ForgeBridge] Invalid IDE URL:', url);
      return false;
    }

    // Reuse existing window if it's alive and already registered
    if (_windowLive() && _ready) return true;

    // Reuse existing window if it's alive but lost registration
    if (!_windowLive()) {
      // Ask the user before opening a new tab ¡ª the bridge window is a
    // side-effect they may not expect (e.g. triggered by a GitLab import
    // or a #execute CSP fallback).
    const confirmed = typeof showToast === 'function'
      ? await new Promise(resolve => {
          const overlay = document.createElement('div');
          overlay.style.cssText = [
            'position:fixed', 'inset:0', 'z-index:2147483647',
            'background:rgba(0,0,0,0.7)',
            'display:flex', 'align-items:center', 'justify-content:center',
            'font-family:Segoe UI,sans-serif'
          ].join(';');

          const dialog = document.createElement('div');
          dialog.style.cssText = [
            'background:#252526', 'border:2px solid #667eea',
            'border-radius:10px', 'padding:22px 26px',
            'width:400px', 'max-width:92vw',
            'box-shadow:0 8px 32px rgba(0,0,0,0.5)',
            'color:#d4d4d4', 'font-size:13px', 'line-height:1.6'
          ].join(';');

          const title = document.createElement('div');
          title.style.cssText = 'font-size:15px;font-weight:700;color:#9b89e8;margin-bottom:10px;';
          title.textContent = '??? FORGE IDE bridge needed';

          const msg = document.createElement('div');
          msg.style.cssText = 'color:#c8c8c8;margin-bottom:18px;';
          msg.textContent = 'FORGE needs to open the FORGE IDE in a new tab to complete this action '
            + '(used as a network proxy / script runner to work around this page\'s security restrictions). '
            + 'Allow the popup?';

          const btns = document.createElement('div');
          btns.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;';

          const cancelBtn = document.createElement('button');
          cancelBtn.textContent = 'Cancel';
          cancelBtn.style.cssText = 'background:#3e3e42;border:none;color:#d4d4d4;padding:8px 18px;border-radius:5px;cursor:pointer;font-size:13px;font-weight:600;font-family:Segoe UI,sans-serif;';

          const okBtn = document.createElement('button');
          okBtn.textContent = 'Open FORGE IDE tab';
          okBtn.style.cssText = 'background:#5a4fcf;border:none;color:#fff;padding:8px 18px;border-radius:5px;cursor:pointer;font-size:13px;font-weight:600;font-family:Segoe UI,sans-serif;';

          btns.appendChild(cancelBtn);
          btns.appendChild(okBtn);
          dialog.appendChild(title);
          dialog.appendChild(msg);
          dialog.appendChild(btns);
          overlay.appendChild(dialog);
          document.body.appendChild(overlay);

          const close = result => { overlay.remove(); resolve(result); };
          okBtn.addEventListener('click',    () => close(true));
          cancelBtn.addEventListener('click', () => close(false));
          overlay.addEventListener('click',   e => { if (e.target === overlay) close(false); });
        })
      : confirm('FORGE needs to open the FORGE IDE in a new tab to act as a network proxy / script runner for this page. Allow?');

    if (!confirmed) {
      console.log('[ForgeBridge] User declined to open IDE window');
      return false;
    }

    // Append bridge signal so the IDE arms its listener on load
    const bridgeUrl = url.includes('#') ? url + '&bridge=1' : url + '#bridge=1';
    console.log('[ForgeBridge] Opening IDE window at', _origin);
    _win = window.open(bridgeUrl, '_blank');
    if (!_win) {
      console.warn('[ForgeBridge] Popup blocked');
      return false;
    }

    // If the browser reused an existing named tab (didn't actually navigate),
    // the old page may be loaded without #bridge=1 and its listener may be
    // stale. Force a reload to ensure the bridge signal is picked up fresh.
    try {
      if (_win.location && !_win.location.hash.includes('bridge')) {
        console.log('[ForgeBridge] Existing tab detected without bridge signal ¡ª reloading');
        _win.location.href = bridgeUrl;
      }
    } catch (e) {
      // Cross-origin ¡ª can't read location, assume it's fine and let the
      // handshake timeout handle it if the tab is truly stale
    }
    }

    await _waitForLoad(_win, REGISTER_TIMEOUT);

    // Attempt handshake with retries
    return new Promise(resolve => {
      const timer = setTimeout(() => {
        window.removeEventListener('message', onMsg);
        clearInterval(retryInterval);
        console.warn('[ForgeBridge] Registration timed out');
        resolve(false);
      }, REGISTER_TIMEOUT);

      function onMsg(event) {
        if (event.origin !== _origin) return;
        if (!event.data || event.data.type !== 'forge-bridge-registered') return;
        clearTimeout(timer);
        clearInterval(retryInterval);
        window.removeEventListener('message', onMsg);
        _ready = true;
        console.log('[ForgeBridge] Registered with IDE at', _origin);
        // Return focus to the originating page now that the bridge is ready
        try { window.focus(); } catch (e) {}
        resolve(true);
      }

      window.addEventListener('message', onMsg);

      let attempts = 0;
      const retryInterval = setInterval(() => {
        attempts++;
        if (attempts > 30) { clearInterval(retryInterval); return; }
      try {
        // Use '*' as target origin -- COOP headers on the IDE server
        // sever the window reference after cross-origin navigation,
        // making targeted postMessage unreliable. The IDE validates
        // event.origin on its end.
        _win.postMessage({
          type:   'forge-bridge-register',
          origin: window.location.origin,
          secret: 'forge-bridge-hello'
        }, '*');
      } catch (e) { /* window not ready yet */ }
      }, POLL_MS);
    });
  }

  // ©¤©¤ Store a window handle from outside (e.g. openInForgeIDE) ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  /**
   * Called by forge-ide.js after window.open so the bridge can reuse
   * the handle without opening a second tab.
   */
  function cacheWindow(win, ideUrl) {
    if (!win || win.closed) return;
    _win   = win;
    _ready = false; // will re-register on next ensure()
    if (ideUrl) {
      try { _origin = new URL(ideUrl).origin; } catch (e) {}
    }
  }

  // ©¤©¤ Proxy fetch ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  /**
   * Ask the IDE window to fetch a URL and return the response.
   * Returns a plain object: { ok, status, statusText, headers, body (text) }
   */
  async function fetch(url, options) {
    options = options || {};
    if (!_ready && !(await ensure())) {
      throw new Error('[ForgeBridge] Not connected to IDE');
    }

    const id = _nonce();

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        window.removeEventListener('message', onReply);
        reject(new Error('[ForgeBridge] fetch timeout'));
      }, FETCH_TIMEOUT);

      function onReply(event) {
        if (event.origin !== _origin) return;
        if (!event.data || event.data.type !== 'forge-proxy-fetch-response') return;
        if (event.data.nonce !== id) return;
        clearTimeout(timer);
        window.removeEventListener('message', onReply);

        const d = event.data;
        if (d.error && d.status === 0) {
          reject(new Error('[ForgeBridge] IDE fetch error: ' + d.error));
          return;
        }

        // Decode base64 body
        let body = '';
        if (d.bodyB64) {
          try {
            const bin = atob(d.bodyB64);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            body = new TextDecoder().decode(bytes);
          } catch (e) {
            body = '';
          }
        }

        resolve({
          ok:         d.ok,
          status:     d.status,
          statusText: d.statusText,
          headers:    d.headers || {},
          body,
          json() { return JSON.parse(this.body); },
          text() { return this.body; }
        });
      }

      window.addEventListener('message', onReply);

      _win.postMessage({
        type:    'forge-proxy-fetch',
        nonce:   id,
        url,
        method:  options.method  || 'GET',
        headers: options.headers || {},
        body:    options.body    || null
      }, '*');
    });
  }

  // ©¤©¤ Eval ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  /**
   * Run arbitrary JS inside the IDE's sandboxed preview iframe.
   * No access to IDE globals, VFS, or localStorage.
   */
  async function evalInIDESandboxed(code) {
    if (!_ready && !(await ensure())) {
      throw new Error('[ForgeBridge] Not connected to IDE');
    }

    const id = _nonce();

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        window.removeEventListener('message', onReply);
        reject(new Error('[ForgeBridge] eval timeout'));
      }, EVAL_TIMEOUT);

      function onReply(event) {
        if (event.origin !== _origin) return;
        if (!event.data || event.data.type !== 'forge-bridge-eval-response') return;
        if (event.data.nonce !== id) return;
        clearTimeout(timer);
        window.removeEventListener('message', onReply);
        if (event.data.error) {
          reject(Object.assign(new Error(event.data.error.message || 'eval error'), event.data.error));
        } else {
          resolve(event.data.result);
        }
      }

      window.addEventListener('message', onReply);

      _win.postMessage({ type: 'forge-bridge-eval', nonce: id, code }, '*');
    });
  }

  /**
   * Run arbitrary JS in the IDE window context (privileged).
   * Has full access to IDE globals: importProjectFromJSON, repo, ForgeActions, etc.
   * The IDE will show a per-request confirmation modal before executing.
   */
  async function evalInIDEPrivileged(code) {
    if (!_ready && !(await ensure())) {
      throw new Error('[ForgeBridge] Not connected to IDE');
    }

    const id = _nonce();

    return new Promise((resolve, reject) => {
      // Privileged evals may wait for user confirmation -- use a longer timeout
      const timer = setTimeout(() => {
        window.removeEventListener('message', onReply);
        reject(new Error('[ForgeBridge] privileged eval timeout (user may have not confirmed)'));
      }, 60000);

      function onReply(event) {
        if (event.origin !== _origin) return;
        if (!event.data || event.data.type !== 'forge-bridge-eval-response') return;
        if (event.data.nonce !== id) return;
        clearTimeout(timer);
        window.removeEventListener('message', onReply);
        if (event.data.error) {
          reject(Object.assign(new Error(event.data.error.message || 'privileged eval error'), event.data.error));
        } else {
          resolve(event.data.result);
        }
      }

      window.addEventListener('message', onReply);

      _win.postMessage({ type: 'forge-bridge-eval-privileged', nonce: id, code }, '*');
    });
  }

  /**
   * Backwards-compatible alias: defaults to sandboxed eval.
   * Use evalPrivileged() for IDE-context access.
   */
  async function evalInIDE(code) {
    return evalInIDESandboxed(code);
  }

  // ©¤©¤ Execute script (the main CSP-fallback entry point) ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  /**
   * Run a #execute script via the IDE bridge.
   *
   * Steps:
   *   1. Sync current VFS to the IDE's repo.files + repo.fileMeta
   *   2. Inject a sendBack collector shim
   *   3. Run the user script
   *   4. Retrieve the collected sendBack entries
   *   5. Return them so execute.js can merge them into the local queue
   *
   * @param {string} scriptContent - The user script source
   * @param {string} operationId   - e.g. '#42'
   * @returns {Promise<{success: boolean, queue: Array, error?: string}>}
   */
  async function execScript(scriptContent, operationId) {
    if (!_ready && !(await ensure())) {
      return { success: false, queue: [], error: 'Bridge not connected' };
    }

    // Gather VFS state from the bookmarklet's repo
    let files = {};
    let fileMeta = {};
    let projectTitle = null;
    try {
      if (typeof repo !== 'undefined') {
        files        = repo.files        || {};
        fileMeta     = repo.fileMeta     || {};
        projectTitle = repo.projectTitle || null;
      }
    } catch (e) {}

    // Serialise VFS ¡ª large repos are slow but this is a last-resort path
    const filesJson    = JSON.stringify(files);
    const fileMetaJson = JSON.stringify(fileMeta);
    const titleJson    = JSON.stringify(projectTitle);

    // Build a minimal self-contained repo shim that the user script can call.
    // The shim is defined inline in the eval string so it works even when the
    // IDE sandbox has no 'repo' global of its own.
    const repoShim = `
var repo = (function() {
  var _files    = ${filesJson};
  var _fileMeta = ${fileMetaJson};
  var _queue    = [];
  var _title    = ${titleJson};

  function _processContent(path, content) {
    if (path && path.endsWith('.md')) return content.replace(/&#96;/g, '\`');
    return content;
  }

  return {
    files:        _files,
    fileMeta:     _fileMeta,
    projectTitle: _title,

    sendBack: function(data) { _queue.push(data); },
    getSendBackQueue: function() { return _queue.slice(); },

    getContent: function(path) {
      var content = _files[path] || '';
      var lines   = content.split('\\n');
      return {
        text:      function()      { return content; },
        lineCount: function()      { return lines.length; },
        lineAt:    function(n)     { return lines[Math.max(0, n - 1)] || ''; },
        lines:     function(s, e)  {
          if (s === undefined) return lines;
          var lo = Math.max(0, (s || 1) - 1);
          var hi = Math.min(lines.length, e || lines.length);
          return lines.slice(lo, hi);
        }
      };
    },

    listFiles: function(parent) {
      var all = Object.keys(_files);
      return parent ? all.filter(function(p) { return p.startsWith(parent); }) : all;
    },

    fileExists: function(path) { return Object.prototype.hasOwnProperty.call(_files, path); },

    findContent: function(term, parent) {
      var matches = [];
      var isRe    = term instanceof RegExp;
      Object.keys(_files).forEach(function(path) {
        if (parent && !path.startsWith(parent)) return;
        _files[path].split('\\n').forEach(function(line, i) {
          if (isRe ? term.test(line) : line.includes(term)) {
            matches.push({ path: path, lineNum: i + 1, content: line });
          }
        });
      });
      return matches;
    },

    getMeta:      function(path) { return _fileMeta[path] || {}; },
    getMetadata:  function(path) { return _fileMeta[path] || {}; },
    getSummary:   function() {
      var count = Object.keys(_files).length;
      var lines = 0;
      Object.values(_files).forEach(function(c) { lines += (c || '').split('\\n').length; });
      return { fileCount: count, totalLines: lines };
    },

    // Write ops update the local copy so scripts that add/replace then read back work
    addFile:     function(id, path, content) { _files[path] = _processContent(path, content || ''); },
    replaceFile: function(id, path, content) { _files[path] = _processContent(path, content || ''); },
    deleteFile:  function(id, path)          { delete _files[path]; },
    patchFile:   function()                  { /* no-op in bridge shim */ },

    getCurrentStep: function() { return { step: 1, lastProcessedStep: 0, projectTitle: _title }; }
  };
})();
`;

    // The bridge-eval handler on the IDE side does:
    //   const result = eval(code);
    //   if result is a Promise, await it, then postMessage the value.
    // So returning a Promise from the top level is fine -- but we must
    // return the queue value itself, not undefined.
    // We use a plain async IIFE that explicitly returns the queue array.
    const opIdJson = JSON.stringify(String(operationId));
    const wrappedScript =
      '(async function __forgeExec() {' +
      repoShim +
      '  try {' +
      '    await (async function() {' +
      scriptContent +
      '    })();' +
      '  } catch(err) {' +
      '    repo.sendBack({ type: "error", operationId: ' + opIdJson + ', message: err.message || String(err), stack: err.stack || "" });' +
      '  }' +
      '  return repo.getSendBackQueue();' +
      '})()';

    console.log('[ForgeBridge] Sending wrapped script to IDE eval:', wrappedScript.slice(0, 400));

    let queue = [];
    try {
      let result = await evalInIDE(wrappedScript);
      // The IDE bridge JSON-serialises the return value before postMessage,
      // so we may receive a string -- parse it back to an array.
      if (typeof result === 'string') {
        try { result = JSON.parse(result); } catch (e) {}
      }
      queue = Array.isArray(result) ? result : [];
    } catch (e) {
      return { success: false, queue: [], error: e.message || String(e) };
    }

    return { success: true, queue };
  }

  // ©¤©¤ Public API ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

  return {
    ensure,
    cacheWindow,
    fetch,
    eval: evalInIDE,
    evalPrivileged: evalInIDEPrivileged,
    execScript,
    get ready()  { return _ready; },
    get origin() { return _origin; }
  };
})();

// Make available globally
if (typeof window !== 'undefined') {
  window.forgeIdeBridge = forgeIdeBridge;
}
// FORGE CODE - FORGE IDE Integration
// Opens the current project in the full FORGE IDE via compressed URL.
// For large repos (>2MB compressed), uses the privileged bridge eval to
// inject the VFS directly into the IDE window via importProjectFromJSON.

const MAX_URL_PAYLOAD_BYTES = 2 * 1024 * 1024; // 2 MB

async function openInForgeIDE(entryPoint, options = {}) {
  try {
    logToUI('Generating FORGE IDE link...');

    if (!repo.projectTitle) {
      ForgeActions.setProjectTitle(generateProjectName());
    }

    // Use spec 1.0.0 compliant export
    const projectData = repo.toForgeJSON();
    const jsonString = JSON.stringify(projectData);
    const compressed = await compress(jsonString);

    // Use configured URL (can be overridden via localStorage)
    const forgeURL = localStorage.getItem('forge-ide-url') || FORGE_CONFIG.FORGE_IDE_URL;

    // Build optional suffix fragments
    let suffix = '';
    if (entryPoint) {
      suffix += `&url=${encodeURIComponent(entryPoint)}`;
    }
    if (options.previewHash) {
      suffix += `&previewHash=${encodeURIComponent(options.previewHash)}`;
    }
    if (options.context) {
      const contextJson = JSON.stringify(options.context);
      const compressedContext = await compress(contextJson);
      suffix += `&context=${encodeURIComponent(compressedContext)}`;
    }

    const payloadParam = `payload=${encodeURIComponent(compressed)}`;
    const payloadBytes = new Blob([payloadParam]).size;

    if (payloadBytes > MAX_URL_PAYLOAD_BYTES) {
      logToUI('Payload too large for URL (' + Math.round(payloadBytes / 1024) + ' KB). Using bridge...');
      await _openInForgeIDEViaBridge(forgeURL, projectData, jsonString, suffix);
      return;
    }

    const fullUrl = `${forgeURL}#${payloadParam}${suffix}`;
    const win = window.open(fullUrl, '_blank');

    // Cache the handle so the bridge can reuse it without a second popup
    if (win && typeof forgeIdeBridge !== 'undefined') {
      forgeIdeBridge.cacheWindow(win, forgeURL);
    }

    logToUI('Opened in FORGE IDE');
  } catch (error) {
    console.error('Error creating FORGE IDE link:', error);
    logToUI('Failed to create FORGE IDE link: ' + (error.message || error));
  }
}

/**
 * Fallback for large repos: open the IDE via the bridge, then inject the
 * VFS using forge-bridge-eval-privileged which runs in the IDE window
 * context where importProjectFromJSON is available.
 *
 * The user will see a confirmation modal in the IDE tab before the code runs.
 */
async function _openInForgeIDEViaBridge(forgeURL, projectData, jsonString, suffix) {
  if (typeof forgeIdeBridge === 'undefined') {
    logToUI('Bridge not available -- cannot open large repo in IDE');
    showToast('Repo too large for URL and bridge is unavailable', 4000);
    return;
  }

  try {
    showToast('Repo too large for URL -- opening via bridge...', 3500);

    const ok = await forgeIdeBridge.ensure(forgeURL);
    if (!ok) {
      logToUI('Bridge connection failed');
      showToast('Could not connect to FORGE IDE bridge', 4000);
      return;
    }

    const sizeKB = Math.round(jsonString.length / 1024);
    logToUI('Bridge connected. Injecting ' + sizeKB + ' KB via privileged eval...');

    // Use privileged eval so the code runs in the IDE window context
    // where importProjectFromJSON exists. The IDE will show a confirmation
    // modal before executing.
    const injectCode = '(function() {' +
      'var parsed = ' + jsonString + ';' +
      'if (typeof loadProjectFromParsed === "function") {' +
      '  try { loadProjectFromParsed(parsed); return "imported-loadProjectFromParsed"; }' +
      '  catch(e) { return "error:" + e.message; }' +
      '}' +
      'if (typeof pasteProjectFromClipboard === "function") {' +
      '  try {' +
      '    var jsonStr = JSON.stringify(parsed);' +
      '    navigator.clipboard.writeText(jsonStr).then(function() { pasteProjectFromClipboard(); });' +
      '    return "imported-via-clipboard";' +
      '  } catch(e) { return "clipboard-error:" + e.message; }' +
      '}' +
      'return "no-import-fn";' +
      '})()';

    const result = await forgeIdeBridge.evalPrivileged(injectCode);
    logToUI('Bridge inject result: ' + result);

    if (result === 'imported') {
      showToast('Opened in FORGE IDE via bridge (' + sizeKB + ' KB)', 3000);
    } else if (result && result.startsWith('error:')) {
      showToast('IDE bridge import error: ' + result.slice(6), 5000);
      logToUI('IDE import error: ' + result);
    } else {
      // importProjectFromJSON not available -- IDE may not have bookmarklet active
      showToast('IDE opened but could not auto-import. Use Import button in the IDE.', 6000);
      logToUI('Bridge eval result: ' + result + ' -- importProjectFromJSON not found in IDE window.');
    }

  } catch (err) {
    console.error('Bridge IDE open error:', err);
    logToUI('Bridge IDE open failed: ' + (err.message || err));
    showToast('Failed to open IDE via bridge: ' + (err.message || err), 5000);
  }
}
// FORGE CODE - Parse and Apply
// parseAndApply()     ¡ª DOM scraping entry point
// _applyParsedBlocks() ¡ª pure execution loop (also used by pasteAndApplyStep)



function copySendBackQueue() {
  const queue = repo && repo.getSendBackQueue ? repo.getSendBackQueue() : [];
  if (queue.length === 0) { showToast('sendBack queue is empty'); return; }
  const json = JSON.stringify(queue, null, 2);
  copyToClipboard(json);
  showToast(`Copied ${queue.length} sendBack entry(entries) to clipboard`);
  logToUI(`sendBack queue copied (${queue.length} entries)`);
}

// ©¤©¤ DOM-scraping entry point ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

function _getApplySurfaceSignature() {
  if (
    typeof document === 'undefined' ||
    typeof document.querySelectorAll !== 'function'
  ) {
    return '';
  }

  const operationPattern =
    /repo\.(?:addFile|createFile|replaceFile|patchFile|deleteFile|moveFile|execute|executeScript)\s*\(/;

  return [
    ...document.querySelectorAll(
      'code, .cm-content'
    )
  ]
    .map(surface =>
      _getParsingText(surface)
    )
    .filter(text => {
      const firstLine =
        text.split('\n')[0].trim();

      return (
        /^\/.*#\d+\s+#(?:new|add|patch|replace|delete|move|execute)\b/.test(
          firstLine
        ) ||
        /^\/\/codebase\s+#step-\d+/.test(
          firstLine
        ) ||
        operationPattern.test(text)
      );
    })
    .map(text =>
      `${text.length}:${text.slice(0, 160)}:${text.slice(-160)}`
    )
    .join('\u241e');
}

async function _waitForApplySurfaceStability(options = {}) {
  const intervalMs =
    Number(options.intervalMs) || 120;

  const maxWaitMs =
    Number(options.maxWaitMs) || 900;

  const stableReads =
    Number(options.stableReads) || 2;

  const readSignature =
    options.readSignature ||
    _getApplySurfaceSignature;

  const delayFn =
    options.delayFn ||
    (ms =>
      new Promise(resolve =>
        setTimeout(resolve, ms)
      )
    );

  const startedAt =
    Date.now();

  let signature =
    readSignature();

  let reads = 1;
  let consecutiveStableReads = 0;
  let changed = false;

  while (
    Date.now() - startedAt <
    maxWaitMs
  ) {
    await delayFn(intervalMs);

    const nextSignature =
      readSignature();

    reads += 1;

    if (nextSignature === signature) {
      consecutiveStableReads += 1;
    } else {
      signature =
        nextSignature;

      consecutiveStableReads = 0;
      changed = true;
    }

    if (
      consecutiveStableReads >=
      stableReads
    ) {
      return {
        stable: true,
        changed,
        reads,
        waitedMs:
          Date.now() - startedAt,
        signature
      };
    }
  }

  return {
    stable: false,
    changed,
    reads,
    waitedMs:
      Date.now() - startedAt,
    signature
  };
}

function _showApplyFeedback(message, duration = 4000, notifier = null) {
  const toast = notifier || (
    typeof showToast === 'function'
      ? showToast
      : null
  );

  if (toast) {
    toast(message, duration);
  }

  return message;
}

function _getNoNewStepsMessage(steps) {
  if (!Array.isArray(steps) || steps.length === 0) {
    return 'No FORGE step markers found on the page.';
  }

  const latestStep = Math.max(
    ...steps.map(step => Number(step.stepNum) || 0)
  );

  return (
    `No new steps found ¡ª latest parsed step ${latestStep} ` +
    'is already processed.'
  );
}

function _isAutoPilotApply(value) {
  return value === true;
}

async function parseAndApply(isAutoPilot = false) {
  // DOM event listeners pass a MouseEvent as the first argument. Only the
  // literal boolean true should enable hidden Auto-Pilot behavior.
  isAutoPilot =
    _isAutoPilotApply(isAutoPilot);

  // Note: clearSendBackQueue is now called in _applyParsedBlocks


  const modal = createProgressModal();
  if (isAutoPilot) {
    const modalEl = document.getElementById('forge-progress-modal');
    if (modalEl) modalEl.style.display = 'none';
  }

  // Convert HTML preview blocks back to raw code
  const rawButtons = [...document.querySelectorAll('button')].filter(btn => btn.textContent.trim() === 'Raw');
  if (rawButtons.length > 0) {
    modal.setStatus(`Converting ${rawButtons.length} preview block(s) to raw...`);
    rawButtons.forEach(btn => btn.click());
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  modal.setStatus(
    'Waiting for the response to finish rendering...'
  );

  const stability =
    await _waitForApplySurfaceStability();

  if (stability.changed) {
    logToUI(
      `Apply Steps waited ${stability.waitedMs}ms ` +
      'for the rendered response to stabilize'
    );
  } else if (!stability.stable) {
    logToUI(
      'Apply Steps response stabilization timed out; ' +
      'using the latest rendered content'
    );
  }

  modal.setStatus(
    'Scanning page for codebase operations...'
  );

  let cancelled = false;
  document.getElementById('forge-progress-cancel').onclick = () => {
    cancelled = true;
    modal.close();
    logToUI('Import cancelled by user');
  };

  try {
    let fileBlocks = [];
    let steps = [];

    // If we have an active adapter with a complete response, use the API-first text parser
    if (typeof window.forgeAdapter !== 'undefined' && window.forgeAdapter.isResponseComplete()) {
      const rawText = await window.forgeAdapter.getLatestResponse();
      if (rawText) {
        console.log('[FORGE] Using API-first text parser from adapter');
        if(window.forgeDebug){
          console.log("Raw received:");
          console.log(rawText);
        }
        const parsed = _parseCodebaseFromRawText(rawText);
        fileBlocks = parsed.fileBlocks;
        steps = parsed.steps;
      }
    }

    // API capture can occasionally be complete-but-stale, particularly when
    // ChatGPT hands the live response off to a separate streaming transport.
    // If the rendered assistant turn contains a newer FORGE step than the
    // API text, prefer the DOM instead of silently applying the stale capture.
    if (fileBlocks.length > 0) {
      const apiLatestStep =
        steps.length > 0
          ? Math.max(
              ...steps.map(step =>
                Number(step.stepNum) || 0
              )
            )
          : null;

      const renderedRoot =
        (
          window.forgeAdapter &&
          typeof window.forgeAdapter
            .getAssistantMessageRoot === 'function'
        )
          ? window.forgeAdapter
              .getAssistantMessageRoot()
          : null;

      let renderedLatestStep = null;

      if (renderedRoot) {
        renderedRoot
          .querySelectorAll(
            'code, .cm-content'
          )
          .forEach(surface => {
            const stepNum =
              _getHighestParsingStepNumber(
                surface
              );

            if (
              stepNum !== null &&
              (
                renderedLatestStep === null ||
                stepNum > renderedLatestStep
              )
            ) {
              renderedLatestStep =
                stepNum;
            }
          });
      }

      if (
        renderedLatestStep !== null &&
        (
          apiLatestStep === null ||
          renderedLatestStep > apiLatestStep
        )
      ) {
        console.warn(
          '[FORGE] API capture is stale; preferring newer rendered response',
          {
            apiLatestStep,
            renderedLatestStep
          }
        );

        fileBlocks = [];
        steps = [];
      }
    }

    // Fallback to DOM scraping if API-first didn't yield anything,
    // or if the rendered assistant response is newer than the API capture.
    if (fileBlocks.length === 0) {
      console.log('[FORGE] Falling back to DOM scraping parser');

      const assistantMessages =
        document.querySelectorAll(
          '[data-message-author-role="assistant"]'
        );

      const latestAssistant =
        assistantMessages.length > 0
          ? assistantMessages[
              assistantMessages.length - 1
            ]
          : null;

      // If the adapter provides a root, prefer it.
      // If that root has a shadowRoot, parse inside it directly ¡ª
      // this handles shadow-DOM platforms like Gemini where the
      // response markup lives inside a web component's shadow tree.
      const adapterRoot =
        window.forgeAdapter &&
        typeof window.forgeAdapter.getAssistantMessageRoot === 'function'
          ? window.forgeAdapter.getAssistantMessageRoot()
          : null;

      let parseRoot;
      if (adapterRoot && adapterRoot.shadowRoot) {
        parseRoot = adapterRoot.shadowRoot;
      } else if (adapterRoot) {
        parseRoot = adapterRoot;
      } else {
        parseRoot = latestAssistant || document;
      }

      fileBlocks = parseCodebase(parseRoot);
      steps = [];
      
      // Collect step summaries only from the latest response.
      // ChatGPT now renders fenced blocks through CodeMirror, so treat
      // .cm-content as a code surface alongside traditional <code>.
      const allCode =
        parseRoot.querySelectorAll(
          'code, .cm-content'
        );

      allCode.forEach(codeBlock => {
        const text =
          _getParsingText(codeBlock);

        const stepNum =
          _getParsingStepNumber(
            codeBlock
          );

        if (
          stepNum !== null &&
          Number.isFinite(stepNum)
        ) {
          steps.push({
            stepNum,
            text
          });

          return;
        }

        // Normal DOM operation parsing already succeeded.
        // Do not reinterpret arbitrary code blocks as raw protocol.
        if (fileBlocks.length > 0) {
          return;
        }

        // A wrapping fence can cause the complete FORGE payload to
        // render as one code block. Try that block as raw Markdown.
        const parsed =
          _parseCodebaseFromRawText(text);

        const parsedFileBlocks =
          Array.isArray(parsed?.fileBlocks)
            ? parsed.fileBlocks
            : [];

        const parsedSteps =
          Array.isArray(parsed?.steps)
            ? parsed.steps
            : [];

        // Require a complete protocol result. A steps-only result can
        // be caused by marker strings inside ordinary source code.
        if (
          parsedFileBlocks.length === 0 ||
          parsedSteps.length === 0
        ) {
          return;
        }

        console.log(
          '[FORGE] Recovered complete protocol from a wrapped code block: ' +
          `${parsedFileBlocks.length} op(s), ${parsedSteps.length} step(s)`
        );

        parsedFileBlocks.forEach(block =>
          fileBlocks.push(block)
        );

        parsedSteps.forEach(step =>
          steps.push(step)
        );
      });

      // ChatGPT may render an outer ~~~ fence as one CodeMirror <pre>.
      // In that layout the nested FORGE fences are not individual <code>
      // elements, but .cm-content.innerText preserves the original raw
      // Markdown. Recover the complete protocol from that surface.
      if (fileBlocks.length === 0) {
        const wrappedSurfaces = [
          ...parseRoot.querySelectorAll(
            '.cm-content, pre'
          )
        ];

        const seenWrappedText =
          new Set();

        for (const surface of wrappedSurfaces) {
          const text =
            (
              surface.matches?.(
                '.cm-content'
              )
                ? _getParsingText(
                    surface
                  )
                : (
                    surface.innerText ||
                    surface.textContent ||
                    ''
                  )
            ).trim();

          if (
            !text ||
            seenWrappedText.has(text) ||
            !text.includes('//codebase')
          ) {
            continue;
          }

          seenWrappedText.add(text);

          const parsed =
            _parseCodebaseFromRawText(text);

          const parsedFileBlocks =
            Array.isArray(parsed?.fileBlocks)
              ? parsed.fileBlocks
              : [];

          const parsedSteps =
            Array.isArray(parsed?.steps)
              ? parsed.steps
              : [];

          if (
            parsedFileBlocks.length === 0 ||
            parsedSteps.length === 0
          ) {
            continue;
          }

          console.log(
            '[FORGE] Recovered FORGE protocol from wrapped CodeMirror surface: ' +
            `${parsedFileBlocks.length} op(s), ${parsedSteps.length} step(s)`
          );

          fileBlocks =
            parsedFileBlocks;

          steps =
            parsedSteps;

          break;
        }
      }
    }

    const blockMap = new Map();
    fileBlocks.forEach(block => blockMap.set(block.id, block));

    await _applyParsedBlocks(fileBlocks, steps, isAutoPilot, modal, cancelled, () => cancelled = true);

  } catch (error) {
    if (isAutoPilot) {
      _setApplyExecutionIndicator(null);
    }

    const errorMessage =
      'Apply Steps failed: ' + error.message;

    modal.setStatus(errorMessage);
    modal.setButtons([{ text: 'Close', onClick: () => modal.close() }]);

    if (isAutoPilot) {
      const modalEl = document.getElementById('forge-progress-modal');
      if (modalEl) modalEl.style.display = 'flex';
    }

    logToUI(errorMessage);
    _showApplyFeedback(errorMessage, 5000);
    console.error('Parse and apply error:', error);
  }
}

function _setApplyExecutionIndicator(message) {
  let indicator =
    document.getElementById('forge-execution-indicator');

  if (!message) {
    if (indicator) indicator.remove();
    return;
  }

  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'forge-execution-indicator';
    indicator.setAttribute('role', 'status');
    indicator.setAttribute('aria-live', 'polite');
    indicator.style.cssText = [
      'position:fixed',
      'right:18px',
      'bottom:18px',
      'z-index:2147483646',
      'max-width:360px',
      'padding:10px 14px',
      'border:1px solid rgba(255,255,255,.24)',
      'border-radius:8px',
      'background:#172554',
      'color:#fff',
      'font:600 13px/1.4 system-ui,sans-serif',
      'box-shadow:0 6px 24px rgba(0,0,0,.32)',
      'pointer-events:none'
    ].join(';');

    document.body.appendChild(indicator);
  }

  indicator.textContent = '?? ' + message;
}

// ©¤©¤ Execution loop (shared by parseAndApply and pasteAndApplyStep) ©¤©¤©¤©¤©¤©¤©¤©¤©¤

/**
 * @param {Array}    fileBlocks   - array of {path, id, operation, content, element, type, destinationPath}
 * @param {Array}    steps        - array of {stepNum, text}
 * @param {boolean}  isAutoPilot  - suppress modal, auto-close, auto-send
 * @param {object}   [modal]      - progress modal instance (created internally if omitted)
 * @param {boolean}  [_cancelled] - initial cancelled state (ignored; use cancelRef)
 * @param {Function} [onCancel]   - callback when user cancels
 * @param {Function} [feedbackFn] - user-visible feedback notifier
 */
async function _applyParsedBlocks(
  fileBlocks,
  steps,
  isAutoPilot,
  modal,
  _cancelled,
  onCancel,
  feedbackFn = _showApplyFeedback
) {
  // Clear sendBack queue at the start of any step application
  if (repo && repo.clearSendBackQueue) repo.clearSendBackQueue();

  // Allow calling without a pre-built modal (e.g. from pasteAndApplyStep)
  if (!modal) modal = createProgressModal();
  if (isAutoPilot) {
    const modalEl = document.getElementById('forge-progress-modal');
    if (modalEl) modalEl.style.display = 'none';
  }

  let cancelled = false;
  const cancelFn = () => { cancelled = true; if (onCancel) onCancel(); };

  if (typeof feedbackFn !== 'function') {
    feedbackFn = _showApplyFeedback;
  }

  // Heartbeat tracking
  let _totalFuzzyMatches = 0;
  let _totalLinesChanged = 0;
  let _totalOpsApplied = 0;
  let _visibleIssueToastShown = false;

  const blockMap = new Map();
  fileBlocks.forEach(block => blockMap.set(block.id, block));

  // ©¤©¤ Validation ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  if (steps.length > 0 && fileBlocks.length === 0) {
    const message =
      'Found step markers, but no operation blocks could be parsed.';

    modal.setStatus('Warning: ' + message);
    modal.setButtons([{ text: 'Close', onClick: () => modal.close() }]);
    logToUI(message + ' Check the rendered response structure.');

    if (!isAutoPilot) {
      feedbackFn(message, 5000);
    }

    return;
  }

  steps.sort((a, b) => a.stepNum - b.stepNum);
  const newSteps = steps.filter(s => s.stepNum > repo.lastProcessedStep);

  if (newSteps.length === 0) {
    if (isAutoPilot) {
      modal.close();
      return;
    }

    const message =
      _getNoNewStepsMessage(steps);

    modal.setStatus(message);
    modal.setButtons([{ text: 'Close', onClick: () => modal.close() }]);
    logToUI(message);
    feedbackFn(message, 4000);
    return;
  }

  // Check for missing operation IDs referenced in step summaries
  const referencedIds = new Set();
  newSteps.forEach(step => {
    for (const match of step.text.matchAll(/#(\d+)/g)) {
      if (!match[1].startsWith('step-')) referencedIds.add(match[1]);
    }
  });
  const missingIds = [...referencedIds].filter(id => !blockMap.has(id));

  if (missingIds.length > 0) {
    const operationLabel =
      missingIds.length === 1
        ? 'operation'
        : 'operations';

    const message =
      `${missingIds.length} referenced ${operationLabel} not found.`;

    modal.setStatus(`?? ${message}`);

    // Build a helpful inline detail block in the modal body
    const detailEl = document.createElement('div');
    detailEl.style.cssText = 'margin-top:12px;';

    // Missing IDs list
    const idsBox = document.createElement('div');
    idsBox.style.cssText = [
      'background:#2a1e0a', 'border:1px solid #b8860b',
      'border-radius:6px', 'padding:10px 12px', 'margin-bottom:10px',
      'font-family:Consolas,monospace', 'font-size:12px', 'color:#ffd77a'
    ].join(';');
    idsBox.textContent = 'Missing: ' + missingIds.map(id => '#' + id).join(', ');

    // Step runner text so user can see what was expected
    const stepText = newSteps.map(s => s.text).join('\n\n');
    const stepBox = document.createElement('div');
    stepBox.style.cssText = [
      'background:#1e1e1e', 'border:1px solid #3e3e42',
      'border-radius:6px', 'padding:10px 12px',
      'font-family:Consolas,monospace', 'font-size:11px',
      'color:#a0a0a0', 'max-height:160px', 'overflow-y:auto',
      'white-space:pre-wrap', 'word-break:break-word', 'margin-bottom:8px'
    ].join(';');
    stepBox.textContent = stepText;

    // Explanation
    const hint = document.createElement('div');
    hint.style.cssText = 'font-size:11px;color:#858585;line-height:1.5;';
    hint.textContent = 'These operation IDs are referenced in the step runner but no matching code blocks were found. '
      + 'This usually means the LLM forgot to include the code block, or the parser missed it. '
      + 'You can continue anyway (skipping the missing ops) or cancel and try Apply Steps again.';

    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.textContent = '?? Copy step runner';
    copyBtn.style.cssText = [
      'margin-top:8px', 'background:#3e3e42', 'border:none',
      'color:#d4d4d4', 'padding:5px 12px', 'border-radius:4px',
      'cursor:pointer', 'font-size:11px', 'font-family:Segoe UI,sans-serif'
    ].join(';');
    copyBtn.onclick = () => {
      if (typeof copyToClipboard === 'function') copyToClipboard(stepText);
      copyBtn.textContent = '? Copied!';
      setTimeout(() => { copyBtn.textContent = '?? Copy step runner'; }, 2000);
    };

    detailEl.appendChild(idsBox);
    detailEl.appendChild(stepBox);
    detailEl.appendChild(hint);
    detailEl.appendChild(copyBtn);

    // Append to modal body
    const progressBody = document.querySelector('.forge-progress-body');
    if (progressBody) progressBody.appendChild(detailEl);

    modal.setButtons([
      { text: 'Continue Anyway', onClick: () => {
        detailEl.remove();
        _runOperations();
      }},
      { text: 'Cancel', secondary: true, onClick: () => modal.close() }
    ]);

    logToUI(message + ' Missing: ' + missingIds.map(id => '#' + id).join(', '));

    if (!isAutoPilot) {
      feedbackFn(message, 5000);
    }

    return;
  }

  modal.setStatus(`Found ${fileBlocks.length} operations in ${newSteps.length} step(s)`);
  fileBlocks.forEach(op => modal.addOperation(op));
  modal.setButtons([
    { text: 'Cancel', secondary: true, onClick: () => { cancelFn(); modal.close(); } },
    { text: 'Import All', onClick: () => _runOperations() }
  ]);

  async function _runOperations() {
    modal.setButtons([{ text: 'Cancel', secondary: true, disabled: true }]);
    logToUI(`Processing ${newSteps.length} step(s)...`);

    if (isAutoPilot) {
      _setApplyExecutionIndicator(
        `Executing ${newSteps.length} step(s)¡­`
      );
    }

    for (const { stepNum, text } of newSteps) {
      if (cancelled) break;
      modal.setStatus(`Processing Step ${stepNum}...`);
      logToUI(`Executing Step ${stepNum}...`);

      if (isAutoPilot) {
        _setApplyExecutionIndicator(
          `Executing Step ${stepNum}¡­`
        );

      }

      ForgeActions.setCurrentStep(stepNum - 1);

      let matchedRunnerOperations = 0;

      // Parse complete runner calls instead of matching one rendered line
      // at a time. Chat responses commonly format these calls across
      // several lines.
      const runnerOperationPattern =
        /repo\.(addFile|createFile|replaceFile|patchFile|deleteFile|moveFile|execute|executeScript)\s*\(\s*["']#(\d+)["']\s*,\s*["'](.*?)["'](?:\s*,\s*["'](.*?)["'])?\s*\)/gs;

      const operationTypeByMethod = {
        addFile: 'add',
        createFile: 'add',
        replaceFile: 'replace',
        patchFile: 'patch',
        deleteFile: 'delete',
        moveFile: 'move',
        execute: 'execute',
        executeScript: 'execute'
      };

      for (const operationMatch of text.matchAll(runnerOperationPattern)) {
        if (cancelled) break;

        const [
          ,
          methodName,
          operationId,
          operationPath,
          matchedDestinationPath
        ] = operationMatch;

        const operationType =
          operationTypeByMethod[methodName] || null;

        const destinationPath =
          matchedDestinationPath || null;

        if (!operationType) continue;

        const block = blockMap.get(operationId);
        if (!block) continue;
        matchedRunnerOperations++;

        modal.updateOperation(operationId, 'processing');

        if (operationType === 'add') {
          try {
            repo.addFile(operationId, operationPath, block.content);
            modal.updateOperation(operationId, 'success');
            markOperationStatus(block, 'success');
            _totalOpsApplied++;
            if (block.content) _totalLinesChanged += block.content.split('\n').length;
          } catch (error) {
            modal.updateOperation(operationId, 'error', error.message.substring(0, 30));
            markOperationStatus(block, 'error', error.message);
            logToUI(`Operation ${operationId} failed: ${error.message}`);
          }

        } else if (operationType === 'replace') {
          try {
            repo.replaceFile(operationId, operationPath, block.content);
            modal.updateOperation(operationId, 'success');
            _totalOpsApplied++;
            if (block.content) _totalLinesChanged += block.content.split('\n').length;
          } catch (error) {
            modal.updateOperation(operationId, 'error', error.message.substring(0, 30));
            markOperationStatus(block, 'error', error.message);
            logToUI(`Operation ${operationId} failed: ${error.message}`);
          }

        } else if (operationType === 'delete') {
          try {
            repo.deleteFile(operationId, operationPath);
            modal.updateOperation(operationId, 'success');
            markOperationStatus(block, 'success');
            _totalOpsApplied++;
          } catch (error) {
            modal.updateOperation(operationId, 'error', error.message.substring(0, 30));
            markOperationStatus(block, 'error', error.message);
            logToUI(`Operation ${operationId} failed: ${error.message}`);
          }

        } else if (operationType === 'move') {
          try {
            repo.moveFile(operationId, operationPath, destinationPath);
            modal.updateOperation(operationId, 'success');
            _totalOpsApplied++;
          } catch (error) {
            modal.updateOperation(operationId, 'error', error.message.substring(0, 30));
            markOperationStatus(block, 'error', error.message);
            logToUI(`Operation ${operationId} failed: ${error.message}`);
          }

      } else if (operationType === 'execute') {
        // Execute JavaScript
        // If no inline content block, try reading the file from the VFS
        // (supports: #new to create a file, then #execute to run it in same step)
        let executeContent = block.content;
        // If content looks like a step runner (parser grabbed wrong block),
        // or is missing entirely, fall back to reading the file from the VFS.
        const looksLikeStepRunner = executeContent &&
          /^\/\/codebase\s+#step-\d+/.test(executeContent.split('\n')[0].trim());
        if ((!executeContent || looksLikeStepRunner) && repo.fileExists(operationPath)) {
          executeContent = repo.getContent(operationPath).text();
          logToUI(`Script ${operationId} running from VFS: ${operationPath}`);
        }
        try {
          if (typeof executeScript === 'function') {
            const result = await executeScript(executeContent, operationId);
            if (result.success) {
                modal.updateOperation(operationId, 'success');
                markOperationStatus(block, 'success');
                logToUI(`Script ${operationId} executed successfully`);
                _totalOpsApplied++;
              } else {
                modal.updateOperation(operationId, 'error', 'Execution failed');
                markOperationStatus(block, 'error', result.error);
                logToUI(`Script ${operationId} failed: ${result.error}`);
              }
            }
          } catch (error) {
            modal.updateOperation(operationId, 'error', 'Exception');
            markOperationStatus(block, 'error', error.message);
            logToUI(`Script ${operationId} threw exception: ${error.message}`);
            console.error('[FORGE] Execute exception:', error);
          }

        } else if (operationType === 'patch') {
          try {
            repo.patchFile(operationId, operationPath, block.content);
            const lastLog = document.getElementById('forge-log').textContent;
            if (lastLog.includes('fuzzy matching')) {
              modal.updateOperation(operationId, 'warning', 'fuzzy match');
              markOperationStatus(block, 'warning', 'Applied (fuzzy match)');
              _totalFuzzyMatches++;
            } else {
              modal.updateOperation(operationId, 'success');
              markOperationStatus(block, 'success');
            }
            _totalOpsApplied++;
            if (block.content) {
              const findBlock = block.content.split('<<<REPLACE')[1] || '';
              _totalLinesChanged += findBlock.split('\n').length;
            }
          } catch (error) {
            let fuzzyStats = null;
            if (error.message.includes('failed:')) {
              const findBlock  = block.content.split('<<<FIND')[1]?.split('>>>')[0]?.trim() || '';
              const fileContent = repo.files[operationPath] || '';
              const fuzzyResult = applyFuzzyPatch(fileContent, findBlock, '');
              if (fuzzyResult.stats) {
                fuzzyStats = {
                  confidence: fuzzyResult.confidence,
                  exactMatches: fuzzyResult.stats.exactMatches,
                  normalizedMatches: fuzzyResult.stats.normalizedMatches,
                  totalLines: fuzzyResult.stats.totalLines,
                  startLine: fuzzyResult.stats.startLine,
                  endLine: fuzzyResult.stats.endLine
                };
              }
            }
            const errorInfo = {
              id: operationId, path: operationPath, message: error.message,
              findBlock: block.content.split('<<<FIND')[1]?.split('>>>')[0] || 'Could not extract FIND block',
              element: block.element, type: block.type, fuzzyStats
            };
            if (typeof _buildPatchFailureMessage === 'function') {
              repo.sendBack({
                type: 'error', operationId, operation: 'patch', stage: 'apply',
                path: operationPath, message: _buildPatchFailureMessage(errorInfo), fuzzyStats
              });
            }
            modal.updateOperation(operationId, 'error', 'skipped');
            markOperationStatus(block, 'warning', 'Patch failed ¡ª skipped');
            logToUI(`Patch #${operationId} failed and was skipped ¡ª added to sendBack`);
          }
        }
      }


      if (matchedRunnerOperations === 0) {
        const message =
          `Step ${stepNum} contained no runnable repo operations. ` +
          'The step was not marked as processed.';

        modal.setStatus(message);
        logToUI(message);

        if (!isAutoPilot) {
          feedbackFn(message, 5000);
          _visibleIssueToastShown = true;
        }

        repo.sendBack({
          type: 'error',
          stage: 'dispatch',
          stepNum,
          message
        });

        continue;
      }

      ForgeActions.setLastProcessedStep(stepNum);
      if (typeof showToast === 'function') showToast(`Step ${stepNum} applied`, 2500);
    }

    // ©¤©¤ Post-loop ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
    if (cancelled) {
      modal.setStatus('Import cancelled');
      logToUI('Import cancelled by user');

      if (isAutoPilot) {
        _setApplyExecutionIndicator(null);
      }
    } else {
      const sendBackQueue = repo && repo.getSendBackQueue ? repo.getSendBackQueue() : [];
      const errorCount    = sendBackQueue.filter(e => e.type === 'error').length;

      if (errorCount > 0) {
        modal.setStatus(`Completed with ${errorCount} error(s)`);
        logToUI(
          `Completed ${newSteps.length} step(s) ¡ª ` +
          `${errorCount} error(s)`
        );

        if (!isAutoPilot && !_visibleIssueToastShown) {
          feedbackFn(
            `${errorCount} Apply Steps error(s) ¡ª ` +
            'click Send Results to Elsa',
            4000
          );
        }
      } else {
        modal.setStatus(`Completed ${newSteps.length} step(s) successfully`);
        logToUI(`Completed ${newSteps.length} step(s)`);
      }

        if (isAutoPilot) {
        const lastStep = newSteps[newSteps.length - 1];
        if (typeof updateAutoPilotStrip === 'function') updateAutoPilotStrip(lastStep.stepNum, fileBlocks.length, errorCount);
        if (typeof flashStepCounter === 'function') flashStepCounter();
        _setApplyExecutionIndicator(null);
      }

      // Validate files changed in this step
      let _validationSummary = null;
      if (repo._validatorRegistry && typeof repo.validate === 'function') {
        try {
          // Collect paths changed in this step
          const changedPaths = new Set();
          newSteps.forEach(({ stepNum }) => {
            const version = repo.versions[stepNum - 1];
            if (version && Array.isArray(version.changes)) {
              version.changes.forEach(c => {
                if (c.path && c.operation !== 'delete') changedPaths.add(c.path);
              });
            }
          });

          if (changedPaths.size > 0) {
            // Only validate extensions that have a registered validator
            const validatedExts = repo.getValidatorExtensions ? repo.getValidatorExtensions() : [];
            const pathsToValidate = [...changedPaths].filter(p => {
              const ext = p.split('.').pop().toLowerCase();
              return validatedExts.includes(ext);
            });

            if (pathsToValidate.length > 0) {
              // Build a pattern list matching exactly these paths
              const patterns = pathsToValidate.map(p => p.replace(/^\//, ''));
              const valResult = await repo.validate(patterns);
              _validationSummary = valResult.summary;

              // Always push failures to sendback queue
              const failedFiles = valResult.results.filter(r => !r.valid);
              if (failedFiles.length > 0) {
                repo.sendBack({
                  type: 'validation',
                  success: false,
                  summary: valResult.summary,
                  failures: failedFiles.map(r => ({
                    path: r.path,
                    errors: r.errors,
                    warnings: r.warnings
                  }))
                });
                logToUI(`?? Validation: ${failedFiles.length} file(s) have errors`);
              } else if (pathsToValidate.length > 0) {
                logToUI(`? Validation: ${pathsToValidate.length} changed file(s) passed`);
              }
            }
          }
        } catch (valErr) {
          console.warn('[FORGE] Post-step validation error:', valErr);
        }
      }

      // Store stats on repo for manual heartbeat access
      repo.lastStepStats = {
        stepNum: newSteps.length > 0 ? newSteps[newSteps.length - 1].stepNum : repo.lastProcessedStep,
        opsApplied: _totalOpsApplied,
        fuzzyMatches: _totalFuzzyMatches,
        linesChanged: _totalLinesChanged,
        errorCount: errorCount,
        validation: _validationSummary
      };

      // Heartbeat: if queue is empty and heartbeat is enabled, synthesize a status message
      if (
        sendBackQueue.length === 0 &&
        isHeartbeatEnabled() &&
        typeof _buildHeartbeat === 'function'
      ) {
        const lastStep = newSteps[newSteps.length - 1];
        const heartbeat = _buildHeartbeat(
          lastStep.stepNum,
          _totalOpsApplied,
          _totalFuzzyMatches,
          _totalLinesChanged,
          errorCount,
          _validationSummary
        );
        repo.sendBack(heartbeat);
        logToUI(`?? Heartbeat queued for step ${lastStep.stepNum}`);
      }

      const finalQueue = repo && repo.getSendBackQueue ? repo.getSendBackQueue() : [];
      if (finalQueue.length > 0) {
        if (isAutoPilotEnabled()) {
          // Check if auto-pilot should continue
          const shouldContinue = typeof shouldAutoPilotContinue === 'function' 
            ? shouldAutoPilotContinue() 
            : true;

          // Always send results first, then decide whether to stop
          logToUI(`Auto-Pilot: Auto-sending results...`);
          setTimeout(() => {
            if (typeof autoSendToElsa === 'function') {
              autoSendToElsa(JSON.stringify(finalQueue, null, 2));
              if (repo.markSendBackSent) repo.markSendBackSent();
            }
            if (!shouldContinue) {
              // Condition returned false - disable auto-pilot after sending
              logToUI(`Auto-Pilot: Continue condition returned false, disabling auto-pilot`);
              if (typeof toggleAutoPilot === 'function') {
                toggleAutoPilot();
              }
            }
          }, 1500);
        }
      }

      if (typeof saveWorkspaceState === 'function') {
        saveWorkspaceState().then(success => {
          if (success) {
            if (typeof updateSessionsCount === 'function') updateSessionsCount();
          }
        });
      }

      // Notify auto-sync to push to disk after successful apply
      if (typeof onApplyComplete === 'function') onApplyComplete();
    }

    modal.setButtons([{ text: 'Close', onClick: () => modal.close() }]);
    if (isAutoPilot) modal.close();


  }

  await _runOperations();
}
// FORGE CODE - Auto-Pilot
// Intercepts network requests to detect when Elsa finishes generating,
// then forces the DOM to render and auto-applies the steps.

let _autoPilotRetryTimer = null;
let _autoPilotApplyInFlight = false;
let _autoPilotDomObserver = null;
let _autoPilotDomWatchTimer = null;
let _autoPilotDomWatchDebounce = null;

// Auto-Pilot and heartbeat enabled state are owned by ForgeState.
function isAutoPilotEnabled() {
  return !!ForgeState.getState().autoPilotEnabled;
}

function isHeartbeatEnabled() {
  return !!ForgeState.getState().heartbeatEnabled;
}

// Auto-Pilot continuation condition
// This function is checked after each step's sendBack.
// If it returns false, auto-pilot is disabled.
// Default: always continue (return true)
let _autoPilotContinueCondition = () => true;

/**
 * Register a condition function that determines whether auto-pilot should continue.
 * The function is called after each step completes and sendBack is ready.
 * If it returns false, auto-pilot will be disabled automatically.
 * 
 * @param {Function} conditionFn - Function that returns true to continue, false to stop
 */
function setAutoPilotContinueCondition(conditionFn) {
  if (typeof conditionFn === 'function') {
    _autoPilotContinueCondition = conditionFn;
  }
}

/**
 * Reset the auto-pilot continue condition to the default (always continue).
 */
function resetAutoPilotContinueCondition() {
  _autoPilotContinueCondition = () => true;
}

/**
 * Check if auto-pilot should continue.
 * Returns true if auto-pilot should continue, false if it should stop.
 */
function shouldAutoPilotContinue() {
  try {
    return _autoPilotContinueCondition();
  } catch (error) {
    console.error('[FORGE Auto-Pilot] Continue condition threw error:', error);
    return true; // Default to continuing on error
  }
}

/**
 * Build a heartbeat sendBack payload after a step completes.
 * Summarises what happened so the LLM can decide what to do next.
 */
function _buildHeartbeat(stepNum, opsApplied, fuzzyMatches, linesChanged, errorCount, validationSummary) {
  const parts = [];

  parts.push(`Step ${stepNum} applied successfully.`);
  parts.push(`${opsApplied} operation(s) processed.`);

  if (linesChanged > 0) {
    parts.push(`~${linesChanged} line(s) changed.`);
  }

  if (fuzzyMatches > 0) {
    parts.push(`${fuzzyMatches} patch(es) applied via fuzzy match ¡ª review if unexpected.`);
  }

  if (errorCount > 0) {
    parts.push(`${errorCount} error(s) occurred ¡ª see details above.`);
  }

  if (validationSummary && validationSummary.total > 0) {
    if (validationSummary.failed > 0) {
      parts.push(`Validation: ${validationSummary.failed}/${validationSummary.total} file(s) failed ¡ª errors queued above.`);
    } else {
      parts.push(`Validation: ${validationSummary.total} changed file(s) passed.`);
    }
  }

  parts.push('Continue with the next step.');

  return {
    type: 'heartbeat',
    stepNum,
    opsApplied,
    linesChanged,
    fuzzyMatches,
    errorCount,
    validation: validationSummary || null,
    message: parts.join(' ')
  };
}

function _stopAutoPilotDomWatch(reason) {
  if (_autoPilotDomObserver) {
    _autoPilotDomObserver.disconnect();
    _autoPilotDomObserver = null;
  }

  if (_autoPilotDomWatchTimer) {
    clearTimeout(_autoPilotDomWatchTimer);
    _autoPilotDomWatchTimer = null;
  }

  if (_autoPilotDomWatchDebounce) {
    clearTimeout(_autoPilotDomWatchDebounce);
    _autoPilotDomWatchDebounce = null;
  }

  if (_autoPilotRetryTimer) {
    clearTimeout(_autoPilotRetryTimer);
    _autoPilotRetryTimer = null;
  }

  if (reason) {
    console.log(
      '[FORGE Auto-Pilot] Render watch stopped:',
      reason
    );
  }
}

function _findLatestRenderedStepNumber(
  root = document
) {
  // If the active adapter can provide its own code surfaces (e.g. shadow DOM),
  // use those ¡ª otherwise fall back to querying the given root.
  let surfaces;
  if (
    window.forgeAdapter &&
    typeof window.forgeAdapter.getCodeSurfaces === 'function'
  ) {
    surfaces = window.forgeAdapter.getCodeSurfaces();
  } else {
    surfaces = [
      ...root.querySelectorAll('code, .cm-content')
    ];
  }

  const searchLimit =
    Math.max(
      0,
      surfaces.length - 20
    );

  let highestStep = null;

  for (
    let index = surfaces.length - 1;
    index >= searchLimit;
    index -= 1
  ) {
    const stepNum =
      _getHighestParsingStepNumber(
        surfaces[index]
      );

    if (
      stepNum !== null &&
      (
        highestStep === null ||
        stepNum > highestStep
      )
    ) {
      highestStep = stepNum;
    }
  }

  return highestStep;
}

function _startAutoPilotDomWatch() {
  if (
    !isAutoPilotEnabled() ||
    !document.body ||
    typeof MutationObserver === 'undefined'
  ) {
    return;
  }

  _stopAutoPilotDomWatch();

  const baselineStep = repo.lastProcessedStep;

  const inspectRenderedSteps = () => {
    _autoPilotDomWatchDebounce = null;

    if (!isAutoPilotEnabled()) {
      _stopAutoPilotDomWatch('Auto-Pilot disabled');
      return;
    }

    const renderedStepNum =
      _findLatestRenderedStepNumber();

    if (
      renderedStepNum !== null &&
      renderedStepNum > repo.lastProcessedStep
    ) {


      _checkAndApply();
    }
  };

  _autoPilotDomObserver = new MutationObserver(
    mutations => {
      const relevantMutation = mutations.some(mutation => {
        if (mutation.type === 'characterData') {
          const parentElement =
            mutation.target.parentElement;
          const codeBlock =
            parentElement &&
            parentElement.closest
              ? parentElement.closest('code')
              : null;

          return !!(
            codeBlock &&
            (codeBlock.textContent || '').includes(
              '//codebase'
            )
          );
        }

        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            const parentElement = node.parentElement;
            const codeSurface =
              parentElement &&
              parentElement.closest
                ? parentElement.closest(
                    'code, .cm-content'
                  )
                : null;

            if (
              codeSurface &&
              _getHighestParsingStepNumber(
                codeSurface
              ) !== null
            ) {
              return true;
            }
          }

          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node;

            const surfaces = [];

            if (
              element.matches &&
              element.matches(
                'code, .cm-content'
              )
            ) {
              surfaces.push(element);
            }

            if (element.querySelectorAll) {
              surfaces.push(
                ...element.querySelectorAll(
                  'code, .cm-content'
                )
              );
            }

            if (
              surfaces.some(surface =>
                _getHighestParsingStepNumber(
                  surface
                ) !== null
              )
            ) {
              return true;
            }
          }
        }

        return false;
      });

      if (
        !relevantMutation ||
        _autoPilotDomWatchDebounce
      ) {
        return;
      }

      _autoPilotDomWatchDebounce = setTimeout(
        inspectRenderedSteps,
        100
      );
    }
  );

  _autoPilotDomObserver.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });

  _autoPilotDomWatchTimer = setTimeout(() => {
    _stopAutoPilotDomWatch(
      'No newer step rendered within five minutes'
    );
  }, 300000);

  console.log(
    '[FORGE Auto-Pilot] Watching the DOM for a step newer than',
    baselineStep
  );

  inspectRenderedSteps();
}

function _getCapturedPendingStepNumber() {
  const adapter = window.forgeAdapter;
  const responseText =
    adapter && typeof adapter.latestResponseText === 'string'
      ? adapter.latestResponseText
      : '';

  if (!responseText) return null;

  const stepPattern = /^\/\/codebase\s+#step-(\d+)/gm;
  let highestStep = null;
  let match;

  while ((match = stepPattern.exec(responseText)) !== null) {
    const stepNum = parseInt(match[1], 10);

    if (
      Number.isFinite(stepNum) &&
      (highestStep === null || stepNum > highestStep)
    ) {
      highestStep = stepNum;
    }
  }

  return highestStep;
}

// ©¤©¤ Response-complete event listener ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
// Adapters dispatch 'forge:response-complete' instead of calling auto-pilot
// internals directly. This keeps adapters decoupled from auto-pilot logic.

window.addEventListener('forge:response-complete', () => {
  if (!isAutoPilotEnabled()) return;

  setTimeout(() => {
    console.log('[FORGE Auto-Pilot] forge:response-complete received; arming render observer');

    // If the adapter can provide its own code surfaces (e.g. shadow DOM platforms
    // like Gemini), skip the MutationObserver and go straight to _checkAndApply ¡ª
    // the surfaces are already available in the DOM at this point.
    if (
      window.forgeAdapter &&
      typeof window.forgeAdapter.getCodeSurfaces === 'function'
    ) {
      console.log('[FORGE Auto-Pilot] Adapter provides code surfaces ¡ª checking directly');
      _checkAndApply(0, true);
      return;
    }

    if (typeof _startAutoPilotDomWatch === 'function') {
      _startAutoPilotDomWatch();
    } else if (typeof _checkAndApply === 'function') {
      _checkAndApply();
    }
  }, 300);
});

function toggleAutoPilot() {
  const enabled = !isAutoPilotEnabled();

  ForgeActions.setAutoPilotEnabled(enabled);

  if (enabled) {
    // When manually enabling auto-pilot, reset the continue condition to default
    resetAutoPilotContinueCondition();
    showToast('?? Auto-Pilot Enabled');
    logToUI('?? Auto-Pilot enabled: Adapters are watching for completion signals');
  } else {
    _stopAutoPilotDomWatch('Auto-Pilot disabled');
    showToast('?? Auto-Pilot Disabled');
    logToUI('?? Auto-Pilot disabled');
  }
}


function _checkAndApply(attempt = 0, waitForRender = false) {
  const maxAttempts = 60;
  const retryDelay = 250;

  if (_autoPilotRetryTimer) {
    clearTimeout(_autoPilotRetryTimer);
    _autoPilotRetryTimer = null;
  }

  if (!isAutoPilotEnabled()) {
    return;
  }

  if (_autoPilotApplyInFlight) {
    console.log(
      '[FORGE Auto-Pilot] Apply already in progress; ignoring duplicate signal.'
    );
    return;
  }

  const adapter = window.forgeAdapter;

  if (adapter && adapter.isStillGenerating()) {
    console.log(
      '[FORGE Auto-Pilot] Platform is still generating; ' +
      'waiting before applying.'
    );

    _autoPilotRetryTimer = setTimeout(() => {
      _autoPilotRetryTimer = null;
      _checkAndApply(0, true);
    }, retryDelay);

    return;
  }

  const applyRoot =
    (adapter && adapter.getAssistantMessageRoot()) || document;

  const renderedStepNum =
    _findLatestRenderedStepNumber(
      applyRoot
    );

  const hasNewStep =
    renderedStepNum !== null &&
    renderedStepNum >
      repo.lastProcessedStep;

  if (hasNewStep) {
    logToUI('?? Auto-Pilot: New step detected, applying...');
    _stopAutoPilotDomWatch('New step detected');
    _autoPilotApplyInFlight = true;

    if (typeof parseAndApply !== 'function') {
      _autoPilotApplyInFlight = false;
      console.error('[FORGE Auto-Pilot] parseAndApply is unavailable.');
      return;
    }

    try {
      const applyResult = parseAndApply(true);

      Promise.resolve(applyResult)
        .catch(error => {
          console.error(
            '[FORGE Auto-Pilot] Automatic apply failed:',
            error
          );
        })
        .finally(() => {
          _autoPilotApplyInFlight = false;
        });
    } catch (error) {
      _autoPilotApplyInFlight = false;

      console.error(
        '[FORGE Auto-Pilot] Automatic apply threw:',
        error
      );
    }

    return;
  }

  const capturedStepNum = _getCapturedPendingStepNumber();
  const capturedStepPending =
    capturedStepNum !== null &&
    capturedStepNum > repo.lastProcessedStep;
  const shouldRetry =
    capturedStepPending ||
    waitForRender;

  if (shouldRetry && attempt < maxAttempts) {


    _autoPilotRetryTimer = setTimeout(() => {
      _autoPilotRetryTimer = null;
      _checkAndApply(attempt + 1, waitForRender);
    }, retryDelay);

    return;
  }

  if (capturedStepPending) {
    console.warn('[FORGE Auto-Pilot] Captured step ' +
      capturedStepNum +
      ' did not render after ' +
      maxAttempts +
      ' retries.'
    );
  } else if (waitForRender) {
    console.warn(
      '[FORGE Auto-Pilot] No newer rendered step appeared within ' +
      ((maxAttempts * retryDelay) / 1000) +
      ' seconds.',
      {
        renderedStepNum,
        capturedStepNum,
        lastProcessedStep: repo.lastProcessedStep
      }
    );
  } else {
    console.log(
      '[FORGE Auto-Pilot] No new steps found. Ignoring network signal.',
      {
        renderedStepNum,
        capturedStepNum,
        lastProcessedStep: repo.lastProcessedStep
      }
    );
  }
}
// FORGE CODE - Auto Sync
// Detects a running forge sync server on localhost:7331,
// polls for disk changes (toast + pull button), and pushes VFS after apply.
//
// Behavior:
//   Arm, VFS empty       ¡ú silent pull
//   Arm, VFS has files   ¡ú modal: pull / push / cancel
//   Disk change detected ¡ú toast with "Pull" button (no auto-pull)
//   Apply completes      ¡ú auto-push (debounced), toast confirmation
//   importProjectFromJSON called ¡ú disarm sync, toast

const AUTO_SYNC_PORT_KEY     = 'forge-sync-port';
const AUTO_SYNC_ARMED_KEY    = 'forge-sync-enabled';
const AUTO_SYNC_DEFAULT_PORT = 7331;
const PUSH_DEBOUNCE_MS       = 1000;
const POLL_MS                = 2000;

let _syncPort          = parseInt(localStorage.getItem(AUTO_SYNC_PORT_KEY) || '', 10) || AUTO_SYNC_DEFAULT_PORT;
let _pollInterval      = null;
let _lastRevision      = null;
let _pushDebounceTimer = null;
let _pendingPullToast  = null; // reference to dismiss active pull-toast

// ©¤©¤ Public API ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

function getSyncPort() { return _syncPort; }

function setSyncPort(port) {
  const p = parseInt(port, 10);
  if (p >= 1024 && p <= 65535) {
    _syncPort = p;
    console.log('[FORGE Sync] Port set to', _syncPort);
  }
}

function isSyncArmed() { return !!ForgeState.getState().syncArmed; }

/**
 * Called once on bookmarklet init. Detects server, restores armed state.
 */
async function initAutoSync() {
  // Read port from localStorage before first detection
  const savedPort = parseInt(localStorage.getItem(AUTO_SYNC_PORT_KEY) || '', 10);
  if (savedPort >= 1024 && savedPort <= 65535) _syncPort = savedPort;

  // Sync the port input if it exists
  const portInput = document.getElementById('forge-sync-port-input');
  if (portInput) portInput.value = _syncPort;

  const detected = await _detectServer();
  ForgeActions.setSyncConnected(detected);

  // Check if localhost fetches are even possible on this platform
  // (some platforms like ChatGPT block localhost entirely)
  if (!detected) {
    // Try a second time with a short delay in case the server is slow to start
    await new Promise(r => setTimeout(r, 1000));
    const retry = await _detectServer();
    if (!retry) {
      _markUnavailableIfBlocked();
      return;
    }
    ForgeActions.setSyncConnected(true);
  }

  // Restore armed state from localStorage ¡ª default is OFF (must be explicitly enabled)
  const wasArmed = localStorage.getItem(AUTO_SYNC_ARMED_KEY) === 'true';
  if (wasArmed) {
    await _armQuietly();
  }
}

/**
 * Re-run detection (called by the Reconnect button).
 */
async function retryAutoSyncDetection() {
  const portInput = document.getElementById('forge-sync-port-input');
  if (portInput) {
    const p = parseInt(portInput.value, 10);
    if (p >= 1024 && p <= 65535) _syncPort = p;
  }

  const detected = await _detectServer();
  ForgeActions.setSyncConnected(detected);

  const unavailableEl = document.getElementById('forge-sync-unavailable');
  if (unavailableEl) unavailableEl.style.display = 'none';

  if (detected) {
    if (typeof showToast === 'function') showToast('? Sync server found on port ' + _syncPort);
    if (typeof logToUI === 'function') logToUI('? Sync server found on port ' + _syncPort);
  } else {
    if (typeof showToast === 'function') showToast('? No sync server found on port ' + _syncPort, 3000);
    if (typeof logToUI === 'function') logToUI('? No sync server on port ' + _syncPort + ' ¡ª is forge sync running?');
  }
}

/**
 * If localhost fetches fail entirely (e.g. ChatGPT CSP), mark the feature
 * as unavailable rather than just offline.
 */
async function _markUnavailableIfBlocked() {
  // Try fetching a known-bad localhost URL ¡ª if it throws a TypeError (network
  // blocked) vs just a failed response, we know localhost is blocked entirely.
  try {
    await fetch('http://localhost:' + _syncPort + '/ping', { mode: 'cors' });
    // Got a response (even an error) ¡ª localhost works, server just not running
  } catch (e) {
    const isBlocked = e instanceof TypeError;
    if (isBlocked) {
      const unavailableEl = document.getElementById('forge-sync-unavailable');
      const checkbox = document.getElementById('forge-sync-checkbox');
      if (unavailableEl) unavailableEl.style.display = '';
      if (checkbox) checkbox.disabled = true;
      if (typeof logToUI === 'function') {
        logToUI('? Auto-sync unavailable on this platform (localhost blocked)');
      }
    }
  }
}

/**
 * Toggle from the UI checkbox.
 */
async function toggleAutoSync() {
  const state = ForgeState.getState();

  if (!state.syncConnected) {
    const detected = await _detectServer();
    ForgeActions.setSyncConnected(detected);
    if (!detected) {
      if (typeof showToast === 'function') showToast('? No sync server found ¡ª is forge sync running?', 3500);
      // Make sure checkbox stays unchecked
      _updateSyncCheckbox(false);
      return;
    }
  }

  if (state.syncArmed) {
    _stopPolling();
    ForgeActions.setSyncArmed(false);
    localStorage.setItem(AUTO_SYNC_ARMED_KEY, 'false');
    if (typeof showToast === 'function') showToast('? Auto-sync paused');
    if (typeof logToUI === 'function') logToUI('? Auto-sync paused');
  } else {
    await _armWithConflictCheck();
  }
}

/**
 * Called by parse-apply.js after _applyParsedBlocks() succeeds.
 */
function onApplyComplete() {
  if (!isSyncArmed()) return;
  if (!ForgeState.getState().syncConnected) return;

  if (_pushDebounceTimer) clearTimeout(_pushDebounceTimer);
  _pushDebounceTimer = setTimeout(async () => {
    _pushDebounceTimer = null;
    await _pushToDisk();
  }, PUSH_DEBOUNCE_MS);
}

/**
 * Called by importProjectFromJSON to disarm sync when a new project loads.
 */
function disarmSyncOnImport() {
  if (!isSyncArmed()) return;
  _stopPolling();
  ForgeActions.setSyncArmed(false);
  localStorage.setItem(AUTO_SYNC_ARMED_KEY, 'false');
  _updateSyncCheckbox(false);
  if (typeof showToast === 'function') showToast('? Auto-sync disarmed (new project imported)', 3000);
  if (typeof logToUI === 'function') logToUI('? Auto-sync disarmed ¡ª new project loaded via import');
}

/**
 * Manual pull button.
 */
async function manualSyncPull() {
  if (typeof logToUI === 'function') logToUI('? Manual pull from disk...');
  await _pullFromDisk();
}

/**
 * Manual push button.
 */
async function manualSyncPush() {
  if (typeof logToUI === 'function') logToUI('? Manual push to disk...');
  await _pushToDisk();
}

// ©¤©¤ Arm logic ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

async function _armQuietly() {
  const files = ForgeState.getState().files || {};
  const hasFiles = Object.keys(files).length > 0;

  _lastRevision = null;
  _startPolling();
  ForgeActions.setSyncArmed(true);
  localStorage.setItem(AUTO_SYNC_ARMED_KEY, 'true');

  if (!hasFiles) {
    // VFS empty ¡ª pull silently
    await _pullFromDisk();
  }
  // VFS has files ¡ª just start polling, no action (quiet restore)
}

async function _armWithConflictCheck() {
  const files = ForgeState.getState().files || {};
  const hasFiles = Object.keys(files).length > 0;

  if (!hasFiles) {
    // Empty VFS ¡ª pull silently, no confirmation needed
    _lastRevision = null;
    _startPolling();
    ForgeActions.setSyncArmed(true);
    localStorage.setItem(AUTO_SYNC_ARMED_KEY, 'true');
    if (typeof showToast === 'function') showToast('? Auto-sync enabled ¡ª pulling from disk...');
    if (typeof logToUI === 'function') logToUI('? Auto-sync armed (VFS empty, pulling from disk)');
    await _pullFromDisk();
    return;
  }

  // VFS has files ¡ª show conflict modal
  _showConflictModal(
    Object.keys(files).length,
    async () => {
      // Pull chosen
      _lastRevision = null;
      _startPolling();
      ForgeActions.setSyncArmed(true);
      localStorage.setItem(AUTO_SYNC_ARMED_KEY, 'true');
      if (typeof showToast === 'function') showToast('? Auto-sync enabled ¡ª pulling from disk...');
      await _pullFromDisk();
    },
    async () => {
      // Push chosen
      _lastRevision = null;
      _startPolling();
      ForgeActions.setSyncArmed(true);
      localStorage.setItem(AUTO_SYNC_ARMED_KEY, 'true');
      if (typeof showToast === 'function') showToast('? Auto-sync enabled ¡ª pushing to disk...');
      await _pushToDisk();
    },
    () => {
      // Cancel ¡ª leave everything as-is
      _updateSyncCheckbox(false);
      if (typeof showToast === 'function') showToast('? Auto-sync cancelled');
    }
  );
}

// ©¤©¤ Polling ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

function _startPolling() {
  _stopPolling();
  _pollInterval = setInterval(_pollStatus, POLL_MS);
  console.log('[FORGE Sync] Polling started');
}

function _stopPolling() {
  if (_pollInterval) { clearInterval(_pollInterval); _pollInterval = null; }
}

async function _pollStatus() {
  try {
    const res = await fetch('http://localhost:' + _syncPort + '/status', {
      method: 'GET', mode: 'cors'
    });

    if (!res.ok) { _handleDisconnect(); return; }

    const status = await res.json();

    // Re-mark connected in case we recovered
    if (!ForgeState.getState().syncConnected) {
      ForgeActions.setSyncConnected(true);
    }

    if (_lastRevision === null) {
      _lastRevision = status.revision;
      return;
    }

    if (status.revision !== _lastRevision) {
      console.log('[FORGE Sync] Disk revision changed:', _lastRevision, '¡ú', status.revision);
      _lastRevision = status.revision;
      _showPullToast();
    }

  } catch (e) {
    _handleDisconnect();
  }
}

function _handleDisconnect() {
  console.warn('[FORGE Sync] Server disconnected');
  _stopPolling();
  ForgeActions.setSyncConnected(false);
  if (typeof showToast === 'function') showToast('? Sync server disconnected', 3000);
  if (typeof logToUI === 'function') logToUI('? Sync disconnected ¡ª is forge sync still running?');
}

// ©¤©¤ Disk I/O ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

async function _pullFromDisk() {
  try {
    const res = await fetch('http://localhost:' + _syncPort + '/repo', {
      method: 'GET', mode: 'cors'
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const repoJson = await res.json();
    if (!repoJson || !Array.isArray(repoJson.files)) throw new Error('Invalid repo payload');

    if (typeof importProjectFromJSON === 'function') {
      // Pass a flag so importProjectFromJSON skips the disarmSyncOnImport call
      importProjectFromJSON(JSON.stringify(repoJson), true, true /* fromSync */);
    }

    if (typeof showToast === 'function') showToast('? Pulled from disk (' + repoJson.files.length + ' files)', 2500);
    if (typeof logToUI === 'function') logToUI('? Pulled from disk: ' + repoJson.files.length + ' file(s)');
  } catch (e) {
    console.error('[FORGE Sync] Pull failed:', e);
    if (typeof showToast === 'function') showToast('? Pull failed: ' + e.message, 4000);
    if (typeof logToUI === 'function') logToUI('? Pull failed: ' + e.message);
  }
}

async function _pushToDisk() {
  try {
    if (typeof repo === 'undefined') return;
    const repoJson = repo.toForgeJSON({ includeCodingPrompt: false });
    const res = await fetch('http://localhost:' + _syncPort + '/repo', {
      method: 'POST', mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(repoJson)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const result = await res.json();
    if (typeof showToast === 'function') showToast('? Pushed to disk (' + result.written + ' files)', 2500);
    if (typeof logToUI === 'function') logToUI('? Pushed to disk: ' + result.written + ' written, ' + result.skipped + ' skipped');
  } catch (e) {
    console.error('[FORGE Sync] Push failed:', e);
    if (typeof showToast === 'function') showToast('? Push failed: ' + e.message, 4000);
    if (typeof logToUI === 'function') logToUI('? Push failed: ' + e.message);
  }
}

// ©¤©¤ UI helpers ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

function _updateSyncCheckbox(checked) {
  const cb = document.getElementById('forge-sync-checkbox');
  if (cb) cb.checked = !!checked;
}

/**
 * Non-blocking toast with a "Pull now" button that appears when disk changes.
 * Dismissed automatically after 10s or when the user clicks Pull / dismisses.
 */
function _showPullToast() {
  // Dismiss any existing pull toast
  if (_pendingPullToast && _pendingPullToast.parentNode) {
    _pendingPullToast.parentNode.removeChild(_pendingPullToast);
  }

  const toast = document.createElement('div');
  toast.style.cssText = [
    'position:fixed', 'bottom:60px', 'left:50%',
    'transform:translateX(-50%)',
    'background:#1e2a1e', 'color:#d4d4d4',
    'border:1px solid #2a7a4a', 'border-radius:8px',
    'padding:10px 16px', 'font-size:12px',
    'font-family:Segoe UI,sans-serif',
    'z-index:2147483647',
    'display:flex', 'align-items:center', 'gap:10px',
    'box-shadow:0 4px 16px rgba(0,0,0,0.4)',
    'white-space:nowrap'
  ].join(';');

  const msg = document.createElement('span');
  msg.textContent = '? Files changed on disk';

  const pullBtn = document.createElement('button');
  pullBtn.textContent = 'Pull now';
  pullBtn.style.cssText = 'background:#1a7a3a;border:none;color:#fff;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:11px;font-weight:600;';

  const dismissBtn = document.createElement('button');
  dismissBtn.textContent = '?';
  dismissBtn.style.cssText = 'background:transparent;border:none;color:#858585;cursor:pointer;font-size:14px;padding:0 2px;';

  const dismiss = () => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
    _pendingPullToast = null;
  };

  pullBtn.addEventListener('click', () => {
    dismiss();
    _pullFromDisk();
  });
  dismissBtn.addEventListener('click', dismiss);

  toast.appendChild(msg);
  toast.appendChild(pullBtn);
  toast.appendChild(dismissBtn);
  document.body.appendChild(toast);
  _pendingPullToast = toast;

  // Auto-dismiss after 10s
  setTimeout(dismiss, 10000);

  if (typeof logToUI === 'function') logToUI('? Disk change detected ¡ª click "Pull now" to sync');
}

/**
 * Modal shown when arming sync with existing VFS content.
 */
function _showConflictModal(localFileCount, onPull, onPush, onCancel) {
  const existing = document.getElementById('forge-sync-conflict-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'forge-sync-conflict-modal';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:10010',
    'background:rgba(0,0,0,0.75)',
    'display:flex', 'align-items:center', 'justify-content:center',
    'font-family:Segoe UI,sans-serif'
  ].join(';');

  const dialog = document.createElement('div');
  dialog.style.cssText = [
    'background:#252526', 'border:2px solid #2a7a4a',
    'border-radius:10px', 'padding:24px 28px',
    'width:420px', 'max-width:90vw',
    'box-shadow:0 8px 32px rgba(0,0,0,0.5)',
    'color:#d4d4d4'
  ].join(';');

  const title = document.createElement('div');
  title.style.cssText = 'font-size:15px;font-weight:600;margin-bottom:10px;color:#4caf50;';
  title.textContent = '? Auto-sync: conflict detected';

  const body = document.createElement('div');
  body.style.cssText = 'font-size:13px;color:#a0a0a0;margin-bottom:20px;line-height:1.6;';
  body.textContent = 'Your VFS has ' + localFileCount + ' file(s) loaded. The sync server also has files on disk. What would you like to do?';

  const btns = document.createElement('div');
  btns.style.cssText = 'display:flex;flex-direction:column;gap:8px;';

  const mkBtn = (label, desc, bg, fn) => {
    const b = document.createElement('button');
    b.style.cssText = 'background:' + bg + ';border:none;color:#fff;padding:10px 14px;border-radius:6px;cursor:pointer;text-align:left;font-size:12px;font-family:Segoe UI,sans-serif;';
    setForgeHTML(b, '<strong>' + label + '</strong><br><span style="opacity:0.7;font-size:11px;">' + desc + '</span>');
    b.addEventListener('click', () => { overlay.remove(); fn(); });
    return b;
  };

  btns.appendChild(mkBtn('¡ý Pull from disk', 'Replace VFS with disk files (disk wins)', '#0e639c', onPull));
  btns.appendChild(mkBtn('¡ü Push to disk', 'Overwrite disk files with VFS (browser wins)', '#1a7a3a', onPush));
  btns.appendChild(mkBtn('? Cancel', 'Keep both unchanged, do not enable sync yet', '#3e3e42', onCancel));

  dialog.appendChild(title);
  dialog.appendChild(body);
  dialog.appendChild(btns);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
}

// ©¤©¤ Server + polling ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

async function _detectServer() {
  try {
    const res = await fetch('http://localhost:' + _syncPort + '/ping', {
      method: 'GET', mode: 'cors'
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!(data && data.ok);
  } catch (e) {
    return false;
  }
}

function _startPolling() {
  _stopPolling();
  _pollInterval = setInterval(_pollStatus, POLL_MS);
  console.log('[FORGE Sync] Polling started');
}

function _stopPolling() {
  if (_pollInterval) { clearInterval(_pollInterval); _pollInterval = null; }
}

async function _pollStatus() {
  try {
    const res = await fetch('http://localhost:' + _syncPort + '/status', {
      method: 'GET', mode: 'cors'
    });
    if (!res.ok) { _handleDisconnect(); return; }

    const status = await res.json();

    if (!ForgeState.getState().syncConnected) {
      ForgeActions.setSyncConnected(true);
    }

    if (_lastRevision === null) {
      _lastRevision = status.revision;
      return;
    }

    if (status.revision !== _lastRevision) {
      console.log('[FORGE Sync] Disk revision changed:', _lastRevision, '¡ú', status.revision);
      _lastRevision = status.revision;
      _showPullToast();
    }
  } catch (e) {
    _handleDisconnect();
  }
}

function _handleDisconnect() {
  console.warn('[FORGE Sync] Server disconnected');
  _stopPolling();
  ForgeActions.setSyncConnected(false);
  if (typeof showToast === 'function') showToast('? Sync server disconnected', 3000);
  if (typeof logToUI === 'function') logToUI('? Sync disconnected ¡ª is forge sync still running?');
}

async function _pullFromDisk() {
  try {
    const res = await fetch('http://localhost:' + _syncPort + '/repo', {
      method: 'GET', mode: 'cors'
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const repoJson = await res.json();
    if (!repoJson || !Array.isArray(repoJson.files)) throw new Error('Invalid repo payload');

    if (typeof importProjectFromJSON === 'function') {
      importProjectFromJSON(JSON.stringify(repoJson), true, true /* fromSync */);
    }

    // Save pulled state to IndexedDB so it survives a page refresh
    if (typeof saveWorkspaceState === 'function') {
      saveWorkspaceState().then(() => {
        if (typeof updateSessionsCount === 'function') updateSessionsCount();
      });
    }

    if (typeof showToast === 'function') showToast('? Pulled from disk (' + repoJson.files.length + ' files)', 2500);
    if (typeof logToUI === 'function') logToUI('? Pulled from disk: ' + repoJson.files.length + ' file(s)');
  } catch (e) {
    console.error('[FORGE Sync] Pull failed:', e);
    if (typeof showToast === 'function') showToast('? Pull failed: ' + e.message, 4000);
    if (typeof logToUI === 'function') logToUI('? Pull failed: ' + e.message);
  }
}

async function _pushToDisk() {
  try {
    if (typeof repo === 'undefined') return;
    const repoJson = repo.toForgeJSON({ includeCodingPrompt: false });
    const res = await fetch('http://localhost:' + _syncPort + '/repo', {
      method: 'POST', mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(repoJson)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const result = await res.json();
    if (typeof showToast === 'function') showToast('? Pushed to disk (' + result.written + ' files)', 2500);
    if (typeof logToUI === 'function') logToUI('? Pushed to disk: ' + result.written + ' written, ' + result.skipped + ' skipped');
  } catch (e) {
    console.error('[FORGE Sync] Push failed:', e);
    if (typeof showToast === 'function') showToast('? Push failed: ' + e.message, 4000);
    if (typeof logToUI === 'function') logToUI('? Push failed: ' + e.message);
  }
}
// FORGE Code - GitLab Import Feature
// Allows importing a GitLab repository into the VFS via the GitLab REST API.
// PAT and instance URL are stored in localStorage.
//
// localStorage keys:
//   forge-gitlab-url   ¡ª GitLab instance base URL (e.g. https://git.fda.gov)
//   forge-gitlab-pat   ¡ª Personal Access Token (read_api scope minimum)

const GITLAB_URL_KEY = 'forge-gitlab-url';
const GITLAB_PAT_KEY = 'forge-gitlab-pat';
const GITLAB_DEFAULT_URL = 'https://git.fda.gov';
const GITLAB_PAGE_SIZE = 8;

// ©¤©¤ Credential helpers ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

function gitlabGetCredentials() {
  return {
    url: localStorage.getItem(GITLAB_URL_KEY) || GITLAB_DEFAULT_URL,
    pat: localStorage.getItem(GITLAB_PAT_KEY) || ''
  };
}

function gitlabSaveCredentials(url, pat) {
  const trimmedUrl = (url || '').replace(/\/+$/, '').trim();
  const trimmedPat = (pat || '').trim();
  if (trimmedUrl) localStorage.setItem(GITLAB_URL_KEY, trimmedUrl);
  if (trimmedPat) localStorage.setItem(GITLAB_PAT_KEY, trimmedPat);
  return { url: trimmedUrl, pat: trimmedPat };
}

// ©¤©¤ API helpers ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

/**
 * Try a fetch, fall back to the IDE bridge if it throws (CORS/CSP block).
 * Returns a Response-like object in both cases.
 */
async function _gitlabFetch(fullUrl, headers) {
  try {
    const resp = await fetch(fullUrl, { headers });
    return resp;
  } catch (e) {
    // Likely a CORS or CSP block ¡ª try the IDE bridge proxy
    if (typeof forgeIdeBridge !== 'undefined') {
      console.log('[GitLab] Direct fetch failed, trying IDE bridge proxy:', e.message);
      const bridgeResp = await forgeIdeBridge.fetch(fullUrl, { headers });
      // Bridge returns a plain object; wrap it so .json() and .text() work
      // and so callers can check .ok / .status as normal
      return bridgeResp;
    }
    throw e;
  }
}

async function gitlabApiFetch(path, params = {}) {
  const { url, pat } = gitlabGetCredentials();
  if (!pat) throw new Error('No GitLab PAT configured. Enter your token in the GitLab settings.');

  const qs = Object.keys(params).length
    ? '?' + new URLSearchParams(params).toString()
    : '';

  const fullUrl = url + '/api/v4' + path + qs;
  const headers = { 'PRIVATE-TOKEN': pat, 'Accept': 'application/json' };

  const response = await _gitlabFetch(fullUrl, headers);

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`GitLab API error ${response.status}: ${text.slice(0, 200)}`);
  }

  // Bridge response already has .json() but it's sync; native fetch .json() is async.
  // Normalise: always return the parsed object.
  const data = typeof response.json === 'function' ? await response.json() : response.json();
  return data;
}

async function gitlabApiFetchRaw(path, params = {}) {
  const { url, pat } = gitlabGetCredentials();
  if (!pat) throw new Error('No GitLab PAT configured.');

  const qs = Object.keys(params).length
    ? '?' + new URLSearchParams(params).toString()
    : '';

  const fullUrl = url + '/api/v4' + path + qs;
  const response = await _gitlabFetch(fullUrl, { 'PRIVATE-TOKEN': pat });

  if (!response.ok) {
    throw new Error(`GitLab API error ${response.status}`);
  }

  // Raw callers do arrayBuffer() on the response ¡ª bridge gives us .body as text,
  // so we need to wrap it into a real Response if it came via bridge.
  if (response.body !== undefined && typeof response.arrayBuffer !== 'function') {
    // It's a bridge response object ¡ª wrap in a real Response
    return new Response(response.body, { status: response.status, headers: response.headers });
  }

  return response;
}

// ©¤©¤ Project search ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

async function gitlabSearchProjects(query, page = 1) {
  const params = {
    per_page: GITLAB_PAGE_SIZE,
    page,
    order_by: 'last_activity_at',
    sort: 'desc'
  };
  if (query.trim()) {
    params.search = query;
  } else {
    params.membership = true;
  }
  return gitlabApiFetch('/projects', params);
}

// ©¤©¤ Branch listing ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

async function gitlabGetBranches(projectId) {
  return gitlabApiFetch(`/projects/${encodeURIComponent(projectId)}/repository/branches`, {
    per_page: 100
  });
}

// ©¤©¤ File tree + import ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

/**
 * Fetch the file tree for a project, optionally scoped to a subfolder path.
 * GitLab paginates; we gather all pages.
 */
async function gitlabGetFileTree(projectId, ref, subfolderPath) {
  const allItems = [];
  let page = 1;
  const params = { ref, recursive: true, per_page: 100, page };
  if (subfolderPath && subfolderPath.trim()) {
    params.path = subfolderPath.trim().replace(/^\/+|\/+$/g, '');
  }
  while (true) {
    params.page = page;
    const items = await gitlabApiFetch(
      `/projects/${encodeURIComponent(projectId)}/repository/tree`,
      params
    );
    if (!items || items.length === 0) break;
    allItems.push(...items);
    if (items.length < 100) break;
    page++;
  }
  return allItems;
}

/**
 * Parse .forgeignore content into an array of glob patterns.
 */
function parseForgeignore(content) {
  if (!content) return [];
  return content
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));
}

/**
 * Import a GitLab project into the VFS.
 *
 * @param {number|string} projectId    - GitLab project ID
 * @param {string}        ref          - Branch / tag / commit ref
 * @param {string}        projectName  - Human-readable name for project title
 * @param {string}        subfolderPath - Optional subfolder to restrict import
 * @param {function}      onProgress   - Called with (message) during import
 */
async function gitlabImportProject(projectId, ref, projectName, subfolderPath, onProgress) {
  const report = msg => {
    if (typeof onProgress === 'function') onProgress(msg);
    if (typeof logToUI === 'function') logToUI(msg);
  };

  const folderNote = subfolderPath ? ` (subfolder: ${subfolderPath})` : '';
  report(`?? Fetching file tree for "${projectName}" @ ${ref}${folderNote}¡­`);

  // Step 1: get full file tree (scoped to subfolder if provided)
  const tree = await gitlabGetFileTree(projectId, ref, subfolderPath);
  const blobs = tree.filter(item => item.type === 'blob');

  report(`?? Found ${blobs.length} file(s) in tree`);

  // Step 2: check for .forgeignore (always at repo root, regardless of subfolder)
  let ignorePatterns = [];
  try {
    const ignoreResp = await gitlabApiFetchRaw(
      `/projects/${encodeURIComponent(projectId)}/repository/files/${encodeURIComponent('.forgeignore')}/raw`,
      { ref }
    );
    const ignoreContent = await ignoreResp.text();
    ignorePatterns = parseForgeignore(ignoreContent);
    if (ignorePatterns.length > 0) {
      report(`?? ${ignorePatterns.length} ignore pattern(s) from .forgeignore`);
    }
  } catch (e) {
    // No .forgeignore present ¡ª that's fine
  }

  // Step 3: filter files against ignore patterns
  const filesToFetch = blobs.filter(blob => {
    const filePath = '/' + blob.path;
    if (ignorePatterns.length === 0) return true;
    if (typeof matchesAnyPattern === 'function') {
      return !matchesAnyPattern(filePath, ignorePatterns);
    }
    return !ignorePatterns.some(pat => {
      const simplified = pat.replace(/^\*\*\//, '').replace(/^\*\//, '');
      return filePath.endsWith('/' + simplified) || filePath === '/' + simplified;
    });
  });

  const ignoredCount = blobs.length - filesToFetch.length;
  if (ignoredCount > 0) {
    report(`?? Skipping ${ignoredCount} file(s) matched by .forgeignore`);
  }

  report(`?? Fetching ${filesToFetch.length} file(s)¡­`);

  // Step 4: fetch each file
  const nextFiles = {};
  const nextFileMeta = {};
  let loaded = 0;
  let binaryCount = 0;
  let errorCount = 0;

  const BATCH = 5;
  for (let i = 0; i < filesToFetch.length; i += BATCH) {
    const batch = filesToFetch.slice(i, i + BATCH);
    await Promise.all(batch.map(async blob => {
      const vfsPath = '/' + blob.path;
      try {
        const resp = await gitlabApiFetchRaw(
          `/projects/${encodeURIComponent(projectId)}/repository/files/${encodeURIComponent(blob.path)}/raw`,
          { ref }
        );
        const arrayBuf = await resp.arrayBuffer();
        const bytes = new Uint8Array(arrayBuf);

        let isBinary = false;
        const checkLen = Math.min(1024, bytes.length);
        for (let j = 0; j < checkLen; j++) {
          if (bytes[j] === 0) { isBinary = true; break; }
        }

        if (isBinary) {
          let binary = '';
          for (let j = 0; j < bytes.length; j++) {
            binary += String.fromCharCode(bytes[j]);
          }
          nextFiles[vfsPath] = btoa(binary);
          nextFileMeta[vfsPath] = { encoding: 'base64' };
          binaryCount++;
        } else {
          const text = new TextDecoder('utf-8').decode(bytes);
          nextFiles[vfsPath] = typeof repo !== 'undefined'
            ? repo._processContent(vfsPath, text)
            : text;
        }
        loaded++;
      } catch (e) {
        errorCount++;
        report(`?? Skipped ${vfsPath}: ${e.message}`);
      }
    }));

    if (i + BATCH < filesToFetch.length) {
      report(`?? Fetched ${Math.min(i + BATCH, filesToFetch.length)} / ${filesToFetch.length}¡­`);
    }
  }

  // Step 5: load into VFS
  const versions = [{
    step: 0,
    changes: [],
    snapshot: JSON.parse(JSON.stringify(nextFiles)),
    metaSnapshot: JSON.parse(JSON.stringify(nextFileMeta))
  }];

  if (typeof ForgeActions !== 'undefined') {
    ForgeActions.replaceRepository({
      files: nextFiles,
      fileMeta: nextFileMeta,
      projectTitle: projectName,
      currentStep: 0,
      lastProcessedStep: 0,
      versions
    });
  }

  const parts = [`? Imported ${loaded} file(s) from GitLab as "${projectName}"`];
  if (binaryCount > 0) parts.push(`${binaryCount} binary`);
  if (ignoredCount > 0) parts.push(`${ignoredCount} ignored`);
  if (errorCount > 0) parts.push(`${errorCount} error(s)`);

  const summary = parts.join(' ¡¤ ');
  report(summary);

  if (typeof saveWorkspaceState === 'function') saveWorkspaceState();

  return { loaded, binaryCount, ignoredCount, errorCount, summary };
}

// ©¤©¤ Shared UI helpers (used by both import and push modals) ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

function makeSkeleton(count) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:4px;';
  for (let i = 0; i < count; i++) {
    const row = document.createElement('div');
    row.style.cssText = [
      'height:44px', 'border-radius:5px',
      'background:linear-gradient(90deg,#2a2a2a 25%,#333 50%,#2a2a2a 75%)',
      'background-size:200% 100%',
      'animation:forge-shimmer 1.2s infinite linear',
      'border:1px solid #3e3e42'
    ].join(';');
    wrap.appendChild(row);
  }
  if (!document.getElementById('forge-shimmer-style')) {
    const st = document.createElement('style');
    st.id = 'forge-shimmer-style';
    st.textContent = '@keyframes forge-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}';
    document.head.appendChild(st);
  }
  return wrap;
}

// ©¤©¤ Push to GitLab ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

const GITLAB_LAST_PROJECT_KEY = 'forge-gitlab-last-project';

function gitlabSaveLastProject(project) {
  try {
    localStorage.setItem(GITLAB_LAST_PROJECT_KEY, JSON.stringify({
      id: project.id,
      path_with_namespace: project.path_with_namespace,
      name: project.name,
      path: project.path,
      default_branch: project.default_branch
    }));
  } catch(e) {}
}

function gitlabGetLastProject() {
  try {
    const raw = localStorage.getItem(GITLAB_LAST_PROJECT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(e) { return null; }
}

function defaultPushBranchName() {
  const ts = new Date().toISOString().slice(0,16).replace(/[-:T]/g,'').slice(0,12);
  return 'forge/changes-' + ts;
}

/**
 * Push the current VFS to GitLab.
 * @param {object} project       - GitLab project object (id, path_with_namespace, default_branch)
 * @param {string} sourceBranch  - Branch to branch from / target for MR
 * @param {string} targetBranch  - Branch to commit to
 * @param {string} branchMode    - 'new' | 'existing'
 * @param {string} commitMessage
 * @param {object} mrOptions     - { open, title, description } or null
 * @param {function} onProgress  - Called with (message) during push
 */
async function gitlabPushProject(project, sourceBranch, targetBranch, branchMode, commitMessage, mrOptions, onProgress) {
  const report = msg => {
    if (typeof onProgress === 'function') onProgress(msg);
    if (typeof logToUI === 'function') logToUI(msg);
  };

  const { url } = gitlabGetCredentials();
  const apiBase = url + '/api/v4/projects/' + encodeURIComponent(project.id);

  // Step 1: verify existing branch or create new one (skip entirely for brand-new repos)
  if (project._newRepo) {
    report('? New repo ¡ª branch will be created with first commit');
  } else if (branchMode === 'existing') {
    report('?? Verifying branch "' + targetBranch + '" exists¡­');
    const checkRes = await gitlabApiFetch(
      '/projects/' + encodeURIComponent(project.id) + '/repository/branches/' + encodeURIComponent(targetBranch)
    );
    // If it throws, error propagates up
    report('? Branch exists');
  } else if (!project._newRepo) {
    report('?? Creating branch "' + targetBranch + '" from "' + sourceBranch + '"¡­');
    const { url: glUrl, pat } = gitlabGetCredentials();
    const brRes = await fetch(glUrl + '/api/v4/projects/' + encodeURIComponent(project.id) + '/repository/branches', {
      method: 'POST',
      headers: { 'PRIVATE-TOKEN': pat, 'Content-Type': 'application/json' },
      body: JSON.stringify({ branch: targetBranch, ref: sourceBranch })
    });
    if (!brRes.ok) {
      const e = await brRes.json().catch(() => ({}));
      if (brRes.status === 409) {
        throw new Error('Branch "' + targetBranch + '" already exists. Use "existing branch" mode or choose a different name.');
      }
      throw new Error('Could not create branch: ' + (e.message || brRes.status));
    }
    report('? Branch created');
  }

  // Step 2: fetch remote tree (or skip for new repos) to know create vs update (skip for brand-new repos)
  const remotePaths = new Set();
  if (!project._newRepo) {
    report('?? Fetching remote file list from "' + sourceBranch + '"¡­');
    try {
      let page = 1;
      while (true) {
        const items = await gitlabApiFetch(
          '/projects/' + encodeURIComponent(project.id) + '/repository/tree',
          { ref: sourceBranch, recursive: true, per_page: 100, page }
        );
        if (!items || items.length === 0) break;
        items.filter(i => i.type === 'blob').forEach(i => remotePaths.add('/' + i.path));
        if (items.length < 100) break;
        page++;
      }
      report('? Remote has ' + remotePaths.size + ' file(s)');
    } catch(e) {
      report('?? Could not fetch remote tree ¡ª all files will be created: ' + e.message);
    }
  } else {
    report('? New repo ¡ª all files will be created');
  }

  // Step 3: build commit actions from VFS
  report('?? Building commit actions¡­');
  const vfsFiles = typeof repo !== 'undefined' ? repo.files : {};
  const vfsFileMeta = typeof repo !== 'undefined' ? repo.fileMeta : {};
  const actions = [];

  for (const [vfsPath, content] of Object.entries(vfsFiles)) {
    const meta = vfsFileMeta[vfsPath] || {};
    if (meta.excluded) continue;

    const filePath = vfsPath.startsWith('/') ? vfsPath.slice(1) : vfsPath;
    const action = remotePaths.has(vfsPath) ? 'update' : 'create';
    const encoding = meta.encoding === 'base64' ? 'base64' : 'text';
    actions.push({ action, file_path: filePath, content: content || '', encoding });
  }

  if (actions.length === 0) {
    throw new Error('No files to push ¡ª VFS is empty or all files are excluded stubs.');
  }

  report('?? Committing ' + actions.length + ' file(s) to "' + targetBranch + '"¡­');

  // Step 4: commit
  const { url: glUrl2, pat: pat2 } = gitlabGetCredentials();
  const commitRes = await fetch(glUrl2 + '/api/v4/projects/' + encodeURIComponent(project.id) + '/repository/commits', {
    method: 'POST',
    headers: { 'PRIVATE-TOKEN': pat2, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      branch: targetBranch,
      commit_message: commitMessage,
      actions
    })
  });

  if (!commitRes.ok) {
    const e = await commitRes.json().catch(() => ({}));
    const msg = (e.message || '').toLowerCase();
    if (commitRes.status === 403) throw new Error('Permission denied ¡ª check your PAT has write access.');
    if (msg.includes('nothing to commit')) throw new Error('No changes detected ¡ª remote is already up to date.');
    throw new Error('Commit failed: ' + (e.message || commitRes.status));
  }

  const commitData = await commitRes.json();
  report('? Committed ' + actions.length + ' file(s) ¡ª ' + commitData.short_id);

  const created = actions.filter(a => a.action === 'create').length;
  const updated = actions.filter(a => a.action === 'update').length;
  report('  ' + created + ' created ¡¤ ' + updated + ' updated');

  // Step 5: open MR if requested
  let mrUrl = null;
  if (mrOptions && mrOptions.open) {
    report('?? Creating merge request¡­');
    try {
      const { url: glUrl3, pat: pat3 } = gitlabGetCredentials();
      const mrRes = await fetch(glUrl3 + '/api/v4/projects/' + encodeURIComponent(project.id) + '/merge_requests', {
        method: 'POST',
        headers: { 'PRIVATE-TOKEN': pat3, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_branch: targetBranch,
          target_branch: sourceBranch,
          title: mrOptions.title || (targetBranch + ' ¡ú ' + sourceBranch),
          description: mrOptions.description || '',
          remove_source_branch: true
        })
      });
      if (mrRes.ok) {
        const mrData = await mrRes.json();
        mrUrl = mrData.web_url;
        report('? MR created: ' + mrUrl);
      } else {
        report('?? MR could not be created (' + mrRes.status + ')');
      }
    } catch(e) {
      report('?? MR error: ' + e.message);
    }
  }

  return {
    commitId: commitData.short_id,
    branch: targetBranch,
    fileCount: actions.length,
    created,
    updated,
    mrUrl
  };
}

// ©¤©¤ Push modal ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

/**
 * Read the [gitlab] section from /.forgeconfig in the VFS (if present)
 * and return a project-like object suitable for pre-populating the push modal.
 * Returns null if not found or incomplete.
 */
function gitlabReadForgeConfig() {
  try {
    if (typeof repo === 'undefined' || !repo.fileExists('/.forgeconfig')) return null;
    const content = repo.getContent('/.forgeconfig').text();
    const section = {};
    let inGitlab = false;
    for (const raw of content.split('\n')) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      if (line === '[gitlab]') { inGitlab = true; continue; }
      if (line.startsWith('[')) { inGitlab = false; continue; }
      if (inGitlab && line.includes('=')) {
        const eq = line.indexOf('=');
        const k = line.slice(0, eq).trim();
        const v = line.slice(eq + 1).trim();
        section[k] = v;
      }
    }
    if (!section.project_id || !section.project_path) return null;
    // Build a project-like object matching what the push modal expects
    const project = {
      id: parseInt(section.project_id, 10) || section.project_id,
      path_with_namespace: section.project_path,
      name: section.project_path.split('/').pop(),
      path: section.project_path.split('/').pop(),
      default_branch: section.default_branch || 'main',
      _sourceBranch: section.source_branch || section.default_branch || 'main',
      _instanceUrl: section.instance_url || null
    };
    return project;
  } catch(e) {
    return null;
  }
}

/**
 * If /.forgeconfig has a [gitlab] section with a different instance_url,
 * temporarily override the stored URL so API calls go to the right server.
 * Returns a restore function to call when done.
 */
function gitlabApplyForgeConfigUrl(project) {
  if (!project || !project._instanceUrl) return () => {};
  const current = localStorage.getItem(GITLAB_URL_KEY);
  const configUrl = project._instanceUrl.replace(/\/+$/, '');
  if (configUrl && configUrl !== current) {
    localStorage.setItem(GITLAB_URL_KEY, configUrl);
    return () => {
      if (current) localStorage.setItem(GITLAB_URL_KEY, current);
      else localStorage.removeItem(GITLAB_URL_KEY);
    };
  }
  return () => {};
}

function showGitLabPushModal() {
  const existing = document.getElementById('forge-gitlab-push-modal');
  if (existing) existing.remove();

  const { pat } = gitlabGetCredentials();

  const overlay = document.createElement('div');
  overlay.id = 'forge-gitlab-push-modal';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:10010',
    'background:rgba(0,0,0,0.85)',
    'display:flex', 'align-items:center', 'justify-content:center',
    'font-family:Segoe UI,sans-serif'
  ].join(';');

  const dialog = document.createElement('div');
  dialog.style.cssText = [
    'background:#252526', 'border:2px solid #1a7a3a',
    'border-radius:10px',
    'width:520px', 'max-width:95vw', 'height:520px', 'max-height:92vh',
    'display:flex', 'flex-direction:column',
    'box-shadow:0 8px 32px rgba(0,0,0,0.5)', 'overflow:hidden'
  ].join(';');

  const header = document.createElement('div');
  header.style.cssText = 'padding:13px 18px;border-bottom:1px solid #3e3e42;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;';
  const titleEl = document.createElement('span');
  titleEl.style.cssText = 'font-size:14px;font-weight:600;color:#d4d4d4;';
  titleEl.textContent = '?? Push to GitLab';
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '¡Á';
  closeBtn.style.cssText = 'background:none;border:none;color:#858585;font-size:20px;cursor:pointer;padding:0 4px;line-height:1;';
  closeBtn.onclick = () => overlay.remove();
  header.appendChild(titleEl);
  header.appendChild(closeBtn);

  const body = document.createElement('div');
  body.style.cssText = 'flex:1;overflow-y:auto;padding:14px 18px;display:flex;flex-direction:column;gap:10px;min-height:0;';

  const footer = document.createElement('div');
  footer.style.cssText = 'padding:11px 18px;border-top:1px solid #3e3e42;display:flex;gap:8px;justify-content:flex-end;flex-shrink:0;';

  dialog.appendChild(header);
  dialog.appendChild(body);
  dialog.appendChild(footer);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  // Shared helpers (same as import modal)
  function makeLabel(text, forId) {
    const l = document.createElement('label');
    l.textContent = text;
    l.style.cssText = 'font-size:10px;color:#858585;text-transform:uppercase;letter-spacing:.05em;font-weight:600;margin-bottom:2px;display:block;';
    if (forId) l.htmlFor = forId;
    return l;
  }
  function makeInput(placeholder, value) {
    const i = document.createElement('input');
    i.type = 'text';
    i.placeholder = placeholder;
    i.value = value || '';
    i.style.cssText = 'width:100%;background:#1e1e1e;border:1px solid #3e3e42;border-radius:4px;color:#d4d4d4;font-size:13px;padding:7px 10px;box-sizing:border-box;font-family:Consolas,monospace;';
    return i;
  }
  function makeBtn(label, primary, color) {
    const b = document.createElement('button');
    b.textContent = label;
    const bg = color || (primary ? '#1a7a3a' : '#3e3e42');
    b.style.cssText = [
      'border:none', 'border-radius:4px', 'padding:7px 16px',
      'font-size:12px', 'font-weight:600', 'cursor:pointer',
      'font-family:Segoe UI,sans-serif',
      'background:' + bg + ';color:' + (primary ? '#fff' : '#d4d4d4') + ';'
    ].join(';');
    return b;
  }
  function makeStatus() {
    const s = document.createElement('div');
    s.style.cssText = 'font-size:11px;color:#858585;min-height:16px;';
    return s;
  }

  // ©¤©¤ Credentials screen (shared with import, but leads back to push) ©¤©¤©¤©¤©¤©¤©¤©¤
  function renderPushCredentials() {
    body.textContent = '';
    footer.textContent = '';
    titleEl.textContent = '?? Push ¡ª Credentials';

    const { url, pat: existingPat } = gitlabGetCredentials();

    const urlGroup = document.createElement('div');
    urlGroup.appendChild(makeLabel('GitLab Instance URL', 'gl-push-url'));
    const urlInput = makeInput('https://git.fda.gov', url);
    urlInput.id = 'gl-push-url';
    urlGroup.appendChild(urlInput);

    const patGroup = document.createElement('div');
    patGroup.appendChild(makeLabel('Personal Access Token (read_api + write_repository)', 'gl-push-pat'));
    const patInput = document.createElement('input');
    patInput.type = 'password';
    patInput.placeholder = 'glpat-¡­';
    patInput.value = existingPat || '';
    patInput.id = 'gl-push-pat';
    patInput.style.cssText = urlInput.style.cssText;
    patGroup.appendChild(patInput);

    const hint = document.createElement('div');
    hint.style.cssText = 'font-size:11px;color:#555;line-height:1.5;';
    setForgeHTML(hint, 'Token needs <code style="background:#1e1e1e;padding:1px 4px;border-radius:3px;">read_api</code> + <code style="background:#1e1e1e;padding:1px 4px;border-radius:3px;">write_repository</code> scopes for pushing.');

    const status = document.createElement('div');
    status.style.cssText = 'font-size:11px;color:#858585;min-height:16px;';

    body.appendChild(urlGroup);
    body.appendChild(patGroup);
    body.appendChild(hint);
    body.appendChild(status);

    const cancelBtn = makeBtn('Cancel');
    cancelBtn.onclick = () => overlay.remove();
    const connectBtn = makeBtn('Connect ¡ú', true);

    connectBtn.onclick = async () => {
      const savedUrl = urlInput.value.trim().replace(/\/+$/, '') || GITLAB_DEFAULT_URL;
      const savedPat = patInput.value.trim();
      if (!savedPat) { status.textContent = '?? PAT is required'; status.style.color = '#f44336'; return; }
      gitlabSaveCredentials(savedUrl, savedPat);
      connectBtn.disabled = true;
      connectBtn.textContent = 'Connecting¡­';
      status.style.color = '#858585';
      status.textContent = 'Verifying¡­';
      try {
        await gitlabApiFetch('/user');
        renderProjectPicker();
      } catch(e) {
        status.textContent = '? ' + e.message;
        status.style.color = '#f44336';
        connectBtn.disabled = false;
        connectBtn.textContent = 'Connect ¡ú';
      }
    };

    footer.appendChild(cancelBtn);
    footer.appendChild(connectBtn);
  }

  // ©¤©¤ State ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  let selectedProject = gitlabGetLastProject();
  let lastSearchQuery = '';
  let currentPage = 1;

  // Check for .forgeconfig project ¡ª highest priority default
  const forgeConfigProject = gitlabReadForgeConfig();

  // ©¤©¤ Step 1: Project picker (or use last) ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  function renderProjectPicker() {
    body.textContent = '';
    footer.textContent = '';
    titleEl.textContent = '?? Push ¡ª Select Repository';

    // Priority: .forgeconfig > last used > search
    const suggestedProject = forgeConfigProject || gitlabGetLastProject();

    if (suggestedProject) {
      const isFromConfig = !!forgeConfigProject;

      const box = document.createElement('div');
      box.style.cssText = 'background:#1a2a1a;border:1px solid #2a5a2a;border-radius:6px;padding:10px 12px;';

      const boxTitle = document.createElement('div');
      boxTitle.style.cssText = 'font-size:10px;color:#858585;text-transform:uppercase;letter-spacing:.05em;font-weight:600;margin-bottom:4px;';
      boxTitle.textContent = isFromConfig ? '?? From .forgeconfig' : 'Last used repository';

      const boxName = document.createElement('div');
      boxName.style.cssText = 'font-size:13px;font-weight:600;color:#4fc3f7;';
      boxName.textContent = '?? ' + suggestedProject.path_with_namespace;

      const boxMeta = document.createElement('div');
      boxMeta.style.cssText = 'font-size:11px;color:#858585;margin-top:2px;';
      const sourceBranch = suggestedProject._sourceBranch || suggestedProject.default_branch || 'unknown';
      boxMeta.textContent = 'Branch: ' + sourceBranch + (isFromConfig ? ' ¡¤ auto-detected from project config' : '');

      box.appendChild(boxTitle);
      box.appendChild(boxName);
      box.appendChild(boxMeta);
      body.appendChild(box);

      const altRow = document.createElement('div');
      altRow.style.cssText = 'display:flex;gap:6px;margin-top:4px;';
      const changeBtn = makeBtn('Choose a different repo');
      changeBtn.style.cssText += 'font-size:11px;padding:4px 10px;';
      changeBtn.onclick = () => renderSearch();
      const newRepoBtn = makeBtn('? Create new repo');
      newRepoBtn.style.cssText += 'font-size:11px;padding:4px 10px;';
      newRepoBtn.onclick = () => renderCreateRepo();
      altRow.appendChild(changeBtn);
      altRow.appendChild(newRepoBtn);
      body.appendChild(altRow);

      const useBtn = makeBtn('Use this repo ¡ú', true);
      const cancelBtn = makeBtn('Cancel');
      cancelBtn.onclick = () => overlay.remove();
      useBtn.onclick = () => {
        selectedProject = suggestedProject;
        gitlabSaveLastProject(suggestedProject);
        renderPushForm(suggestedProject);
      };
      footer.appendChild(cancelBtn);
      footer.appendChild(useBtn);
    } else {
      // No suggestion ¡ª show search with create button
      renderSearch();
    }
  }

  // ©¤©¤ Create new repo form ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  async function renderCreateRepo() {
    body.textContent = '';
    footer.textContent = '';
    titleEl.textContent = '?? Push ¡ª Create New Repository';

    // Fetch namespaces so user can pick a group or their personal namespace
    const nsStatus = document.createElement('div');
    nsStatus.style.cssText = 'font-size:11px;color:#858585;';
    nsStatus.textContent = 'Loading namespaces¡­';
    body.appendChild(nsStatus);

    let namespaces = [];
    try {
      // Get user info for personal namespace
      const user = await gitlabApiFetch('/user');
      // Get groups the user can create projects in
      const groups = await gitlabApiFetch('/groups', { min_access_level: 20, per_page: 100 });
      namespaces = [
        { path: user.username, name: user.username + ' (personal)', kind: 'user' },
        ...groups.map(g => ({ path: g.full_path, name: g.full_path, kind: 'group' }))
      ];
    } catch(e) {
      namespaces = [];
    }

    body.textContent = '';

    // Repo name
    const nameGroup = document.createElement('div');
    nameGroup.appendChild(makeLabel('Repository name *', 'gl-new-name'));
    const nameInput = makeInput(
      'my-project',
      typeof repo !== 'undefined' ? (repo.projectTitle || '').replace(/[^a-z0-9._-]/gi, '-').toLowerCase() : ''
    );
    nameInput.id = 'gl-new-name';
    nameGroup.appendChild(nameInput);
    body.appendChild(nameGroup);

    // Description
    const descGroup = document.createElement('div');
    descGroup.appendChild(makeLabel('Description (optional)', 'gl-new-desc'));
    const descInput = makeInput('', '');
    descInput.id = 'gl-new-desc';
    descGroup.appendChild(descInput);
    body.appendChild(descGroup);

    // Namespace picker
    const nsGroup = document.createElement('div');
    nsGroup.appendChild(makeLabel('Namespace (owner)', 'gl-new-ns'));
    const nsSelect = document.createElement('select');
    nsSelect.id = 'gl-new-ns';
    nsSelect.style.cssText = 'width:100%;background:#1e1e1e;border:1px solid #3e3e42;border-radius:4px;color:#d4d4d4;font-size:13px;padding:7px 10px;box-sizing:border-box;';
    if (namespaces.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '(default ¡ª your personal namespace)';
      nsSelect.appendChild(opt);
    } else {
      namespaces.forEach(ns => {
        const opt = document.createElement('option');
        opt.value = ns.path;
        opt.textContent = (ns.kind === 'group' ? '?? ' : '?? ') + ns.name;
        nsSelect.appendChild(opt);
      });
    }
    nsGroup.appendChild(nsSelect);
    body.appendChild(nsGroup);

    // Visibility
    const visGroup = document.createElement('div');
    visGroup.appendChild(makeLabel('Visibility', 'gl-new-vis'));
    const visSelect = document.createElement('select');
    visSelect.id = 'gl-new-vis';
    visSelect.style.cssText = nsSelect.style.cssText;
    [
      { value: 'private',  label: '?? Private' },
      { value: 'internal', label: '?? Internal' },
      { value: 'public',   label: '?? Public' }
    ].forEach(opt => {
      const o = document.createElement('option');
      o.value = opt.value;
      o.textContent = opt.label;
      visSelect.appendChild(o);
    });
    visGroup.appendChild(visSelect);
    body.appendChild(visGroup);

    // Initialize with default branch
    const branchGroup = document.createElement('div');
    branchGroup.appendChild(makeLabel('Default branch name', 'gl-new-branch'));
    const branchInput = makeInput('main', 'main');
    branchInput.id = 'gl-new-branch';
    branchGroup.appendChild(branchInput);

    const branchHint = document.createElement('div');
    branchHint.style.cssText = 'font-size:10px;color:#555;margin-top:3px;line-height:1.4;';
    branchHint.textContent = 'The VFS will be pushed to this branch as the initial commit.';
    branchGroup.appendChild(branchHint);
    body.appendChild(branchGroup);

    const status = document.createElement('div');
    status.style.cssText = 'font-size:11px;color:#858585;min-height:16px;';
    body.appendChild(status);

    // Footer
    const cancelBtn = makeBtn('Cancel');
    cancelBtn.onclick = () => overlay.remove();
    const backBtn = makeBtn('¡û Back');
    backBtn.onclick = renderProjectPicker;
    const createBtn = makeBtn('? Create & Push ¡ú', true);

    createBtn.onclick = async () => {
      const name = nameInput.value.trim();
      if (!name) { status.textContent = '?? Repository name is required'; status.style.color = '#f44336'; return; }
      if (!/^[a-z0-9._\-]+$/i.test(name)) { status.textContent = '?? Name may only contain letters, numbers, dots, underscores, hyphens'; status.style.color = '#f44336'; return; }

      createBtn.disabled = true;
      createBtn.textContent = 'Creating¡­';
      status.style.color = '#858585';
      status.textContent = 'Creating repository¡­';

      try {
        const body_ = {
          name,
          description: descInput.value.trim(),
          visibility: visSelect.value,
          initialize_with_readme: false
        };
        // Use namespace path string rather than numeric id ¡ª works across all GitLab versions
        const nsVal = nsSelect.value;
        if (nsVal) body_.namespace = nsVal;

        const { url: glUrl, pat } = gitlabGetCredentials();
        const res = await fetch(glUrl + '/api/v4/projects', {
          method: 'POST',
          headers: { 'PRIVATE-TOKEN': pat, 'Content-Type': 'application/json' },
          body: JSON.stringify(body_)
        });

        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          // e.message may be an object (e.g. {base: [...]}) ¡ª flatten it
          let errMsg = 'HTTP ' + res.status;
          if (e.message) {
            if (typeof e.message === 'string') {
              errMsg = e.message;
            } else {
              // Flatten nested error object into readable string
              errMsg = Object.entries(e.message)
                .map(([k, v]) => k + ': ' + (Array.isArray(v) ? v.join(', ') : v))
                .join(' ¡¤ ');
            }
          }
          throw new Error(errMsg);
        }

        const newProject = await res.json();
        status.textContent = '? Repository created!';

        // Save as last used and proceed to push form with default branch as both src and target
        gitlabSaveLastProject(newProject);

        // For a brand-new empty repo we push directly to the default branch
        const defaultBranch = branchInput.value.trim() || newProject.default_branch || 'main';
        const enriched = Object.assign({}, newProject, {
          _sourceBranch: defaultBranch,
          _newRepo: true,
          _initialBranch: defaultBranch
        });

        renderPushForm(enriched);

      } catch(e) {
        status.textContent = '? ' + e.message;
        status.style.color = '#f44336';
        createBtn.disabled = false;
        createBtn.textContent = '? Create & Push ¡ú';
      }
    };

    footer.appendChild(backBtn);
    footer.appendChild(cancelBtn);
    footer.appendChild(createBtn);
  }

  // ©¤©¤ Search (same pattern as import) ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  function renderSearch() {
    body.textContent = '';
    footer.textContent = '';
    titleEl.textContent = '?? Push ¡ª Select Repository';

    const searchRow = document.createElement('div');
    searchRow.style.cssText = 'display:flex;gap:6px;flex-shrink:0;';
    const searchInput = makeInput('Search repositories¡­', lastSearchQuery);
    searchInput.style.flex = '1';
    const searchBtn = makeBtn('Search', true);
    searchBtn.style.cssText += 'padding:7px 12px;';
    searchRow.appendChild(searchInput);
    searchRow.appendChild(searchBtn);

    const resultsArea = document.createElement('div');
    resultsArea.style.cssText = 'flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:4px;';

    const paginationRow = document.createElement('div');
    paginationRow.style.cssText = 'display:flex;gap:6px;align-items:center;flex-shrink:0;min-height:30px;';

    const status = makeStatus();

    body.appendChild(searchRow);
    body.appendChild(resultsArea);
    body.appendChild(paginationRow);
    body.appendChild(status);

    const cancelBtn = makeBtn('Cancel');
    cancelBtn.onclick = () => overlay.remove();
    const backBtn = makeBtn('¡û Back');
    backBtn.onclick = renderProjectPicker;
    const newRepoBtn2 = makeBtn('? New repo', false);
    newRepoBtn2.onclick = () => renderCreateRepo();
    footer.appendChild(backBtn);
    footer.appendChild(newRepoBtn2);
    footer.appendChild(cancelBtn);

    function renderPagination(page, hasMore) {
      paginationRow.textContent = '';
      if (page <= 1 && !hasMore) return;
      const prevBtn = makeBtn('¡û Prev');
      prevBtn.style.cssText += 'padding:4px 10px;font-size:11px;';
      prevBtn.disabled = page <= 1;
      prevBtn.onclick = () => doSearch(lastSearchQuery, page - 1);
      const pageLabel = document.createElement('span');
      pageLabel.style.cssText = 'font-size:11px;color:#858585;flex:1;text-align:center;';
      pageLabel.textContent = 'Page ' + page;
      const nextBtn = makeBtn('Next ¡ú');
      nextBtn.style.cssText += 'padding:4px 10px;font-size:11px;';
      nextBtn.disabled = !hasMore;
      nextBtn.onclick = () => doSearch(lastSearchQuery, page + 1);
      paginationRow.appendChild(prevBtn);
      paginationRow.appendChild(pageLabel);
      paginationRow.appendChild(nextBtn);
    }

    async function doSearch(query, page) {
      lastSearchQuery = query;
      currentPage = page;
      resultsArea.textContent = '';
      resultsArea.appendChild(makeSkeleton(GITLAB_PAGE_SIZE));
      paginationRow.textContent = '';
      status.textContent = 'Loading¡­';
      status.style.color = '#858585';
      searchBtn.disabled = true;
      try {
        const projects = await gitlabSearchProjects(query, page);
        resultsArea.textContent = '';
        if (projects.length === 0) {
          const empty = document.createElement('div');
          empty.style.cssText = 'color:#858585;font-size:12px;padding:20px 0;text-align:center;';
          empty.textContent = query ? 'No repositories found for "' + query + '".' : 'No repositories found.';
          resultsArea.appendChild(empty);
          status.textContent = '';
        } else {
          projects.forEach(proj => {
            const item = document.createElement('div');
            item.style.cssText = 'padding:8px 10px;border-radius:5px;border:1px solid #3e3e42;cursor:pointer;background:#1e1e1e;transition:border-color .12s,background .12s;';
            const name = document.createElement('div');
            name.style.cssText = 'font-size:12px;font-weight:600;color:#d4d4d4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
            name.textContent = proj.path_with_namespace;
            const meta = document.createElement('div');
            meta.style.cssText = 'font-size:11px;color:#858585;margin-top:2px;';
            meta.textContent = proj.visibility + ' ¡¤ default: ' + (proj.default_branch || 'unknown');
            item.appendChild(name);
            item.appendChild(meta);
            item.addEventListener('mouseenter', () => { item.style.borderColor='#1a7a3a'; item.style.background='#2d2d30'; });
            item.addEventListener('mouseleave', () => { item.style.borderColor='#3e3e42'; item.style.background='#1e1e1e'; });
            item.addEventListener('click', () => {
              selectedProject = proj;
              gitlabSaveLastProject(proj);
              renderPushForm(proj);
            });
            resultsArea.appendChild(item);
          });
          const hasMore = projects.length === GITLAB_PAGE_SIZE;
          status.textContent = projects.length + ' result(s)';
          renderPagination(page, hasMore);
        }
      } catch(e) {
        resultsArea.textContent = '';
        status.textContent = '? ' + e.message;
        status.style.color = '#f44336';
      }
      searchBtn.disabled = false;
    }

    searchBtn.onclick = () => doSearch(searchInput.value.trim(), 1);
    searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(searchInput.value.trim(), 1); });
    doSearch(lastSearchQuery, currentPage);
  }

  // ©¤©¤ Push form ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  function renderPushForm(project) {
    body.textContent = '';
    footer.textContent = '';
    titleEl.textContent = '?? Push to GitLab';

    const isNewRepo = !!project._newRepo;
    const initialBranch = project._initialBranch || project.default_branch || 'main';
    const vfsFileCount = typeof repo !== 'undefined' ? Object.keys(repo.files || {}).length : 0;
    const projectTitle = typeof repo !== 'undefined' ? (repo.projectTitle || 'untitled') : 'untitled';

    // Project pill
    const projPill = document.createElement('div');
    projPill.style.cssText = 'background:#1a2a1a;border:1px solid #2a5a2a;border-radius:5px;padding:7px 10px;font-size:11px;line-height:1.6;flex-shrink:0;';
    setForgeHTML(projPill, '<span style="font-weight:600;color:#4fc3f7;">?? ' + escapeHtml(project.path_with_namespace) + '</span><br>' +
      '<span style="color:#858585;">' + vfsFileCount + ' files in VFS ¡¤ project: "' + escapeHtml(projectTitle) + '"</span>');
    body.appendChild(projPill);

    // New-repo notice
    if (isNewRepo) {
      const notice = document.createElement('div');
      notice.style.cssText = 'background:#1a2a3a;border:1px solid #2a5a8a;border-radius:5px;padding:8px 10px;font-size:11px;color:#7ab8e8;line-height:1.6;flex-shrink:0;';
      notice.textContent = '? New empty repository ¡ª all files will be created on the initial commit.';
      body.appendChild(notice);
    }

    // Source branch (base)
    const srcGroup = document.createElement('div');
    srcGroup.style.display = isNewRepo ? 'none' : '';
    srcGroup.appendChild(makeLabel('Source branch (base / MR target)', 'gl-push-src'));
    const srcInput = makeInput('e.g. main', project._sourceBranch || project.default_branch || 'main');
    srcInput.id = 'gl-push-src';
    srcGroup.appendChild(srcInput);
    body.appendChild(srcGroup);

    // Target branch
    const tgtGroup = document.createElement('div');
    tgtGroup.appendChild(makeLabel(isNewRepo ? 'Initial branch name' : 'Target branch (commit destination)', 'gl-push-tgt'));
    const tgtInput = makeInput(
      isNewRepo ? 'main' : 'e.g. forge/changes-2026¡­',
      isNewRepo ? initialBranch : defaultPushBranchName()
    );
    tgtInput.id = 'gl-push-tgt';
    tgtGroup.appendChild(tgtInput);
    body.appendChild(tgtGroup);

    // Branch mode (hidden for new repos ¡ª always "new")
    const modeGroup = document.createElement('div');
    modeGroup.style.display = isNewRepo ? 'none' : '';
    modeGroup.style.cssText = 'display:flex;flex-direction:column;gap:4px;flex-shrink:0;';
    function makeRadio(value, label, checked) {
      const wrap = document.createElement('label');
      wrap.style.cssText = 'display:flex;align-items:center;gap:7px;font-size:12px;color:#d4d4d4;cursor:pointer;';
      const r = document.createElement('input');
      r.type = 'radio'; r.name = 'gl-push-mode'; r.value = value;
      if (checked) r.checked = true;
      wrap.appendChild(r);
      wrap.appendChild(document.createTextNode(label));
      return wrap;
    }
    const newRadio = makeRadio('new', 'Create new branch', true);
    const existingRadio = makeRadio('existing', 'Push to existing branch');
    const modeWarn = document.createElement('div');
    modeWarn.style.cssText = 'display:none;font-size:11px;color:#ffd77a;background:#3a2200;border-left:3px solid #ffc107;border-radius:3px;padding:5px 8px;';
    modeWarn.textContent = '?? This will add a new commit directly onto the existing branch.';
    modeGroup.appendChild(newRadio);
    modeGroup.appendChild(existingRadio);
    modeGroup.appendChild(modeWarn);
    body.appendChild(modeGroup);

    existingRadio.querySelector('input').addEventListener('change', e => {
      modeWarn.style.display = e.target.checked ? '' : 'none';
    });
    newRadio.querySelector('input').addEventListener('change', e => {
      modeWarn.style.display = e.target.checked ? 'none' : '';
    });

    // Commit message
    const msgGroup = document.createElement('div');
    msgGroup.appendChild(makeLabel('Commit message', 'gl-push-msg'));
    const msgInput = makeInput('feat: update via FORGE', 'feat: update via FORGE Code');
    msgInput.id = 'gl-push-msg';
    msgGroup.appendChild(msgInput);
    body.appendChild(msgGroup);

    // MR toggle ¡ª hidden and disabled for brand-new repos (nothing to merge into)
    const mrWrap = document.createElement('div');
    mrWrap.style.cssText = 'display:flex;flex-direction:column;gap:5px;flex-shrink:0;';
    mrWrap.style.display = isNewRepo ? 'none' : '';
    const mrLabel = document.createElement('label');
    mrLabel.style.cssText = 'display:flex;align-items:center;gap:7px;font-size:12px;color:#d4d4d4;cursor:pointer;';
    const mrCheck = document.createElement('input');
    mrCheck.type = 'checkbox'; mrCheck.checked = !isNewRepo;
    mrLabel.appendChild(mrCheck);
    mrLabel.appendChild(document.createTextNode('Open Merge Request after push'));
    mrWrap.appendChild(mrLabel);

    const mrFields = document.createElement('div');
    mrFields.style.cssText = 'display:flex;flex-direction:column;gap:5px;padding-left:22px;';
    const mrTitleInput = makeInput('MR title (auto-filled if blank)', '');
    mrTitleInput.style.fontSize = '12px';
    const mrDescInput = document.createElement('textarea');
    mrDescInput.placeholder = 'MR description (optional)';
    mrDescInput.style.cssText = 'width:100%;background:#1e1e1e;border:1px solid #3e3e42;border-radius:4px;color:#d4d4d4;font-size:12px;padding:6px 10px;box-sizing:border-box;font-family:Consolas,monospace;resize:vertical;height:50px;';
    mrFields.appendChild(mrTitleInput);
    mrFields.appendChild(mrDescInput);
    mrWrap.appendChild(mrFields);
    body.appendChild(mrWrap);

    mrCheck.addEventListener('change', () => {
      mrFields.style.display = mrCheck.checked ? '' : 'none';
    });

    const status = makeStatus();
    body.appendChild(status);

    // Footer buttons
    const cancelBtn = makeBtn('Cancel');
    cancelBtn.onclick = () => overlay.remove();
    const backBtn = makeBtn('¡û Back');
    backBtn.onclick = renderProjectPicker;
    const pushBtn = makeBtn('?? Push ¡ú', true);

    pushBtn.onclick = async () => {
      const srcBranch = srcInput.value.trim();
      const tgtBranch = tgtInput.value.trim();
      const msg = msgInput.value.trim();
      const branchMode = isNewRepo ? 'new' : (document.querySelector('input[name="gl-push-mode"]:checked')?.value || 'new');

      if (!srcBranch) { status.textContent = '?? Source branch required'; status.style.color = '#f44336'; return; }
      if (!tgtBranch) { status.textContent = '?? Target branch required'; status.style.color = '#f44336'; return; }
      if (!msg) { status.textContent = '?? Commit message required'; status.style.color = '#f44336'; return; }
      if (tgtBranch.includes(' ') || tgtBranch.startsWith('-')) { status.textContent = '?? Invalid branch name'; status.style.color = '#f44336'; return; }

      const mrOptions = mrCheck.checked ? {
        open: true,
        title: mrTitleInput.value.trim() || (tgtBranch + ' ¡ú ' + srcBranch),
        description: mrDescInput.value.trim()
      } : null;

      pushBtn.disabled = true;
      pushBtn.textContent = 'Pushing¡­';
      status.style.color = '#858585';
      gitlabSaveLastProject(project);

      renderPushing(project, srcBranch, tgtBranch, branchMode, msg, mrOptions);
    };

    footer.appendChild(backBtn);
    footer.appendChild(cancelBtn);
    footer.appendChild(pushBtn);
  }

  // ©¤©¤ Pushing progress ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  function renderPushing(project, srcBranch, tgtBranch, branchMode, commitMsg, mrOptions) {
    body.textContent = '';
    footer.textContent = '';
    titleEl.textContent = '?? Pushing¡­';

    const progressLog = document.createElement('div');
    progressLog.style.cssText = [
      'background:#1e1e1e', 'border:1px solid #3e3e42',
      'border-radius:4px', 'padding:10px 12px',
      'font-size:11px', 'font-family:Consolas,monospace',
      'color:#858585', 'flex:1', 'overflow-y:auto',
      'line-height:1.7', 'min-height:0'
    ].join(';');
    body.appendChild(progressLog);

    function addLine(msg) {
      const line = document.createElement('div');
      line.textContent = msg;
      progressLog.appendChild(line);
      progressLog.scrollTop = progressLog.scrollHeight;
    }

    gitlabPushProject(project, srcBranch, tgtBranch, branchMode, commitMsg, mrOptions, addLine)
      .then(result => {
        titleEl.textContent = '?? Push Complete';
        const doneBtn = makeBtn('? Done', true);
        doneBtn.onclick = () => overlay.remove();

        if (result.mrUrl) {
          const mrBtn = makeBtn('¨J Open MR', false, '#0e639c');
          mrBtn.onclick = () => window.open(result.mrUrl, '_blank');
          footer.appendChild(mrBtn);
        }
        footer.appendChild(doneBtn);
      })
      .catch(err => {
        addLine('? Push failed: ' + err.message);
        titleEl.textContent = '?? Push Failed';
        const retryBtn = makeBtn('¡û Back');
        retryBtn.onclick = renderProjectPicker;
        const closeBtn2 = makeBtn('Close');
        closeBtn2.onclick = () => overlay.remove();
        footer.appendChild(retryBtn);
        footer.appendChild(closeBtn2);
      });
  }

  // ©¤©¤ Kick off ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  if (!pat) {
    renderPushCredentials();
  } else {
    renderProjectPicker();
  }
}

// ©¤©¤ repo.gitlab API ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
// Attached to the repo object after everything is defined.
// Available inside #execute scripts as repo.gitlab.*
//
// All methods respect the .forgeconfig [gitlab] section when present.
// If credentials or project config are missing and confirm is not explicitly
// false, the push modal opens instead of failing silently.

function _gitlabAttachRepoAPI() {
  if (typeof repo === 'undefined') return;

  repo.gitlab = {

    /**
     * Read the [gitlab] section from /.forgeconfig in the VFS.
     * Returns an object with instance_url, project_id, project_path,
     * source_branch, default_branch ¡ª or null if not found.
     */
    getConfig() {
      return gitlabReadForgeConfig();
    },

    /**
     * Push the current VFS to GitLab.
     *
     * Options:
     *   message      {string}  Commit message (required for silent push)
     *   branch       {string}  Target branch (default: forge/changes-TIMESTAMP)
     *   sourceBranch {string}  Base branch for MR / branch creation (default: from config or 'main')
     *   branchMode   {string}  'new' | 'existing' (default: 'new')
     *   mr           {object}  { title, description } to auto-open an MR, or false to skip
     *   confirm      {boolean} true = open pre-filled modal for human confirmation (default: false)
     *
     * Returns: { commitId, branch, fileCount, created, updated, mrUrl } on silent success.
     * On confirm:true, opens the modal and returns null (result comes via human interaction).
     * Falls back to modal automatically if credentials or project config are missing.
     */
    async push(options = {}) {
      const cfg = gitlabReadForgeConfig();
      const { pat } = gitlabGetCredentials();
      const needsModal = options.confirm === true || !pat || (!cfg && !options.project);

      if (needsModal) {
        // Open pre-filled push modal
        showGitLabPushModal();
        return null;
      }

      // Build project object from config or explicit option
      const project = options.project || cfg;
      if (!project) {
        showGitLabPushModal();
        return null;
      }

      const sourceBranch = options.sourceBranch || cfg?._sourceBranch || project.default_branch || 'main';
      const targetBranch = options.branch || defaultPushBranchName();
      const branchMode   = options.branchMode || 'new';
      const commitMsg    = options.message || 'feat: update via FORGE Code';
      const mrOptions    = options.mr
        ? { open: true, title: options.mr.title || (targetBranch + ' ¡ú ' + sourceBranch), description: options.mr.description || '' }
        : null;

      // Apply instance URL from config if different from stored
      const restoreUrl = gitlabApplyForgeConfigUrl(project);

      try {
        const result = await gitlabPushProject(
          project,
          sourceBranch,
          targetBranch,
          branchMode,
          commitMsg,
          mrOptions,
          msg => { if (typeof logToUI === 'function') logToUI(msg); }
        );
        if (typeof showToast === 'function') {
          showToast('?? Pushed ' + result.fileCount + ' file(s) ¡ú ' + targetBranch, 3000);
        }
        return result;
      } finally {
        restoreUrl();
      }
    },

    /**
     * Open a merge request on GitLab.
     *
     * Options:
     *   sourceBranch {string}  Branch to merge from (required for silent)
     *   targetBranch {string}  Branch to merge into (default: from config default_branch)
     *   title        {string}  MR title
     *   description  {string}  MR description
     *   confirm      {boolean} true = open push modal pre-filled (default: false)
     *
     * Returns: { mrUrl } on silent success, null on confirm mode.
     */
    async createMR(options = {}) {
      const cfg = gitlabReadForgeConfig();
      const { pat } = gitlabGetCredentials();
      const needsModal = options.confirm === true || !pat || !cfg;

      if (needsModal) {
        showGitLabPushModal();
        return null;
      }

      const project      = options.project || cfg;
      const sourceBranch = options.sourceBranch;
      const targetBranch = options.targetBranch || cfg?.default_branch || project.default_branch || 'main';

      if (!sourceBranch) {
        throw new Error('repo.gitlab.createMR: sourceBranch is required');
      }

      const restoreUrl = gitlabApplyForgeConfigUrl(project);
      try {
        const { url: glUrl, pat: glPat } = gitlabGetCredentials();
        const res = await fetch(
          glUrl + '/api/v4/projects/' + encodeURIComponent(project.id) + '/merge_requests',
          {
            method: 'POST',
            headers: { 'PRIVATE-TOKEN': glPat, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              source_branch: sourceBranch,
              target_branch: targetBranch,
              title: options.title || (sourceBranch + ' ¡ú ' + targetBranch),
              description: options.description || '',
              remove_source_branch: true
            })
          }
        );
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          const msg = typeof e.message === 'string' ? e.message
            : Object.entries(e.message || {}).map(([k,v]) => k + ': ' + v).join(' ¡¤ ');
          throw new Error('MR failed: ' + msg);
        }
        const mrData = await res.json();
        if (typeof showToast === 'function') showToast('?? MR created ¡ú ' + mrData.web_url, 3000);
        return { mrUrl: mrData.web_url, iid: mrData.iid, title: mrData.title };
      } finally {
        restoreUrl();
      }
    },

    /**
     * Fetch a file (or list of files) from GitLab into the VFS.
     *
     * Options:
     *   path   {string|string[]}  File path(s) in the repo (e.g. 'src/app.js')
     *   branch {string}           Branch/ref to fetch from (default: from config source_branch)
     *   project {object}          Override project (default: from .forgeconfig)
     *
     * Returns: { loaded: number, paths: string[] }
     */
    async fetch(options = {}) {
      const cfg = gitlabReadForgeConfig();
      const { pat } = gitlabGetCredentials();
      if (!pat) throw new Error('repo.gitlab.fetch: no PAT configured ¡ª set credentials via Import or Settings');

      const project = options.project || cfg;
      if (!project) throw new Error('repo.gitlab.fetch: no project configured ¡ª import from GitLab first or pass options.project');

      const ref = options.branch || cfg?._sourceBranch || project.default_branch || 'main';
      const paths = Array.isArray(options.path) ? options.path : [options.path];
      const restoreUrl = gitlabApplyForgeConfigUrl(project);
      const loaded = [];

      try {
        await Promise.all(paths.map(async filePath => {
          const cleanPath = filePath.replace(/^\/+/, '');
          const resp = await gitlabApiFetchRaw(
            '/projects/' + encodeURIComponent(project.id) + '/repository/files/' + encodeURIComponent(cleanPath) + '/raw',
            { ref }
          );
          const arrayBuf = await resp.arrayBuffer();
          const bytes = new Uint8Array(arrayBuf);
          let isBinary = false;
          const checkLen = Math.min(1024, bytes.length);
          for (let j = 0; j < checkLen; j++) {
            if (bytes[j] === 0) { isBinary = true; break; }
          }
          const vfsPath = '/' + cleanPath;
          if (isBinary) {
            let binary = '';
            for (let j = 0; j < bytes.length; j++) binary += String.fromCharCode(bytes[j]);
            repo.addFile('gitlab-fetch', vfsPath, btoa(binary));
            repo.fileMeta[vfsPath] = { encoding: 'base64' };
          } else {
            const text = new TextDecoder('utf-8').decode(bytes);
            if (repo.fileExists(vfsPath)) {
              repo.replaceFile('gitlab-fetch', vfsPath, repo._processContent(vfsPath, text));
            } else {
              repo.addFile('gitlab-fetch', vfsPath, repo._processContent(vfsPath, text));
            }
          }
          loaded.push(vfsPath);
          if (typeof logToUI === 'function') logToUI('?? Fetched ' + vfsPath + ' from GitLab');
        }));
      } finally {
        restoreUrl();
      }

      if (typeof showToast === 'function') showToast('?? Fetched ' + loaded.length + ' file(s) from GitLab', 2500);
      return { loaded: loaded.length, paths: loaded };
    }
  };
}

// Attach after a short delay so repo is guaranteed to be initialized
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _gitlabAttachRepoAPI);
  } else {
    _gitlabAttachRepoAPI();
  }
}

// ©¤©¤ Modal UI ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

function showGitLabImportModal() {
  const existing = document.getElementById('forge-gitlab-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'forge-gitlab-modal';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:10010',
    'background:rgba(0,0,0,0.85)',
    'display:flex', 'align-items:center', 'justify-content:center',
    'font-family:Segoe UI,sans-serif'
  ].join(';');

  const dialog = document.createElement('div');
  dialog.style.cssText = [
    'background:#252526', 'border:2px solid #667eea',
    'border-radius:10px',
    // Fixed width + height so the modal never resizes during loading
    'width:520px', 'max-width:95vw', 'height:520px', 'max-height:92vh',
    'display:flex', 'flex-direction:column',
    'box-shadow:0 8px 32px rgba(0,0,0,0.5)', 'overflow:hidden'
  ].join(';');

  // Header
  const header = document.createElement('div');
  header.style.cssText = 'padding:13px 18px;border-bottom:1px solid #3e3e42;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;';
  const titleEl = document.createElement('span');
  titleEl.style.cssText = 'font-size:14px;font-weight:600;color:#d4d4d4;';
  titleEl.textContent = '?? Import from GitLab';
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '¡Á';
  closeBtn.style.cssText = 'background:none;border:none;color:#858585;font-size:20px;cursor:pointer;padding:0 4px;line-height:1;';
  closeBtn.onclick = () => overlay.remove();
  header.appendChild(titleEl);
  header.appendChild(closeBtn);

  // Body (scrollable, fixed height takes remaining space)
  const body = document.createElement('div');
  body.style.cssText = 'flex:1;overflow-y:auto;padding:14px 18px;display:flex;flex-direction:column;gap:10px;min-height:0;';

  // Footer
  const footer = document.createElement('div');
  footer.style.cssText = 'padding:11px 18px;border-top:1px solid #3e3e42;display:flex;gap:8px;justify-content:flex-end;flex-shrink:0;';

  dialog.appendChild(header);
  dialog.appendChild(body);
  dialog.appendChild(footer);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  // ©¤©¤ State ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  let lastSearchQuery = '';
  let currentPage = 1;

  // ©¤©¤ Shared helpers ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  function makeLabel(text, forId) {
    const l = document.createElement('label');
    l.textContent = text;
    l.style.cssText = 'font-size:10px;color:#858585;text-transform:uppercase;letter-spacing:.05em;font-weight:600;margin-bottom:2px;display:block;';
    if (forId) l.htmlFor = forId;
    return l;
  }

  function makeInput(placeholder, value, type) {
    const i = document.createElement('input');
    i.type = type || 'text';
    i.placeholder = placeholder;
    i.value = value || '';
    i.style.cssText = 'width:100%;background:#1e1e1e;border:1px solid #3e3e42;border-radius:4px;color:#d4d4d4;font-size:13px;padding:7px 10px;box-sizing:border-box;font-family:Consolas,monospace;';
    return i;
  }

  function makeBtn(label, primary) {
    const b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = [
      'border:none', 'border-radius:4px', 'padding:7px 16px',
      'font-size:12px', 'font-weight:600', 'cursor:pointer',
      'font-family:Segoe UI,sans-serif',
      primary ? 'background:#0e639c;color:#fff;' : 'background:#3e3e42;color:#d4d4d4;'
    ].join(';');
    return b;
  }

  function makeStatus() {
    const s = document.createElement('div');
    s.style.cssText = 'font-size:11px;color:#858585;min-height:16px;';
    return s;
  }


  // ©¤©¤ Step 1: Credentials ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  function renderCredentials() {
    body.textContent = '';
    footer.textContent = '';
    titleEl.textContent = '?? GitLab ¡ª Credentials';

    const { url, pat } = gitlabGetCredentials();

    const urlGroup = document.createElement('div');
    urlGroup.appendChild(makeLabel('GitLab Instance URL', 'gl-url'));
    const urlInput = makeInput('https://git.fda.gov', url);
    urlInput.id = 'gl-url';
    urlGroup.appendChild(urlInput);

    const patGroup = document.createElement('div');
    patGroup.appendChild(makeLabel('Personal Access Token (read_api scope)', 'gl-pat'));
    const patInput = makeInput('glpat-¡­', pat, 'password');
    patInput.id = 'gl-pat';
    patGroup.appendChild(patInput);

    const hint = document.createElement('div');
    hint.style.cssText = 'font-size:11px;color:#555;line-height:1.5;';
    setForgeHTML(hint, 'Create a PAT at <strong style="color:#667eea;">Settings ¡ú Access Tokens</strong> with <code style="background:#1e1e1e;padding:1px 5px;border-radius:3px;">read_api</code> scope. Credentials are stored in localStorage.');

    const status = makeStatus();

    body.appendChild(urlGroup);
    body.appendChild(patGroup);
    body.appendChild(hint);
    body.appendChild(status);

    const cancelBtn = makeBtn('Cancel');
    const connectBtn = makeBtn('Connect & Browse ¡ú', true);

    cancelBtn.onclick = () => overlay.remove();
    connectBtn.onclick = async () => {
      const savedUrl = urlInput.value.trim().replace(/\/+$/, '') || GITLAB_DEFAULT_URL;
      const savedPat = patInput.value.trim();
      if (!savedPat) {
        status.textContent = '?? PAT is required';
        status.style.color = '#f44336';
        return;
      }
      gitlabSaveCredentials(savedUrl, savedPat);
      connectBtn.disabled = true;
      connectBtn.textContent = 'Connecting¡­';
      status.style.color = '#858585';
      status.textContent = 'Verifying credentials¡­';
      try {
        await gitlabApiFetch('/user');
        renderSearch();
      } catch (e) {
        status.textContent = '? ' + e.message;
        status.style.color = '#f44336';
        connectBtn.disabled = false;
        connectBtn.textContent = 'Connect & Browse ¡ú';
      }
    };

    footer.appendChild(cancelBtn);
    footer.appendChild(connectBtn);
  }

  // ©¤©¤ Step 2: Search / Browse ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  function renderSearch(initialQuery) {
    body.textContent = '';
    footer.textContent = '';
    titleEl.textContent = '?? GitLab ¡ª Select Repository';
    if (initialQuery !== undefined) lastSearchQuery = initialQuery;

    // Search row
    const searchRow = document.createElement('div');
    searchRow.style.cssText = 'display:flex;gap:6px;flex-shrink:0;';
    const searchInput = makeInput('Search repositories¡­', lastSearchQuery);
    searchInput.style.flex = '1';
    const searchBtn = makeBtn('Search', true);
    searchBtn.style.padding = '7px 12px';
    searchRow.appendChild(searchInput);
    searchRow.appendChild(searchBtn);

    // Fixed-height results area ¡ª prevents modal resize
    const resultsArea = document.createElement('div');
    resultsArea.style.cssText = [
      'flex:1', 'min-height:0', 'overflow-y:auto',
      'display:flex', 'flex-direction:column', 'gap:4px'
    ].join(';');

    // Pagination row ¡ª always present so it doesn't shift layout
    const paginationRow = document.createElement('div');
    paginationRow.style.cssText = 'display:flex;gap:6px;align-items:center;flex-shrink:0;min-height:30px;';

    const status = makeStatus();
    status.style.flexShrink = '0';

    body.appendChild(searchRow);
    body.appendChild(resultsArea);
    body.appendChild(paginationRow);
    body.appendChild(status);

    const cancelBtn = makeBtn('Cancel');
    const backBtn = makeBtn('¡û Credentials');
    cancelBtn.onclick = () => overlay.remove();
    backBtn.onclick = renderCredentials;
    footer.appendChild(backBtn);
    footer.appendChild(cancelBtn);

    function renderPagination(page, hasMore) {
      paginationRow.textContent = '';
      if (page <= 1 && !hasMore) return; // nothing to show

      const prevBtn = makeBtn('¡û Prev');
      prevBtn.style.padding = '4px 10px';
      prevBtn.style.fontSize = '11px';
      prevBtn.disabled = page <= 1;
      prevBtn.onclick = () => doSearch(lastSearchQuery, page - 1);

      const pageLabel = document.createElement('span');
      pageLabel.style.cssText = 'font-size:11px;color:#858585;flex:1;text-align:center;';
      pageLabel.textContent = 'Page ' + page;

      const nextBtn = makeBtn('Next ¡ú');
      nextBtn.style.padding = '4px 10px';
      nextBtn.style.fontSize = '11px';
      nextBtn.disabled = !hasMore;
      nextBtn.onclick = () => doSearch(lastSearchQuery, page + 1);

      paginationRow.appendChild(prevBtn);
      paginationRow.appendChild(pageLabel);
      paginationRow.appendChild(nextBtn);
    }

    async function doSearch(query, page) {
      lastSearchQuery = query;
      currentPage = page;

      // Show skeleton immediately ¡ª prevents cursor-position surprise
      resultsArea.textContent = '';
      resultsArea.appendChild(makeSkeleton(GITLAB_PAGE_SIZE));
      paginationRow.textContent = '';
      status.textContent = 'Loading¡­';
      status.style.color = '#858585';
      searchBtn.disabled = true;

      try {
        const projects = await gitlabSearchProjects(query, page);

        resultsArea.textContent = '';

        if (projects.length === 0) {
          const empty = document.createElement('div');
          empty.style.cssText = 'color:#858585;font-size:12px;padding:20px 0;text-align:center;';
          empty.textContent = query ? 'No repositories found for "' + query + '".' : 'No repositories found.';
          resultsArea.appendChild(empty);
          status.textContent = '';
          renderPagination(page, false);
        } else {
          projects.forEach(proj => {
            const item = document.createElement('div');
            item.style.cssText = [
              'padding:8px 10px', 'border-radius:5px',
              'border:1px solid #3e3e42', 'cursor:pointer',
              'transition:border-color .12s,background .12s',
              'background:#1e1e1e', 'flex-shrink:0'
            ].join(';');

            const name = document.createElement('div');
            name.style.cssText = 'font-size:12px;font-weight:600;color:#d4d4d4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
            name.textContent = proj.path_with_namespace;

            const meta = document.createElement('div');
            meta.style.cssText = 'font-size:11px;color:#858585;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;';
            meta.textContent = proj.description || (proj.visibility + ' ¡¤ last active ' + (proj.last_activity_at || '').slice(0, 10));

            item.appendChild(name);
            item.appendChild(meta);

            item.addEventListener('mouseenter', () => {
              item.style.borderColor = '#667eea';
              item.style.background = '#2d2d30';
            });
            item.addEventListener('mouseleave', () => {
              item.style.borderColor = '#3e3e42';
              item.style.background = '#1e1e1e';
            });
            item.addEventListener('click', () => renderBranchSelect(proj));

            resultsArea.appendChild(item);
          });

          const hasMore = projects.length === GITLAB_PAGE_SIZE;
          status.textContent = projects.length + ' result(s)' + (hasMore ? ' ¡ª more on next page' : '');
          renderPagination(page, hasMore);
        }
      } catch (e) {
        resultsArea.textContent = '';
        status.textContent = '? ' + e.message;
        status.style.color = '#f44336';
      }

      searchBtn.disabled = false;
    }

    searchBtn.onclick = () => doSearch(searchInput.value.trim(), 1);
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') doSearch(searchInput.value.trim(), 1);
    });

    // Auto-load on open
    doSearch(lastSearchQuery, currentPage);
  }

  // ©¤©¤ Step 3: Branch + subfolder select ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  function renderBranchSelect(project) {
    body.textContent = '';
    footer.textContent = '';
    titleEl.textContent = '?? GitLab ¡ª Branch & Subfolder';

    const projName = document.createElement('div');
    projName.style.cssText = 'font-size:13px;font-weight:600;color:#4fc3f7;padding:4px 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
    projName.textContent = '?? ' + project.path_with_namespace;

    // Branch select
    const branchGroup = document.createElement('div');
    branchGroup.appendChild(makeLabel('Branch', 'gl-branch'));
    const branchSelect = document.createElement('select');
    branchSelect.id = 'gl-branch';
    branchSelect.style.cssText = 'width:100%;background:#1e1e1e;border:1px solid #3e3e42;border-radius:4px;color:#d4d4d4;font-size:13px;padding:7px 10px;box-sizing:border-box;';
    const loadingOpt = document.createElement('option');
    loadingOpt.textContent = 'Loading branches¡­';
    loadingOpt.disabled = true;
    branchSelect.appendChild(loadingOpt);
    branchGroup.appendChild(branchSelect);

    // ©¤©¤ Subfolder combo widget ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
    const subGroup = document.createElement('div');
    subGroup.style.cssText = 'display:flex;flex-direction:column;gap:4px;flex:1;min-height:0;';

    const subLabelRow = document.createElement('div');
    subLabelRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;';
    const subLabelEl = makeLabel('Subfolder (optional ¡ª leave blank for entire repo)', 'gl-subfolder');
    subLabelEl.style.marginBottom = '0';
    const clearSubBtn = document.createElement('button');
    clearSubBtn.textContent = '? Clear';
    clearSubBtn.style.cssText = 'background:none;border:none;color:#555;font-size:10px;cursor:pointer;padding:0;line-height:1;';
    clearSubBtn.title = 'Clear selection ¡ª import entire repo';
    subLabelRow.appendChild(subLabelEl);
    subLabelRow.appendChild(clearSubBtn);

    const subInput = makeInput('e.g. src/demos  or  packages/ui', '');
    subInput.id = 'gl-subfolder';
    subInput.style.fontFamily = 'Consolas,monospace';

    // Folder browser panel
    const folderBrowser = document.createElement('div');
    folderBrowser.style.cssText = [
      'background:#1a1a1a', 'border:1px solid #3e3e42',
      'border-radius:4px', 'flex:1', 'min-height:0',
      'overflow-y:auto', 'display:flex', 'flex-direction:column'
    ].join(';');

    // Breadcrumb bar inside browser
    const breadcrumb = document.createElement('div');
    breadcrumb.style.cssText = [
      'display:flex', 'align-items:center', 'flex-wrap:wrap', 'gap:2px',
      'padding:5px 8px', 'border-bottom:1px solid #3e3e42',
      'font-size:11px', 'color:#858585', 'flex-shrink:0',
      'background:#1e1e1e'
    ].join(';');

    // Folder list inside browser
    const folderList = document.createElement('div');
    folderList.style.cssText = 'flex:1;overflow-y:auto;padding:4px 0;';

    folderBrowser.appendChild(breadcrumb);
    folderBrowser.appendChild(folderList);

    const subHint = document.createElement('div');
    subHint.style.cssText = 'font-size:10px;color:#555;line-height:1.4;flex-shrink:0;';
    subHint.textContent = 'Files import with full paths (e.g. /src/demos/index.js). Click a folder to drill in, or type a path above.';

    subGroup.appendChild(subLabelRow);
    subGroup.appendChild(subInput);
    subGroup.appendChild(folderBrowser);
    subGroup.appendChild(subHint);

    const status = makeStatus();
    status.style.flexShrink = '0';

    body.appendChild(projName);
    body.appendChild(branchGroup);
    body.appendChild(subGroup);
    body.appendChild(status);

    const cancelBtn = makeBtn('Cancel');
    const backBtn = makeBtn('¡û Back');
    const importBtn = makeBtn('Import ¡ú', true);
    importBtn.disabled = true;

    cancelBtn.onclick = () => overlay.remove();
    backBtn.onclick = () => renderSearch();
    importBtn.onclick = () => {
      const ref = branchSelect.value;
      if (!ref) return;
      const subfolder = subInput.value.trim().replace(/^\/+|\/+$/g, '');
      renderImporting(project, ref, subfolder);
    };
    clearSubBtn.onclick = () => {
      subInput.value = '';
      loadFolders('', branchSelect.value);
    };

    footer.appendChild(backBtn);
    footer.appendChild(cancelBtn);
    footer.appendChild(importBtn);

    // ©¤©¤ Folder browser logic ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤

    // currentBreadcrumb: array of path segments, e.g. ['src', 'demos']
    let currentBreadcrumb = [];

    function renderBreadcrumb(segments) {
      breadcrumb.textContent = '';

      const rootCrumb = document.createElement('span');
      rootCrumb.textContent = '/ (root)';
      rootCrumb.style.cssText = 'cursor:pointer;color:' + (segments.length === 0 ? '#d4d4d4' : '#667eea') + ';';
      rootCrumb.title = 'Go to root';
      rootCrumb.onclick = () => {
        currentBreadcrumb = [];
        subInput.value = '';
        loadFolders('', branchSelect.value);
      };
      breadcrumb.appendChild(rootCrumb);

      segments.forEach((seg, idx) => {
        const sep = document.createElement('span');
        sep.textContent = ' / ';
        sep.style.color = '#444';
        breadcrumb.appendChild(sep);

        const crumb = document.createElement('span');
        const isLast = idx === segments.length - 1;
        crumb.textContent = seg;
        crumb.style.cssText = 'cursor:' + (isLast ? 'default' : 'pointer') + ';color:' + (isLast ? '#d4d4d4' : '#667eea') + ';';
        if (!isLast) {
          crumb.onclick = () => {
            const newPath = segments.slice(0, idx + 1).join('/');
            currentBreadcrumb = segments.slice(0, idx + 1);
            subInput.value = newPath;
            loadFolders(newPath, branchSelect.value);
          };
        }
        breadcrumb.appendChild(crumb);
      });
    }

    function setFolderListLoading() {
      folderList.textContent = '';
      folderList.appendChild(makeSkeleton(4));
    }

    function setFolderListEmpty(msg) {
      folderList.textContent = '';
      const empty = document.createElement('div');
      empty.style.cssText = 'color:#555;font-size:11px;padding:10px 10px;font-style:italic;';
      empty.textContent = msg || 'No subfolders here.';
      folderList.appendChild(empty);
    }

    async function loadFolders(path, ref) {
      if (!ref) return;
      renderBreadcrumb(path ? path.split('/') : []);
      setFolderListLoading();

      try {
        const params = { ref, recursive: false, per_page: 100 };
        if (path) params.path = path;
        const items = await gitlabApiFetch(
          `/projects/${encodeURIComponent(project.id)}/repository/tree`,
          params
        );
        const dirs = items.filter(i => i.type === 'tree');

        folderList.textContent = '';

        if (dirs.length === 0) {
          setFolderListEmpty('No subfolders in this directory.');
          return;
        }

        dirs.forEach(dir => {
          const row = document.createElement('div');
          row.style.cssText = [
            'display:flex', 'align-items:center', 'justify-content:space-between',
            'padding:5px 10px', 'cursor:pointer',
            'font-size:12px', 'color:#c8c8c8',
            'transition:background .1s', 'gap:6px'
          ].join(';');

          const nameSpan = document.createElement('span');
          nameSpan.style.cssText = 'display:flex;align-items:center;gap:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;';
    setForgeHTML(nameSpan, '<span style="color:#e8b86d;flex-shrink:0;">??</span><span>' + escapeHtml(dir.name) + '</span>');

          const selectBtn = document.createElement('button');
          selectBtn.textContent = 'Select';
          selectBtn.title = 'Import this folder: ' + dir.path;
          selectBtn.style.cssText = [
            'border:1px solid #3e3e42', 'border-radius:3px',
            'background:#2d2d30', 'color:#858585',
            'font-size:10px', 'padding:2px 7px',
            'cursor:pointer', 'flex-shrink:0',
            'font-family:Segoe UI,sans-serif'
          ].join(';');
          selectBtn.onmouseenter = () => { selectBtn.style.background = '#0e639c'; selectBtn.style.color = '#fff'; selectBtn.style.borderColor = '#0e639c'; };
          selectBtn.onmouseleave = () => { selectBtn.style.background = '#2d2d30'; selectBtn.style.color = '#858585'; selectBtn.style.borderColor = '#3e3e42'; };

          selectBtn.onclick = e => {
            e.stopPropagation(); // don't also drill in
            subInput.value = dir.path;
          };

          // Clicking the row name drills in
          nameSpan.onclick = () => {
            currentBreadcrumb = dir.path.split('/');
            subInput.value = dir.path;
            loadFolders(dir.path, ref);
          };

          row.onmouseenter = () => { row.style.background = '#2a2a2a'; };
          row.onmouseleave = () => { row.style.background = 'transparent'; };

          row.appendChild(nameSpan);
          row.appendChild(selectBtn);
          folderList.appendChild(row);
        });

      } catch (e) {
        setFolderListEmpty('Could not load folders: ' + e.message);
      }
    }

    // Sync the input back into the browser when user types
    subInput.addEventListener('input', () => {
      const val = subInput.value.trim().replace(/^\/+|\/+$/g, '');
      currentBreadcrumb = val ? val.split('/') : [];
      renderBreadcrumb(currentBreadcrumb);
    });

    // Load branches, then kick off folder load for default branch
    gitlabGetBranches(project.id).then(branches => {
      branchSelect.textContent = '';
      branches
        .sort((a, b) => {
          if (a.default) return -1;
          if (b.default) return 1;
          return a.name.localeCompare(b.name);
        })
        .forEach(branch => {
          const opt = document.createElement('option');
          opt.value = branch.name;
          opt.textContent = branch.name + (branch.default ? ' (default)' : '');
          branchSelect.appendChild(opt);
        });
      importBtn.disabled = false;
      status.textContent = branches.length + ' branch(es) loaded';
      // Load root folders for the selected branch
      loadFolders('', branchSelect.value);
    }).catch(e => {
      status.textContent = '? ' + e.message;
      status.style.color = '#f44336';
    });

    // Reload folder browser when branch changes
    branchSelect.addEventListener('change', () => {
      currentBreadcrumb = [];
      subInput.value = '';
      loadFolders('', branchSelect.value);
    });
  }

  // ©¤©¤ Step 4: Importing ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  function renderImporting(project, ref, subfolder) {
    body.textContent = '';
    footer.textContent = '';
    titleEl.textContent = '?? GitLab ¡ª Importing¡­';

    const progressLog = document.createElement('div');
    progressLog.style.cssText = [
      'background:#1e1e1e', 'border:1px solid #3e3e42',
      'border-radius:4px', 'padding:10px 12px',
      'font-size:11px', 'font-family:Consolas,monospace',
      'color:#858585', 'flex:1', 'overflow-y:auto',
      'line-height:1.7', 'min-height:0'
    ].join(';');

    body.appendChild(progressLog);

    function addLine(msg) {
      const line = document.createElement('div');
      line.textContent = msg;
      progressLog.appendChild(line);
      progressLog.scrollTop = progressLog.scrollHeight;
    }

    const projectName = project.name || project.path || 'gitlab-repo';

    gitlabImportProject(project.id, ref, projectName, subfolder, addLine)
      .then(() => {
        footer.textContent = '';
        titleEl.textContent = '?? GitLab ¡ª Import Complete';
        const doneBtn = makeBtn('Done ?', true);
        doneBtn.onclick = () => overlay.remove();
        footer.appendChild(doneBtn);
      })
      .catch(err => {
        addLine('? Import failed: ' + err.message);
        footer.textContent = '';
        titleEl.textContent = '?? GitLab ¡ª Import Failed';
        const retryBtn = makeBtn('¡û Back to Projects');
        retryBtn.onclick = () => renderSearch();
        const cls = makeBtn('Close');
        cls.onclick = () => overlay.remove();
        footer.appendChild(retryBtn);
        footer.appendChild(cls);
      });
  }

  // ©¤©¤ Kick off ©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤©¤
  const { pat } = gitlabGetCredentials();
  if (pat) {
    renderSearch();
  } else {
    renderCredentials();
  }
}
// FORGE Code - Initialization
// Check domain first, then initialize UI.
// Expose key functions on window for HTML onchange handlers and console access.

// Global adapter instance
window.forgeAdapter = null;

async function initializeAdapter() {
  try {
    if (typeof createAdapter === 'undefined') return;
    window.forgeAdapter = await createAdapter();
    console.log('[FORGE] ? Adapter initialized:', window.forgeAdapter.constructor.name);
  } catch (err) {
    console.error('[FORGE] ? Failed to initialize adapter:', err);
  }
}

/**
 * Initialize FORGE with the FallbackAdapter on an unsupported page.
 * Called when the user clicks "Try anyway" in the domain-check error UI.
 */
window.forgeInitWithFallback = async function forgeInitWithFallback() {
  createForgeUI();

  window.forgeAdapter = new FallbackAdapter();
  await window.forgeAdapter.initialize();

  if (typeof showToast === 'function') {
    showToast('?? Generic adapter active ¡ª limited functionality', 4000);
  }
  if (typeof logToUI === 'function') {
    logToUI('?? Running on unsupported platform with generic adapter. Auto-pilot and protocol injection may not work.');
  }

  _surfaceFallbackDiagnostics(window.forgeAdapter.getFallbackDiagnostics());
};

function _surfaceFallbackDiagnostics(diag) {
  if (!diag) return;

  const log = document.getElementById('forge-log');
  if (!log) return;

  const banner = document.createElement('div');
  banner.style.cssText = 'margin-top:8px; padding:6px 8px; background:#1e1e1e; border:1px solid #444; border-radius:4px; font-size:10px; color:#858585;';

  const copyBtn = document.createElement('button');
  copyBtn.textContent = '?? Copy Adapter Diagnostics';
  copyBtn.style.cssText = 'display:block; width:100%; margin-top:6px; padding:4px 8px; background:#3e3e42; border:none; border-radius:3px; color:#d4d4d4; font-size:10px; cursor:pointer;';
  copyBtn.addEventListener('click', () => {
    const payload = JSON.stringify(diag, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(payload)
        .then(() => { if (typeof showToast === 'function') showToast('?? Diagnostics copied!', 2000); })
        .catch(() => { console.log('[FORGE] Adapter diagnostics:\n', payload); });
    } else {
      console.log('[FORGE] Adapter diagnostics:\n', payload);
      if (typeof showToast === 'function') showToast('Diagnostics logged to console', 2000);
    }
  });

  banner.textContent = '?? Page scan complete. See console for details.';
  banner.appendChild(copyBtn);
  log.appendChild(banner);
}

if (checkDomainOrShowError()) {
  console.log([
    '%c',
    '¨€¨€¨€¨€¨€¨€¨€¨[ ¨€¨€¨€¨€¨€¨€¨[ ¨€¨€¨€¨€¨€¨€¨[  ¨€¨€¨€¨€¨€¨€¨[ ¨€¨€¨€¨€¨€¨€¨€¨[',
    '¨€¨€¨X¨T¨T¨T¨T¨a¨€¨€¨X¨T¨T¨T¨€¨€¨[¨€¨€¨X¨T¨T¨€¨€¨[¨€¨€¨X¨T¨T¨T¨T¨a ¨€¨€¨X¨T¨T¨T¨T¨a',
    '¨€¨€¨€¨€¨€¨[  ¨€¨€¨U   ¨€¨€¨U¨€¨€¨€¨€¨€¨€¨X¨a¨€¨€¨U  ¨€¨€¨€¨[¨€¨€¨€¨€¨€¨[  ',
    '¨€¨€¨X¨T¨T¨a  ¨€¨€¨U   ¨€¨€¨U¨€¨€¨X¨T¨T¨€¨€¨[¨€¨€¨U   ¨€¨€¨U¨€¨€¨X¨T¨T¨a  ',
    '¨€¨€¨U     ¨^¨€¨€¨€¨€¨€¨€¨X¨a¨€¨€¨U  ¨€¨€¨U¨^¨€¨€¨€¨€¨€¨€¨X¨a¨€¨€¨€¨€¨€¨€¨€¨[',
    '¨^¨T¨a      ¨^¨T¨T¨T¨T¨T¨a ¨^¨T¨a  ¨^¨T¨a ¨^¨T¨T¨T¨T¨T¨a ¨^¨T¨T¨T¨T¨T¨T¨a',
    '',
    '         ???  FORGE Code v' + (typeof FORGE_VERSION !== 'undefined' ? FORGE_VERSION : '?'),
    '    Browser-native LLM development environment',
    '    Ctrl+Shift+P  ¡ú  Apply Steps',
    '    Ctrl+Shift+U  ¡ú  Paste & Apply (manual)',
    '    Ctrl+Shift+V  ¡ú  Import Repo JSON',
    '    Ctrl+Shift+C  ¡ú  Copy Repo JSON',
    ''
  ].join('\n'), 'color: #667eea; font-family: monospace; font-size: 11px;');

  createForgeUI();
  
  // Initialize adapter after a short delay to ensure everything is loaded
  setTimeout(() => {
    initializeAdapter().catch(err => {
      console.error('[FORGE] Adapter initialization error:', err);
    });
  }, 100);

  // Initialize auto-sync (detect server, restore armed state)
  setTimeout(() => {
    if (typeof initAutoSync === 'function') initAutoSync();
  }, 500);

  // Check for cached state and show a non-blocking in-panel resume banner
  if (typeof loadWorkspaceState === 'function') {
    loadWorkspaceState().then(state => {
      // No saved state ¡ª fresh start, auto-arm upload
      if (!state || !state.files || Object.keys(state.files).length === 0) {
        if (typeof armUploadInterceptor === 'function') armUploadInterceptor();
        return;
      }

      const currentChatUrl =
        typeof window.getEffectiveConversationUrl ===
          'function'
          ? window.getEffectiveConversationUrl()
          : window.location.href;

      const savedChatUrl =
        typeof window.getEffectiveConversationUrl ===
          'function'
          ? window.getEffectiveConversationUrl(
              state.url
            )
          : state.url;

      const isSameChat =
        savedChatUrl === currentChatUrl;

      const ageMs = Date.now() - (state.timestamp || 0);
      const timeAgo = formatTimeAgo(ageMs);

      const fileCount = Object.keys(state.files).length;
      const stepLabel = `Step ${(state.lastProcessedStep || 0) + 1}`;
      const projectName = state.projectTitle || 'untitled';

      // Use the shared restore helper from handlers.js (eliminates duplication).
      // _restoreRepoFromSession(session, asNewChat) handles repo mutation,
      // ForgeState sync, and banner removal.
      function _applyRestoredState(asNewChat) {
        _restoreRepoFromSession(state, asNewChat);
      }

      // Truncate the saved URL for display (show just the hash fragment)
      const savedUrlDisplay = state.url
        ? (state.url.includes('#') ? '¡­' + state.url.substring(state.url.indexOf('#')) : state.url).substring(0, 48)
        : '';

      // Arm upload by default when a saved session is found ¡ª disarmed below
      // if the user chooses Resume or Go to original chat (continuation flows)
      if (typeof armUploadInterceptor === 'function') armUploadInterceptor();

      // Render the banner inside the FORGE panel, above the welcome banner
      const banner = document.createElement('div');
      banner.className = 'forge-resume-banner';
      banner.id = 'forge-resume-banner';
      setForgeHTML(banner,
        '<div class="forge-resume-banner-title">?? Saved session found: "' + escapeHtml(projectName) + '"</div>' +
        '<div class="forge-resume-banner-meta">' + fileCount + ' files ¡¤ ' + stepLabel + ' ¡¤ ' + timeAgo +
          (savedUrlDisplay && !isSameChat ? '<br><span title="' + escapeHtml(state.url) + '" style="opacity:0.7">' + escapeHtml(savedUrlDisplay) + '</span>' : '') +
        '</div>' +
        '<div class="forge-resume-banner-btns">' +
          (isSameChat
            // Same chat: single Resume button (no navigation needed)
            ? '<button class="forge-resume-btn forge-resume-btn-primary" id="forge-resume-primary">Resume</button>'
            // Different chat: offer to go back OR load here
            : '<button class="forge-resume-btn forge-resume-btn-primary" id="forge-resume-primary" title="Navigate back to the original chat and restore the project">? Go to original chat</button>' +
              '<button class="forge-resume-btn forge-resume-btn-secondary" id="forge-resume-secondary" title="Load project here and reset step counter">Load here</button>'
          ) +
          '<button class="forge-resume-btn forge-resume-btn-dismiss" id="forge-resume-dismiss" title="Dismiss and clear saved state">?</button>' +
        '</div>');

      // Insert at the top of the single control panel created by createForgeUI().
      const body = document.querySelector('.forge-control-panel');
      if (!body) {
        console.warn('[FORGE] Resume banner target not found; skipping resume prompt');
        return;
      }
      body.insertBefore(banner, body.firstChild);

      function _removeBanner() {
        const b = document.getElementById('forge-resume-banner');
        if (b) b.remove();
      }

      // Query within the banner so listener setup does not depend on global DOM lookup.
      const primaryBtn = banner.querySelector('#forge-resume-primary');
      const secondaryBtn = banner.querySelector('#forge-resume-secondary');
      const dismissBtn = banner.querySelector('#forge-resume-dismiss');

      if (!primaryBtn || !dismissBtn) {
        console.warn('[FORGE] Resume banner controls were not created');
        banner.remove();
        return;
      }

      primaryBtn.addEventListener('click', () => {
        _removeBanner();
        // Disarm upload ¡ª this is a continuation, LLM already has context
        if (typeof disarmUploadInterceptor === 'function') disarmUploadInterceptor();
        if (!isSameChat && state.url) {
          // Navigate back to the saved chat URL.
          window.location.href = state.url;
        }
        // Restore with original steps intact
        _applyRestoredState(false);
      });

      if (secondaryBtn) {
        // "Load here" ¡ª stay in current chat, reset steps, and arm upload.
        // _restoreRepoFromSession() owns the upload-arming behavior.
        secondaryBtn.addEventListener('click', () => {
          _removeBanner();
          _applyRestoredState(true);
        });
      }

      dismissBtn.addEventListener('click', () => {
        _removeBanner();
        if (typeof clearWorkspaceState === 'function') clearWorkspaceState();
        // Already armed when banner appeared ¡ª nothing to do
      });
    });
  }

  // Expose functions that need to be callable from HTML attribute handlers
  // (onchange, onclick, etc.) and from the browser console.
  // Everything runs inside an IIFE so these aren't global by default.
  window.showGitLabImportModal      = showGitLabImportModal;
  window.showGitLabPushModal        = showGitLabPushModal;
  window.handleUploadCheckbox       = handleUploadCheckbox;
  window.handleCodingPromptCheckbox = handleCodingPromptCheckbox;
  window.handleSummaryOnlyCheckbox  = handleSummaryOnlyCheckbox;
  window.armUploadInterceptor  = armUploadInterceptor;
  window.disarmUploadInterceptor = disarmUploadInterceptor;
  window.isUploadArmed         = isUploadArmed;
  window.consumeUploadArm      = consumeUploadArm;
  window.toggleDock            = toggleDock;
  window.parseAndApply         = parseAndApply;
  window.openInForgeIDE        = openInForgeIDE;
  window.copySendBackQueue     = copySendBackQueue;
  window.updateSendBackDisplay = updateSendBackDisplay;
  window.executeScript         = executeScript;
  window.repo                  = repo;
}

})();
