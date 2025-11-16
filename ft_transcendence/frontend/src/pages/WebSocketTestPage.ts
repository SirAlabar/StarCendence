// WebSocket Test Page - Simple test interface for WebSocket connection
// This page is for testing purposes only and can be easily removed
import { webSocketService } from '../services/websocket/WebSocketService';
import { LoginService } from '../services/auth/LoginService';

export default class WebSocketTestPage {
  private container: HTMLElement | null = null;
  private messagesContainer: HTMLElement | null = null;
  private statusElement: HTMLElement | null = null;
  private connectButton: HTMLElement | null = null;
  private disconnectButton: HTMLElement | null = null;
  private messageInput: HTMLInputElement | null = null;
  private sendButton: HTMLElement | null = null;
  private messageTypeInput: HTMLInputElement | null = null;

  render(): string {
    // Check if user is authenticated
    if (!LoginService.isAuthenticated()) {
      return `
        <div style="padding: 2rem; text-align: center; color: #000;">
          <h1 style="color: #000 !important;">WebSocket Test Page</h1>
          <p style="color: #000 !important;">Please <a href="/login" data-link style="color: #000 !important;">login</a> first to test WebSocket connection.</p>
        </div>
      `;
    }

    return `
      <style>
        #ws-message-input::placeholder,
        #ws-message-type::placeholder {
          color: #666 !important;
          opacity: 1;
        }
        #ws-test-page-container h1,
        #ws-test-page-container h2,
        #ws-test-page-container p,
        #ws-test-page-container label {
          color: #000 !important;
        }
        #ws-message-type,
        #ws-message-input {
          color: #000 !important;
          background: white !important;
        }
      </style>
      <div id="ws-test-page-container" style="max-width: 1200px; margin: 0 auto; padding: 2rem; color: #000;">
        <h1 style="margin-bottom: 1rem; color: #000 !important;">WebSocket Test Page</h1>
        <p style="color: #000 !important; margin-bottom: 2rem;">
          This is a test page for WebSocket functionality. You can test sending and receiving messages here.
        </p>
        
        <div style="background: #f5f5f5; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
          <h2 style="margin-top: 0; font-size: 1.2rem; color: #000 !important;">Connection Status</h2>
          <div id="ws-status" style="display: inline-block; padding: 0.5rem 1rem; border-radius: 4px; margin: 0.5rem 0; font-weight: bold; color: #000 !important;">
            Checking...
          </div>
          <div style="margin-top: 1rem; display: flex; gap: 1rem;">
            <button id="ws-connect-btn" style="padding: 0.5rem 1rem; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Connect
            </button>
            <button id="ws-disconnect-btn" style="padding: 0.5rem 1rem; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Disconnect
            </button>
          </div>
        </div>

        <div style="background: #f5f5f5; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
          <h2 style="margin-top: 0; font-size: 1.2rem; color: #000 !important;">Send Test Message</h2>
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: bold; color: #000 !important;">Message Type:</label>
              <input 
                id="ws-message-type" 
                type="text" 
                value="test:message" 
                style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; background: white !important; color: #000 !important;"
              />
            </div>
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: bold; color: #000 !important;">Message Payload (JSON):</label>
              <input 
                id="ws-message-input" 
                type="text" 
                placeholder='{"message": "Hello, WebSocket!"}' 
                style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; background: white !important; color: #000 !important;"
              />
            </div>
            <button 
              id="ws-send-btn" 
              style="padding: 0.5rem 1rem; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; align-self: flex-start;"
            >
              Send Message
            </button>
          </div>
        </div>

        <div style="background: #f5f5f5; padding: 1.5rem; border-radius: 8px;">
          <h2 style="margin-top: 0; font-size: 1.2rem; color: #000 !important;">Received Messages</h2>
          <div 
            id="ws-messages" 
            style="background: white; border: 1px solid #ddd; border-radius: 4px; padding: 1rem; max-height: 400px; overflow-y: auto; min-height: 200px; font-family: monospace; font-size: 0.9rem; color: #000 !important;"
          >
            <div style="color: #000 !important;">No messages received yet...</div>
          </div>
          <button 
            id="ws-clear-btn" 
            style="margin-top: 1rem; padding: 0.5rem 1rem; background: #9E9E9E; color: white; border: none; border-radius: 4px; cursor: pointer;"
          >
            Clear Messages
          </button>
        </div>
      </div>
    `;
  }

  private setupEventHandlers(): void {
    this.statusElement = document.getElementById('ws-status');
    this.connectButton = document.getElementById('ws-connect-btn');
    this.disconnectButton = document.getElementById('ws-disconnect-btn');
    this.messageInput = document.getElementById('ws-message-input') as HTMLInputElement;
    this.messageTypeInput = document.getElementById('ws-message-type') as HTMLInputElement;
    this.sendButton = document.getElementById('ws-send-btn');
    this.messagesContainer = document.getElementById('ws-messages');

    // Connect button
    this.connectButton?.addEventListener('click', async () => {
      try {
        await webSocketService.connect();
        this.updateStatus();
        this.addMessage('System', 'Connected to WebSocket server', 'success');
      } catch (error) {
        this.addMessage('System', `Failed to connect: ${error}`, 'error');
        this.updateStatus();
      }
    });

    // Disconnect button
    this.disconnectButton?.addEventListener('click', () => {
      webSocketService.disconnect();
      this.updateStatus();
      this.addMessage('System', 'Disconnected from WebSocket server', 'info');
    });

    // Send message button
    this.sendButton?.addEventListener('click', () => {
      this.sendTestMessage();
    });

    // Enter key to send message
    this.messageInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendTestMessage();
      }
    });

    // Clear messages button
    const clearButton = document.getElementById('ws-clear-btn');
    clearButton?.addEventListener('click', () => {
      if (this.messagesContainer) {
        this.messagesContainer.innerHTML = '<div style="color: #000 !important;">No messages received yet...</div>';
      }
    });

    // Listen to WebSocket messages
    webSocketService.on('*', (message: any) => {
      this.addMessage('Received', JSON.stringify(message, null, 2), 'received');
    });

    // Listen to connection status changes
    window.addEventListener('websocket:connected', () => {
      this.updateStatus();
      this.addMessage('System', 'WebSocket connection established', 'success');
    });

    window.addEventListener('websocket:disconnected', () => {
      this.updateStatus();
      this.addMessage('System', 'WebSocket connection closed', 'info');
    });

    window.addEventListener('websocket:error', (e: any) => {
      this.updateStatus();
      this.addMessage('System', `WebSocket error: ${e.detail || 'Unknown error'}`, 'error');
    });
  }

  private async sendTestMessage(): Promise<void> {
    if (!this.messageInput || !this.messageTypeInput) return;

    const messageType = this.messageTypeInput.value.trim() || 'test:message';
    let payload: any = {};

    // Try to parse JSON payload
    const payloadText = this.messageInput.value.trim();
    if (payloadText) {
      try {
        payload = JSON.parse(payloadText);
      } catch (error) {
        // If not valid JSON, use as string
        payload = { message: payloadText };
      }
    }

    try {
      if (!webSocketService.isConnected()) {
        this.addMessage('System', 'Not connected to WebSocket server', 'error');
        return;
      }

      const success = webSocketService.send(messageType, payload);
      
      if (success) {
        const message = {
          type: messageType,
          payload: payload,
          timestamp: Date.now(),
        };
        this.addMessage('Sent', JSON.stringify(message, null, 2), 'sent');
        this.messageInput.value = '';
      } else {
        this.addMessage('System', 'Failed to send message', 'error');
      }
    } catch (error) {
      this.addMessage('System', `Failed to send message: ${error}`, 'error');
    }
  }

  private updateStatus(): void {
    if (!this.statusElement || !this.connectButton || !this.disconnectButton) return;

    const isConnected = webSocketService.isConnected();
    
    if (isConnected) {
      this.statusElement.textContent = 'Connected';
      this.statusElement.style.background = '#4CAF50';
      this.statusElement.style.color = 'white';
      this.connectButton.setAttribute('disabled', 'true');
      (this.connectButton as HTMLButtonElement).style.opacity = '0.5';
      this.disconnectButton.removeAttribute('disabled');
      (this.disconnectButton as HTMLButtonElement).style.opacity = '1';
    } else {
      this.statusElement.textContent = 'Disconnected';
      this.statusElement.style.background = '#f44336';
      this.statusElement.style.color = 'white';
      this.connectButton.removeAttribute('disabled');
      (this.connectButton as HTMLButtonElement).style.opacity = '1';
      this.disconnectButton.setAttribute('disabled', 'true');
      (this.disconnectButton as HTMLButtonElement).style.opacity = '0.5';
    }
  }

  private addMessage(source: string, message: string, type: 'sent' | 'received' | 'success' | 'error' | 'info'): void {
    if (!this.messagesContainer) return;

    // Clear "No messages" placeholder
    if (this.messagesContainer.innerHTML.includes('No messages received yet')) {
      this.messagesContainer.innerHTML = '';
    }

    const messageDiv = document.createElement('div');
    messageDiv.style.padding = '0.5rem';
    messageDiv.style.marginBottom = '0.5rem';
    messageDiv.style.borderLeft = '3px solid';
    messageDiv.style.background = '#fafafa';

    const colors: Record<string, string> = {
      sent: '#2196F3',
      received: '#4CAF50',
      success: '#4CAF50',
      error: '#f44336',
      info: '#FF9800',
    };

    messageDiv.style.borderLeftColor = colors[type] || '#999';

    const timestamp = new Date().toLocaleTimeString();
    messageDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
        <strong style="color: #000 !important;">[${source}]</strong>
        <span style="color: #000 !important; font-size: 0.85rem;">${timestamp}</span>
      </div>
      <pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word; color: #000 !important;">${message}</pre>
    `;

    this.messagesContainer.insertBefore(messageDiv, this.messagesContainer.firstChild);

    // Limit to 50 messages
    while (this.messagesContainer.children.length > 50) {
      this.messagesContainer.removeChild(this.messagesContainer.lastChild!);
    }
  }

  mount(selector: string): void {
    this.container = document.querySelector(selector);
    if (!this.container) {
      console.error(`Element with selector "${selector}" not found`);
      return;
    }
    this.setupEventHandlers();
    this.updateStatus();
  }

  dispose(): void {
    // Cleanup - remove event listeners if needed
    this.container = null;
    this.messagesContainer = null;
    this.statusElement = null;
    this.connectButton = null;
    this.disconnectButton = null;
    this.messageInput = null;
    this.messageTypeInput = null;
    this.sendButton = null;
  }
}

