import { Scene } from "phaser";

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  init() {
    this.add.image(512, 384, "background");
    this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);
    const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);
    this.load.on("progress", (progress) => {
      bar.width = 4 + 460 * progress;
    });
  }

  preload() {
    this.load.image("logo", "public/assets/logo.png");
    this.load.image("start", "public/assets/startbutton.png");
    this.load.image("ball-red", "/assets/objects/red.png");
    this.load.image("ball-blue", "/assets/objects/blue.png");
    this.load.image("ball-green", "/assets/objects/green.png");
    this.load.image("ball-yellow", "/assets/objects/yellow.png");
    this.load.image("ball-purple", "/assets/objects/purple.png");
    this.load.image("ball-pink", "/assets/objects/pink.png");
    this.load.image("fondo1", "public/assets/fondo.jpg");
    this.load.image("fondo2", "public/assets/fondo2.png");
    this.load.image("rectangle", "/assets/rectangle.png");
    this.load.image("pointer", "/assets/puntero.png");
    this.load.video("introgba", "assets/videos/introgba.mp4");
    this.load.video("introtait", "assets/videos/introtait.mp4");
    this.load.video("introubi", "assets/videos/introubi.mp4");

    //pjs
    this.load.spritesheet("npc", "assets/entieties/npc_idle.png", {
      frameWidth: 64,
      frameHeight: 63,
    });
  }

  create() {
    this.scene.start("IntroGb");
  }
}
