import { Scene } from "phaser";

export class Game extends Scene {
  constructor() {
    super("Game");
    this.colors = ["red", "green", "blue", "yellow", "purple", "pink"];
    this.filaSize = 3; // mostramos la próxima
    this.boundaryWidth = 280;
    this.boundaryHeight = 600;
    this.gridSize = 50;
    this.offsetX = 512 - this.boundaryWidth / 2 + this.gridSize / 2;
    this.offsetY = 405 - this.boundaryHeight / 2 + this.gridSize / 2;
    this.canShoot = true; // sólo un disparo a la vez
    this.rows = 6;
    this.cols = 7;
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
    // Matriz de nulls para saber qué celda está ocupada
    this.grid = Array.from({ length: this.rows }, () =>
      Array(this.cols).fill(null)
    );

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

    this.physics.add.collider(
      this.balls,
      this.wallGroup,
      this.handleBallCollision,
      (moving, hit) => !moving.attached,
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
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const x = this.offsetX + col * this.gridSize;
        const y = this.offsetY + row * this.gridSize;
        const color = Phaser.Utils.Array.GetRandom(this.colors);
        this.createStaticBallGrid(row, col, color);
      }
    }
  }

  shootBall(pointer) {
    if (!this.canShoot) return;
    this.canShoot = false;

    const color = this.nextColors.shift();
    this.nextColors.push(Phaser.Utils.Array.GetRandom(this.colors));
    this.renderFila();

    //bola dinámica
    const ball = this.balls
      .create(this.launchPosition.x, this.launchPosition.y, `ball-${color}`)
      .setOrigin(0.5)
      .setDisplaySize(this.gridSize, this.gridSize);
    ball.body.setCircle(this.gridSize / 2 - 2);
    ball.color = color;
    ball.attached = false;
    ball.setBounce(1).setCollideWorldBounds(true).body.setAllowGravity(false);

    //velocidad
    const angle = Phaser.Math.Angle.Between(
      this.launchPosition.x,
      this.launchPosition.y,
      pointer.x,
      pointer.y
    );
    ball.setVelocity(Math.cos(angle) * 800, Math.sin(angle) * 800);
  }

  createStaticBallGrid(row, col, color) {
    row = Phaser.Math.Clamp(row, 0, this.rows - 1);
    col = Phaser.Math.Clamp(col, 0, this.cols - 1);

    if (this.grid[row][col]) {
      // si el objeto ya fue destruido por animación
      if (!this.grid[row][col].active) {
        this.grid[row][col] = null;
      } else {
        return this.grid[row][col];
      }
    }

    const x = this.offsetX + col * this.gridSize;
    const y = this.offsetY + row * this.gridSize;
    const b = this.wallGroup
      .create(x, y, `ball-${color}`)
      .setOrigin(0.5)
      .setDisplaySize(this.gridSize, this.gridSize);

    const radius = this.gridSize / 2 - 2;
    const offset = (this.gridSize - radius * 2) / 2;
    b.body.setCircle(radius, offset, offset);

    b.row = row;
    b.col = col;
    b.color = color;

    this.grid[row][col] = b; //guarda en la matriz ocupada

    return b;
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
      this.getHexNeighbors(b)
        .filter((nb) => nb.color === start.color)
        .forEach((nb) => stack.push(nb));
    }
    if (cluster.length >= 3) {
      cluster.forEach((b) => b.destroy());
      this.removeFloatingBalls();
    }
  }

  handleBallCollision(moving, hit) {
    
    // 1) Detener y quitar la bola dinámica
    moving.body.setVelocity(0);
    this.physics.world.disable(moving);

    const hitRow = hit.row;
    const hitCol = hit.col;

    // 2) Solo offsets con dr >= 0 (misma fila o filas inferiores)
    const neighborOffsets = [
      { dr: 0, dc: -1 }, // izquierda, misma fila
      { dr: 0, dc: 1 }, // derecha, misma fila
      { dr: 1, dc: 0 }, // justo debajo
      { dr: 1, dc: -1 }, // debajo-izquierda
      { dr: 1, dc: 1 }, // debajo-derecha
    ];

    let staticBall = null;

    // 3) Probar cada vecino en orden fijo
    for (let { dr, dc } of neighborOffsets) {
      const r = Phaser.Math.Clamp(hitRow + dr, 0, this.rows - 1);
      const c = Phaser.Math.Clamp(hitCol + dc, 0, this.cols - 1);
      // si está libre…
      if (!this.grid[r][c]) {
        staticBall = this.createStaticBallGrid(r, c, moving.color);
        break;
      }
    }

    // 4) Si no quedó en ninguno de los de dr>=0,
    //    lo forzamos al impacto (no hay huecos ni abajo ni al lado)
    if (!staticBall) {
      staticBall = this.createStaticBallGrid(hitRow, hitCol, moving.color);
    }

    // 5) Destruir bola dinámica y cluster
    this.balls.remove(moving, true, true); //destruye directo
    this.checkCluster(staticBall);

    // 6) Reactivar disparo
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

  getNeighbors(ball) {
    return this.wallGroup.getChildren().filter((b) => {
      if (b === ball) return false;
      return (
        Phaser.Math.Distance.Between(ball.x, ball.y, b.x, b.y) <=
        this.gridSize * 1.1
      );
    });
  }

  //balls vecinas en el grid hex
  getHexNeighbors(ball) {
    const { row, col } = ball;
    // offsets para filas pares/impares
    const offsets =
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

    const neighbors = [];
    offsets.forEach(([dr, dc]) => {
      const r = row + dr;
      const c = col + dc;
      //límites
      if (r < 0 || c < 0 || r >= this.rows || c >= this.cols) return;
      // busca una bola en esa celda
      this.wallGroup.getChildren().forEach((b) => {
        if (b.row === r && b.col === c) {
          neighbors.push(b);
        }
      });
    });
    return neighbors;
  }

  removeFloatingBalls() {
    const visited = new Set(),
      queue = [];

    this.wallGroup.getChildren().forEach((b) => {
      //todas las bolas de la fila superior (row 0)
      if (b.row === 0) {
        visited.add(`${b.row},${b.col}`);
        queue.push(b);
      }
    });

    while (queue.length) {
      const b = queue.shift(); //BFS para marcar todas las conectadas
      this.getHexNeighbors(b).forEach((nb) => {
        const key = `${nb.row},${nb.col}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push(nb);
        }
      });
    }

    this.wallGroup.getChildren().forEach((b) => {
      const key = `${b.row},${b.col}`; //no están en visited → CAEN
      if (!visited.has(key)) {
        this.tweens.add({
          targets: b, //libera celda  b.row, b.col  ya no ocupada y animamos la caída
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
