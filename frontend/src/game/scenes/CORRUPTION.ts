import { EventBus } from "../EventBus";
import { WebSocketService } from "../WebSocketService";
import { CombatSystem } from "../classes/combatSystem";
import { BaseScene } from "./BaseScene";

export class Corruption extends BaseScene {
  private wsService: WebSocketService | null = null;
  private orbText: Phaser.GameObjects.Text | null = null;
  private combatSystem: CombatSystem | null = null;

  constructor() {
    super("Corruption");
  }

  create() {
    super.create();

    this.setupWebSocket();
    this.setUpCombatSystem();
    this.setupOrbUI();
    this.setupEventListeners();

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

  private updateOrbText() {
    if (this.combatSystem) {
      const collectedOrbs = this.combatSystem.orbSystem.getCollectedOrbs();
      this.orbText?.setText(`Orbs: ${collectedOrbs}`);
    }
  }

  private setupOrbUI() {
    this.orbText = this.add.text(500, 50, "Orbs: 0", {
      fontSize: "16px",
      color: "#ffffff",
    });

    this.orbText.setDepth(1000);
    this.orbText.setScrollFactor(0);

    console.log("Orb text created:", this.orbText);

    this.time.addEvent({
      delay: 500,
      callback: this.updateOrbText,
      callbackScope: this,
      loop: true,
    });
  }

  private setUpCombatSystem() {
    this.combatSystem = new CombatSystem(this, this.player);
    this.combatSystem.setHealthBar(this.playerHealthBar);
  }

  update() {
    super.update();

    if (this.combatSystem) {
      this.combatSystem.update();
    }
  }

  shutdown() {
    if (this.wsService) {
      this.wsService = null;
    }

    EventBus.removeListener("server-response", this.handleServerResponse);
  }

  private cleanupBeforeTransition() {
    if (this.wsService) {
      this.wsService = null;
    }
    EventBus.removeListener("server-response");
    EventBus.removeListener("game-over");
    EventBus.removeListener("game-error");
    EventBus.removeListener("game-stage-update");
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.physics.world.shutdown();
  }

  changeScene() {
    this.cleanupBeforeTransition();
    this.scene.start("GameOver");
  }
}
