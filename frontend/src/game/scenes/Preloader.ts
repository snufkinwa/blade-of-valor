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
  }

  create() {
    this.scene.start("MainMenu");
  }
}
