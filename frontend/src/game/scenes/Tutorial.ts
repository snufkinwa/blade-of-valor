import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { Player } from "../classes/player";

export class Tutorial extends Scene {
  private player: Player;
  private map: Phaser.Tilemaps.Tilemap;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private wallsLayer!: Phaser.Tilemaps.TilemapLayer;
  private platformLayer!: Phaser.Tilemaps.TilemapLayer;

  constructor() {
    super("Tutorial");
  }

  create() {
    // Create tilemap

    // Camera setup
    this.cameras.main.setBounds(
      0,
      0,
      this.map.widthInPixels,
      this.map.heightInPixels
    );
    this.cameras.main.startFollow(this.player);

    EventBus.emit("current-scene-ready", this);
  }

  update() {
    if (!this.player) return;

    if (this.player.x <= 0 || this.player.x >= this.map.widthInPixels) {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      body.setVelocityX(0);
    }
  }
}
