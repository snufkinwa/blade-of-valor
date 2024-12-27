import { Scene } from "phaser";
import { getAssetUrl } from "../assetLoader";

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  init() {
    this.load.image(
      "loadingBar",
      getAssetUrl("UI/Loading Bar/Loading_Bar x2.png")
    );

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
    this.load.on("filecomplete", (key: string, type: string, data: any) => {
      console.log(`File Complete: ${key}, Type: ${type}`);
    });

    // Main Menu Assets
    this.load.image(
      "arrow-left",
      getAssetUrl("UI/Mini Arrows/x2/Mini_Arrows1.png")
    );
    this.load.image(
      "arrow-right",
      getAssetUrl("UI/Mini Arrows/x2/Mini_Arrows2.png")
    );
    this.load.image(
      "popup-bg",
      getAssetUrl("UI/Popup Screen/Blurry_popup.png")
    );

    this.load.image(
      "seperator",
      getAssetUrl("UI/Gothic patterns/Pattern01 x2.png")
    );

    //Intro assets
    this.load.json("dialogue", getAssetUrl("data/dialogue.json"));
    this.load.image(
      "elara_portrait",
      getAssetUrl("portrait/elara_portrait_light.png")
    );
    this.load.image(
      "elara_portrait_dark",
      getAssetUrl("portrait/elara_portrait_dark.png")
    );

    this.preloadAWAKENING();

    this.loadAtlasAssets();
  }

  private loadAtlasAssets() {
    this.load.atlas(
      "architect",
      getAssetUrl("data/architect.png"),
      getAssetUrl("data/architect.json")
    );

    this.load.atlas(
      "light",
      getAssetUrl("sprites/light.png"),
      getAssetUrl("data/light.json")
    );

    this.load.atlas(
      "dark",
      getAssetUrl("sprites/dark.png"),
      getAssetUrl("data/dark.json")
    );

    this.load.atlas(
      "ui",
      getAssetUrl("UI/scalable+screen/Variations/Type+2/Screen__4.png"),
      getAssetUrl("data/dialoguebox.json")
    );

    this.load.atlas(
      "architect_portrait",
      getAssetUrl("data/architect_portrait.png"),
      getAssetUrl("data/architect_portrait.json")
    );
  }

  private preloadAWAKENING() {
    // Environment backgrounds
    const backgrounds = [
      "Background",
      "Background_Pillars",
      "Background_Fog",
      "Fog",
      "Fog_Top",
    ];

    backgrounds.forEach((name) => {
      this.load.image(name, getAssetUrl(`enviroment/Opening/${name}.png`));
    });

    // Base tiles
    ["16x16", "blxo", "leftwall", "blcks4", "blcks2"].forEach((name) => {
      this.load.image(name, getAssetUrl(`enviroment/tilemap/${name}.png`));
    });

    // Sprite series
    [
      "00012",
      "13",
      "0013",
      "35",
      "89",
      "2",
      "02023",
      "00216",
      "02019",
      "00214",
      "0117",
      "5445-0013",
      "0007",
      "0008",
      "0009",
      "0010",
      "0012",
      "0011",
      "014",
    ].forEach((id) => {
      this.load.image(
        `sprite${id}`,
        getAssetUrl(`enviroment/tilemap/Sprite-${id}.png`)
      );
    });

    // Special sprites with different prefix format
    ["df-0003", "df-0006", "fd-0002"].forEach((id) => {
      this.load.image(
        `sprite${id}`,
        getAssetUrl(`enviroment/tilemap/Sprite${id}.png`)
      );
    });

    // Numbered sprites
    ["8", "30", "9"].forEach((num) => {
      this.load.image(
        `spr${num}`,
        getAssetUrl(`enviroment/tilemap/Spr${num}.png`)
      );
    });

    // Environmental elements
    const envElements = {
      cage1: "Cage_1",
      cage2: "Cage_2",
      datatile: "datatile",
      chapel: "chapel",
      latter: "latter",
      ire: "ire",
      light545: "light545",
      num854564: "854564",
      bottonsds: "bottonsds",
      spriihj0041: "Spriihj0041",
    };

    Object.entries(envElements).forEach(([key, filename]) => {
      this.load.image(key, getAssetUrl(`enviroment/tilemap/${filename}.png`));
    });

    // S-series
    ["44kj", "043", "044", "47", "48"].forEach((id) => {
      this.load.image(`s${id}`, getAssetUrl(`enviroment/tilemap/S${id}.png`));
    });

    // Miscellaneous
    ["5154", "corner32x32", "45231", "000", "050", "blxo_02"].forEach(
      (name) => {
        this.load.image(name, getAssetUrl(`enviroment/tilemap/${name}.png`));
      }
    );

    // Load tilemap data
    this.load.tilemapTiledJSON(
      "awakening",
      getAssetUrl("tilemap/awakening.json")
    );
  }

  create() {
    this.scene.start("MainMenu");
  }
}
