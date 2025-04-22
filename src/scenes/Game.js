import { Scene } from "phaser";

export class Game extends Scene {
  constructor() {
    super("Game");
    this.colors = ["red", "green", "blue", "yellow"];
    this.filaSize = 3; // mostramos la próxima
    this.boundaryWidth = 280;
    this.boundaryHeight = 600;
    this.gridSize = 40;
    this.offsetX = 512 - this.boundaryWidth / 2 + this.gridSize / 2;
    this.offsetY = 405 - this.boundaryHeight / 2 + this.gridSize / 2;
    this.canShoot = true; // sólo un disparo a la vez
  }

  create() {
    // — Mundo y marco —
    this.physics.world.setBounds(
      512 - this.boundaryWidth / 2,
      405 - this.boundaryHeight / 2,
      this.boundaryWidth,
      this.boundaryHeight
    );
    this.add
      .rectangle(
        512,
        405,
        this.boundaryWidth,
        this.boundaryHeight,
        0xffffff,
        0.1
      )
      .setStrokeStyle(2, 0xffffff, 0.3);

    // — Grupos y datos —
    this.nextColors = [];
    this.filaSprites = this.add.group();
    this.balls = this.physics.add.group();
    this.wallGroup = this.physics.add.staticGroup();

    // — Próximas bolas —
    for (let i = 0; i < this.filaSize; i++) {
      this.nextColors.push(Phaser.Utils.Array.GetRandom(this.colors));
    }
    this.renderFila();

    // — Muro en patrón hexagonal —
    this.createWall();

    // — Disparo —
    this.launchPosition = { x: 512, y: 620 };
    this.input.setDefaultCursor("crosshair");
    this.cannonLine = this.add.graphics();
    this.input.on("pointerdown", (p) => this.shootBall(p));

    // — Collider bola en movimiento vs muro estático —
    this.physics.add.collider(
      this.balls,
      this.wallGroup,
      this.handleBallCollision,
      null,
      this
    );

    // — Fondo y línea de game over —
    this.add.image(512, 380, "fondo1").setDepth(-1).setScale(1.02);
    this.gameOverLineY = 540;
    this.drawGameOverLine();
  }

  update() {
    // línea de puntería
    this.cannonLine.clear();
    this.cannonLine.lineStyle(2, 0xffffff, 1);
    this.cannonLine.beginPath();
    this.cannonLine.moveTo(this.launchPosition.x, this.launchPosition.y);
    const p = this.input.activePointer;
    this.cannonLine.lineTo(p.x, p.y);
    this.cannonLine.strokePath();

    this.checkGameOver();
  }

  renderFila() {
    this.filaSprites.clear(true, true);
    const startX = 400,
      startY = 720;
    this.nextColors.forEach((color, i) => {
      this.add
        .image(startX + i * this.gridSize, startY, `ball-${color}`)
        .setOrigin(0.5)
        .setDisplaySize(this.gridSize, this.gridSize);
    });
  }

  createWall() {
    const cols = 7,
      rows = 6;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const xOffset = row % 2 === 1 ? this.gridSize / 2 : 0;
        const x = this.offsetX + col * this.gridSize + xOffset;
        const y = this.offsetY + row * this.gridSize;
        const color = Phaser.Utils.Array.GetRandom(this.colors);
        this.createStaticBall(x, y, color);
      }
    }
  }

  shootBall(pointer) {
    if (!this.canShoot) return;
    this.canShoot = false;

    // tomar color y refrescar fila
    const color = this.nextColors.shift();
    this.nextColors.push(Phaser.Utils.Array.GetRandom(this.colors));
    this.renderFila();

    // crear bola dinámica
    const ball = this.balls
      .create(this.launchPosition.x, this.launchPosition.y, `ball-${color}`)
      .setOrigin(0.5)
      .setDisplaySize(this.gridSize, this.gridSize);
    ball.body.setCircle(this.gridSize / 2 - 2);
    ball.color = color;
    ball.attached = false;
    ball.setBounce(1).setCollideWorldBounds(true).body.setAllowGravity(false);

    // velocidad en dirección del puntero
    const angle = Phaser.Math.Angle.Between(
      this.launchPosition.x,
      this.launchPosition.y,
      pointer.x,
      pointer.y
    );
    ball.setVelocity(Math.cos(angle) * 800, Math.sin(angle) * 800);
  }

  handleBallCollision(movingBall, hitBall) {
    if (movingBall.attached) return;
    movingBall.attached = true;

    // detener y remover disparada
    movingBall.body.setVelocity(0);
    this.physics.world.disable(movingBall);
    this.balls.remove(movingBall, false, false);
    movingBall.destroy();

    // —— decidir en qué celda hex colocarla ——
    const hitGrid = this.getAlignedPosition(hitBall.x, hitBall.y);
    // offsets de vecinos según fila par/impar
    const nbrs =
      hitGrid.row % 2 === 0
        ? [
            { dr: -1, dc: 0 },
            { dr: -1, dc: 1 },
            { dr: 0, dc: 1 },
            { dr: 1, dc: 1 },
            { dr: 1, dc: 0 },
            { dr: 0, dc: -1 },
          ]
        : [
            { dr: -1, dc: -1 },
            { dr: -1, dc: 0 },
            { dr: 0, dc: 1 },
            { dr: 1, dc: 0 },
            { dr: 1, dc: -1 },
            { dr: 0, dc: -1 },
          ];

    let best = null,
      bestDist = Infinity;
    // buscar vecino libre más cercano al punto de colisión
    nbrs.forEach((o) => {
      const r = hitGrid.row + o.dr;
      const c = hitGrid.col + o.dc;
      const x =
        this.offsetX + c * this.gridSize + (r % 2 ? this.gridSize / 2 : 0);
      const y = this.offsetY + r * this.gridSize;
      // existe ya bola ahí?
      const occ = this.wallGroup
        .getChildren()
        .some((b) => b.x === x && b.y === y);
      if (!occ) {
        const d = Phaser.Math.Distance.Between(
          movingBall.x,
          movingBall.y,
          x,
          y
        );
        if (d < bestDist) {
          bestDist = d;
          best = { x, y };
        }
      }
    });

    // fallback sobre su propia posición si no hay vecino libre
    if (!best) {
      const a = this.getAlignedPosition(movingBall.x, movingBall.y);
      best = { x: a.x, y: a.y };
    }

    // crear bola estática y chequear cluster
    const staticBall = this.createStaticBall(best.x, best.y, movingBall.color);
    this.checkCluster(staticBall);

    // reactivar disparo
    this.time.delayedCall(100, () => (this.canShoot = true));
  }

  getAlignedPosition(px, py) {
    const row = Math.round((py - this.offsetY) / this.gridSize);
    const isOdd = row % 2 === 1;
    const col = Math.round(
      (px - this.offsetX - (isOdd ? this.gridSize / 2 : 0)) / this.gridSize
    );
    const x =
      this.offsetX + col * this.gridSize + (isOdd ? this.gridSize / 2 : 0);
    const y = this.offsetY + row * this.gridSize;
    return { x, y, row, col };
  }

  createStaticBall(x, y, color) {
    // redondear posición para evitar acumulaciones pequeñas
    x = Math.round(x);
    y = Math.round(y);

    const ball = this.wallGroup.create(x, y, `ball-${color}`);
    ball.setOrigin(0.5).setDisplaySize(this.gridSize, this.gridSize);
    ball.body.setCircle(this.gridSize / 2 - 2);
    ball.color = color;
    return ball;
  }

  checkCluster(startBall) {
    const toCheck = [startBall];
    const visited = new Set();
    const cluster = [];
    while (toCheck.length) {
      const b = toCheck.pop();
      if (!b || visited.has(b)) continue;
      visited.add(b);
      cluster.push(b);
      this.getNeighbors(b).forEach((n) => {
        if (n.color === startBall.color) toCheck.push(n);
      });
    }
    if (cluster.length >= 3) {
      cluster.forEach((b) => b.destroy());
      this.removeFloatingBalls();
    }
  }

  getNeighbors(ball) {
    return this.wallGroup.getChildren().filter((b) => {
      if (b === ball) return false;
      return (
        Phaser.Math.Distance.Between(ball.x, ball.y, b.x, b.y) <=
        this.gridSize * 1.1
      );
    });
  }

  removeFloatingBalls() {
    const visited = new Set();
    const toCheck = [];

    // Empezamos desde las bolas conectadas al techo
    this.wallGroup.getChildren().forEach((b) => {
      if (b.y <= this.offsetY + this.gridSize) toCheck.push(b);
    });

    while (toCheck.length) {
      const b = toCheck.pop();
      if (visited.has(b)) continue;
      visited.add(b);
      this.getNeighbors(b).forEach((n) => toCheck.push(n));
    }

    // Animamos las bolas que no están conectadas al techo
    this.wallGroup.getChildren().forEach((b) => {
      if (!visited.has(b)) {
        this.wallGroup.remove(b); // remover del grupo estático
        this.tweens.add({
          targets: b,
          y: b.y + 1000,
          alpha: 0,
          duration: 800,
          onComplete: () => {
            b.destroy();
          },
        });
      }
    });
  }

  checkGameOver() {
    this.wallGroup.getChildren().forEach((b) => {
      if (b.y + this.gridSize / 2 >= this.gameOverLineY) {
        this.scene.start("GameOver");
      }
    });
  }

  drawGameOverLine() {
    this.add
      .graphics()
      .lineStyle(4, 0xff0000, 1)
      .beginPath()
      .moveTo(512 - this.boundaryWidth / 2, this.gameOverLineY)
      .lineTo(512 + this.boundaryWidth / 2, this.gameOverLineY)
      .strokePath();
  }
}
