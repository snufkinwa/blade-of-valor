import { BaseEndingScene } from "./BaseEndingScene";
import { EventBus } from "../EventBus";

export class LightEnding extends BaseEndingScene {
  constructor() {
    super("LightEnding");
  }

  create() {
    super.create();

    // Add unique visual elements for light ending
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // Create light rays effect
    const rays = this.add.group();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      const ray = this.add
        .rectangle(centerX, centerY, 800, 4, 0xffffff, 0.3)
        .setAngle(angle * (180 / Math.PI))
        .setBlendMode(Phaser.BlendModes.ADD);

      rays.add(ray);

      this.tweens.add({
        targets: ray,
        alpha: { from: 0.1, to: 0.3 },
        duration: 2000 + i * 200,
        yoyo: true,
        repeat: -1,
      });
    }

    // Rotate the rays
    this.tweens.add({
      targets: rays.getChildren(),
      angle: "+=45",
      duration: 10000,
      repeat: -1,
      ease: "Linear",
    });

    this.createParticles(centerX, centerY);

    EventBus.emit("current-scene-ready", this);
  }

  protected loadDialogue(): void {
    const dialogueData = this.cache.json.get("dialogue");
    this.dialogue = dialogueData.endings.light.dialogue;
  }
}
