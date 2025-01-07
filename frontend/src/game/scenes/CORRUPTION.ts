import { EventBus } from "../EventBus";
import WebSocketService from "../WebSocketService";
import Darkling from "../classes/darkling";
import { CombatSystem } from "../classes/combatSystem";
import { BaseScene } from "./BaseScene";

export class Corruption extends BaseScene {
  private wsService: WebSocketService | null = null;
  private corruptionLevel: number = 0;
  constructor() {
    super("Corruption");
  }

  create() {
    super.create();

    this.setupWebSocket();
    this.setUpCombatSystem();
    this.setupEventListeners();
    this.testWebSocketConnection("game1");

    EventBus.emit("current-scene-ready", this);
  }

  private setupWebSocket() {
    this.wsService = WebSocketService.getInstance("game1");
  }

  private async testWebSocketConnection(gameId: string) {
    const wsUrl = `ws://localhost:5328/ws/${gameId}`;
    let websocket: WebSocket;

    try {
      console.log(`Connecting to WebSocket at ${wsUrl}...`);
      websocket = new WebSocket(wsUrl);

      // Event listeners
      websocket.onopen = () => {
        console.log(`WebSocket connection established for game ID: ${gameId}`);
      };

      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Received response from server:", data);

        // Handle specific game updates
        if (data.status === "success") {
          if (data.engine_move) {
            console.log("Engine's move:", data.engine_move);
          }
          if (data.darkling_wave) {
            console.log("Darkling wave stats:", data.darkling_wave);
          }
          if (data.darkness_stats) {
            console.log("Darkness stats:", data.darkness_stats);
          }
        } else if (data.status === "error") {
          console.error("Error response from server:", data.message);
        } else {
          console.log("Unexpected response:", data);
        }
      };

      websocket.onerror = (event) => {
        console.error("WebSocket error occurred:", event);
      };

      websocket.onclose = (event) => {
        console.log(
          `WebSocket connection closed: [${event.code}] ${event.reason}`
        );
      };
    } catch (error) {
      console.error("Error during WebSocket test:", error);
    }
  }

  private setupEventListeners() {
    EventBus.on("server-response", this.handleServerResponse, this);
    EventBus.on("player-corrupted", this.handlePlayerCorruption, this);
    EventBus.on("darkness-level-update", this.updateCorruptionLevel, this);
    EventBus.on("light-level-change", this.handleLightLevelChange, this);
  }

  private handleServerResponse(data: any) {
    if (data.game_stage) {
      EventBus.emit("game-stage-update", data.game_stage);
    }
    if (data.darkling_wave) {
      EventBus.emit("darkling-wave", data.darkling_wave);
    }
  }

  private setUpCombatSystem() {
    const combatSystem = new CombatSystem(this, this.player);
  }

  private handlePlayerCorruption() {
    this.cameras.main.shake(500, 0.005);
    this.cameras.main.flash(500, 128, 0, 128);
    this.corruptionLevel += 10;
    this.updateCorruptionEffects();
  }

  private handleLightLevelChange(level: number) {
    this.corruptionLevel = Math.max(0, this.corruptionLevel - level * 0.1);
    this.updateCorruptionEffects();
  }

  private updateCorruptionLevel(level: number) {
    this.corruptionLevel = level;
    this.updateCorruptionEffects();
  }

  private updateCorruptionEffects() {
    const intensity = this.corruptionLevel / 100;

    this.fogLayers["fogTop1"].setAlpha(0.6 + intensity * 0.4);
    this.fogLayers["fogTop2"].setAlpha(0.6 + intensity * 0.4);
  }

  update() {
    super.update();

    this.updateCorruptionEffects();
  }

  shutdown() {
    if (this.wsService) {
      this.wsService = null;
    }

    EventBus.removeListener("server-response", this.handleServerResponse);
    EventBus.removeListener("player-corrupted", this.handlePlayerCorruption);
    EventBus.removeListener(
      "darkness-level-update",
      this.updateCorruptionLevel
    );
    EventBus.removeListener("light-level-change", this.handleLightLevelChange);
  }

  changeScene() {
    this.scene.start("FinalBattle");
  }
}
