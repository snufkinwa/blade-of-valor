import { EventBus } from "./EventBus";

class WebSocketService {
  private static instance: WebSocketService;
  private socket: WebSocket | null = null;
  private gameId: string;

  private constructor(gameId: string) {
    this.gameId = gameId;
    const backendUrl = `ws://localhost:5328/ws/${gameId}`;
    this.socket = new WebSocket(backendUrl);

    this.socket.onopen = () => {
      console.log("WebSocket connection established");
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.status === "success") {
        EventBus.emit("server-response", data);
      } else if (data.status === "error") {
        console.error("Error from server:", data.message);
      }
    };

    this.socket.onclose = () => {
      console.log("WebSocket connection closed");
      this.socket = null;
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  public static getInstance(gameId: string): WebSocketService {
    if (
      !WebSocketService.instance ||
      WebSocketService.instance.gameId !== gameId
    ) {
      WebSocketService.instance = new WebSocketService(gameId);
    }
    return WebSocketService.instance;
  }

  public sendMessage(message: Record<string, any>): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not open");
    }
  }
}

export default WebSocketService;
