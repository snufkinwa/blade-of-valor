import { EventBus } from "../EventBus";
import { WebSocketService } from "../WebSocketService";
import Darkling from "../classes/darkling";
import { CombatSystem } from "../classes/combatSystem";
import { BaseScene } from "./BaseScene";

export class Corruption extends BaseScene {
  private wsService: WebSocketService | null = null;

  constructor() {
    super("Corruption");
  }

  create() {
    super.create();

    this.setupWebSocket();
    this.setUpCombatSystem();
    this.setupEventListeners();
    //this.testWebSocketConnection("game1");

    EventBus.emit("current-scene-ready", this);
  }

  private setupWebSocket() {
    this.wsService = WebSocketService.getInstance("game1");
    if (this.wsService) {
      this.wsService.setGameObjects(this.playerHealthBar, this.darklings);
    }
  }

  private setupEventListeners() {
    EventBus.on("server-response", (data: any) => {
      if (data.engine_move) {
        console.log("Engine move:", data.engine_move);
      }
    });
  }

  private handleServerResponse(data: any) {
    if (data.game_stage) {
      EventBus.emit("game-stage-update", data.game_stage);
    }
  }

  private setUpCombatSystem() {
    const combatSystem = new CombatSystem(this, this.player);
    combatSystem.setHealthBar(this.playerHealthBar);
  }

  update() {
    super.update();
  }

  shutdown() {
    if (this.wsService) {
      this.wsService = null;
    }

    EventBus.removeListener("server-response", this.handleServerResponse);
  }

  changeScene() {
    this.scene.start("GameOver");
  }
}
