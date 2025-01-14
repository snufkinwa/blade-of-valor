import { EventBus } from "../EventBus";
import { CombatSystem } from "../classes/combatSystem";
import { BaseScene } from "./BaseScene";

export class Corruption extends BaseScene {
  private orbText: Phaser.GameObjects.Text | null = null;
  private timerText: Phaser.GameObjects.Text | null = null;
  private combatSystem: CombatSystem | null = null;
  private timerDuration: number = 60; // Timer duration in seconds
  private timerEvent: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super("Corruption");
  }

  create() {
    super.create();

    this.setUpCombatSystem();
    this.setupUI();
    this.setupEventListeners();

    // Start the timer
    this.startTimer();

    EventBus.emit("current-scene-ready", this);
  }

  private setupEventListeners() {
    EventBus.on("server-response", (data: any) => {
      if (data.engine_move) {
        console.log("Engine move:", data.engine_move);
      }
    });
  }

  private updateOrbText() {
    if (this.combatSystem) {
      const collectedOrbs = this.combatSystem.orbSystem.getCollectedOrbs();
      this.orbText?.setText(`Orbs: ${collectedOrbs}`);
    }
  }

  private setupUI() {
    // Orb count UI
    this.orbText = this.add.text(900, 20, "Orbs: 0", {
      fontSize: "16px",
      color: "#ffffff",
    });
    this.orbText.setDepth(1000).setScrollFactor(0);

    // Timer UI
    this.timerText = this.add.text(900, 50, `Time: ${this.timerDuration}`, {
      fontSize: "16px",
      color: "#ffffff",
    });
    this.timerText.setDepth(1000).setScrollFactor(0);

    console.log("UI setup complete: Orb text and timer created.");

    // Orb update event
    this.time.addEvent({
      delay: 500,
      callback: this.updateOrbText,
      callbackScope: this,
      loop: true,
    });
  }

  private startTimer() {
    // Timer event to update the remaining time
    this.timerEvent = this.time.addEvent({
      delay: 1000, // 1 second
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });
  }

  private updateTimer() {
    this.timerDuration--;
    this.timerText?.setText(`Time: ${this.timerDuration}`);

    // End the game when the timer reaches zero
    if (this.timerDuration <= 0) {
      this.endGame();
    }
  }

  private endGame() {
    // Stop the timer
    if (this.timerEvent) {
      this.timerEvent.destroy();
    }

    const collectedOrbs = this.combatSystem?.orbSystem.getCollectedOrbs() || 0;
    this.scene.start("GameOver", { collectedOrbs });
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

  shutdown() {}

  private cleanupBeforeTransition() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.physics.world.shutdown();
  }

  changeScene() {
    EventBus.removeAllListeners();
    this.cleanupBeforeTransition();
    if (this.combatSystem) {
      this.combatSystem.cleanup();
      this.combatSystem = null;
    }
    if (this.timerEvent) {
      this.timerEvent.destroy();
      this.timerEvent = null;
    }
    if (this.player) {
      this.player.destroy();
    }
    this.scene.start("GameOver");
  }
}
