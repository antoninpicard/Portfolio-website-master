import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Application from '../Application';
import Debug from '../Utils/Debug';

export default class Gundam {
    application: Application;
    scene: THREE.Scene;
    resources: any;
    model: THREE.Group;
    modelType: string;
    debug: Debug;
    debugFolder: any;
    
    // Paramètres spécifiques pour chaque modèle
    modelSettings: {[key: string]: {
        position: {x: number, y: number, z: number},
        rotation: {x: number, y: number, z: number},
        scale: number
    }};

    constructor() {
        this.application = new Application();
        this.scene = this.application.scene;
        this.resources = this.application.resources;
        this.debug = this.application.debug;
        
        // Initialiser les paramètres spécifiques pour chaque modèle
        this.initModelSettings();
        
        // Initialize debug controls if debug is active
        if(this.debug.active) {
            this.debugFolder = this.debug.ui.addFolder('Gundam');
        }
        
        // Créer un cube temporaire pendant le chargement
        this.createReferenceCube();
        
        // Randomly select a model type au démarrage uniquement
        this.selectRandomModel();
        this.loadGundamModel();
    }
    
    // Initialiser les paramètres spécifiques à chaque modèle
    initModelSettings() {
        this.modelSettings = {
            'rx78': { // RX-78-NT-1 Gundam Alex
                position: {x: -3000, y: -450, z: 700},
                rotation: {x: 0, y: -50, z: 0},
                scale: 400
            },
            'rx0': { // RX-0 Full Armor Unicorn Gundam
                position: {x: -2800, y: -3000, z: 2800},
                rotation: {x: 0, y: 180, z: 0}, // Légère rotation de 30 degrés
                scale: 600
            },
            'rx93': { // RX-93-2 Hi-Nu Gundam
                position: {x: 2000, y: -350, z: 500},
                rotation: {x: 0, y: -45, z: 0}, // Rotation de -45 degrés
                scale: 480
            },
            'rx93nu': { // RX-93 Nu Gundam
                position: {x: -3000, y: 300, z: 0},
                rotation: {x: 0, y: 70, z: 0},
                scale: 450
            },
            'gf': { // GF13-017NJII God Gundam
                position: {x: 2000, y: -400, z: 500},
                rotation: {x: 0, y: -45, z: 0}, // Rotation de -45 degrés
                scale: 550
            },
            'unicorn': { // Gundam Unicorn
                position: {x: -3000, y: -450, z: 900},
                rotation: {x: 0, y: -50, z: 0},
                scale: 6
            }
        };
    }
    
    createReferenceCube() {
        // Créer un cube bleu comme référence visuelle en cas d'échec du chargement
        const geometry = new THREE.BoxGeometry(500, 500, 500);
        const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(3000, -2700, 0);
        cube.name = 'tempGundamCube'; // Donner un nom pour pouvoir le supprimer plus tard
        this.scene.add(cube);
        
        console.log('Cube bleu créé à la position du Gundam');
    }
    
    selectRandomModel() {
        // Available model types
        const modelTypes = ['rx78', 'rx0', 'rx93', 'rx93nu', 'gf', 'unicorn'];
        // Select random model type
        this.modelType = modelTypes[Math.floor(Math.random() * modelTypes.length)];
        console.log(`Selected Gundam model: ${this.modelType}`);
    }

    loadGundamModel() {
        console.log(`Chargement du modèle Gundam ${this.modelType}...`);
        
        // Get model file based on selected model type
        let modelFile = '';
        
        // Map model type to model file - utiliser les noms de fichiers réels présents dans les dossiers
        switch(this.modelType) {
            case 'rx78':
                modelFile = 'rx-78nt-1_gundam_alex.glb';
                break;
            case 'rx0':
                modelFile = 'rx-0_full_armor_unicorn_gundam.glb';
                break;
            case 'rx93':
                modelFile = 'rx-93-2_hi-nu.glb';
                break;
            case 'rx93nu':
                modelFile = 'rx-93_nu_gundam.glb';
                break;
            case 'gf':
                modelFile = 'gf13-017njii_god_gundam.glb';
                break;
            case 'unicorn':
                modelFile = 'gundam_unicorn.glb';
                break;
            default:
                modelFile = 'rx-78nt-1_gundam_alex.glb';
        }
        
        // Définir des couleurs pour chaque type de modèle
        const mainColors: {[key: string]: number} = {
            'rx78': 0xffffff,  // blanc
            'rx0': 0xd8d8d8,   // gris clair
            'rx93': 0x3366cc,  // bleu
            'rx93nu': 0x660000, // rouge foncé
            'gf': 0xcc0000     // rouge
        };
        
        // Couleurs secondaires pour certaines parties
        const secondaryColors: {[key: string]: number} = {
            'rx78': 0x0000ff,  // bleu
            'rx0': 0xff0000,   // rouge
            'rx93': 0xffd700,  // jaune/or
            'rx93nu': 0x000000, // noir
            'gf': 0x333333     // gris foncé
        };
        
        // Couleurs accent (détails)
        const accentColors: {[key: string]: number} = {
            'rx78': 0xff0000,  // rouge
            'rx0': 0x00ff00,   // vert
            'rx93': 0xffffff,  // blanc
            'rx93nu': 0xffff00, // jaune
            'gf': 0x0000ff     // bleu
        };
        
        // Pour le Unicorn Gundam, le chemin est différent
        const modelPath = this.modelType === 'unicorn' ? 
                         `/models/Gundam/gundam/${modelFile}` : 
                         `/models/Gundam/${this.modelType}/${modelFile}`;
        const loader = new GLTFLoader();
        
        // Chargement du modèle
        loader.load(
            modelPath,
            (gltf) => {
                console.log(`Modèle Gundam ${this.modelType} chargé avec succès!`);
                
                // Supprimer le cube temporaire
                const cube = this.scene.getObjectByName('tempGundamCube');
                if (cube) {
                    this.scene.remove(cube);
                }
                
                this.model = gltf.scene;
                
                // Appliquer les paramètres spécifiques à ce modèle
                const settings = this.modelSettings[this.modelType];
                
                // Appliquer l'échelle spécifique au modèle
                this.model.scale.set(settings.scale, settings.scale, settings.scale);
                
                // Appliquer la position spécifique au modèle
                this.model.position.set(settings.position.x, settings.position.y, settings.position.z);
                
                // Appliquer la rotation spécifique au modèle
                this.model.rotation.set(settings.rotation.x, settings.rotation.y, settings.rotation.z);
                
                // Appliquer des couleurs différentes aux parties du Gundam
                let partIndex = 0;
                
                // Appliquer le même traitement de texture que pour le chat
                this.model.traverse((node: THREE.Object3D) => {
                    if (node instanceof THREE.Mesh) {
                        const mesh = node as THREE.Mesh;
                        
                        // Traiter les matériaux exactement comme pour le chat
                        if (Array.isArray(mesh.material)) {
                            // Pour les mesh avec plusieurs matériaux
                            mesh.material = mesh.material.map((mat) => {
                                // Récupérer la texture du matériau si elle existe
                                const texture = mat instanceof THREE.MeshStandardMaterial ? mat.map : null;
                                
                                // Créer un MeshBasicMaterial indépendant de l'éclairage avec la texture
                                return new THREE.MeshBasicMaterial({
                                    map: texture,
                                    side: THREE.DoubleSide,
                                    color: 0xffffff  // Couleur blanche pour ne pas altérer la texture
                                });
                            });
                        } else if (mesh.material) {
                            // Récupérer la texture du matériau si elle existe
                            const existingMaterial = mesh.material;
                            const texture = existingMaterial instanceof THREE.MeshStandardMaterial ? 
                                           existingMaterial.map : 
                                           (existingMaterial instanceof THREE.MeshBasicMaterial ? 
                                            existingMaterial.map : null);
                            
                            // Pour les mesh avec un seul matériau, comme le chat
                            mesh.material = new THREE.MeshBasicMaterial({
                                map: texture,
                                side: THREE.DoubleSide,
                                color: 0xffffff  // Couleur blanche pour ne pas altérer la texture
                            });
                        }
                        
                        // Activer les ombres comme pour le chat
                        mesh.castShadow = true;
                        mesh.receiveShadow = true;
                    }
                });
                
                // Ajouter à la scène
                this.scene.add(this.model);
                
                // Add debug controls if available
                if(this.debug.active && this.debugFolder) {
                    // Vider le dossier de debug précédent
                    this.debugFolder.destroy();
                    this.debugFolder = this.debug.ui.addFolder(`Gundam ${this.modelType.toUpperCase()}`);
                    
                    // Position
                    const posFolder = this.debugFolder.addFolder('Position');
                    posFolder.add(this.model.position, 'x')
                        .name('X Position')
                        .min(-5000)
                        .max(5000)
                        .step(10)
                        .onChange((value: number) => {
                            // Sauvegarder les modifications dans les paramètres
                            this.modelSettings[this.modelType].position.x = value;
                        });
                    
                    posFolder.add(this.model.position, 'y')
                        .name('Y Position')
                        .min(-5000)
                        .max(0)
                        .step(10)
                        .onChange((value: number) => {
                            this.modelSettings[this.modelType].position.y = value;
                        });
                    
                    posFolder.add(this.model.position, 'z')
                        .name('Z Position')
                        .min(-5000)
                        .max(5000)
                        .step(10)
                        .onChange((value: number) => {
                            this.modelSettings[this.modelType].position.z = value;
                        });
                    
                    // Rotation
                    const rotFolder = this.debugFolder.addFolder('Rotation');
                    rotFolder.add(this.model.rotation, 'x')
                        .name('X Rotation')
                        .min(-Math.PI)
                        .max(Math.PI)
                        .step(0.1)
                        .onChange((value: number) => {
                            this.modelSettings[this.modelType].rotation.x = value;
                        });
                    
                    rotFolder.add(this.model.rotation, 'y')
                        .name('Y Rotation')
                        .min(-Math.PI)
                        .max(Math.PI)
                        .step(0.1)
                        .onChange((value: number) => {
                            this.modelSettings[this.modelType].rotation.y = value;
                        });
                    
                    rotFolder.add(this.model.rotation, 'z')
                        .name('Z Rotation')
                        .min(-Math.PI)
                        .max(Math.PI)
                        .step(0.1)
                        .onChange((value: number) => {
                            this.modelSettings[this.modelType].rotation.z = value;
                        });
                    
                    // Scale
                    const scaleCtrl = this.debugFolder.add(this.modelSettings[this.modelType], 'scale')
                        .name('Scale')
                        .min(100)
                        .max(1000)
                        .step(10)
                        .onChange((value: number) => {
                            this.model.scale.set(value, value, value);
                        });
                }
            },
            (progress) => {
                // Afficher la progression du chargement
                if (progress.lengthComputable) {
                    const percentage = (progress.loaded / progress.total) * 100;
                    console.log(`Progression du chargement: ${percentage.toFixed(2)}%`);
                }
            },
            (error) => {
                console.error(`Erreur de chargement du modèle Gundam ${this.modelType}:`, error);
                console.log('Le cube bleu restera visible puisque le modèle n\'a pas pu être chargé');
                
                // Try loading a fallback model
                if(this.modelType !== 'rx78') {
                    console.log('Tentative de chargement du modèle de secours...');
                    this.modelType = 'rx78';
                    this.loadGundamModel();
                }
            }
        );
    }
    

    
    // Compter le nombre de mesh dans un modèle
    countMeshes(model: THREE.Group | null): number {
        let count = 0;
        if (!model) return count;
        
        model.traverse((node: THREE.Object3D) => {
            if (node instanceof THREE.Mesh) {
                count++;
            }
        });
        
        return count;
    }
    
    // Les touches n/0-6 pour changer de modèle sont désactivées
    
    /**
     * Changer de modèle Gundam
     * @param random Si vrai, sélectionne un modèle aléatoirement
     * @param specificType Type spécifique à charger (si random est faux)
     */
    changeGundamModel(random: boolean = false, specificType: string = ''): void {
        // Supprimer le modèle actuel de la scène
        if (this.model) {
            this.scene.remove(this.model);
            // Libérer la mémoire
            this.model.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(material => material.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                }
            });
        }
        
        // Afficher un cube temporaire pendant le chargement
        this.createReferenceCube();
        
        const currentType = this.modelType;
        
        if (random) {
            // Sélectionner un nouveau modèle différent de l'actuel
            const availableTypes = ['rx78', 'rx0', 'rx93', 'rx93nu', 'gf', 'unicorn'];
            const filteredTypes = availableTypes.filter(type => type !== currentType);
            
            // Sélectionner aléatoirement un nouveau type parmi les types disponibles
            this.modelType = filteredTypes[Math.floor(Math.random() * filteredTypes.length)];
            
            console.log(`Changement de modèle aléatoire : ${currentType} -> ${this.modelType}`);
        } else {
            // Utiliser le type spécifique fourni
            this.modelType = specificType;
            console.log(`Changement de modèle spécifique : ${currentType} -> ${this.modelType}`);
        }
        
        // Charger le nouveau modèle
        this.loadGundamModel();
    }
    
    update() {
        // Pas de rotation automatique comme demandé
    }
}
