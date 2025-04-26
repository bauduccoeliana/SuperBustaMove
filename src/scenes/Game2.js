import { Scene } from "phaser";

export class Game2 extends Scene {
  constructor() {
    super("Game2");
    this.colors = ["red", "green", "blue", "yellow", "purple", "pink"];
    this.nextCount = 3;
    this.gridSize = 40;
    this.boundary = { width: 282, height: 595 };
    this.origin = { x: 510, y: 405 };
    this.launchPos = { x: 512, y: 620 };
    this.canShoot = true;
    this.rows = 12;
    this.cols = 7;
    this.minAimLength = 149;
    this.maxAimLength = 150;
    this.pointerSize = { width: 40, height: 75 };
  }

  create() {
    // Mundo y límite
    const { width, height } = this.boundary;
    this.physics.world.setBounds(
      this.origin.x - width / 2,
      this.origin.y - height / 2,
      width,
      height
    );
    this.add
      .rectangle(this.origin.x, this.origin.y, width, height, 0xffffff, 0.1)
      .setDepth(-1)
      .setStrokeStyle(2, 0xffffff, 0.3);

    // Grilla de bolas
    this.balls = this.physics.add.group();
    this.grid = Array.from({ length: this.rows }, () =>
      Array(this.cols).fill(null)
    );
    this.initWall();

    //prox balls
    this.nextColors = [];
    for (let i = 0; i < this.nextCount; i++) {
      this.nextColors.push(Phaser.Utils.Array.GetRandom(this.colors));
    }
    this.renderNext();

    //puntero
    this.input.setDefaultCursor("crosshair");
    this.aimPointer = this.add
      .image(this.launchPos.x, this.launchPos.y, "pointer")
      .setScale(4)
      .setOrigin(0.85)
      .setDisplaySize(80, 80)
      .setVisible(false);
    this.input.on("pointerdown", (p) => this.shoot(p));

    //animación idle
    this.anims.create({
      key: "npc",
      frames: this.anims.generateFrameNumbers("npc", { start: 0, end: 5 }),
      frameRate: 8,
      repeat: -1,
    });
    this.player = this.add.sprite(630, 670, "npc").setScale(1.5);
    this.player.play("npc");

    //colision
    this.physics.add.collider(
      this.balls,
      this.balls,
      (shot, cell) => this.handleCollision(shot, cell),
      (shot, cell) => !cell.isShot,
      this
    );

    this.add
      .image(this.origin.x, this.origin.y - 25, "fondo2")
      .setDepth(-1)
      .setScale(1.02);
    //gameoverline
    this.gameOverY = this.origin.y + height / 2 - 150;
    this.drawGameOverLine();
  }

  update() {
    this.updateAimPointer();
    // Detección y pegado al techo del boundary
    const topY = this.origin.y - this.boundary.height / 2 + this.gridSize / 2;
    this.balls.getChildren().forEach((shot) => {
      if (shot.isShot && shot.y <= topY) {
        const col = Phaser.Math.Clamp(
          Math.round(
            (shot.x -
              (this.origin.x - this.boundary.width / 2 + this.gridSize / 2)) /
              this.gridSize
          ),
          0,
          this.cols - 1
        );
        this.placeShot(0, col, shot.color);
        shot.destroy();
        this.checkCluster(this.grid[0][col]);
        this.canShoot = true;
      }
    });

    this.checkGameOver();
  }

  //puntero disparo
  updateAimPointer() {
    const p = this.input.activePointer;
    const dx = p.x - this.launchPos.x;
    const dy = p.y - this.launchPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const length = Phaser.Math.Clamp(
      dist,
      this.minAimLength,
      this.maxAimLength
    );
    const angle = Phaser.Math.Angle.Between(
      this.launchPos.x,
      this.launchPos.y,
      p.x,
      p.y
    );

    this.aimPointer
      .setVisible(true)
      .setPosition(this.launchPos.x, this.launchPos.y)
      .setRotation(angle + Phaser.Math.DegToRad(90))
      .setDisplaySize(this.pointerSize.width, length);
  }

  //grid balls
  initWall() {
    for (let r = 0; r < this.rows - 5; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.addCell(r, c, Phaser.Utils.Array.GetRandom(this.colors));
      }
    }
  }

  //celdas de grilla
  addCell(row, col, color) {
    const x =
      this.origin.x -
      this.boundary.width / 2 +
      col * this.gridSize +
      this.gridSize / 2;
    const y =
      this.origin.y -
      this.boundary.height / 2 +
      row * this.gridSize +
      this.gridSize / 2;
    const cell = this.balls
      .create(x, y, `ball-${color}`)
      .setOrigin(0.5)
      .setDisplaySize(this.gridSize, this.gridSize);

    cell.body.setCircle(this.gridSize / 1.5);
    cell.body.setOffset(this.gridSize / 2, this.gridSize / 2);
    cell.setImmovable(false);
    cell.isShot = false;
    cell.row = row;
    cell.col = col;
    cell.color = color;
    this.grid[row][col] = cell;
  }

  //fila prox
  renderNext() {
    if (this.nextGroup) this.nextGroup.clear(true, true);
    this.nextGroup = this.add.group();
    const baseX = 400,
      baseY = 720;
    this.nextColors.forEach((col, i) => {
      this.nextGroup
        .create(baseX + i * this.gridSize, baseY, `ball-${col}`)
        .setOrigin(0.5)
        .setDisplaySize(this.gridSize, this.gridSize);
    });
  }

  //disparo balls
  shoot(pointer) {
    if (!this.canShoot) return;
    this.canShoot = false;

    const color = this.nextColors.shift();
    this.nextColors.push(Phaser.Utils.Array.GetRandom(this.colors));
    this.renderNext();

    const shot = this.balls
      .create(this.launchPos.x, this.launchPos.y, `ball-${color}`)
      .setOrigin(0.5)
      .setDisplaySize(this.gridSize, this.gridSize);
    shot.body.setCircle(this.gridSize / 1.5);
    shot.body.setOffset(this.gridSize / 2, this.gridSize / 2);
    shot.color = color;
    shot.isShot = true;
    shot.setBounce(1).setCollideWorldBounds(true).body.setAllowGravity(false);

    const angle = Phaser.Math.Angle.Between(
      this.launchPos.x,
      this.launchPos.y,
      pointer.x,
      pointer.y
    );
    shot.setVelocity(Math.cos(angle) * 800, Math.sin(angle) * 800);
  }

  //colision pared/balls
  handleCollision(shot, cell) {
    shot.body.setVelocity(0);
    this.physics.world.disable(shot);

    const { row, col } = this.findGridPos(cell.row, cell.col, shot);
    this.placeShot(row, col, shot.color);
    shot.destroy();
    this.checkCluster(this.grid[row][col]);
    this.time.delayedCall(100, () => (this.canShoot = true));
  }

  //busca posición vacía en el grid
  findGridPos(r, c, shot) {
    const neighbors = [
      [0, -1],
      [0, 1],
      [1, 0],
      [1, -1],
      [1, 1],
    ];
    for (const [dr, dc] of neighbors) {
      const nr = Phaser.Math.Clamp(r + dr, 0, this.rows - 1);
      const nc = Phaser.Math.Clamp(c + dc, 0, this.cols - 1);
      if (!this.grid[nr][nc]) return { row: nr, col: nc };
    }
    return { row: r, col: c };
  }

  placeShot(row, col, color) {
    this.addCell(row, col, color);
  }

  //arma conjunto-color
  checkCluster(start) {
    const stack = [start],
      visited = new Set(),
      cluster = [];
    while (stack.length) {
      const b = stack.pop();
      const key = `${b.row},${b.col}`;
      if (visited.has(key)) continue;
      visited.add(key);
      cluster.push(b);
      this.getNeighbors(b)
        .filter((n) => n.color === start.color)
        .forEach((n) => stack.push(n));
    }
    if (cluster.length >= 3) {
      cluster.forEach((b) => {
        this.grid[b.row][b.col] = null;
        b.destroy();
      });
      this.removeFloating();
    }
  }

  //busca vecinos de = color
  getNeighbors(ball) {
    const { row, col } = ball;
    const offs =
      row % 2 === 0
        ? [
            [-1, 0],
            [-1, 1],
            [0, 1],
            [1, 1],
            [1, 0],
            [0, -1],
          ]
        : [
            [-1, -1],
            [-1, 0],
            [0, 1],
            [1, 0],
            [1, -1],
            [0, -1],
          ];
    return offs
      .map(([dr, dc]) => {
        const r = row + dr,
          c = col + dc;
        return r >= 0 && c >= 0 && r < this.rows && c < this.cols
          ? this.grid[r][c]
          : null;
      })
      .filter((n) => n);
  }

  //elimina balls sueltas
  removeFloating() {
    const visited = new Set(),
      queue = [];
    this.grid[0].forEach((cell) => {
      if (cell) {
        visited.add(`0,${cell.col}`);
        queue.push(cell);
      }
    });
    while (queue.length) {
      const b = queue.shift();
      this.getNeighbors(b).forEach((n) => {
        const key = `${n.row},${n.col}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push(n);
        }
      });
    }
    this.grid.flat().forEach((b) => {
      if (b && !visited.has(`${b.row},${b.col}`)) {
        this.tweens.add({
          targets: b,
          y: b.y + 100,
          alpha: 0,
          duration: 500,
          onComplete: () => {
            this.grid[b.row][b.col] = null;
            b.destroy();
          },
        });
      }
    });
  }

  //linea gameover
  drawGameOverLine() {
    this.add
      .graphics()
      .lineStyle(4, 0xff0000, 1)
      .beginPath()
      .moveTo(this.origin.x - this.boundary.width / 2, this.gameOverY)
      .lineTo(this.origin.x + this.boundary.width / 2, this.gameOverY)
      .strokePath();
  }

  //update gameover
  checkGameOver() {
    if (
      this.grid
        .flat()
        .some((b) => b && b.y + this.gridSize / 2 >= this.gameOverY)
    ) {
      this.scene.start("MainMenu");
    }
  }
}
