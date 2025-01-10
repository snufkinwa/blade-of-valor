import { PlayerHealthBar } from "./classes/HealthBar";
import { EventBus } from "./EventBus";

export class WebSocketService {
  private static instance: WebSocketService;
  private socket: WebSocket | null = null;
  private gameId: string;
  private playerHealthBar: PlayerHealthBar | null = null;
  private darklings: Phaser.Physics.Arcade.Group | null = null;
  private moveInterval: number | null = null;

  private constructor(gameId: string) {
    this.gameId = gameId;
    const backendUrl = `ws://localhost:5328/ws/${gameId}`;
    this.socket = new WebSocket(backendUrl);

    this.socket.onopen = () => {
      console.log("WebSocket connection established");
      this.startMoveUpdates(); // Start sending moves at regular intervals
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received message from server:", data);

      if (data.status === "success") {
        if (data.darkling_wave) {
          EventBus.emit("server-response", data);
        }
      } else if (data.status === "error") {
        console.error("Error from server:", data.message);
      } else if (data.status === "game_over") {
        console.log(`Game Over: ${data.reason}`);
        this.stopMoveUpdates(); // Stop updates when the game is over
      }
    };

    this.socket.onclose = () => {
      console.log("WebSocket connection closed");
      this.stopMoveUpdates(); // Clean up interval on close
      this.socket = null;
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  private requestMove() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      const message = {
        type: "move",
        health: this.playerHealthBar?.getValue() || 100,
        darkling_count: this.darklings?.countActive() || 0,
      };
      console.log("Sending WebSocket message:", message);
      this.socket.send(JSON.stringify(message));
    }
  }

  private startMoveUpdates() {
    if (this.moveInterval === null) {
      this.moveInterval = window.setInterval(() => {
        this.requestMove();
      }, 1000); // Adjust interval time as needed (1000ms = 1 second)
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
