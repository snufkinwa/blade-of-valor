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
  private healthBar: PlayerHealthBar | null = null;
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
    this.orbSystem = new OrbSystem(scene);
    this.orbSystem.setupCollision(playerSprite);
    this.setupEventListeners();

    this.scene.time.delayedCall(1000, () => {
      this.spawnWave();
    });

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

  private createWavePath(width: number, height: number): Phaser.Curves.Path {
    const path = new Phaser.Curves.Path(0, 0);
    const points: Phaser.Math.Vector2[] = [];

    for (let x = 0; x <= width; x += 20) {
      const waveHeight = Math.sin(x * 0.04) * 100; // Higher amplitude for peaks
      const baseOffset = height - waveHeight; // Base offset keeps lower parts stable
      points.push(new Phaser.Math.Vector2(x, baseOffset));
    }

    path.splineTo(points);
    return path;
  }

  private spawnWave(): void {
    this.darklings.forEach((darkling) => darkling.destroy());
    this.darklings = [];

    const waveWidth = 400; // Wider wave for a smoother curve
    const waveHeight = 200; // Initial vertical offset for spawning
    const spawnX = this.scene.cameras.main.width + 100;
    const baseY = this.scene.cameras.main.height - 200; // Start below the screen

    const wavePath = this.createWavePath(waveWidth, waveHeight);

    const numRows = 6;
    const darklingPerRow = 8;
    const totalDarklings = numRows * darklingPerRow;

    for (let i = 0; i < totalDarklings; i++) {
      const row = Math.floor(i / darklingPerRow);
      const col = i % darklingPerRow;

      // Position along wave, with vertical emphasis at peaks
      const t = col / (darklingPerRow - 1);
      const point = wavePath.getPoint(t);

      const x = spawnX + point.x;
      const y = baseY + point.y - row * 20; // Add a climbing effect for rows

      const darkling = new Darkling(this.scene, x, y);
      this.setupDarklingColliders(darkling);
      darkling.setPlayer(this.player);
      darkling.setWavePosition(i, y);
      this.darklings.push(darkling);
    }
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
