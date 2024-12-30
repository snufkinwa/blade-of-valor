import { Scene, GameObjects, Cameras } from "phaser";
import { EventBus } from "../EventBus";
import { Player } from "../classes/player";
import Darkling from "../classes/darkling";
import HealthBar from "../classes/HealthBar";

export class Platformer extends Scene {
  private map!: Phaser.Tilemaps.Tilemap;
  private layers: Record<string, Phaser.Tilemaps.TilemapLayer | null> = {};
  private imageLayers: Record<string, GameObjects.TileSprite> = {};
  private fogLayers: Record<string, GameObjects.TileSprite> = {};
  private player!: Player;
  private darklings!: Phaser.Physics.Arcade.Group;
  private healthBar!: HealthBar;
  camera!: Cameras.Scene2D.Camera;

  constructor() {
    super("Platformer");
  }

  create() {
    this.setupCamera();
    this.createTilemap();
    this.createBackgroundLayers();
    this.createPlayer();
    this.createDarklings();
    this.setupPhysics();
    this.setupParallaxEffects();
    this.createFogLayers();
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

    this.layers["Background"] = this.map.createLayer("BackGround", [
      backgroundTileset,
      awakeningTileset,
    ]);
    this.layers["Ground"] = this.map.createLayer("Ground", awakeningTileset);
    this.layers["Platforms"] = this.map.createLayer(
      "Platformers",
      platformTileset
    );
    this.layers["Gutter"] = this.map.createLayer("Gutter", platformTileset);
    this.layers["Lights"] = this.map.createLayer("Lights", [
      awakeningTileset,
      platformTileset,
    ]);
    this.layers["Other"] = this.map.createLayer("Other", [
      awakeningTileset,
      platformTileset,
    ]);

    this.layers["Cage"] = this.map.createLayer("Cage", awakeningTileset);

    if (this.layers["Ground"]) {
      this.layers["Ground"].setCollisionByExclusion([-1]);
    }

    if (this.layers["Gutter"]) {
      this.layers["Gutter"].setCollisionByExclusion([-1]);
    }

    if (this.layers["Platforms"]) {
      this.layers["Platforms"].setCollisionByExclusion([-1]);
      // Debug: Show collision boxes
      this.layers["Platforms"].renderDebug(this.add.graphics(), {
        tileColor: null,
        collidingTileColor: new Phaser.Display.Color(243, 134, 48, 128),
        faceColor: new Phaser.Display.Color(40, 39, 37, 255),
      });
    }

    Object.values(this.layers).forEach((layer, index) => {
      if (layer) {
        layer.setDepth(index);
      }
    });
  }

  private createBackgroundLayers() {
    const width = 1024;
    const height = 650;

    const bgLayers = [
      { key: "Background", scroll: 0.1, offsetX: 0, offsetY: 0 },
      { key: "Background_Pillars", scroll: 0.2, offsetX: -480, offsetY: 0 },
      { key: "Background_Fog", scroll: 0.3, offsetX: 0, offsetY: 690 },
    ];

    bgLayers.forEach(({ key, scroll, offsetX, offsetY }, index) => {
      const texture = this.textures.get(key);
      const tileSprite = this.add.tileSprite(
        offsetX,
        offsetY,
        this.map.widthInPixels,
        height,
        key
      );

      tileSprite
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(-10 + index);

      if (key === "Background_Fog") {
        tileSprite.setTileScale(1, 1);
      }

      this.imageLayers[key] = tileSprite;
    });
  }

  private createFogLayers() {
    const fogHeight = 200; // Reduced height for top-only fog
    const mapWidth = this.map.widthInPixels;

    this.fogLayers["fogTop1"] = this.add
      .tileSprite(0, 0, mapWidth, fogHeight, "Fog_Top")
      .setOrigin(0, 0)
      .setTint(0x000000)
      .setScrollFactor(0.8)
      .setAlpha(1)
      .setDepth(4)
      .setScale(2.0);

    this.fogLayers["fogTop2"] = this.add
      .tileSprite(0, 0, mapWidth, fogHeight, "Fog_Top")
      .setOrigin(0, 0)
      .setScrollFactor(0.6)
      .setTint(0x00000)
      .setAlpha(1)
      .setDepth(5)
      .setScale(2.0);
  }

  private createPlayer() {
    const groundY = 530;
    this.player = new Player(this, 100, groundY, "light");
    if (this.player.body) {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      body.setSize(32, 50);
      body.setCollideWorldBounds(true);

      this.healthBar = new HealthBar(this, 20, 20, "player_healthbar");
      this.healthBar.setPosition(40, 40);
    }
  }

  private createDarklings(): void {
    this.darklings = this.physics.add.group({
      classType: Darkling,
      runChildUpdate: true, // Ensures Darklings' update method is called
    });

    // Define the number of darklings to spawn
    const numberOfDarklings = 5; // Adjust this as needed

    // Get map dimensions
    const mapWidth = this.map.widthInPixels;
    const mapHeight = this.map.heightInPixels;

    // Spawn darklings randomly within the map bounds
    for (let i = 0; i < numberOfDarklings; i++) {
      const spawnX = Phaser.Math.Between(0, mapWidth);
      const spawnY = Phaser.Math.Between(0, mapHeight);

      const darkling = new Darkling(this, spawnX, spawnY);
      this.darklings.add(darkling);
    }

    // Add collision with ground and platforms
    if (this.layers["Ground"]) {
      this.physics.add.collider(this.darklings, this.layers["Ground"]);
    }
    if (this.layers["Platforms"]) {
      this.physics.add.collider(this.darklings, this.layers["Platforms"]);
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

    if (this.layers["Gutter"]) {
      this.physics.add.collider(this.player, this.layers["Gutter"]);
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
    // Update background parallax
    Object.entries(this.imageLayers).forEach(([key, layer]) => {
      const scrollFactor = parseFloat(key.match(/\d+/)?.[0] || "0.1") / 10;
      layer.tilePositionX = this.cameras.main.scrollX * scrollFactor;
    });

    // Update fog parallax
    Object.values(this.fogLayers).forEach((layer) => {
      layer.tilePositionX = this.cameras.main.scrollX * layer.scrollFactorX;
    });

    if (this.healthBar) {
      this.healthBar.update(this.camera);
    }

    this.player?.update?.();
  }

  changeScene() {
    this.scene.start("Corruption");
  }
}
