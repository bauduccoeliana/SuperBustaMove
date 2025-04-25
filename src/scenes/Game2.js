import { Scene } from "phaser";

export class Game2 extends Scene {
    constructor () {
        super("Game2");
        this.colors = ["red", "green", "blue", "yellow", "purple", "pink"];
        this.nextCount = 3;
        this.gridSize = 40;
        this.boundary = { width: 280, height: 600 };
        this.origin = { x: 512, y: 405 };
        this.launchPos = { x: 512, y: 620 };
        this.canShoot = true;
        this.rows = 12;
        this.cols = 7;
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
      .setStrokeStyle(2, 0xffffff, 0.3);

    // Grilla de bolas
    this.balls = this.physics.add.group();
    this.grid = Array.from({ length: this.rows }, () =>
      Array(this.cols).fill(null)
    );
    this.initWall();

    // Próximas bolas
    this.nextColors = [];
    for (let i = 0; i < this.nextCount; i++) {
      this.nextColors.push(Phaser.Utils.Array.GetRandom(this.colors));
    }
    this.renderNext();

    // Disparo
    this.input.setDefaultCursor("crosshair");
    this.aimLine = this.add.graphics();
    this.input.on("pointerdown", (p) => this.shoot(p));

    // Colisión bolas disparo vs pared
    this.physics.add.collider(
      this.balls,
      this.balls,
      (shot, cell) => this.handleCollision(shot, cell),
      (shot, cell) => !cell.isShot,
      this
    );

    // Fondo y game over
    this.add
      .image(this.origin.x, this.origin.y - 25, "fondo2")
      .setDepth(-1)
      .setScale(1.02);
    this.gameOverY = this.origin.y + height / 2 - 180;
    this.drawGameOverLine();
  }

  update() {
    this.drawAimLine();
    this.checkGameOver();
  }

  initWall() {
    for (let r = 0; r < this.rows - 5; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.addCell(r, c, Phaser.Utils.Array.GetRandom(this.colors));
      }
    }
  }

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

    cell.body.setCircle(this.gridSize / 2 - 2);
    cell.setImmovable(false);
    cell.isShot = false;
    cell.row = row;
    cell.col = col;
    cell.color = color;
    this.grid[row][col] = cell;
  }

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

  shoot(pointer) {
    if (!this.canShoot) return;
    this.canShoot = false;

    const color = this.nextColors.shift();
    this.nextColors.push(Phaser.Utils.Array.GetRandom(this.colors));
    this.renderNext();

    const shot = this.balls
      .create(this.launchPos.x, this.launchPos.y, `ball-${color}`)
      .setOrigin(1)
      .setDisplaySize(this.gridSize, this.gridSize);
    shot.body.setCircle(this.gridSize / 2 - 2);
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

  handleCollision(shot, cell) {
    shot.body.setVelocity(0);
    this.physics.world.disable(shot);

    const { row, col } = this.findGridPos(cell.row, cell.col, shot);
    this.placeShot(row, col, shot.color);
    shot.destroy();
    this.checkCluster(this.grid[row][col]);
    this.time.delayedCall(100, () => (this.canShoot = true));
  }

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

  drawAimLine() {
    this.aimLine.clear();
    this.aimLine.lineStyle(2, 0xffffff, 1);
    this.aimLine.beginPath();
    this.aimLine.moveTo(this.launchPos.x, this.launchPos.y);
    const p = this.input.activePointer;
    this.aimLine.lineTo(p.x, p.y);
    this.aimLine.strokePath();
  }

  drawGameOverLine() {
    this.add
      .graphics()
      .lineStyle(4, 0xff0000, 1)
      .beginPath()
      .moveTo(this.origin.x - this.boundary.width / 2, this.gameOverY)
      .lineTo(this.origin.x + this.boundary.width / 2, this.gameOverY)
      .strokePath();
  }

  checkGameOver() {
    if (
      this.grid
        .flat()
        .some((b) => b && b.y + this.gridSize / 2 >= this.gameOverY)
    ) {
      this.scene.start("GameOver");
    }
  }
}