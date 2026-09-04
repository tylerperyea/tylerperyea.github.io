(function() {
  'use strict';
  
  const PlaybackUI = {
    events: [],
    currentIndex: 0,
    
    init() {
      this.createUI();
    },
    
    createUI() {
      const container = document.createElement('div');
      container.id = 'session-playback';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #34495e;
        color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        z-index: 999999;
        font-family: Arial, sans-serif;
        font-size: 14px;
        width: 400px;
        max-height: 80vh;
        overflow-y: auto;
      `;
      
      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <div style="font-weight: bold; font-size: 16px;">Session Playback</div>
          <button id="playback-close-x" style="background: none; border: none; color: #bdc3c7; cursor: pointer; font-size: 20px; padding: 0; width: 24px; height: 24px; line-height: 20px; border-radius: 3px;" title="Close playback">×</button>
        </div>
        
        <div id="playback-upload">
          <div style="margin-bottom: 15px;">
            <input type="file" id="playback-file" accept=".json" style="margin-bottom: 10px; color: white; width: 100%;">
            <div style="font-size: 12px; color: #bdc3c7;">Upload a session recording JSON file</div>
          </div>
          
          <div style="margin-bottom: 10px; text-align: center; color: #bdc3c7; font-size: 12px;">— OR —</div>
          
          <div>
            <textarea id="playback-paste" placeholder="Paste JSON here..." style="width: 100%; height: 120px; padding: 10px; background: #2c3e50; color: white; border: 1px solid #7f8c8d; border-radius: 4px; font-family: monospace; font-size: 12px; resize: vertical;"></textarea>
            <button id="playback-load-json" style="width: 100%; padding: 10px; margin-top: 10px; cursor: pointer; background: #3498db; color: white; border: none; border-radius: 4px; font-weight: bold;">Load JSON</button>
          </div>
        </div>
        
        <div id="playback-controls" style="display: none;">
          <div style="margin-bottom: 15px; padding: 10px; background: #2c3e50; border-radius: 4px;">
            <div style="font-size: 12px; color: #bdc3c7; margin-bottom: 5px;">Progress</div>
            <div id="playback-progress" style="font-weight: bold;">Step 0 of 0</div>
            <div id="playback-time" style="font-size: 12px; color: #bdc3c7; margin-top: 5px;">Time: 0ms</div>
          </div>
          
          <div id="playback-event-details" style="margin-bottom: 15px; padding: 10px; background: #2c3e50; border-radius: 4px; min-height: 100px;">
            <div style="font-size: 12px; color: #bdc3c7; margin-bottom: 5px;">Current Event</div>
            <div id="playback-event-content">No event loaded</div>
          </div>
          
          <div style="display: flex; gap: 10px; margin-bottom: 10px;">
            <button id="playback-prev" style="flex: 1; padding: 10px; cursor: pointer; background: #95a5a6; color: white; border: none; border-radius: 4px; font-weight: bold;">← Previous</button>
            <button id="playback-next" style="flex: 1; padding: 10px; cursor: pointer; background: #3498db; color: white; border: none; border-radius: 4px; font-weight: bold;">Next →</button>
          </div>
          
          <div style="display: flex; gap: 10px;">
            <button id="playback-jump" style="flex: 1; padding: 8px; cursor: pointer; background: #7f8c8d; color: white; border: none; border-radius: 4px;">Jump to Step...</button>
            <button id="playback-new" style="flex: 1; padding: 8px; cursor: pointer; background: #16a085; color: white; border: none; border-radius: 4px;">Load New</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(container);
      
      // Event listeners for upload screen
      document.getElementById('playback-file').addEventListener('change', (e) => this.loadFile(e));
      document.getElementById('playback-load-json').addEventListener('click', () => this.loadPastedJSON());
      
      // Event listeners for playback controls
      document.getElementById('playback-prev').addEventListener('click', () => this.previousStep());
      document.getElementById('playback-next').addEventListener('click', () => this.nextStep());
      document.getElementById('playback-jump').addEventListener('click', () => this.jumpToStep());
      document.getElementById('playback-new').addEventListener('click', () => this.loadNewRecording());
      
      // Close button (works in both modes)
      const closeBtn = document.getElementById('playback-close-x');
      closeBtn.addEventListener('click', () => this.close());
      
      // Add hover effect for close button
      closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.background = '#e74c3c';
        closeBtn.style.color = 'white';
      });
      closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.background = 'none';
        closeBtn.style.color = '#bdc3c7';
      });
    },
    
    loadFile(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          this.loadRecording(data);
        } catch (error) {
          alert('Error loading file: ' + error.message);
        }
      };
      reader.readAsText(file);
    },
    
    loadPastedJSON() {
      const jsonText = document.getElementById('playback-paste').value.trim();
      
      if (!jsonText) {
        alert('Please paste JSON data first');
        return;
      }
      
      try {
        const data = JSON.parse(jsonText);
        this.loadRecording(data);
      } catch (error) {
        alert('Error parsing JSON: ' + error.message + '\n\nPlease make sure you pasted valid JSON.');
      }
    },
    
    loadRecording(data) {
      this.events = data.events || [];
      this.currentIndex = 0;
      
      if (this.events.length === 0) {
        alert('No events found in the recording');
        return;
      }
      
      document.getElementById('playback-upload').style.display = 'none';
      document.getElementById('playback-controls').style.display = 'block';
      
      this.showCurrentEvent();
    },
    
    loadNewRecording() {
      // Clear current recording
      this.events = [];
      this.currentIndex = 0;
      
      // Clear file input and textarea
      document.getElementById('playback-file').value = '';
      document.getElementById('playback-paste').value = '';
      
      // Remove highlights
      document.querySelectorAll('.playback-highlight').forEach(el => {
        el.classList.remove('playback-highlight');
      });
      
      // Show upload screen
      document.getElementById('playback-controls').style.display = 'none';
      document.getElementById('playback-upload').style.display = 'block';
    },
    
    showCurrentEvent() {
      if (this.events.length === 0) return;
      
      const event = this.events[this.currentIndex];
      
      // Update progress
      document.getElementById('playback-progress').textContent = 
        `Step ${this.currentIndex + 1} of ${this.events.length}`;
      document.getElementById('playback-time').textContent = 
        `Time: ${event.timestamp}ms`;
      
      // Clear previous highlights
      document.querySelectorAll('.playback-highlight').forEach(el => {
        el.classList.remove('playback-highlight');
      });
      
      // Show event details
      const details = this.formatEventDetails(event);
      document.getElementById('playback-event-content').innerHTML = details;
      
      // Highlight element if applicable
      if (event.data.selector) {
        this.highlightElement(event.data.selector);
      }
      
      // Update button states
      document.getElementById('playback-prev').disabled = this.currentIndex === 0;
      document.getElementById('playback-next').disabled = this.currentIndex === this.events.length - 1;
    },
    
    formatEventDetails(event) {
      let html = `<div style="margin-bottom: 10px;">
        <strong style="color: #3498db;">${event.type.toUpperCase()}</strong>
      </div>`;
      
      // Check if there are errors nearby
      const errorWindow = 1000; // 1 second
      const nearbyErrors = this.events.filter((e, idx) => {
        return (e.type === 'console_error' || e.type === 'error') &&
               Math.abs(e.timestamp - event.timestamp) < errorWindow &&
               idx !== this.currentIndex;
      });
      
      if (nearbyErrors.length > 0) {
        html += `<div style="background: #e74c3c; padding: 8px; border-radius: 4px; margin-bottom: 10px;">
          <strong>⚠️ ERROR DETECTED NEARBY</strong><br>
          <span style="font-size: 12px;">${nearbyErrors.length} error(s) within 1 second</span>
        </div>`;
      }
      
      // Event-specific details
      switch (event.type) {
        case 'click':
          html += `
            <div style="font-size: 12px; line-height: 1.6;">
              <strong>Action:</strong> Click on element<br>
              <strong>Element:</strong> <code style="background: #2c3e50; padding: 2px 4px; border-radius: 2px;">${event.data.selector}</code><br>
              <strong>Tag:</strong> ${event.data.tagName}<br>
              ${event.data.text ? `<strong>Text:</strong> "${event.data.text.substring(0, 50)}..."<br>` : ''}
              <strong>Position:</strong> (${event.data.x}, ${event.data.y})
            </div>
          `;
          break;
          
        case 'input':
          html += `
            <div style="font-size: 12px; line-height: 1.6;">
              <strong>Action:</strong> Type into field<br>
              <strong>Element:</strong> <code style="background: #2c3e50; padding: 2px 4px; border-radius: 2px;">${event.data.selector}</code><br>
              <strong>Type:</strong> ${event.data.inputType || 'text'}<br>
              <strong>Value:</strong> <code style="background: #2c3e50; padding: 2px 4px; border-radius: 2px;">${event.data.value}</code>
            </div>
          `;
          break;
          
        case 'console_error':
        case 'error':
          html += `
            <div style="font-size: 12px; line-height: 1.6; background: #c0392b; padding: 8px; border-radius: 4px;">
              <strong>Error Message:</strong><br>
              <code style="display: block; margin-top: 5px; white-space: pre-wrap; font-size: 11px;">${event.data.message}</code>
              ${event.data.stack ? `<details style="margin-top: 5px;"><summary style="cursor: pointer;">Stack Trace</summary><code style="display: block; margin-top: 5px; white-space: pre-wrap; font-size: 10px;">${event.data.stack}</code></details>` : ''}
            </div>
          `;
          break;
          
        case 'network_fetch':
        case 'network_xhr':
          const statusColor = event.data.status >= 400 ? '#e74c3c' : '#27ae60';
          html += `
            <div style="font-size: 12px; line-height: 1.6;">
              <strong>Network Request:</strong><br>
              <strong>URL:</strong> <code style="background: #2c3e50; padding: 2px 4px; border-radius: 2px; font-size: 11px;">${event.data.url}</code><br>
              <strong>Method:</strong> ${event.data.method}<br>
              <strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${event.data.status}</span><br>
              <strong>Duration:</strong> ${event.data.duration}ms
            </div>
          `;
          break;
          
        case 'navigation':
          html += `
            <div style="font-size: 12px; line-height: 1.6;">
              <strong>Page Navigation:</strong><br>
              <strong>From:</strong> <code style="background: #2c3e50; padding: 2px 4px; border-radius: 2px; font-size: 11px;">${event.data.from}</code><br>
              <strong>To:</strong> <code style="background: #2c3e50; padding: 2px 4px; border-radius: 2px; font-size: 11px;">${event.data.to}</code>
            </div>
          `;
          break;
          
        case 'scroll':
          html += `
            <div style="font-size: 12px; line-height: 1.6;">
              <strong>Action:</strong> Scroll page<br>
              <strong>Position:</strong> (${event.data.x}, ${event.data.y})
            </div>
          `;
          break;
          
        default:
          html += `
            <div style="font-size: 12px;">
              <pre style="background: #2c3e50; padding: 8px; border-radius: 4px; overflow-x: auto; font-size: 11px;">${JSON.stringify(event.data, null, 2)}</pre>
            </div>
          `;
      }
      
      // URL info
      if (event.url) {
        html += `<div style="margin-top: 10px; font-size: 11px; color: #bdc3c7;">
          <strong>Page:</strong> ${event.url}
        </div>`;
      }
      
      return html;
    },
    
    highlightElement(selector) {
      try {
        const element = document.querySelector(selector);
        if (element && !element.closest('#session-playback')) {
          // Add highlight class
          if (!document.getElementById('playback-styles')) {
            const style = document.createElement('style');
            style.id = 'playback-styles';
            style.textContent = `
              .playback-highlight {
                outline: 3px solid #3498db !important;
                outline-offset: 2px !important;
                background-color: rgba(52, 152, 219, 0.1) !important;
              }
              @keyframes playback-pulse {
                0%, 100% { outline-color: #3498db; }
                50% { outline-color: #e74c3c; }
              }
              .playback-highlight {
                animation: playback-pulse 1s ease-in-out infinite;
              }
            `;
            document.head.appendChild(style);
          }
          
          element.classList.add('playback-highlight');
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (!element) {
          console.warn('Element not found:', selector);
        }
      } catch (error) {
        console.warn('Error highlighting element:', error);
      }
    },
    
    nextStep() {
      if (this.currentIndex < this.events.length - 1) {
        this.currentIndex++;
        this.showCurrentEvent();
      }
    },
    
    previousStep() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.showCurrentEvent();
      }
    },
    
    jumpToStep() {
      const step = prompt(`Jump to step (1-${this.events.length}):`);
      if (step) {
        const index = parseInt(step) - 1;
        if (index >= 0 && index < this.events.length) {
          this.currentIndex = index;
          this.showCurrentEvent();
        } else {
          alert('Invalid step number');
        }
      }
    },
    
    close() {
      document.getElementById('session-playback').remove();
      
      // Remove highlight styles
      document.getElementById('playback-styles')?.remove();
      document.querySelectorAll('.playback-highlight').forEach(el => {
        el.classList.remove('playback-highlight');
      });
    }
  };
  
  PlaybackUI.init();
})();
