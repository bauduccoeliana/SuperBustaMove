import { Scene } from "phaser";

export class IntroUbi extends Scene {
  constructor() {
    super("IntroUbi");
  }

  create() {
    const video = this.add.video(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      "introubi"
    );
    video.setOrigin(0.5).setScale(0.75);
    video.play();

    video.once("complete", () => {
      this.scene.start("IntroTait");
    });

    this.input.once("pointerdown", () => {
      video.stop();
      this.scene.start("IntroTait");
    });
  }
}
