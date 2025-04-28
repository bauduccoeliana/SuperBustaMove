import { Scene } from "phaser";

export class MainMenu extends Scene {
  constructor() {
    super("MainMenu");
  }

  create() {
    this.add.image(512, 384, "background");
    this.add.image(512, 300, "logo").setScale(1.2);
    this.theme1 = this.sound.add("theme1", { volume: 1, loop: true });
    this.theme1.play();

    this.enterKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ENTER
    );

    this.startButton = this.add
      .image(512, 600, "start")
      .setInteractive()
      .setScale(1.6);
    this.tweens.add({
      targets: this.startButton,
      alpha: { from: 1, to: 0.2 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.scene.start("Selec1");
    }
  }
}
