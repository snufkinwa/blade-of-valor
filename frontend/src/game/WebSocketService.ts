import { PlayerHealthBar } from "./classes/HealthBar";
import { EventBus } from "./EventBus";

export class WebSocketService {
  private static instance: WebSocketService;
  private socket: WebSocket | null = null;
  private gameId: string;
  private playerHealthBar: PlayerHealthBar | null = null;
  private darklings: Phaser.Physics.Arcade.Group | null = null;
  private isConnected: boolean = false;

  private constructor(gameId: string) {
    this.gameId = gameId;
    const backendUrl = `ws://localhost:5328/ws/${gameId}`;
    this.socket = new WebSocket(backendUrl);

    this.socket.onopen = () => {
      console.log("WebSocket connection established");
      this.isConnected = true;
      // Only send game state if we have the required objects
      if (this.playerHealthBar && this.darklings) {
        this.sendGameState();
      }
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received response from server:", data);
      if (data.status === "success") {
        if (data.engine_move) {
          console.log("Engine's move:", data.engine_move);
        }
        if (data.darkling_wave) {
          console.log("Darkling wave:", data.darkling_wave);
        }
        EventBus.emit("server-response", data);
      } else if (data.status === "error") {
        console.error("Error from server:", data.message);
      }
    };

    this.socket.onclose = () => {
      console.log("WebSocket connection closed");
      this.socket = null;
      this.isConnected = false;
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  public setGameObjects(
    healthBar: PlayerHealthBar,
    darklings: Phaser.Physics.Arcade.Group
  ) {
    this.playerHealthBar = healthBar;
    this.darklings = darklings;
    // Send game state if we're already connected
    if (this.isConnected) {
      this.sendGameState();
    }
  }

  public sendGameState(): void {
    if (
      this.socket?.readyState === WebSocket.OPEN &&
      this.playerHealthBar &&
      this.darklings
    ) {
      try {
        const message = {
          type: "move",
          health: this.playerHealthBar.getValue() ?? 100,
          darkling_count: this.darklings.getChildren().length ?? 0,
        };
        this.socket.send(JSON.stringify(message));
      } catch (error) {
        console.error("Error sending game state:", error);
      }
    }
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
}
