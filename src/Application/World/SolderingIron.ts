import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Application from '../Application';

export default class SolderingIron {
    application: Application;
    scene: THREE.Scene;
    model: THREE.Group | null = null;

    // ---- Paramètres configurables ----
    POSITION = { x: -1550, y:-190, z: 1000};
    SCALE = 600;
    ROTATION = { x: 0, y: 0, z: 0 };
    // ----------------------------------

    constructor() {
        this.application = new Application();
        this.scene = this.application.scene;
        this.loadModel();
    }

    loadModel() {
        const loader = new GLTFLoader();
        loader.load(
            '/models/SolderingIron/Station.glb',
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
            },
            undefined,
            (error) => {
                console.error('Erreur chargement SolderingIron:', error);
            }
        );
    }
}
