import { EventBus } from "../EventBus";
import WebSocketService from "../WebSocketService";
import { CombatSystem } from "../classes/combatSystem";
import { BaseScene } from "./BaseScene";

export class Corruption extends BaseScene {
  private wsService: WebSocketService | null = null;
  private combatSystem!: CombatSystem;
  private corruptionLevel: number = 0;

  constructor() {
    super("Corruption");
  }

  create() {
    super.create();

    this.setupCombatSystem();
    this.setupWebSocket();
    this.setupEventListeners();
    EventBus.emit("current-scene-ready", this);
  }

  private setupCombatSystem() {
    this.combatSystem = new CombatSystem(this, 100, 300);
  }

  private setupWebSocket() {
    this.wsService = WebSocketService.getInstance("game1");
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

    if (this.combatSystem) {
      this.combatSystem.update();
    }

    this.updateCorruptionEffects();
  }

  shutdown() {
    if (this.wsService) {
      this.wsService = null;
    }

    this.combatSystem?.cleanup();

    EventBus.removeListener("server-response", this.handleServerResponse);
    EventBus.removeListener("player-corrupted", this.handlePlayerCorruption);
    EventBus.removeListener(
      "darkness-level-update",
      this.updateCorruptionLevel
    );
    EventBus.removeListener("light-level-change", this.handleLightLevelChange);
  }
}
