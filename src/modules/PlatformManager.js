import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import { RigidBody } from './RigidBody.js';


const VS = `
varying vec3 vPos;

void main() {
    vPos = position;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FS = `
varying vec3 vPos;

uniform vec3 size;
uniform vec3 color;
uniform float thickness;
uniform float smoothness;
uniform float u_time;

void main() {
    float a = smoothstep(thickness, thickness + smoothness, length(abs(vPos.xy) - size.xy));
    a *= smoothstep(thickness, thickness + smoothness, length(abs(vPos.yz) - size.yz));
    a *= smoothstep(thickness, thickness + smoothness, length(abs(vPos.xz) - size.xz));
    
    vec3 c = mix(color, vec3(0.0), a);
    
    gl_FragColor = vec4(c, 1.0);
  }
`;


class PlatformManager {
    constructor(scene, physicsWorld) {
        this._scene = scene;
        this._physics_world = physicsWorld;

        /* Stores Platforms */
        this._platforms = [];
    }

    Rand(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    CreatePlatform(size, pos, quat, borderProperties) {
        /* Parameters for Shader */
        const uniforms = {
            size: { value: new THREE.Vector3(size.x, size.y, size.z).multiplyScalar(0.5) },
            color: { value: new THREE.Color(0,0,0).setHex(0x00ccff) },
            thickness: { value: 0.1 },
            smoothness: { value: 0.01 }
        }

        /* Adjust Parameters if borderProperties Parameter is Passed in */
        if (borderProperties) {
            uniforms.thickness.value = borderProperties.thickness ? borderProperties.thickness : 0.01;
            uniforms.smoothness.value = borderProperties.smoothness ? borderProperties.smoothness : 0.01;
        }

        /* Create the Mesh */
        const ground = new THREE.Mesh(
            new THREE.BoxBufferGeometry(size.x, size.y, size.z),
            new THREE.ShaderMaterial({
                vertexShader: VS,
                fragmentShader: FS,
                uniforms: uniforms
            })
        );
        ground.position.copy(pos);
        ground.setRotationFromQuaternion(quat);
        this._scene.add(ground);

        /* Create the Rigid Body */
        const rbGround = new RigidBody();
        rbGround.createBox(0, ground.position, ground.quaternion, size);
        this._physics_world.addRigidBody(rbGround._body, 1, -1);
        rbGround._body.needUpdate = true;

        /* Set Custom User Data */
        ground.userData.physicsBody = rbGround;
        ground.userData.isMoving = this.Rand(0, 10) == 0;
        if (ground.userData.isMoving) ground.userData.moveDirection = this.Rand(0, 1) == 0 ? 1 : -1;

        /* Add Platform to List */
        this._platforms.push(ground);

        return ground;
    }

    CreateWall(size, pos, quat, borderProperties) {
        /* Parameters for Shader */
        const uniforms = {
            size: { value: new THREE.Vector3(size.x, size.y, size.z).multiplyScalar(0.5) },
            color: { value: new THREE.Color(0,0,0).setHex(0x00ccff) },
            thickness: { value: 0.1 },
            smoothness: { value: 0.01 },
        }
        
        /* Adjust Parameters if borderProperties Parameter is passed in */
        if (borderProperties) {
            uniforms.thickness.value = borderProperties.thickness ? borderProperties.thickness : 0.01;
            uniforms.smoothness.value = borderProperties.smoothness ? borderProperties.smoothness : 0.01;
        }

        /* Create the Mesh */
        const wall = new THREE.Mesh(
            new THREE.BoxBufferGeometry(size.x, size.y, size.z),
            new THREE.ShaderMaterial({
                vertexShader: VS,
                fragmentShader: FS,
                uniforms: uniforms,
                side: THREE.FrontSide
            })
        );
        wall.position.copy(pos);
        wall.setRotationFromQuaternion(quat);
        this._scene.add(wall);

        /* Create the Rigid Body */
        const rbWall = new RigidBody();
        rbWall.createBox(0, wall.position, wall.quaternion, size);
        this._physics_world.addRigidBody(rbWall._body, 1, -1);

        /* Set Custom User Data */
        wall.userData.physicsBody = rbWall;

        return wall;        
    }

    RemovePlatformByIndex(index) {
        /* Remove the Platform from the List */
        const platform = this._platforms.splice(index, 1)[0];
        /* Wait 2 Seconds Before Removing it from the Scene */
        setTimeout(() => {
            this._physics_world.removeCollisionObject(platform.userData.physicsBody._body);
            platform.userData.physicsBody.Destroy();
            platform.geometry.dispose();
            platform.material.dispose();
            this._scene.remove(platform);
        }, 2000);
    }

    RemoveAllPlatforms() {
        /* Dispose All Platforms */
        this._platforms.forEach(platform => {
            this._physics_world.removeCollisionObject(platform.userData.physicsBody._body);
            platform.userData.physicsBody.Destroy();
            platform.geometry.dispose();
            platform.material.dispose();
            this._scene.remove(platform);
        });
        /* Clear the Whole List */
        this._platforms.splice(0, this._platforms.length);
    }
    
    Update(e) {
        /* If there's no Platforms, then don't Continue */
        if (this._platforms.length <= 0) return;
        
        /* Loop through all Platforms and Move them */
        this._platforms.forEach(platform => {
            if (platform.userData.isMoving) {
                /* Get Previous Position and Offset the x position */
                const prevPosition = platform.userData.physicsBody._transform.getOrigin();
                prevPosition.setX((prevPosition.x() - prevPosition.x() * 0.5) + (Math.sin(e * 2.0) * 5.0) * platform.userData.moveDirection);

                platform.userData.physicsBody._transform.setOrigin(prevPosition);
                platform.userData.physicsBody._body.setWorldTransform(platform.userData.physicsBody._transform);
                platform.userData.physicsBody._motion_state.setWorldTransform(platform.userData.physicsBody._transform);;

                platform.position.set(
                    prevPosition.x(),
                    prevPosition.y(),
                    prevPosition.z(),
                );
            }
        });
    }
}

export { PlatformManager }