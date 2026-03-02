import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Application from '../Application';

export default class RoboticArm {
    application: Application;
    scene: THREE.Scene;
    mixer: THREE.AnimationMixer | null = null;
    model: THREE.Group | null = null;
    clock: THREE.Clock = new THREE.Clock();

    // ---- Paramètres configurables ----
    POSITION = { x: -2700, y:-450, z: 1000};
    SCALE = 1000
    ROTATION = { x: 0, y: 90, z: 0 };
    ANIMATION_SPEED = 0.3// 1.0 = vitesse normale, 0.5 = moitié, 2.0 = double
    // ----------------------------------

    constructor() {
        this.application = new Application();
        this.scene = this.application.scene;
        this.loadModel();
    }

    loadModel() {
        const loader = new GLTFLoader();
        loader.load(
            '/models/RoboticArm/robotic_arm.glb',
            (gltf) => {
                this.model = gltf.scene;

                this.model.scale.set(this.SCALE, this.SCALE, this.SCALE);
                this.model.position.set(this.POSITION.x, this.POSITION.y, this.POSITION.z);
                this.model.rotation.set(this.ROTATION.x, this.ROTATION.y, this.ROTATION.z);

                this.model.traverse((node: THREE.Object3D) => {
                    if ((node as THREE.Mesh).isMesh) {
                        const mesh = node as THREE.Mesh;
                        const oldMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
                        const texture = (oldMat as any).map || null;
                        mesh.material = new THREE.MeshBasicMaterial({
                            map: texture,
                            color: texture ? 0xffffff : 0x888888,
                            side: THREE.DoubleSide,
                        });
                    }
                });

                this.scene.add(this.model);

                if (gltf.animations && gltf.animations.length > 0) {
                    this.mixer = new THREE.AnimationMixer(this.model);
                    const action = this.mixer.clipAction(gltf.animations[0]);
                    action.setLoop(THREE.LoopRepeat, Infinity);
                    action.timeScale = this.ANIMATION_SPEED;
                    action.play();
                    this.clock.start();
                }
            },
            undefined,
            (error) => {
                console.error('Erreur chargement RoboticArm:', error);
            }
        );
    }

    update() {
        if (this.mixer) {
            this.mixer.update(this.clock.getDelta());
        }
    }
}
