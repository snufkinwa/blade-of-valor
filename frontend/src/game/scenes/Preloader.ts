import { Scene } from "phaser";
import { getAssetUrl } from "../assetLoader";

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  init() {
    // Loading bar setup
    this.load.image(
      "loadingBar",
      getAssetUrl("UI/Loading Bar/Loading_Bar x2.png")
    );
    this.setupLoadingBar();
  }

  private setupLoadingBar() {
    this.load.once("complete", () => {
      const centerX = this.cameras.main.centerX;
      const centerY = this.cameras.main.centerY;

      const loadingBarBg = this.add
        .image(centerX, centerY, "loadingBar")
        .setOrigin(0.5);
      const progressBar = this.add
        .image(centerX - 230, centerY, "loadingBar")
        .setOrigin(0, 0.5);

      const maskGraphics = this.make.graphics();
      const maskRect = new Phaser.Geom.Rectangle(
        centerX - 230,
        centerY - progressBar.height / 2,
        0,
        progressBar.height
      );
      maskGraphics.fillRectShape(maskRect);
      progressBar.setMask(maskGraphics.createGeometryMask());

      this.load.on("progress", (progress: number) => {
        maskRect.width = 460 * progress;
        maskGraphics.clear();
        maskGraphics.fillRectShape(maskRect);
      });
    });

    this.load.start();
  }

  preload() {
    // Debug logging
    this.load.on("filecomplete", (key: string) =>
      console.log(`Loaded: ${key}`)
    );

    this.loadUIAssets();
    this.loadCharacterAssets();
    this.loadBackgrounds();
    this.loadTilemapAssets();
  }

  private loadUIAssets() {
    const uiAssets = {
      "arrow-left": "UI/Mini Arrows/x2/Mini_Arrows1.png",
      "arrow-right": "UI/Mini Arrows/x2/Mini_Arrows2.png",
      "popup-bg": "UI/Popup Screen/Blurry_popup.png",
      seperator: "UI/Gothic patterns/Pattern01 x2.png",
    };

    Object.entries(uiAssets).forEach(([key, path]) => {
      this.load.image(key, getAssetUrl(path));
    });

    // UI Atlas
    this.load.atlas(
      "ui",
      getAssetUrl("UI/scalable+screen/Variations/Type+2/Screen__4.png"),
      getAssetUrl("data/dialoguebox.json")
    );
  }

  private loadCharacterAssets() {
    // Character atlases
    const atlases = {
      architect: ["data/architect.png", "data/architect.json"],
      light: ["data/light.png", "data/light.json"],
      dark: ["data/dark.png", "data/dark.json"],
      architect_portrait: [
        "data/architect_portrait.png",
        "data/architect_portrait.json",
      ],
    };

    Object.entries(atlases).forEach(([key, [png, json]]) => {
      this.load.atlas(key, getAssetUrl(png), getAssetUrl(json));
    });

    // Character portraits
    this.load.image(
      "elara_portrait",
      getAssetUrl("portrait/elara_portrait_light.png")
    );
    this.load.image(
      "elara_portrait_dark",
      getAssetUrl("portrait/elara_portrait_black.png")
    );
  }

  private loadBackgrounds() {
    [
      "Background",
      "Background_Pillars",
      "Background_Fog",
      "Fog",
      "Fog_Top",
    ].forEach((name) => {
      this.load.image(name, getAssetUrl(`enviroment/Opening/${name}.png`));
    });
  }

  private loadTilemapAssets() {
    // Load tilemap JSON
    this.load.tilemapTiledJSON(
      "awakening",
      getAssetUrl("enviroment/tilemap/awakening.json")
    );

    // Load tileset images
    const tilesets = [
      "16x16",
      "blxo",
      "leftwall",
      "blcks4",
      "blcks2",
      "Sprite-00012",
      "Sprite-13",
      "Sprite-0013",
      "Sprite-02023",
      "Sprite-00216",
      "Sprite-02019",
      "Sprite-00214",
      "Sprite-0117",
      "Sprite-0007",
      "Sprite-0008",
      "Sprite-0009",
      "Sprite-0010",
      "Sprite-0012",
      "Sprite-0011",
      "Sprite-014",
      "Sprite5445-0013",
      "Sprite35",
      "Sprite89",
      "Sprite2",
      "Spritedf-0003",
      "Spritedf-0006",
      "Spritefd-0002",
      "Spr8",
      "Spr30",
      "Spr9",
      "Cage_1",
      "Cage_2",
      "datatile",
      "chapel",
      "latter",
      "ire",
      "light545",
      "bottonsds",
      "Spriihj0041",
      "S44kj",
      "S044",
      "S47",
      "S48",
      "5154",
      "corner32x32",
      "45231",
      "000",
      "050",
      "blxo_02",
    ];

    tilesets.forEach((name) => {
      this.load.image(name, getAssetUrl(`enviroment/tilemap/${name}.png`));
    });

    // Load dialogue data
    this.load.json("dialogue", getAssetUrl("data/dialogue.json"));
  }

  create() {
    this.scene.start("MainMenu");
  }
}
