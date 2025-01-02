import { Scene } from "phaser";
import { Knight } from "../classes/knight";
import Darkling from "../classes/darkling";
import { EventBus } from "../EventBus";
import { BossHealthBar } from "./HealthBar";

export class CombatSystem {
  private scene: Scene;
  private knight: Knight;
  private darklings: Darkling[] = [];
  private hitAnimationThreshold: number = 10;
  private isInvulnerable: boolean = false;
  private invulnerabilityDuration: number = 1000;
  private bossBar: BossHealthBar;
  private corruptionLevel: number = 0;
  private maxCorruption: number = 100;
  private attackQueue: string[] = [];
  private isProcessingAttacks = false;

  constructor(scene: Scene, x: number, y: number) {
    this.scene = scene;
    this.knight = new Knight(scene, x, y);
    this.setupEventListeners();
    this.bossBar = new BossHealthBar(
      scene,
      100,
      20,
      "bossTexture",
      "bossFillTexture"
    );
  }

  private setupEventListeners(): void {
    EventBus.on("darkling-wave", this.spawnDarklingWave.bind(this));
    EventBus.on("darkling-attack", this.handleDarklingAttack.bind(this));
    EventBus.on("player-damage", this.handlePlayerDamage.bind(this));
    EventBus.on("darkness-level-update", this.updateCorruptionLevel.bind(this));

    // Combat controls
    EventBus.on("attack-1-pressed", () => this.queueAttack(1));
    EventBus.on("attack-2-pressed", () => this.queueAttack(2));
    EventBus.on("attack-3-pressed", () => this.queueAttack(3));

    // Movement controls
    EventBus.on("run-pressed", (direction: "ArrowLeft" | "ArrowRight") => {
      const velocity = direction === "ArrowLeft" ? -200 : 200;
      this.knight.startRun(velocity);
    });

    EventBus.on("run-released", () => {
      this.knight.stopRun();
    });

    EventBus.on("jump-pressed", () => {
      this.knight.jump();
    });
  }

  private spawnDarklingWave(data: { count: number; baseY: number }): void {
    // Clear previous wave
    this.darklings.forEach((darkling) => darkling.destroy());
    this.darklings = [];

    // Spawn new wave
    for (let i = 0; i < data.count; i++) {
      const darkling = new Darkling(
        this.scene,
        this.scene.cameras.main.width + 100,
        data.baseY
      );
      darkling.setWavePosition(i, data.baseY);
      this.darklings.push(darkling);

      // Setup collision with knight
      this.scene.physics.add.overlap(this.knight, darkling, (obj1, obj2) => {
        // Type cast the objects to their correct types
        const knight = obj1 as Knight;
        const darkling = obj2 as Darkling;
        this.handleDarklingCollision(knight, darkling);
      });
    }
  }

  private handleDarklingCollision(knight: Knight, darkling: Darkling): void {
    if (!this.isInvulnerable) {
      this.applyDamage(10); // Base damage value
      darkling.attack();
    }
  }

  private queueAttack(type: 1 | 2 | 3): void {
    if (this.attackQueue.length < 3) {
      this.attackQueue.push(type.toString());
    }

    if (!this.isProcessingAttacks) {
      this.processAttackQueue();
    }
  }

  private processAttackQueue(): void {
    if (this.attackQueue.length === 0) {
      this.isProcessingAttacks = false;
      return;
    }

    this.isProcessingAttacks = true;
    const attackType = parseInt(this.attackQueue[0]) as 1 | 2 | 3;

    this.knight.attack(attackType);

    // Check for darkling hits during attack
    this.darklings.forEach((darkling) => {
      const distance = Phaser.Math.Distance.Between(
        this.knight.x,
        this.knight.y,
        darkling.x,
        darkling.y
      );

      if (distance < 60) {
        // Attack range
        darkling.hurt();
        darkling.disappear(() => {
          const index = this.darklings.indexOf(darkling);
          if (index > -1) {
            this.darklings.splice(index, 1);
          }
          darkling.destroy();
        });
      }
    });

    this.attackQueue.shift();

    this.scene.time.delayedCall(500, () => {
      if (this.attackQueue.length > 0) {
        this.processAttackQueue();
      } else {
        this.isProcessingAttacks = false;
      }
    });
  }

  private handleDarklingAttack(data: {
    damage: number;
    corruption: number;
  }): void {
    if (!this.isInvulnerable) {
      this.applyDamage(data.damage);
      this.increaseCorruption(data.corruption);
    }
  }

  private handlePlayerDamage(damage: number): void {
    if (damage >= this.hitAnimationThreshold) {
      this.startInvulnerabilityPeriod();
      this.knight.takeDamage();
    }

    this.bossBar.setValue(this.knight.hp);
  }

  private applyDamage(damage: number): void {
    if (!this.knight.hp) return;

    this.knight.hp -= damage;
    this.handlePlayerDamage(damage);

    if (this.knight.hp <= 0) {
      this.handleCorruption();
    }
  }

  private increaseCorruption(amount: number): void {
    this.corruptionLevel = Math.min(
      this.maxCorruption,
      this.corruptionLevel + amount
    );

    if (this.corruptionLevel >= this.maxCorruption) {
      this.handleCorruption();
    }
  }

  private updateCorruptionLevel(level: number): void {
    this.corruptionLevel = level;
  }

  private startInvulnerabilityPeriod(): void {
    this.isInvulnerable = true;

    this.scene.tweens.add({
      targets: this.knight,
      alpha: 0.7,
      duration: 200,
      yoyo: true,
      repeat: 2,
      ease: "Cubic.easeInOut",
    });

    this.scene.time.delayedCall(this.invulnerabilityDuration, () => {
      this.isInvulnerable = false;
    });
  }

  private handleCorruption(): void {
    // Reset health but maintain corruption
    if (this.knight.hp) this.knight.hp = 100;
    this.bossBar.setValue(100);

    // Emit event for game state changes
    EventBus.emit("player-corrupted");
  }

  public update(): void {
    this.knight.update();
    this.darklings.forEach((darkling) => darkling.update());
  }

  public getKnight(): Knight {
    return this.knight;
  }

  public cleanup(): void {
    EventBus.removeListener("darkling-wave");
    EventBus.removeListener("darkling-attack");
    EventBus.removeListener("player-damage");
    EventBus.removeListener("darkness-level-update");
    EventBus.removeListener("attack-1-pressed");
    EventBus.removeListener("attack-2-pressed");
    EventBus.removeListener("attack-3-pressed");
    EventBus.removeListener("run-pressed");
    EventBus.removeListener("run-released");
    EventBus.removeListener("jump-pressed");

    this.darklings.forEach((darkling) => darkling.destroy());
    this.bossBar.destroy();
    this.knight.destroy();
  }
}
