import { Scene } from "phaser";

export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  preload() {
    this.load.image("transicion", "/assets/trans.png");
    this.load.image("logo", "/assets/logo.png");
    this.load.image("start", "/assets/startbutton.png");
    this.load.image("ball-red", "/assets/objects/red.png");
    this.load.image("ball-blue", "/assets/objects/blue.png");
    this.load.image("ball-green", "/assets/objects/green.png");
    this.load.image("ball-yellow", "/assets/objects/yellow.png");
    this.load.image("ball-purple", "/assets/objects/purple.png");
    this.load.image("ball-pink", "/assets/objects/pink.png");
    this.load.image("fondo1", "/assets/fondo.jpg");
    this.load.image("fondo2", "/assets/fondo2.png");
    this.load.image("rectangle", "/assets/rectangle.png");
    this.load.image("pointer", "/assets/puntero.png");
    //videos
    this.load.video("introgba", "/assets/videos/introgba.mp4");
    this.load.video("introtait", "/assets/videos/introtait.mp4");
    this.load.video("introubi", "/assets/videos/introubi.mp4");
    this.load.video("select1", "/assets/videos/select1.mp4");
    this.load.video("select2", "/assets/videos/select2.mp4");
    this.load.video("select3", "/assets/videos/select3.mp4");
    //sonidos/musica
    this.load.audio("theme1", "/assets/music/theme1.mp3");
    this.load.audio("theme2", "/assets/music/theme2.mp3");
    this.load.audio("theme3", "/assets/music/theme3.mp3");

    //pj
    this.load.spritesheet("npc", "./assets/entieties/npc_idle.png", {
      frameWidth: 64,
      frameHeight: 63,
    });
    //npc
    this.load.spritesheet("pj", "./assets/entieties/pj_idle.png", {
      frameWidth: 111,
      frameHeight: 137,
    });
  }

  init() {
    this.add.image(512, 384, "background");
    this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);
    const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);
    this.load.on("progress", (progress) => {
      bar.width = 4 + 460 * progress;
    });
  }

  create() {
    this.scene.start("IntroGb");
  }
}
