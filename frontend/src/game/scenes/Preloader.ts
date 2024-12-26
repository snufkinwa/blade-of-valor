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

    this.load.json("dialogue", getAssetUrl("data/dialogue.json"));
    this.load.image(
      "elara_portrait",
      getAssetUrl("portrait/elara_portrait_light.png")
    );
    this.load.image(
      "elara_portrait_dark",
      getAssetUrl("portrait/elara_portrait_dark.png")
    );

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

  create() {
    this.scene.start("MainMenu");
  }
}
