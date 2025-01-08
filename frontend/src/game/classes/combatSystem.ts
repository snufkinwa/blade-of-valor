import { Scene } from "phaser";
import Darkling from "../classes/darkling";
import { EventBus } from "../EventBus";
import { OrbSystem } from "./orbs";
import { PlayerHealthBar } from "./HealthBar";

export class CombatSystem {
  private scene: Scene;
  private darklings: Darkling[] = [];
  private orbSystem: OrbSystem;
  private player: Phaser.Physics.Arcade.Sprite;
  private healthBar: PlayerHealthBar;
  private spawnTimer: Phaser.Time.TimerEvent;
  private checkDistanceTimer: Phaser.Time.TimerEvent;
  private readonly CHASE_DISTANCE = 150;
  private readonly ATTACK_DISTANCE = 60;
  private readonly DAMAGE_AMOUNT = 10;
  private isPlayerInvulnerable = false;
  private invulnerabilityDuration = 6000;

  constructor(scene: Scene, playerSprite: Phaser.GameObjects.Sprite) {
    this.scene = scene;
    this.player = playerSprite as unknown as Phaser.Physics.Arcade.Sprite;
    this.healthBar = this.healthBar;
    this.orbSystem = new OrbSystem(scene);
    this.setupEventListeners();
    this.setupOrbSystem();
    this.startSpawning();
    this.startDistanceCheck();
  }

  private setupOrbSystem(): void {
    this.orbSystem.setupCollisions();
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
    if (!this.player || this.darklings.length >= 5) return;

    const spawnX = this.player.x + Phaser.Math.Between(-30, 30);
    const spawnY = this.player.y - 50;

    const darkling = new Darkling(this.scene, spawnX, spawnY);
    this.setupDarklingColliders(darkling);
    darkling.setPlayer(this.player);

    this.darklings.push(darkling);
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
    if ((this.scene as any).layers) {
      ["Ground", "Platforms", "Gutter"].forEach((layerName) => {
        const layer = (this.scene as any).layers[layerName];
        if (layer) {
          this.scene.physics.add.collider(darkling, layer);
        }
      });
    }

    this.scene.physics.add.overlap(
      this.player,
      darkling,
      (playerObj, darklingObj) => {
        // Type check and cast objects
        const player = playerObj as Phaser.GameObjects.Sprite;
        const darklingEntity = darklingObj as Darkling;

        if (darklingEntity instanceof Darkling) {
          this.handlePlayerAttack(player, darklingEntity);
        }
      },
      undefined,
      this
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

  private handlePlayerAttack(
    player: Phaser.GameObjects.Sprite,
    darkling: Darkling
  ): void {
    if (darkling.isVulnerable()) {
      darkling.takeDamage(20);
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
