import { Scene } from "phaser";
import Darkling from "../classes/darkling";
import { EventBus } from "../EventBus";
import { OrbSystem } from "./orbs";

export class CombatSystem {
  private scene: Scene;
  private darklings: Darkling[] = [];
  private orbSystem: OrbSystem;
  private playerSprite: Phaser.GameObjects.Sprite;
  private spawnTimer: Phaser.Time.TimerEvent;
  private checkDistanceTimer: Phaser.Time.TimerEvent;
  private readonly CHASE_DISTANCE = 60;
  private readonly ATTACK_DISTANCE = 60;
  private readonly DAMAGE_AMOUNT = 10;
  private isPlayerInvulnerable = false;
  private invulnerabilityDuration = 6000;

  constructor(scene: Scene, playerSprite: Phaser.GameObjects.Sprite) {
    this.scene = scene;
    this.playerSprite = playerSprite;
    this.orbSystem = new OrbSystem(scene);
    this.setupEventListeners();
    this.startSpawning();
    this.startDistanceCheck();
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
      callback: this.spawnDarkling,
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
    if (!this.playerSprite || this.darklings.length >= 5) return;

    const spawnX = this.playerSprite.x + Phaser.Math.Between(-30, 30);
    const spawnY = this.playerSprite.y - 50;

    const darkling = new Darkling(this.scene, spawnX, spawnY);
    this.setupDarklingColliders(darkling);
    darkling.setPlayer(this.playerSprite);

    this.darklings.push(darkling);
  }

  private checkDarklingsDistance(): void {
    if (!this.playerSprite) return;

    this.darklings.forEach((darkling) => {
      const distance = Phaser.Math.Distance.Between(
        darkling.x,
        darkling.y,
        this.playerSprite.x,
        this.playerSprite.y
      );

      if (distance > this.CHASE_DISTANCE) {
        this.handleDarklingRespawn(darkling);
      } else if (distance <= this.ATTACK_DISTANCE) {
        darkling.attack();
        this.handleDarklingAttack();
      } else {
        const direction = this.playerSprite.x < darkling.x ? "left" : "right";
        darkling.walk(direction);
      }
    });
  }

  private handleDarklingRespawn(darkling: Darkling): void {
    const newX = this.playerSprite.x + Phaser.Math.Between(-50, 50);
    const newY = this.playerSprite.y;

    darkling.disappear(() => {
      darkling.respawn(newX, newY, () => {
        darkling.attack();
      });
    });
  }

  private setupDarklingColliders(darkling: Phaser.GameObjects.Sprite): void {
    if ((this.scene as any).layers) {
      ["Ground", "Platforms", "Gutter"].forEach((layerName) => {
        const layer = (this.scene as any).layers[layerName];
        if (layer) {
          this.scene.physics.add.collider(darkling, layer);
        }
      });
    }
  }

  private handleDarklingDefeat(darkling: Darkling): void {
    const index = this.darklings.indexOf(darkling);
    if (index > -1) {
      this.darklings.splice(index, 1);
      this.orbSystem.spawnOrbsFromDarkling(darkling.x, darkling.y);
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
