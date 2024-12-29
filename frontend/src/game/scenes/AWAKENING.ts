import { Scene, GameObjects, Cameras } from "phaser";
import { EventBus } from "../EventBus";
import { Player } from "../classes/player";

export class Platformer extends Scene {
  private map!: Phaser.Tilemaps.Tilemap;
  private layers: Record<string, Phaser.Tilemaps.TilemapLayer | null> = {};
  private imageLayers: Record<string, GameObjects.TileSprite> = {};
  private fogLayers: Record<string, GameObjects.Image> = {};
  private player!: Player;
  camera!: Cameras.Scene2D.Camera;

  constructor() {
    super("Platformer");
  }

  create() {
    this.setupCamera();
    this.createTilemap();
    this.createBackgroundLayers();
    this.createPlayer();
    this.setupPhysics();
    this.setupParallaxEffects();
    this.createFogLayer();
    EventBus.emit("current-scene-ready", this);
  }

  private setupCamera() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor("#1a1a1a");
  }

  private createTilemap() {
    this.map = this.make.tilemap({ key: "awakening" });
    const awakeningTileset = this.map.addTilesetImage(
      "awakeningtileset",
      "awakening"
    );
    const backgroundTileset = this.map.addTilesetImage(
      "awakeningbg",
      "awakeningbg"
    );
    const platformTileset = this.map.addTilesetImage(
      "Platformers",
      "awakeningPTOG"
    );

    if (!awakeningTileset || !backgroundTileset || !platformTileset) {
      console.error("Failed to load tilesets");
      return;
    }

    this.layers["Background"] = this.map.createLayer(
      "BackGround",
      backgroundTileset
    );
    this.layers["Ground"] = this.map.createLayer("Ground", awakeningTileset);
    this.layers["Platforms"] = this.map.createLayer(
      "Platformers",
      platformTileset
    );
    this.layers["Lights"] = this.map.createLayer("Lights", awakeningTileset);
    this.layers["Other"] = this.map.createLayer("Other", awakeningTileset);

    if (this.layers["Ground"]) {
      this.layers["Ground"].setCollisionByExclusion([-1]);
    }
    if (this.layers["Platforms"]) {
      this.layers["Platforms"].setCollisionByExclusion([-1]);
    }

    Object.values(this.layers).forEach((layer, index) => {
      if (layer) {
        layer.setDepth(index);
      }
    });
  }

  private createBackgroundLayers() {
    const width = 1024;
    const height = 768;

    const bgLayers = [
      { key: "Background", scroll: 0.1, offsetX: 0, offsetY: 0 },
      { key: "Background_Pillars", scroll: 0.2, offsetX: 0, offsetY: 0 },
      { key: "Background_Fog", scroll: 0.3, offsetX: 480, offsetY: 690 },
    ];

    bgLayers.forEach(({ key, scroll, offsetX, offsetY }, index) => {
      this.imageLayers[key] = this.add
        .tileSprite(0, 0, width, height, key)
        .setOrigin(0, 0)
        .setPosition(offsetX, offsetY)
        .setScrollFactor(0)
        .setDepth(-10 + index);

      if (key === "Background_Fog") {
        this.imageLayers[key].setTileScale(1, 0);
      }
    });
  }

  private createFogLayer() {
    this.fogLayers["fogTop1"] = this.add
      .image(477, -1, "Fog_Top")
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(5);

    this.fogLayers["fogTop2"] = this.add
      .image(306.76, 0.59, "Fog_Top")
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setTint(0x334455)
      .setDepth(6);
  }

  private createPlayer() {
    const groundY = 650;
    this.player = new Player(this, 100, groundY, "light");
    if (this.player.body) {
      (this.player.body as Phaser.Physics.Arcade.Body).setSize(32, 32);
    }
  }

  private setupPhysics() {
    this.physics.world.setBounds(
      0,
      0,
      this.map.widthInPixels,
      this.map.heightInPixels
    );
    this.physics.world.gravity.y = 1000;

    if (this.layers["Ground"]) {
      this.physics.add.collider(this.player, this.layers["Ground"]);
    }
    if (this.layers["Platforms"]) {
      this.physics.add.collider(this.player, this.layers["Platforms"]);
    }

    this.camera.setBounds(
      0,
      0,
      this.map.widthInPixels,
      this.map.heightInPixels
    );
    this.camera.startFollow(this.player, true, 0.08, 0.08);
  }

  private setupParallaxEffects() {
    this.cameras.main.scrollX = 0;
    Object.entries(this.imageLayers).forEach(([key, layer]) => {
      const scrollFactor = parseFloat(key.match(/\d+/)?.[0] || "0.1") / 10;
      layer.setScrollFactor(scrollFactor);
    });
  }

  update() {
    Object.entries(this.imageLayers).forEach(([key, layer]) => {
      const scrollFactor = parseFloat(key.match(/\d+/)?.[0] || "0.1") / 10;
      layer.tilePositionX = this.cameras.main.scrollX * scrollFactor;
    });

    this.player?.update?.();
  }

  changeScene() {
    this.scene.start("Corruption");
  }
}
