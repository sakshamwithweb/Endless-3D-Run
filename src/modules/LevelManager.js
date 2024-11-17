import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

const MAX_PLATFORMS = 25;
const MAX_TRIANGLES = 100;

class LevelManager {
    constructor(platformManager, scene, characterController) {
        this._platform_manager = platformManager;
        this._scene = scene;
        this._character_controller = characterController;

        this._max_jump_dist = this._character_controller.maxJumpDist;

        this._starting_wall_depth = 10000;
        this._next_wall_depth = this._starting_wall_depth;
        this._next_wall_z_pos = this._next_wall_depth * 0.5;

        this._platform_added_depth = 0;
        this._next_platform_z_pos = 50 + this._max_jump_dist * 0.5;

        this._triangles = [];
        this._spawn_z = 150;
        this._rotation = 1;

        this.CreateMap();
    }

    Rand(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    CreateMap() {
        const quat = new THREE.Quaternion();
        this._platform_manager.CreateWall(new THREE.Vector3(100, 1, 100), new THREE.Vector3(0, 0, 0), quat, {thickness: 0.5, smoothness: 0.01});
        this._platform_manager.CreateWall(new THREE.Vector3(99, 99, 1), new THREE.Vector3(0, 50, -50), quat, {thickness: 0.5, smoothness: 0.01});
        this._platform_manager.CreateWall(new THREE.Vector3(20, 99, 1), new THREE.Vector3(-40, 50, 50), quat, {thickness: 0.5, smoothness: 0.01});
        this._platform_manager.CreateWall(new THREE.Vector3(20, 99, 1), new THREE.Vector3(40, 50, 50), quat, {thickness: 0.5, smoothness: 0.01});
        this._platform_manager.CreateWall(new THREE.Vector3(1, 99, 99), new THREE.Vector3(50, 50, 0), quat, {thickness: 0.5, smoothness: 0.01});
        this._platform_manager.CreateWall(new THREE.Vector3(1, 99, 99), new THREE.Vector3(-50, 50, 0), quat, {thickness: 0.5, smoothness: 0.01});
        this._platform_manager.CreateWall(new THREE.Vector3(100, 1, 100), new THREE.Vector3(0, 101, 0), quat, {thickness: 0.5, smoothness: 0.01});
    
        this.CreateCorridor();
    }

    CreateCorridor() {
        const quat = new THREE.Quaternion();
        if (this._walls) {
            this._walls.forEach(wall => {
                wall.geometry.dispose();
                this._scene.remove(wall);
            });
        }
        this._walls = [
            this._platform_manager.CreateWall(new THREE.Vector3(1, 150, this._next_wall_depth), new THREE.Vector3(-75, 25, this._next_wall_z_pos + 50), quat, {thickness: 0.5, smoothness: 0.01}),
            this._platform_manager.CreateWall(new THREE.Vector3(1, 150, this._next_wall_depth), new THREE.Vector3(75, 25, this._next_wall_z_pos + 50), quat, {thickness: 0.5, smoothness: 0.01}),
            this._platform_manager.CreateWall(new THREE.Vector3(150, 1, this._next_wall_depth), new THREE.Vector3(0, -51, this._next_wall_z_pos + 50), quat, {thickness: 0.5, smoothness: 0.01}),
            this._platform_manager.CreateWall(new THREE.Vector3(150, 1, this._next_wall_depth), new THREE.Vector3(0, 101, this._next_wall_z_pos + 50), quat, {thickness: 0.5, smoothness: 0.01})
        ]
        this._next_wall_depth += this._starting_wall_depth;
        this._next_wall_z_pos += this._starting_wall_depth * 0.5;
    }

    SpawnPlatform() {
        this._platform_added_depth = this.Rand(8, 15);
        const rand = this.Rand(1, 10);
        const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(
            rand == 1 ? -0.3 : 0.0, 
            0.0, 
            rand == 2 ? 0.6 : rand == 3 ? -0.6 : 0.0, 
            "XYZ"
        ));
        this._platform_manager.CreatePlatform(
            new THREE.Vector3(this.Rand(3, 8), this.Rand(7, 10), this._platform_added_depth), 
            new THREE.Vector3(this.Rand(-7, 7), 0, this._next_platform_z_pos),
            quaternion
        );

        this._next_platform_z_pos += this._platform_added_depth + this.Rand(this._max_jump_dist - 3, this._max_jump_dist);
    }

    CreateTriangle() {
        const points = [
            new THREE.Vector3(-75, 99, this._spawn_z),
            new THREE.Vector3(75, 99, this._spawn_z),
            new THREE.Vector3(0, -49, this._spawn_z)
        ];

        const geometry = new THREE.Geometry();
        geometry.vertices.push(points[0]);
        geometry.vertices.push(points[1]);
        geometry.vertices.push(points[2]);
        geometry.vertices.push(points[0]);

        const triangle = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x00ccff }));
        triangle.rotation.z = this._rotation;
        this._scene.add(triangle);

        this._triangles.push(triangle);

        this._rotation += 1;
        this._spawn_z += 150;
    }

    ResetLevel() {
        this._platform_manager.RemoveAllPlatforms();

        this._max_jump_dist = this._character_controller.maxJumpDist;

        this._triangles.forEach(triangle => {
            triangle.geometry.dispose();
            this._scene.remove(triangle);
        });

        this._triangles.splice(0, this._triangles.length);

        this._starting_wall_depth = 10000;
        this._next_wall_depth = this._starting_wall_depth;
        this._next_wall_z_pos = this._next_wall_depth * 0.5;

        this._platform_added_depth = 0;
        this._next_platform_z_pos = 50 + this._character_controller.maxJumpDist * 0.5;

        this._rotation = 1;
        this._spawn_z = 150;
    }

    Update(e) {
        if (this._platform_manager._platforms.length < MAX_PLATFORMS) this.SpawnPlatform();
        if (this._triangles.length < MAX_TRIANGLES) this.CreateTriangle();

        const transform = this._character_controller._body.getWorldTransform();
        const pos = transform.getOrigin();

        const i = this._triangles.findIndex(triangle => triangle.geometry.vertices[0].z < pos.z());
    
        if (i > -1) {
            const triangle = this._triangles.splice(i, 1)[0];
            triangle.geometry.dispose();
            triangle.material.dispose();
            this._scene.remove(triangle);
        }

        if (pos.z() > this._next_wall_z_pos * 0.5) this.CreateCorridor();

        this._platform_manager.Update(e);
    }    
}

export { LevelManager }