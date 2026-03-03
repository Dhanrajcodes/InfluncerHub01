// frontend/src/services/websocket.ts
class WebSocketService {
  private ws: WebSocket | null = null;
  private messageListeners: ((message: any) => void)[] = [];
  private connectionListeners: ((connected: boolean) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private token: string | null = null;
  private isIntentionallyClosed = false;

  connect(token: string) {
    // Close existing connection if present
    if (this.ws) {
      this.isIntentionallyClosed = false;
      this.ws.close();
    }

    this.token = token;

    // Determine WebSocket URL based on current environment
    let wsUrl: string;
    
    const apiBaseUrl = process.env.REACT_APP_API_URL || process.env.VITE_API_URL;

    if (apiBaseUrl) {
      // Use the API URL from environment variables
      const url = new URL(apiBaseUrl);
      
      // Change http to ws and https to wss
      if (url.protocol === 'https:') {
        wsUrl = `wss://${url.host}`;
      } else {
        wsUrl = `ws://${url.host}`;
      }
    } else {
      // Fallback for development environment
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      wsUrl = `${protocol}//${host}`;
    }

    try {
      this.ws = new WebSocket(`${wsUrl}?token=${token}`);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected to:', wsUrl);
        this.reconnectAttempts = 0;
        this.notifyConnectionListeners(true);
        
        // Send authentication token upon connection
        if (token) {
          this.send({ type: 'auth', token });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.notifyMessageListeners(message);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
        this.notifyConnectionListeners(false);
        
        // Reconnect if not intentionally closed and not reached max attempts
        if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (err) {
      console.error('Error establishing WebSocket connection:', err);
      this.attemptReconnect();
    }
  }

  disconnect() {
    this.isIntentionallyClosed = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', data);
    }
  }

  addMessageListener(callback: (message: any) => void) {
    this.messageListeners.push(callback);
  }

  removeMessageListener(callback: (message: any) => void) {
    this.messageListeners = this.messageListeners.filter(listener => listener !== callback);
  }

  addConnectionListener(callback: (connected: boolean) => void) {
    this.connectionListeners.push(callback);
  }

  removeConnectionListener(callback: (connected: boolean) => void) {
    this.connectionListeners = this.connectionListeners.filter(listener => listener !== callback);
  }

  private notifyMessageListeners(message: any) {
    this.messageListeners.forEach(listener => listener(message));
  }

  private notifyConnectionListeners(connected: boolean) {
    this.connectionListeners.forEach(listener => listener(connected));
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (this.token) {
          this.connect(this.token);
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnect attempts reached. Giving up.');
    }
  }
}

const websocketService = new WebSocketService();
export default websocketService;
