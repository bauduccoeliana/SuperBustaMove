import { Scene } from "phaser";

export class Selec2 extends Scene {
  constructor() {
    super("Selec2");
  }

  create() {
    this.add.image(512, 384, "transicion").setOrigin(0.5);
    const video = this.add.video(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      "select2"
    );
    video.setOrigin(0.5).setScale(0.65);
    video.play();
    video.once("complete", () => {
      this.scene.start("Selec3");
    });
  }

}
