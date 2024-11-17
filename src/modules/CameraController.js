class CameraController {
    constructor(camera) {
        this._camera = camera;

        this._x = 0;
        this._y = 0;
        this._dx = 0;
        this._dy = 0;
        this._can_move_camera = true;

        document.addEventListener("touchstart", event => this.OnTouchStart(event));
        document.addEventListener("touchmove", event => this.OnTouchMove(event));
        document.querySelector(".game-canvas").addEventListener("click", () => this.OnMouseDown());
        document.addEventListener("mousemove", event => this.OnMouseMove(event));
    }
  
    OnTouchStart(event) {
        event.preventDefault();

        if (event.touches[0].clientX > window.innerWidth * 0.5) {
            if (event.touches.length >= 2) {
              this._can_move_camera = true;
            } else {
              this._can_move_camera = false;
            }
            
            return;
        }

        this._x = event.touches[0].clientX;
        this._y = event.touches[0].clientY;
        this._dx = this._x;
        this._dy = this._y;

        this._can_move_camera = true;
    }

    OnTouchMove(event) {
        event.preventDefault();

        if (!this._can_move_camera) return;

        this._dx = event.touches[0].clientX - this._x;
        this._dy = event.touches[0].clientY - this._y;
        this._x += this._dx;
        this._y += this._dy;

        this._camera.rotation.y -= this._dx * 0.005;
        this._camera.rotation.x -= this._dy * 0.003;
    }

    OnMouseDown() {
        document.body.requestPointerLock();
    } 

    OnMouseMove(event) {
        if (document.pointerLockElement == document.body) {
            this._camera.rotation.y -= event.movementX / 500;
            this._camera.rotation.x -= event.movementY / 500;
        }
    }
}

export { CameraController }