import { Scene } from "phaser";
import Darkling from "../classes/darkling";
import { EventBus } from "../EventBus";
import { OrbSystem } from "./orbs";
import { PlayerHealthBar } from "./HealthBar";

export class CombatSystem {
  private scene: Scene;
  private darklings: Darkling[] = [];
  public orbSystem: OrbSystem;
  private player: Phaser.Physics.Arcade.Sprite;
  private healthBar: PlayerHealthBar | null = null;
  private spawnTimer: Phaser.Time.TimerEvent;
  private checkDistanceTimer: Phaser.Time.TimerEvent;
  private readonly CHASE_DISTANCE = 150;
  private readonly ATTACK_DISTANCE = 60;
  private readonly DAMAGE_AMOUNT = 25;
  private isPlayerInvulnerable = false;
  private invulnerabilityDuration = 6000;

  constructor(scene: Scene, playerSprite: Phaser.GameObjects.Sprite) {
    this.scene = scene;
    this.player = playerSprite as unknown as Phaser.Physics.Arcade.Sprite;
    this.orbSystem = new OrbSystem(scene);
    console.log("CombatSystem OrbSystem initialized:", this.orbSystem);
    this.orbSystem.setupCollision(playerSprite);
    this.setupEventListeners();

    this.startSpawning();
    this.startDistanceCheck();
  }

  setHealthBar(healthBar: PlayerHealthBar): void {
    this.healthBar = healthBar;
    this.orbSystem.setupPlayerCollision(this.player, this.healthBar);
  }

  private setupEventListeners(): void {
    EventBus.on("darkling-defeated", (darkling: Darkling) =>
      this.handleDarklingDefeat(darkling)
    );
  }

  private handleDarklingAttack(): void {
    if (!this.isPlayerInvulnerable) {
      EventBus.emit("player-damage", this.DAMAGE_AMOUNT);
      this.startInvulnerabilityPeriod();
    }
  }

  private startInvulnerabilityPeriod(): void {
    this.isPlayerInvulnerable = true;
    this.scene.time.delayedCall(this.invulnerabilityDuration, () => {
      this.isPlayerInvulnerable = false;
    });
  }

  private startSpawning(): void {
    this.spawnTimer = this.scene.time.addEvent({
      delay: 3000,
      callback: this.checkAndSpawnDarklings,
      callbackScope: this,
      loop: true,
    });
  }

  private startDistanceCheck(): void {
    this.checkDistanceTimer = this.scene.time.addEvent({
      delay: 100,
      callback: this.checkDarklingsDistance,
      callbackScope: this,
      loop: true,
    });
  }

  private spawnDarkling(): void {
    const maxDarklings = 50;
    if (!this.player || this.darklings.length >= maxDarklings) return;

    const spawnX = this.player.x + Phaser.Math.Between(-200, 2000);
    const spawnY = this.player.y - 50;

    const darkling = new Darkling(this.scene, spawnX, spawnY);
    this.setupDarklingColliders(darkling);
    darkling.setPlayer(this.player);

    this.darklings.push(darkling);
  }

  private checkAndSpawnDarklings(): void {
    const maxDarklings = 5; // Adjust this for difficulty scaling
    const missingDarklings = maxDarklings - this.darklings.length;

    for (let i = 0; i < missingDarklings; i++) {
      this.spawnDarkling();
    }
  }

  private checkDarklingsDistance(): void {
    if (!this.player) return;

    this.darklings.forEach((darkling) => {
      const distance = Phaser.Math.Distance.Between(
        darkling.x,
        darkling.y,
        this.player.x,
        this.player.y
      );

      if (distance > this.CHASE_DISTANCE) {
        this.handleDarklingRespawn(darkling);
      } else if (distance <= this.ATTACK_DISTANCE) {
        darkling.attack();
        this.handleDarklingAttack();
      } else {
        const direction = this.player.x < darkling.x ? "left" : "right";
        darkling.walk(direction);
      }
    });
  }

  private handleDarklingRespawn(darkling: Darkling): void {
    const newX = this.player.x + Phaser.Math.Between(-50, 50);
    const newY = this.player.y;

    darkling.disappear(() => {
      darkling.respawn(newX, newY, () => {
        darkling.attack();
      });
    });
  }

  private setupDarklingColliders(darkling: Phaser.GameObjects.Sprite): void {
    // Setup layer collisions
    if ((this.scene as any).layers) {
      ["Ground", "Platforms", "Gutter"].forEach((layerName) => {
        const layer = (this.scene as any).layers[layerName];
        if (layer) {
          this.scene.physics.add.collider(darkling, layer);
        }
      });
    }

    // Handle attacks
    ["attack-1-pressed", "attack-2-pressed", "attack-3-pressed"].forEach(
      (attackType) => {
        EventBus.on(attackType, () => {
          if (
            Phaser.Math.Distance.Between(
              this.player.x,
              this.player.y,
              darkling.x,
              darkling.y
            ) <= this.ATTACK_DISTANCE
          ) {
            if ((darkling as Darkling).isVulnerable()) {
              (darkling as Darkling).takeDamage(20);
            }
          }
        });
      }
    );
  }

  private handleDarklingDefeat(darkling: Darkling): void {
    const index = this.darklings.indexOf(darkling);
    if (index > -1) {
      this.orbSystem.spawnOrbsFromDarkling(darkling.x, darkling.y, true);
      this.darklings.splice(index, 1);
      darkling.destroy();
    }
  }

  public update(): void {
    this.darklings.forEach((darkling) => darkling.update());
  }

  public cleanup(): void {
    if (this.spawnTimer) this.spawnTimer.destroy();
    if (this.checkDistanceTimer) this.checkDistanceTimer.destroy();

    EventBus.removeAllListeners();
    this.darklings.forEach((darkling) => darkling.destroy());
    this.darklings = [];
    this.orbSystem.cleanup();
  }
}
