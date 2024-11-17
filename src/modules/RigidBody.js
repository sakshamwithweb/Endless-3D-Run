class RigidBody {
    constructor() {
    }
    
    createBox(mass, pos, quat, size) {
        this._transform = new Ammo.btTransform();
        this._transform.setIdentity();
        this._transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
        this._transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
        this._motion_state = new Ammo.btDefaultMotionState(this._transform);

        const btSize = new Ammo.btVector3(size.x * 0.5, size.y * 0.5, size.z * 0.5);
        this._shape = new Ammo.btBoxShape(btSize);
        this._shape.setMargin(0.05);

        this._inertia = new Ammo.btVector3(0, 0, 0);
        if (mass > 0) {
            this._shape.calculateLocalInertia(mass, this._inertia);
        }
        
        this._info = new Ammo.btRigidBodyConstructionInfo(mass, this._motion_state, this._shape, this._inertia);
        this._body = new Ammo.btRigidBody(this._info);

        Ammo.destroy(btSize);
    }

    Destroy() {
        Ammo.destroy(this._transform);
        Ammo.destroy(this._motion_state);
        Ammo.destroy(this._shape);
        Ammo.destroy(this._inertia);
        Ammo.destroy(this._info);
        Ammo.destroy(this._body);
    }
}

export { RigidBody }