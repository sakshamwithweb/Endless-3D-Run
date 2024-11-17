const flags = {
    CF_STATIC_OBJECT: 1,
    CF_KINEMATIC_OBJECT: 2,
    CF_NO_CONTACT_RESPONSE: 4,
    CF_CUSTOM_MATERIAL_CALLBACK: 8,
    CF_CHARACTER_OBJECT: 16
};

const GRAVITY = 75;

class CharacterController {
    constructor() {
        this._player_speed = document.querySelector("#playerSpeed").value;
        this._max_jump_dist = document.querySelector("#maxJumpDistance").value;
    }

    Destroy() {
    }

    Initialize(pos, quat) {
        const radius = 3;
        const height = 5;

        this._tmp_vec = new Ammo.btVector3();
        this._has_collided = true;

        this._transform = new Ammo.btTransform();
        this._transform.setIdentity();
        this._transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
        this._transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));

        this._motion_state = new Ammo.btDefaultMotionState(this._transform);

        this._shape = new Ammo.btCapsuleShape(radius, height);
        this._shape.setMargin(0.05);

        this._body = new Ammo.btPairCachingGhostObject();
        this._body.setWorldTransform(this._transform);
        this._body.setCollisionShape(this._shape);
        this._body.setCollisionFlags(flags.CF_CHARACTER_OBJECT);
        this._body.activate(true);

        this._controller = new Ammo.btKinematicCharacterController(this._body, this._shape, 0.35, 1);
        this._controller.setUseGhostSweepTest(true);
        this._controller.setUpInterpolate();
        this._controller.setGravity(GRAVITY);
        this._controller.setMaxSlope(Math.PI / 3);
        this._controller.canJump(true);
        this._controller.setJumpSpeed(GRAVITY / 3);
        this._controller.setMaxJumpHeight(100);
    }

    get playerSpeed() {
        return this._player_speed;
    }

    get maxJumpDist() {
        return this._max_jump_dist;
    }

    Move(direction) {
        this._tmp_vec.setX(direction.x);
        this._tmp_vec.setY(direction.y);
        this._tmp_vec.setZ(direction.z);
        this._controller.setWalkDirection(this._tmp_vec);

        const newTransform = this._body.getWorldTransform();

        return newTransform;
    }

    Jump() {
        this._controller.jump();
    }

    Teleport(pos) {
        const position = new Ammo.btVector3(pos.x, pos.y, pos.z);
        this._transform.setOrigin(position);
        this._body.setWorldTransform(this._transform);
        this._motion_state.setWorldTransform(this._transform);

        Ammo.destroy(position);
    }

    CheckForNewCollisions() {
        const isColliding = this._body.getNumOverlappingObjects() > 0;

        if (isColliding && !this._has_collided) {
            this._has_collided = true;
            return true;
        }

        if (!isColliding && this._has_collided) {
            this._has_collided = false;
            return false;
        }
    }

    GetCollidingObjects() {
        const contacts = this._body.getNumOverlappingObjects();
        const contactObjects = [];
        
        if (contacts > 0) {
            for (let i = 0; i < contacts; i++) {
                const contactObject = this._body.getOverlappingObject(i);

                if (!contactObject) continue;

                contactObjects.push(contactObject);
            }
        }

        return contactObjects;
    }
}

export { CharacterController }