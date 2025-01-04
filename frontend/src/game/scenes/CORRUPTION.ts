import { EventBus } from "../EventBus";
import WebSocketService from "../WebSocketService";
import { CombatSystem } from "../classes/combatSystem";
import { BaseScene } from "./BaseScene";

export class Corruption extends BaseScene {
  private wsService: WebSocketService | null = null;

  constructor() {
    super("Corruption");
  }

  create() {
    // Create environment and characters
    // Initialize WebSocket only when this scene starts
    this.wsService = WebSocketService.getInstance("game1");

    // Set up WebSocket response handling
    EventBus.on("server-response", (data: any) => {
      if (data.game_stage) {
        EventBus.emit("game-stage-update", data.game_stage);
      }
      if (data.darkling_wave) {
        EventBus.emit("darkling-wave", data.darkling_wave);
      }
    });

    EventBus.emit("current-scene-ready", this);
  }

  update() {
    // Update logic
  }

  changeScene() {
    // Clean up WebSocket before changing scene
    if (this.wsService) {
      this.wsService = null;
    }
    this.scene.start("GameOver");
  }

  shutdown() {
    // Clean up when scene shuts down
    if (this.wsService) {
      this.wsService = null;
    }
    EventBus.removeListener("server-response");
  }
}
