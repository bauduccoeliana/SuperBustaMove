import { Scene } from "phaser";

export class IntroTait extends Scene {
  constructor() {
    super("IntroTait");
  }

  create() {
    const video = this.add.video(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      "introtait"
    );
    video.setOrigin(0.5).setScale(0.75);
    video.setMute(true);
    video.play();

    video.once("complete", () => {
      this.scene.start("MainMenu"); // o 'GameScene', según tu flujo
    });

    this.input.once("pointerdown", () => {
      video.stop();
      this.scene.start("MainMenu");
    });
  }
}
