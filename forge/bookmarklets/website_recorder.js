(function() {
  'use strict';
  
  const RecorderUI = {
    events: [],
    startTime: null,
    isRecording: false,
    hasUnsavedRecording: false,
    
    init() {
      this.createUI();
      this.setupEventListeners();
      this.interceptConsole();
      this.interceptNetwork();
    },
    
    createUI() {
      const container = document.createElement('div');
      container.id = 'session-recorder';
      container.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #2c3e50;
        color: white;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        z-index: 999999;
        font-family: Arial, sans-serif;
        font-size: 14px;
        min-width: 200px;
      `;
      
      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <div style="font-weight: bold;">Session Recorder</div>
          <button id="rec-close" style="background: none; border: none; color: #bdc3c7; cursor: pointer; font-size: 18px; padding: 0; width: 24px; height: 24px; line-height: 20px; border-radius: 3px;" title="Close recorder">×</button>
        </div>
        <button id="rec-start" style="padding: 8px 12px; margin-right: 5px; cursor: pointer; background: #27ae60; color: white; border: none; border-radius: 4px;">Start</button>
        <button id="rec-stop" style="padding: 8px 12px; margin-right: 5px; cursor: pointer; background: #e74c3c; color: white; border: none; border-radius: 4px;" disabled>Stop</button>
        <button id="rec-download" style="padding: 8px 12px; cursor: pointer; background: #3498db; color: white; border: none; border-radius: 4px;" disabled>Download</button>
        <div id="rec-status" style="margin-top: 10px; font-size: 12px; color: #ecf0f1;">Ready</div>
        <div id="rec-count" style="margin-top: 5px; font-size: 12px; color: #bdc3c7;">Events: 0</div>
      `;
      
      document.body.appendChild(container);
      
      document.getElementById('rec-start').addEventListener('click', () => this.startRecording());
      document.getElementById('rec-stop').addEventListener('click', () => this.stopRecording());
      document.getElementById('rec-download').addEventListener('click', () => this.downloadRecording());
      document.getElementById('rec-close').addEventListener('click', () => this.close());
      
      // Add hover effect for close button
      const closeBtn = document.getElementById('rec-close');
      closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.background = '#e74c3c';
        closeBtn.style.color = 'white';
      });
      closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.background = 'none';
        closeBtn.style.color = '#bdc3c7';
      });
    },
    
    startRecording() {
      this.events = [];
      this.startTime = Date.now();
      this.isRecording = true;
      this.hasUnsavedRecording = false;
      
      document.getElementById('rec-start').disabled = true;
      document.getElementById('rec-stop').disabled = false;
      document.getElementById('rec-download').disabled = true;
      document.getElementById('rec-status').textContent = 'Recording...';
      document.getElementById('rec-status').style.color = '#e74c3c';
      
      this.recordEvent('session_start', {
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      });
    },
    
    stopRecording() {
      this.isRecording = false;
      this.hasUnsavedRecording = true;
      
      document.getElementById('rec-start').disabled = false;
      document.getElementById('rec-stop').disabled = true;
      document.getElementById('rec-download').disabled = false;
      document.getElementById('rec-status').textContent = 'Stopped';
      document.getElementById('rec-status').style.color = '#f39c12';
      
      this.recordEvent('session_end', {});
    },
    
    recordEvent(type, data) {
      const event = {
        type,
        timestamp: Date.now() - this.startTime,
        data,
        url: window.location.href
      };
      
      this.events.push(event);
      document.getElementById('rec-count').textContent = `Events: ${this.events.length}`;
    },
    
    setupEventListeners() {
      // Click events
      document.addEventListener('click', (e) => {
        if (!this.isRecording || e.target.closest('#session-recorder')) return;
        
        this.recordEvent('click', {
          selector: this.getSelector(e.target),
          text: e.target.textContent?.substring(0, 100),
          tagName: e.target.tagName,
          x: e.clientX,
          y: e.clientY
        });
      }, true);
      
      // Input events
      document.addEventListener('input', (e) => {
        if (!this.isRecording || e.target.closest('#session-recorder')) return;
        
        this.recordEvent('input', {
          selector: this.getSelector(e.target),
          value: e.target.value,
          tagName: e.target.tagName,
          inputType: e.target.type
        });
      }, true);
      
      // Focus events
      document.addEventListener('focus', (e) => {
        if (!this.isRecording || e.target.closest('#session-recorder')) return;
        
        this.recordEvent('focus', {
          selector: this.getSelector(e.target),
          tagName: e.target.tagName
        });
      }, true);
      
      // Scroll events (debounced)
      let scrollTimeout;
      document.addEventListener('scroll', (e) => {
        if (!this.isRecording) return;
        
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          this.recordEvent('scroll', {
            x: window.scrollX,
            y: window.scrollY
          });
        }, 250);
      }, true);
      
      // Navigation
      let lastUrl = window.location.href;
      setInterval(() => {
        if (!this.isRecording) return;
        
        if (window.location.href !== lastUrl) {
          this.recordEvent('navigation', {
            from: lastUrl,
            to: window.location.href
          });
          lastUrl = window.location.href;
        }
      }, 500);
    },
    
    getSelector(element) {
      // Try to get a unique selector for the element
      if (element.id) {
        return `#${element.id}`;
      }
      
      if (element.className && typeof element.className === 'string') {
        const classes = element.className.trim().split(/\s+/).join('.');
        if (classes) {
          return `${element.tagName.toLowerCase()}.${classes}`;
        }
      }
      
      // Fallback to XPath-like selector
      let path = [];
      let current = element;
      
      while (current && current.tagName) {
        let selector = current.tagName.toLowerCase();
        
        if (current.parentElement) {
          const siblings = Array.from(current.parentElement.children).filter(
            e => e.tagName === current.tagName
          );
          
          if (siblings.length > 1) {
            const index = siblings.indexOf(current) + 1;
            selector += `:nth-of-type(${index})`;
          }
        }
        
        path.unshift(selector);
        current = current.parentElement;
        
        if (path.length > 5) break; // Limit depth
      }
      
      return path.join(' > ');
    },
    
    interceptConsole() {
      const originalError = console.error;
      const originalWarn = console.warn;
      
      console.error = (...args) => {
        if (this.isRecording) {
          this.recordEvent('console_error', {
            message: args.map(a => String(a)).join(' '),
            stack: new Error().stack
          });
        }
        originalError.apply(console, args);
      };
      
      console.warn = (...args) => {
        if (this.isRecording) {
          this.recordEvent('console_warn', {
            message: args.map(a => String(a)).join(' ')
          });
        }
        originalWarn.apply(console, args);
      };
      
      // Capture unhandled errors
      window.addEventListener('error', (e) => {
        if (this.isRecording) {
          this.recordEvent('error', {
            message: e.message,
            filename: e.filename,
            lineno: e.lineno,
            colno: e.colno,
            stack: e.error?.stack
          });
        }
      });
    },
    
    interceptNetwork() {
      // Intercept fetch
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const startTime = Date.now();
        const url = args[0];
        
        try {
          const response = await originalFetch.apply(window, args);
          
          if (this.isRecording) {
            this.recordEvent('network_fetch', {
              url: typeof url === 'string' ? url : url.url,
              method: args[1]?.method || 'GET',
              status: response.status,
              duration: Date.now() - startTime
            });
          }
          
          return response;
        } catch (error) {
          if (this.isRecording) {
            this.recordEvent('network_fetch_error', {
              url: typeof url === 'string' ? url : url.url,
              error: error.message
            });
          }
          throw error;
        }
      };
      
      // Intercept XMLHttpRequest
      const originalOpen = XMLHttpRequest.prototype.open;
      const originalSend = XMLHttpRequest.prototype.send;
      
      XMLHttpRequest.prototype.open = function(method, url) {
        this._recordedMethod = method;
        this._recordedUrl = url;
        this._recordedStartTime = Date.now();
        return originalOpen.apply(this, arguments);
      };
      
      XMLHttpRequest.prototype.send = function() {
        const xhr = this;
        
        this.addEventListener('load', function() {
          if (RecorderUI.isRecording) {
            RecorderUI.recordEvent('network_xhr', {
              url: xhr._recordedUrl,
              method: xhr._recordedMethod,
              status: xhr.status,
              duration: Date.now() - xhr._recordedStartTime
            });
          }
        });
        
        this.addEventListener('error', function() {
          if (RecorderUI.isRecording) {
            RecorderUI.recordEvent('network_xhr_error', {
              url: xhr._recordedUrl,
              method: xhr._recordedMethod
            });
          }
        });
        
        return originalSend.apply(this, arguments);
      };
    },
    
    downloadRecording() {
      const data = {
        version: '1.0',
        recordedAt: new Date().toISOString(),
        duration: this.events[this.events.length - 1]?.timestamp || 0,
        events: this.events
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-recording-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Mark as saved
      this.hasUnsavedRecording = false;
    },
    
    close() {
      let shouldClose = true;
      
      // Warn if currently recording
      if (this.isRecording) {
        shouldClose = confirm(
          'You are currently recording a session. If you close now, your recording will be lost.\n\n' +
          'Are you sure you want to close?'
        );
      }
      // Warn if there's an unsaved recording
      else if (this.hasUnsavedRecording) {
        shouldClose = confirm(
          'You have a stopped recording that has not been downloaded.\n\n' +
          'Are you sure you want to close without downloading?'
        );
      }
      
      if (shouldClose) {
        document.getElementById('session-recorder').remove();
      }
    }
  };
  
  RecorderUI.init();
})();
