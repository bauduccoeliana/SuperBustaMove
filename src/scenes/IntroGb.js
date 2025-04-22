import { Scene } from "phaser";

export class IntroGb extends Scene {
  constructor() {
    super("IntroGb");
  }

  create() {
    const video = this.add.video(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      "introgba"
    );
    video.setOrigin(0.5).setScale(0.75);
    video.play();
    video.once("complete", () => {
      this.scene.start("IntroUbi");
    });

    this.input.once("pointerdown", () => {
      video.stop();
      this.scene.start("IntroUbi");
    });
  }
}
