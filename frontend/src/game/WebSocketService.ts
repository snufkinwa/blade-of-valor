import { PlayerHealthBar } from "./classes/HealthBar";
import { EventBus } from "./EventBus";

const WEBSOCKET_BASE_URL = "ws://localhost:5328/ws/";

export class WebSocketService {
  private static instance: WebSocketService;
  private socket: WebSocket | null = null;
  private gameId: string | null = null;
  private playerHealthBar: PlayerHealthBar | null = null;
  private darklings: Phaser.Physics.Arcade.Group | null = null;
  private moveInterval: number | null = null;

  private constructor(gameId: string) {
    const backendUrl = `${WEBSOCKET_BASE_URL}${gameId}`;
    this.socket = new WebSocket(backendUrl);

    this.socket.onopen = () => {
      console.log("WebSocket connection established");
      this.startMoveUpdates();
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received message from server:", data);

      switch (data.status) {
        case "connected":
          this.gameId = data.gameId;
          console.log(`Connected to game with ID: ${this.gameId}`);
          break;

        case "success":
          EventBus.emit("server-response", data);
          break;

        case "error":
          console.error("Error from server:", data.message);
          break;

        case "game_over":
          console.log(`Game Over: ${data.reason} - Score: ${data.score}`);
          this.handleGameOver(data);
          break;

        default:
          console.warn("Unknown status from server:", data.status);
          break;
      }
    };

    this.socket.onclose = () => {
      console.log("WebSocket connection closed");
      this.cleanupSocket();
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  private handleGameOver(data: { reason: string; score: number }) {
    // Stop move updates
    this.stopMoveUpdates();

    // Emit game over event for UI handling
    EventBus.emit("game-over", {
      reason: data.reason,
      score: data.score,
      gameId: this.gameId,
    });

    // Clean up socket after a brief delay
    setTimeout(() => {
      this.cleanupSocket();
    }, 1000);
  }

  private cleanupSocket(): void {
    if (this.socket) {
      this.stopMoveUpdates();
      if (this.socket.readyState !== WebSocket.CLOSED) {
        this.socket.close();
      }
      this.socket = null;
    }
  }

  private requestMove() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      // Validate required game objects
      if (!this.playerHealthBar || !this.darklings) {
        console.warn(
          "Game objects not set. Using default values for health and darkling count."
        );
      }

      // Prepare the message to send
      const message = {
        type: "move",
        health: this.playerHealthBar?.getValue() || 100,
        darkling_count:
          this.darklings?.getChildren().filter((d) => d.active).length || 0,
      };

      // Debug log the message
      console.log("Sending WebSocket message:", JSON.stringify(message));

      // Validate the message before sending
      if (
        !message.type ||
        typeof message.health !== "number" ||
        typeof message.darkling_count !== "number"
      ) {
        console.error("Invalid message format:", message);
        return;
      }

      // Send the message to the WebSocket server
      this.socket.send(JSON.stringify(message));
    }
  }

  private startMoveUpdates() {
    if (this.moveInterval === null) {
      this.moveInterval = window.setInterval(() => {
        this.requestMove();
      }, 5000);
    }
  }

  private stopMoveUpdates() {
    if (this.moveInterval !== null) {
      window.clearInterval(this.moveInterval);
      this.moveInterval = null;
    }
  }

  public setGameObjects(
    healthBar: PlayerHealthBar,
    darklings: Phaser.Physics.Arcade.Group
  ) {
    this.playerHealthBar = healthBar;
    this.darklings = darklings;
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
