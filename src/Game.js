import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.118.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.118.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.118.0/examples/jsm/postprocessing/UnrealBloomPass.js';

import { CameraController } from './modules/CameraController.js';
import { CharacterController } from './modules/CharacterController.js';
import { LevelManager } from './modules/LevelManager.js';
import { PlatformManager } from './modules/PlatformManager.js';
import { ScoreManager } from './modules/ScoreManager.js';


class Game {
    constructor(callback) {
        /* Initialize Ammo JS Physics Library */
        Ammo().then(lib => {
            /* Initialize Game */
            Ammo = lib;
            this.LoadGame();
        }).then(() => {
            /* Callback When Game is Created */
            callback();
            /* Update Everything */
            window.requestAnimationFrame(() => this.Update());
        });
    }

    LoadGame() {
        /* Initialize Everything */
        this.InitializeScene();
        this.InitializeCamera();
        this.InitializeRenderer();
        this.AddListeners();

        /* Toggle Bloom */
        this._bloom_enabled = document.querySelector("#bloomEnabled").checked;
        if (this._bloom_enabled) this.PostFX();

        /* Variables */
        this._clock = new THREE.Clock();

        this._direction = new THREE.Vector3();
        this._keys = {};
        this._has_lost = false;
        this._ready = false;

        this._tmp_vec = new Ammo.btVector3();

        /* Timer to Start the Game */
      
        /* Physics World Configuration */
        this._collision_configuration = new Ammo.btDefaultCollisionConfiguration();
        this._dispatcher = new Ammo.btCollisionDispatcher(this._collision_configuration);
        this._broadphase = new Ammo.btDbvtBroadphase();
        this._solver = new Ammo.btSequentialImpulseConstraintSolver();
        this._physics_world = new Ammo.btDiscreteDynamicsWorld(this._dispatcher, this._broadphase, this._solver, this._collision_configuration);
        this._physics_world.setGravity(new Ammo.btVector3(0, -9.81, 0));
        this._physics_world.getBroadphase().getOverlappingPairCache().setInternalGhostPairCallback(new Ammo.btGhostPairCallback())

        /* Player Controller */
        this._player_mesh = new THREE.Mesh(
            new THREE.BoxBufferGeometry(6, 6, 6),
            new THREE.MeshBasicMaterial({ color: 0x00ccff }) 
        );
        this._player_mesh.position.set(3, 3, 3);
        this._scene.add(this._player_mesh); // Don't know why I didn't remove this yet

        this._character_controller = new CharacterController();
        this._character_controller.Initialize(this._player_mesh.position, this._player_mesh.quaternion);
        this._physics_world.addCollisionObject(this._character_controller._body);
        this._physics_world.addAction(this._character_controller._controller);
        this._player_mesh.userData.physicsBody = this._character_controller._body;

        /* Instances */
        this._camera_controller = new CameraController(this._camera);
        this._platform_manager = new PlatformManager(this._scene, this._physics_world);
        this._level_manager = new LevelManager(this._platform_manager, this._scene, this._character_controller);
        this._score_manager = new ScoreManager();
    }

    OnKeyDown(event) {
        this._keys[event.code] = true;
    }

    OnKeyUp(event) {
        this._keys[event.code] = false;

        this._character_controller._controller.setWalkDirection(this._tmp_vec);
    }

    OnTapScreen(event) {
        let canJump = false;

        for (let i = 0; i < event.touches.length; i++) {
            if (event.touches[i].clientX > window.innerWidth * 0.5) canJump = true;
        }
      
        if (canJump) this._character_controller.Jump();
    }

    GetForwardVector() {
        this._camera.getWorldDirection(this._direction);
        this._direction.y = 0;
        this._direction.normalize();
        return this._direction;
    }

    GetSideVector() {
        this._camera.getWorldDirection(this._direction);
        this._direction.y = 0;
        this._direction.normalize();
        this._direction.cross(this._camera.up);
        return this._direction;
    }

    InitializeScene() {
        this._scene = new THREE.Scene();
        this._scene.background = new THREE.Color(0x030303);
    }

    InitializeCamera() {
        this._camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, .1, 10000);
        this._camera.position.set(3, 20, -20);
        this._camera.rotation.y = 135;
        this._camera.rotation.order = "YXZ";
    }

    InitializeRenderer() {
        this._renderer = new THREE.WebGLRenderer({antialias: true});
        this._renderer.setPixelRatio(window.devicePixelRatio);
        this._renderer.setSize(window.innerWidth, window.innerHeight);
        this._renderer.shadowMap.enabled = true;
        this._renderer.shadowMap.type = THREE.VSMShadowMap;
        this._renderer.outputEncoding = THREE.sRGBEncoding;
        this._renderer.toneMapping = THREE.ACESFilmicToneMapping;
        document.querySelector(".game-canvas").appendChild(this._renderer.domElement);
    }

    AddListeners() {
        window.addEventListener("resize", () => this.OnWindowResize(), false);
        document.addEventListener("keydown", event => this.OnKeyDown(event));
        document.addEventListener("keyup", event => this.OnKeyUp(event));
        document.addEventListener("touchstart", event => this.OnTapScreen(event));
    }

    PostFX() {
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.8, 0.3, 0.1);
        this._composer = new EffectComposer(this._renderer);
        this._composer.addPass(new RenderPass(this._scene, this._camera));
        this._composer.addPass(bloomPass);
    }

    OnWindowResize() {
        this._camera.aspect = window.innerWidth / window.innerHeight;
        this._camera.updateProjectionMatrix();
        this._renderer.setSize(window.innerWidth, window.innerHeight);
    }

    StartGame() {
        document.body.requestPointerLock();
        setTimeout(() => this._ready = true, 2000);
    }

    RestartGame(callback) {
        this._character_controller.Teleport(new THREE.Vector3(3, 3, 3));
        this._character_controller._player_speed = document.querySelector("#playerSpeed").value;
        this._character_controller._max_jump_dist = document.querySelector("#maxJumpDistance").value;
        this._bloom_enabled = document.querySelector("#bloomEnabled").checked;
        this._level_manager.ResetLevel();
        this._score_manager.ResetScore();
        this._has_lost = false;

        this._player_mesh.position.set(3, 3, 3);
        this._camera.position.set(3, 20, -20);
        this._camera.lookAt(new THREE.Vector3(3, 20, 20));

        callback();
        // setTimeout(() => this._ready = true, 2000);
    }

    Controls(t) {
        /* Position Offset */
        const direction = new THREE.Vector3();

        /* Get Current Position */
        const transform = this._character_controller._body.getWorldTransform();
        const pos = transform.getOrigin();

        /* Check if Player has Lost */
        if (pos.y() <= -40) {
            this.OnLose();
            return;
        }

        /* Go Forward Only */
        direction.add(this.GetForwardVector().multiplyScalar(t * this._character_controller.playerSpeed));

        if (document.pointerLockElement == document.body) {
            /* Free Roam Controls */
            // if (this._keys["KeyW"]) direction.add(this.GetForwardVector().multiplyScalar(t * this._character_controller.playerSpeed));
            // if (this._keys["KeyS"]) direction.sub(this.GetForwardVector().multiplyScalar(t * this._character_controller.playerSpeed));
            // if (this._keys["KeyA"]) direction.sub(this.GetSideVector().multiplyScalar(t * this._character_controller.playerSpeed));
            // if (this._keys["KeyD"]) direction.add(this.GetSideVector().multiplyScalar(t * this._character_controller.playerSpeed));
            if (this._keys["Space"]) this._character_controller.Jump();
        }

        /* Move Player in Direction and Get New Transform */
        const newTransform = this._character_controller.Move(direction);

        /* Update Camera and Player Position */
        const newPos = newTransform.getOrigin();
        const newPos3 = new THREE.Vector3(newPos.x(), newPos.y(), newPos.z());
        this._player_mesh.position.copy(newPos3);
        this._camera.position.copy(newPos3);
    }

    /* Set What Happens When You Lose */
    SetLoseResponse(callback) {
        this.OnLose = () => { 
            this._has_lost = true;
            this._ready = false;
            this._character_controller._controller.setWalkDirection(this._tmp_vec);
            this._score_manager.SetLocalStorageScore(); /* Set Highest Score */
            document.exitPointerLock(); /* Exit Pointer Lock */
            callback(this._score_manager._score, this._score_manager.GetHighestScore());
        };
    }

    Update() {
        requestAnimationFrame(() => this.Update());

        /* Get Time Since Last Frame */
        const t = this._clock.getDelta();
        const e = this._clock.getElapsedTime();

        /* Update Composer or Renderer */
        if (this._bloom_enabled) this._composer.render();
        else this._renderer.render(this._scene, this._camera);
        
        /* Update Physics World */
        this._physics_world.stepSimulation(t, 10);

        /* Update Level Manager */
        this._level_manager.Update(e);

        if (!this._ready || this._has_lost) return;
        
        /* Update Controls */
        this.Controls(t);

        /* Check for Player Collisions */
        if (this._character_controller.CheckForNewCollisions()) {
            /* Get All Collision Objects */
            const collisions = this._character_controller.GetCollidingObjects();
            /* Loop Through Every Platform */
            collisions.forEach(object => {
                const i = this._platform_manager._platforms.findIndex(platform => platform.userData.physicsBody._body.eB == object.eB);

                /* If it Wasn't the Same Platform then Continue to Next Iteration */
                if (i == -1) return;

                /* Increment Score and Remove Platform */
                this._score_manager.IncrementScore();
                this._platform_manager.RemovePlatformByIndex(i);

                // if (this._score_manager.score % 10 == 0) { 
                //     this._character_controller._controller.setGravity(-70);
                //     setTimeout(() => this._character_controller._controller.setGravity(70), 1000);
                // }
            });
        }
    }
}

export { Game }