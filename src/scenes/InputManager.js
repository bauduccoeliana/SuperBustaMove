export class InputManager {
  constructor(scene) {
    this.scene = scene;
    this.pad = null;

    this.movement = { x: 0, y: 0 };
    this.shootPressed = false;
    this.lastMenuMoveTime = 0;
  }

  setup() {
    // Verifica todos los gamepads al iniciar
    const pads = this.scene.input.gamepad.gamepads;
    if (pads.length > 0) {
      this.pad = pads[0];
      console.log("🎮 Gamepad ya conectado:", this.pad.id);
      this.showConnectionMessage();
    }

    // Escucha futuras conexiones
    this.scene.input.gamepad.once("connected", (pad) => {
      console.log("🎮 Gamepad conectado:", pad.id);
      this.pad = pad;
      this.showConnectionMessage();
    });

    this.scene.input.gamepad.on("disconnected", (pad) => {
      if (this.pad && this.pad.id === pad.id) {
        console.warn("🎮 Gamepad desconectado:", pad.id);
        this.pad = null;
      }
    });
  }

  update() {
    if (!this.pad) return;

    if (!this.pad.connected) {
      console.warn("🎮 Gamepad desconectado");
      this.pad = null;
      return;
    }

    // Movimiento del stick izquierdo (ejes 0 y 1)
    const x = this.pad.axes.length > 0 ? this.pad.axes[0].getValue() : 0;
    const y = this.pad.axes.length > 1 ? this.pad.axes[1].getValue() : 0;

    this.movement.x = Math.abs(x) > 0.1 ? x : 0;
    this.movement.y = Math.abs(y) > 0.1 ? y : 0;

    // Disparo con botones A/B/X/Y (botones 0-3 en la mayoría de controles)
    this.shootPressed =
      this.pad.buttons[0].pressed || // A
      this.pad.buttons[1].pressed || // B
      this.pad.buttons[2].pressed || // X
      this.pad.buttons[3].pressed; // Y
  }

  showConnectionMessage() {
    // Crea el texto y ocúltalo después de 2 segundos
    const message = this.scene.add.text(10, 10, "Gamepad conectado!", {
      color: "#fff",
    });

    // Configura un temporizador para ocultar el mensaje
    this.messageTimer = this.scene.time.addEvent({
      delay: 2000, // 2 segundos
      callback: () => {
        message.destroy(); // Destruye el texto
      },
    });
  }

  getMovement() {
    return this.movement;
  }

  isShooting() {
    if (!this.pad || !this.pad.buttons) return false;

    const triggerThreshold = 0.5;
    return (
      this.pad.buttons[0].pressed || // A
      this.pad.buttons[1].pressed || // B
      this.pad.buttons[2].pressed || // X
      this.pad.buttons[3].pressed || // Y
      this.pad.buttons[6].value > triggerThreshold || // L2
      this.pad.buttons[7].value > triggerThreshold // R2
    );
  }

  // Para menús, devuelve "up" o "down" con antirebote
  getMenuNavigation() {
    const now = this.scene.time.now;

    if (Math.abs(this.movement.y) > 0.5 && now - this.lastMenuMoveTime > 300) {
      this.lastMenuMoveTime = now;
      return this.movement < 0 ? "up" : "down";
    }

    return null;
  }
}
