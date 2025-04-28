import { Scene } from "phaser";

export class GameOver extends Scene {
  constructor() {
    super("GameOver");
  }

  create() {
    this.cameras.main.setBackgroundColor(0xff0000);
    const game1 = this.scene.get("Game");
    const g2 = this.scene.get("Game2");

    if (game1.overSound) {
      game1.overSound.stop();
    }
    if (g2.overSound) {
      g2.overSound.stop();
    }

    this.add.image(512, 384, "GO").setScale(0.65);

    this.input.once("pointerdown", () => {
      this.scene.start("MainMenu");
    });
  }
}
