(function() {
  // Ensure we're running in the top window
  const targetWindow = window.top || window;
  const targetDocument = targetWindow.document;
  
  if (targetWindow.fdaPageAnalyzer) {
    alert('Page Analyzer is already running!');
    return;
  }
  targetWindow.fdaPageAnalyzer = true;

  // Configuration with defaults
  const config = {
    maxNetworkRequests: 50,
    maxRequestSize: 100,
    maxResponseSize: 500,
    captureRequestBody: true,
    captureResponseBody: true,
    captureImages: false,
    captureCSS: false,
    captureJS: false,
    maxTableRows: 1000,
    analyzeFrames: true
  };

  // Data collection object
  const analysisData = {
    metadata: {
      url: targetWindow.location.href,
      title: targetDocument.title,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      viewport: { width: targetWindow.innerWidth, height: targetWindow.innerHeight },
      isFrameset: targetDocument.querySelectorAll('frameset').length > 0,
      frameCount: targetWindow.frames.length
    },
    summary: {
      formCount: 0,
      inputCount: 0,
      buttonCount: 0,
      linkCount: 0,
      scriptCount: 0,
      errorCount: 0,
      networkRequests: 0,
      networkCaptured: 0,
      networkSkipped: 0,
      tableCount: 0,
      totalDataSize: 0,
      framesAnalyzed: 0
    },
    forms: [],
    markedElements: [],
    consoleErrors: [],
    networkTraffic: [],
    tables: [],
    frames: [],
    userNotes: '',
    keyElements: []
  };

  // Function to analyze accessible frames
  function analyzeFrames() {
    analysisData.frames = [];
    
    for (let i = 0; i < targetWindow.frames.length; i++) {
      try {
        const frame = targetWindow.frames[i];
        const frameDoc = frame.document;
        
        analysisData.frames.push({
          index: i,
          name: frame.name || `frame_${i}`,
          url: frame.location.href,
          accessible: true,
          formCount: frameDoc.querySelectorAll('form').length,
          inputCount: frameDoc.querySelectorAll('input, select, textarea').length,
          tableCount: frameDoc.querySelectorAll('table').length,
          linkCount: frameDoc.querySelectorAll('a').length,
          scriptCount: frameDoc.querySelectorAll('script').length
        });
        
        analysisData.summary.framesAnalyzed++;
      } catch(e) {
        analysisData.frames.push({
          index: i,
          name: targetWindow.frames[i].name || `frame_${i}`,
          accessible: false,
          error: 'Cross-origin restriction'
        });
      }
    }
  }

  // Analyze frames if enabled
  if (config.analyzeFrames && targetWindow.frames.length > 0) {
    analyzeFrames();
  }

  // Count resources
  analysisData.summary.scriptCount = targetDocument.querySelectorAll('script').length;
  analysisData.summary.linkCount = targetDocument.querySelectorAll('a').length;
  analysisData.summary.buttonCount = targetDocument.querySelectorAll('button').length;

  // Capture forms
  targetDocument.querySelectorAll('form').forEach((form, idx) => {
    const formData = {
      index: idx,
      id: form.id || null,
      name: form.name || null,
      action: form.action || null,
      method: form.method || null,
      xpath: getXPath(form),
      fields: []
    };
    
    form.querySelectorAll('input, select, textarea').forEach(field => {
      analysisData.summary.inputCount++;
      formData.fields.push({
        type: field.type || field.tagName.toLowerCase(),
        name: field.name || null,
        id: field.id || null,
        required: field.required || false,
        placeholder: field.placeholder || null,
        label: findLabel(field)
      });
    });
    
    analysisData.forms.push(formData);
  });
  
  analysisData.summary.formCount = analysisData.forms.length;

  // Find label for input
  function findLabel(input) {
    if (input.id) {
      const label = targetDocument.querySelector(`label[for="${input.id}"]`);
      if (label) return label.textContent.trim().substring(0, 100);
    }
    const parent = input.closest('label');
    if (parent) return parent.textContent.trim().substring(0, 100);
    return null;
  }

  // Capture key page elements
  targetDocument.querySelectorAll('h1, h2, .error, .alert, [role="alert"]').forEach(el => {
    analysisData.keyElements.push({
      tag: el.tagName,
      class: el.className || null,
      text: el.textContent.trim().substring(0, 200),
      xpath: getXPath(el)
    });
  });

  // Table scraping function
  function scrapeTables() {
    analysisData.tables = [];
    const tables = targetDocument.querySelectorAll('table');
    
    tables.forEach((table, idx) => {
      const tableData = {
        index: idx,
        id: table.id || null,
        className: table.className || null,
        xpath: getXPath(table),
        rowCount: table.rows.length,
        columnCount: 0,
        headers: [],
        rows: [],
        location: {
          top: table.getBoundingClientRect().top,
          left: table.getBoundingClientRect().left,
          width: table.offsetWidth,
          height: table.offsetHeight
        }
      };
      
      // Extract headers
      const headerRow = table.querySelector('thead tr, tr:first-child');
      if (headerRow) {
        const headers = Array.from(headerRow.querySelectorAll('th, td')).map(cell => 
          cell.textContent.trim()
        );
        tableData.headers = headers;
        tableData.columnCount = headers.length;
      }
      
      // Extract data rows (limit to config.maxTableRows)
      const dataRows = table.querySelectorAll('tbody tr, tr');
      const rowsToCapture = Math.min(dataRows.length, config.maxTableRows);
      
      for (let i = 0; i < rowsToCapture; i++) {
        const row = dataRows[i];
        // Skip if this is the header row
        if (row === headerRow) continue;
        
        const cells = Array.from(row.querySelectorAll('td, th')).map(cell => 
          cell.textContent.trim()
        );
        
        if (cells.length > 0) {
          tableData.rows.push(cells);
        }
      }
      
      // Only add tables that have data
      if (tableData.rows.length > 0 || tableData.headers.length > 0) {
        analysisData.tables.push(tableData);
      }
    });
    
    analysisData.summary.tableCount = analysisData.tables.length;
    updateStats();
  }

  // Console error tracking
  const originalError = console.error;
  console.error = function(...args) {
    analysisData.consoleErrors.push({
      timestamp: new Date().toISOString(),
      message: args.join(' ').substring(0, 500)
    });
    analysisData.summary.errorCount++;
    updateStats();
    originalError.apply(console, args);
  };

  // Network interception helpers
  function shouldCaptureRequest(url, type) {
    if (!config.captureImages && (url.match(/\.(jpg|jpeg|png|gif|svg|ico|webp)$/i) || type?.includes('image'))) {
      return false;
    }
    if (!config.captureCSS && (url.match(/\.css$/i) || type?.includes('css'))) {
      return false;
    }
    if (!config.captureJS && (url.match(/\.js$/i) || type?.includes('javascript'))) {
      return false;
    }
    return true;
  }

  function truncateIfNeeded(data, maxSizeKB, label) {
    if (!data) return null;
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    const sizeKB = new Blob([str]).size / 1024;
    
    if (sizeKB > maxSizeKB) {
      const maxChars = Math.floor((maxSizeKB * 1024) / 2);
      return {
        truncated: true,
        originalSize: `${sizeKB.toFixed(1)} KB`,
        data: str.substring(0, maxChars) + `\n\n[TRUNCATED - Original size: ${sizeKB.toFixed(1)} KB]`
      };
    }
    return { truncated: false, data: str };
  }

  // Intercept fetch
  const originalFetch = targetWindow.fetch;
  targetWindow.fetch = function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0].url;
    const options = args[1] || {};
    const startTime = Date.now();
    
    analysisData.summary.networkRequests++;
    
    return originalFetch.apply(this, args).then(response => {
      const duration = Date.now() - startTime;
      
      if (analysisData.networkTraffic.length >= config.maxNetworkRequests) {
        analysisData.summary.networkSkipped++;
        updateStats();
        return response;
      }
      
      if (!shouldCaptureRequest(url, response.headers.get('content-type'))) {
        analysisData.summary.networkSkipped++;
        updateStats();
        return response;
      }
      
      const clonedResponse = response.clone();
      
      clonedResponse.text().then(body => {
        const requestData = {
          timestamp: new Date().toISOString(),
          duration: duration,
          method: options.method || 'GET',
          url: url,
          status: response.status,
          statusText: response.statusText,
          type: 'fetch',
          requestHeaders: options.headers || null,
          responseHeaders: Object.fromEntries(response.headers.entries()),
          requestBody: null,
          responseBody: null
        };
        
        if (config.captureRequestBody && options.body) {
          const reqResult = truncateIfNeeded(options.body, config.maxRequestSize, 'request');
          requestData.requestBody = reqResult.data;
          requestData.requestTruncated = reqResult.truncated;
        }
        
        if (config.captureResponseBody && body) {
          const respResult = truncateIfNeeded(body, config.maxResponseSize, 'response');
          requestData.responseBody = respResult.data;
          requestData.responseTruncated = respResult.truncated;
          
          try {
            const parsed = JSON.parse(respResult.data);
            requestData.responseBodyParsed = parsed;
          } catch(e) {}
        }
        
        analysisData.networkTraffic.push(requestData);
        analysisData.summary.networkCaptured++;
        updateStats();
      }).catch(() => {
        analysisData.summary.networkSkipped++;
        updateStats();
      });
      
      return response;
    });
  };

  // Intercept XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._fdaMethod = method;
    this._fdaUrl = url;
    this._fdaStartTime = Date.now();
    return originalXHROpen.apply(this, [method, url, ...rest]);
  };
  
  XMLHttpRequest.prototype.send = function(body) {
    const xhr = this;
    
    analysisData.summary.networkRequests++;
    
    xhr.addEventListener('load', function() {
      const duration = Date.now() - xhr._fdaStartTime;
      
      if (analysisData.networkTraffic.length >= config.maxNetworkRequests) {
        analysisData.summary.networkSkipped++;
        updateStats();
        return;
      }
      
      const contentType = xhr.getResponseHeader('content-type');
      if (!shouldCaptureRequest(xhr._fdaUrl, contentType)) {
        analysisData.summary.networkSkipped++;
        updateStats();
        return;
      }
      
      const requestData = {
        timestamp: new Date().toISOString(),
        duration: duration,
        method: xhr._fdaMethod,
        url: xhr._fdaUrl,
        status: xhr.status,
        statusText: xhr.statusText,
        type: 'xhr',
        requestBody: null,
        responseBody: null
      };
      
      if (config.captureRequestBody && body) {
        const reqResult = truncateIfNeeded(body, config.maxRequestSize, 'request');
        requestData.requestBody = reqResult.data;
        requestData.requestTruncated = reqResult.truncated;
      }
      
      if (config.captureResponseBody && xhr.responseText) {
        const respResult = truncateIfNeeded(xhr.responseText, config.maxResponseSize, 'response');
        requestData.responseBody = respResult.data;
        requestData.responseTruncated = respResult.truncated;
        
        try {
          const parsed = JSON.parse(respResult.data);
          requestData.responseBodyParsed = parsed;
        } catch(e) {}
      }
      
      analysisData.networkTraffic.push(requestData);
      analysisData.summary.networkCaptured++;
      updateStats();
    });
    
    return originalXHRSend.apply(this, arguments);
  };

  // XPath helper
  function getXPath(element) {
    if (element.id) return `//*[@id="${element.id}"]`;
    if (element === targetDocument.body) return '/html/body';
    
    let ix = 0;
    const siblings = element.parentNode.childNodes;
    for (let i = 0; i < siblings.length; i++) {
      const sibling = siblings[i];
      if (sibling === element) {
        return getXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
      }
      if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
        ix++;
      }
    }
  }

  // Create floating UI
  const overlay = targetDocument.createElement('div');
  overlay.id = 'fda-analyzer-overlay';
  overlay.innerHTML = `
    <style>
      #fda-analyzer-overlay {
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px;
        z-index: 999999;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        border-radius: 10px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        min-width: 300px;
        max-width: 400px;
        cursor: move;
        user-select: none;
      }
      #fda-analyzer-overlay.minimized {
        padding: 10px 15px;
      }
      #fda-analyzer-overlay.minimized .fda-analyzer-body {
        display: none;
      }
      #fda-analyzer-overlay * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      .fda-analyzer-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(255,255,255,0.3);
      }
      #fda-analyzer-overlay.minimized .fda-analyzer-header {
        margin-bottom: 0;
        padding-bottom: 0;
        border-bottom: none;
      }
      .fda-analyzer-title {
        font-weight: bold;
        font-size: 14px;
      }
      .fda-analyzer-controls {
        display: flex;
        gap: 8px;
      }
      .fda-control-btn {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        line-height: 1;
        transition: background 0.2s;
      }
      .fda-control-btn:hover {
        background: rgba(255,255,255,0.3);
      }
      .fda-analyzer-stats {
        background: rgba(0,0,0,0.2);
        padding: 10px;
        border-radius: 6px;
        margin-bottom: 12px;
        font-size: 12px;
        line-height: 1.6;
      }
      .fda-stat-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
      }
      .fda-stat-row:last-child {
        margin-bottom: 0;
      }
      .fda-stat-label {
        opacity: 0.9;
      }
      .fda-stat-value {
        font-weight: bold;
      }
      .fda-stat-section {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid rgba(255,255,255,0.2);
      }
      .fda-stat-section:first-child {
        margin-top: 0;
        padding-top: 0;
        border-top: none;
      }
      .fda-analyzer-buttons {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .fda-analyzer-btn {
        background: white;
        color: #667eea;
        border: none;
        padding: 10px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 13px;
        transition: all 0.2s;
        text-align: center;
      }
      .fda-analyzer-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      }
      .fda-analyzer-btn.danger {
        background: #ff4757;
        color: white;
      }
      .fda-analyzer-btn.active {
        background: #4CAF50;
        color: white;
      }
      .fda-marked-element {
        outline: 3px solid #ff6b6b !important;
        outline-offset: 2px;
        background: rgba(255, 107, 107, 0.1) !important;
      }
      #fda-notes-modal, #fda-settings-modal, #fda-json-viewer-modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        color: #333;
        padding: 25px;
        border-radius: 8px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        z-index: 10000000;
        min-width: 400px;
        max-width: 800px;
        max-height: 80vh;
        overflow-y: auto;
      }
      #fda-json-viewer-modal {
        max-width: 90vw;
        width: 800px;
      }
      #fda-notes-modal h3, #fda-settings-modal h3, #fda-json-viewer-modal h3 {
        margin-bottom: 15px;
        color: #667eea;
      }
      #fda-notes-modal textarea {
        width: 100%;
        min-height: 100px;
        padding: 10px;
        border: 2px solid #ddd;
        border-radius: 5px;
        font-family: inherit;
        font-size: 14px;
        resize: vertical;
      }
      .modal-buttons {
        margin-top: 15px;
        display: flex;
        gap: 10px;
        justify-content: flex-end;
      }
      .fda-status-text {
        font-size: 12px;
        opacity: 0.9;
        margin-bottom: 12px;
        text-align: center;
      }
      .setting-group {
        margin-bottom: 20px;
      }
      .setting-group:last-child {
        margin-bottom: 0;
      }
      .setting-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #333;
      }
      .setting-group input[type="range"] {
        width: 100%;
        margin-bottom: 5px;
      }
      .setting-value {
        font-size: 12px;
        color: #666;
        text-align: right;
      }
      .setting-group input[type="checkbox"] {
        margin-right: 8px;
      }
      .checkbox-label {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        font-weight: normal;
        cursor: pointer;
      }
      #json-viewer-content {
        background: #f5f5f5;
        padding: 15px;
        border-radius: 5px;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        white-space: pre-wrap;
        word-wrap: break-word;
        max-height: 60vh;
        overflow-y: auto;
        border: 1px solid #ddd;
      }
      .json-viewer-stats {
        background: #e8f4f8;
        padding: 10px;
        border-radius: 5px;
        margin-bottom: 15px;
        font-size: 13px;
      }
    </style>
    <div class="fda-analyzer-header">
      <div class="fda-analyzer-title">📊 Analyzer</div>
      <div class="fda-analyzer-controls">
        <button class="fda-control-btn" id="minimize-btn" title="Minimize">−</button>
        <button class="fda-control-btn" id="close-btn-x" title="Close">×</button>
      </div>
    </div>
    <div class="fda-analyzer-body">
      <div class="fda-analyzer-stats">
        <div class="fda-stat-section">
          <div class="fda-stat-row">
            <span class="fda-stat-label">Forms:</span>
            <span class="fda-stat-value" id="stat-forms">0</span>
          </div>
          <div class="fda-stat-row">
            <span class="fda-stat-label">Inputs:</span>
            <span class="fda-stat-value" id="stat-inputs">0</span>
          </div>
          <div class="fda-stat-row">
            <span class="fda-stat-label">Tables:</span>
            <span class="fda-stat-value" id="stat-tables">0</span>
          </div>
          <div class="fda-stat-row">
            <span class="fda-stat-label">Frames:</span>
            <span class="fda-stat-value" id="stat-frames">0</span>
          </div>
          <div class="fda-stat-row">
            <span class="fda-stat-label">Marked:</span>
            <span class="fda-stat-value" id="stat-marked">0</span>
          </div>
        </div>
        <div class="fda-stat-section">
          <div class="fda-stat-row">
            <span class="fda-stat-label">Network Requests:</span>
            <span class="fda-stat-value" id="stat-network">0</span>
          </div>
          <div class="fda-stat-row">
            <span class="fda-stat-label">Captured:</span>
            <span class="fda-stat-value" id="stat-captured">0</span>
          </div>
          <div class="fda-stat-row">
            <span class="fda-stat-label">Skipped:</span>
            <span class="fda-stat-value" id="stat-skipped">0</span>
          </div>
        </div>
        <div class="fda-stat-section">
          <div class="fda-stat-row">
            <span class="fda-stat-label">Errors:</span>
            <span class="fda-stat-value" id="stat-errors">0</span>
          </div>
        </div>
      </div>
      <div class="fda-status-text" id="status-text">Marking: OFF</div>
      <div class="fda-analyzer-buttons">
        <button class="fda-analyzer-btn" id="scrape-tables-btn">📋 Scrape Tables</button>
        <button class="fda-analyzer-btn" id="toggle-marking-btn">🎯 Enable Marking</button>
        <button class="fda-analyzer-btn" id="settings-btn">⚙️ Settings</button>
        <button class="fda-analyzer-btn" id="add-notes-btn">📝 Add Notes</button>
        <button class="fda-analyzer-btn" id="view-json-btn">👁️ View JSON</button>
        <button class="fda-analyzer-btn" id="download-btn">💾 Download</button>
        <button class="fda-analyzer-btn danger" id="close-btn">Close</button>
      </div>
    </div>
  `;
  targetDocument.body.appendChild(overlay);

  // Update stats display
  function updateStats() {
    const statForms = targetDocument.getElementById('stat-forms');
    const statInputs = targetDocument.getElementById('stat-inputs');
    const statTables = targetDocument.getElementById('stat-tables');
    const statFrames = targetDocument.getElementById('stat-frames');
    const statMarked = targetDocument.getElementById('stat-marked');
    const statNetwork = targetDocument.getElementById('stat-network');
    const statCaptured = targetDocument.getElementById('stat-captured');
    const statSkipped = targetDocument.getElementById('stat-skipped');
    const statErrors = targetDocument.getElementById('stat-errors');
    
    if (statForms) statForms.textContent = analysisData.summary.formCount;
    if (statInputs) statInputs.textContent = analysisData.summary.inputCount;
    if (statTables) statTables.textContent = analysisData.summary.tableCount;
    if (statFrames) statFrames.textContent = analysisData.summary.framesAnalyzed;
    if (statMarked) statMarked.textContent = analysisData.markedElements.length;
    if (statNetwork) statNetwork.textContent = analysisData.summary.networkRequests;
    if (statCaptured) statCaptured.textContent = analysisData.summary.networkCaptured;
    if (statSkipped) statSkipped.textContent = analysisData.summary.networkSkipped;
    if (statErrors) statErrors.textContent = analysisData.summary.errorCount;
  }
  updateStats();

  // Make draggable
  let isDragging = false;
  let currentX, currentY, initialX, initialY;
  
  overlay.addEventListener('mousedown', function(e) {
    if (e.target.closest('.fda-analyzer-btn') || e.target.closest('.fda-control-btn')) return;
    isDragging = true;
    initialX = e.clientX - overlay.offsetLeft;
    initialY = e.clientY - overlay.offsetTop;
  });

  targetDocument.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    e.preventDefault();
    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;
    overlay.style.left = currentX + 'px';
    overlay.style.top = currentY + 'px';
    overlay.style.right = 'auto';
  });

  targetDocument.addEventListener('mouseup', function() {
    isDragging = false;
  });

  // Minimize/maximize
  targetDocument.getElementById('minimize-btn').addEventListener('click', function() {
    overlay.classList.toggle('minimized');
    this.textContent = overlay.classList.contains('minimized') ? '+' : '−';
  });

  // Scrape tables button
  targetDocument.getElementById('scrape-tables-btn').addEventListener('click', function() {
    scrapeTables();
    alert(`Scraped ${analysisData.summary.tableCount} tables!\n\nClick "View JSON" to see the data.`);
  });

  // Element marking (now toggleable)
  let markingMode = false;
  
  function updateMarkingUI() {
    const btn = targetDocument.getElementById('toggle-marking-btn');
    const statusText = targetDocument.getElementById('status-text');
    
    if (btn && statusText) {
      if (markingMode) {
        btn.textContent = '🎯 Disable Marking';
        btn.classList.add('active');
        statusText.textContent = 'Marking: ON - Click elements to mark';
      } else {
        btn.textContent = '🎯 Enable Marking';
        btn.classList.remove('active');
        statusText.textContent = 'Marking: OFF - Page interactive';
      }
    }
  }
  
  targetDocument.getElementById('toggle-marking-btn').addEventListener('click', function() {
    markingMode = !markingMode;
    updateMarkingUI();
  });
  
  updateMarkingUI();
  
  targetDocument.addEventListener('click', function(e) {
    if (!markingMode) return;
    if (e.target.closest('#fda-analyzer-overlay') || e.target.closest('#fda-notes-modal') || e.target.closest('#fda-settings-modal') || e.target.closest('#fda-json-viewer-modal')) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const element = e.target;
    
    if (element.classList.contains('fda-marked-element')) {
      element.classList.remove('fda-marked-element');
      const idx = analysisData.markedElements.findIndex(el => el.xpath === getXPath(element));
      if (idx > -1) analysisData.markedElements.splice(idx, 1);
    } else {
      element.classList.add('fda-marked-element');
      analysisData.markedElements.push({
        xpath: getXPath(element),
        tagName: element.tagName,
        id: element.id || null,
        className: element.className || null,
        text: element.textContent.trim().substring(0, 200),
        outerHTML: element.outerHTML.substring(0, 300)
      });
    }
    
    updateStats();
  }, true);

  // Settings modal
  targetDocument.getElementById('settings-btn').addEventListener('click', function() {
    const modal = targetDocument.createElement('div');
    modal.id = 'fda-settings-modal';
    modal.innerHTML = `
      <h3>Capture Settings</h3>
      
      <div class="setting-group">
        <label>Max Network Requests: <span id="max-requests-val">${config.maxNetworkRequests}</span></label>
        <input type="range" id="max-requests" min="10" max="200" step="10" value="${config.maxNetworkRequests}">
      </div>
      
      <div class="setting-group">
        <label>Max Request Size: <span id="max-req-size-val">${config.maxRequestSize} KB</span></label>
        <input type="range" id="max-req-size" min="10" max="500" step="10" value="${config.maxRequestSize}">
      </div>
      
      <div class="setting-group">
        <label>Max Response Size: <span id="max-resp-size-val">${config.maxResponseSize} KB</span></label>
        <input type="range" id="max-resp-size" min="50" max="2000" step="50" value="${config.maxResponseSize}">
      </div>
      
      <div class="setting-group">
        <label>Max Table Rows: <span id="max-table-rows-val">${config.maxTableRows}</span></label>
        <input type="range" id="max-table-rows" min="100" max="10000" step="100" value="${config.maxTableRows}">
      </div>
      
      <div class="setting-group">
        <label class="checkbox-label">
          <input type="checkbox" id="capture-req-body" ${config.captureRequestBody ? 'checked' : ''}>
          Capture Request Bodies
        </label>
        <label class="checkbox-label">
          <input type="checkbox" id="capture-resp-body" ${config.captureResponseBody ? 'checked' : ''}>
          Capture Response Bodies
        </label>
      </div>
      
      <div class="setting-group">
        <label>Skip Resource Types:</label>
        <label class="checkbox-label">
          <input type="checkbox" id="skip-images" ${!config.captureImages ? 'checked' : ''}>
          Skip Images
        </label>
        <label class="checkbox-label">
          <input type="checkbox" id="skip-css" ${!config.captureCSS ? 'checked' : ''}>
          Skip CSS
        </label>
        <label class="checkbox-label">
          <input type="checkbox" id="skip-js" ${!config.captureJS ? 'checked' : ''}>
          Skip JavaScript
        </label>
      </div>
      
      <div class="setting-group">
        <label class="checkbox-label">
          <input type="checkbox" id="analyze-frames" ${config.analyzeFrames ? 'checked' : ''}>
          Analyze Frames (when present)
        </label>
      </div>
      
      <div class="modal-buttons">
        <button class="fda-analyzer-btn" id="save-settings-btn">Save</button>
        <button class="fda-analyzer-btn danger" id="cancel-settings-btn">Cancel</button>
      </div>
    `;
    targetDocument.body.appendChild(modal);
    
    // Update slider values in real-time
    modal.querySelector('#max-requests').addEventListener('input', function(e) {
      modal.querySelector('#max-requests-val').textContent = e.target.value;
    });
    modal.querySelector('#max-req-size').addEventListener('input', function(e) {
      modal.querySelector('#max-req-size-val').textContent = e.target.value + ' KB';
    });
    modal.querySelector('#max-resp-size').addEventListener('input', function(e) {
      modal.querySelector('#max-resp-size-val').textContent = e.target.value + ' KB';
    });
    modal.querySelector('#max-table-rows').addEventListener('input', function(e) {
      modal.querySelector('#max-table-rows-val').textContent = e.target.value;
    });
    
    modal.querySelector('#save-settings-btn').addEventListener('click', function() {
      config.maxNetworkRequests = parseInt(modal.querySelector('#max-requests').value);
      config.maxRequestSize = parseInt(modal.querySelector('#max-req-size').value);
      config.maxResponseSize = parseInt(modal.querySelector('#max-resp-size').value);
      config.maxTableRows = parseInt(modal.querySelector('#max-table-rows').value);
      config.captureRequestBody = modal.querySelector('#capture-req-body').checked;
      config.captureResponseBody = modal.querySelector('#capture-resp-body').checked;
      config.captureImages = !modal.querySelector('#skip-images').checked;
      config.captureCSS = !modal.querySelector('#skip-css').checked;
      config.captureJS = !modal.querySelector('#skip-js').checked;
      config.analyzeFrames = modal.querySelector('#analyze-frames').checked;
      modal.remove();
    });
    
    modal.querySelector('#cancel-settings-btn').addEventListener('click', function() {
      modal.remove();
    });
  });

  // Notes modal
  targetDocument.getElementById('add-notes-btn').addEventListener('click', function() {
    const modal = targetDocument.createElement('div');
    modal.id = 'fda-notes-modal';
    modal.innerHTML = `
      <h3>Add Notes</h3>
      <textarea id="notes-textarea" placeholder="Describe any issues, observations, or context...">${analysisData.userNotes}</textarea>
      <div class="modal-buttons">
        <button class="fda-analyzer-btn" id="save-notes-btn">Save</button>
        <button class="fda-analyzer-btn danger" id="cancel-notes-btn">Cancel</button>
      </div>
    `;
    targetDocument.body.appendChild(modal);
    
    modal.querySelector('#save-notes-btn').addEventListener('click', function() {
      analysisData.userNotes = modal.querySelector('#notes-textarea').value;
      modal.remove();
    });
    
    modal.querySelector('#cancel-notes-btn').addEventListener('click', function() {
      modal.remove();
    });
  });

  // View JSON modal
  targetDocument.getElementById('view-json-btn').addEventListener('click', function() {
    const dataStr = JSON.stringify(analysisData, null, 2);
    const sizeKB = (new Blob([dataStr]).size / 1024).toFixed(1);
    
    const modal = targetDocument.createElement('div');
    modal.id = 'fda-json-viewer-modal';
    modal.innerHTML = `
      <h3>Analysis Data (JSON)</h3>
      <div class="json-viewer-stats">
        <strong>Size:</strong> ${sizeKB} KB | 
        <strong>Tables:</strong> ${analysisData.summary.tableCount} | 
        <strong>Frames:</strong> ${analysisData.summary.framesAnalyzed} | 
        <strong>Network:</strong> ${analysisData.summary.networkCaptured} | 
        <strong>Marked:</strong> ${analysisData.markedElements.length}
      </div>
      <div id="json-viewer-content">${dataStr}</div>
      <div class="modal-buttons">
        <button class="fda-analyzer-btn" id="copy-json-btn">📋 Copy to Clipboard</button>
        <button class="fda-analyzer-btn danger" id="close-viewer-btn">Close</button>
      </div>
    `;
    targetDocument.body.appendChild(modal);
    
    modal.querySelector('#copy-json-btn').addEventListener('click', function() {
      navigator.clipboard.writeText(dataStr).then(() => {
        alert('JSON copied to clipboard!');
      }).catch(() => {
        alert('Failed to copy. Try selecting the text manually.');
      });
    });
    
    modal.querySelector('#close-viewer-btn').addEventListener('click', function() {
      modal.remove();
    });
  });

  // Download
  targetDocument.getElementById('download-btn').addEventListener('click', function() {
    const dataStr = JSON.stringify(analysisData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = targetDocument.createElement('a');
    a.href = url;
    a.download = `page-analysis-${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    const sizeKB = (blob.size / 1024).toFixed(1);
    alert(`Downloaded!\n\nFile size: ${sizeKB} KB\nTables: ${analysisData.summary.tableCount}\nFrames: ${analysisData.summary.framesAnalyzed}\nNetwork requests: ${analysisData.summary.networkCaptured}`);
  });

  // Close
  function closeAnalyzer() {
    if (confirm('Close the analyzer? Any unsaved data will be lost.')) {
      overlay.remove();
      targetDocument.querySelectorAll('.fda-marked-element').forEach(el => {
        el.classList.remove('fda-marked-element');
      });
      delete targetWindow.fdaPageAnalyzer;
      console.error = originalError;
      targetWindow.fetch = originalFetch;
      XMLHttpRequest.prototype.open = originalXHROpen;
      XMLHttpRequest.prototype.send = originalXHRSend;
    }
  }
  
  targetDocument.getElementById('close-btn').addEventListener('click', closeAnalyzer);
  targetDocument.getElementById('close-btn-x').addEventListener('click', closeAnalyzer);
})();
