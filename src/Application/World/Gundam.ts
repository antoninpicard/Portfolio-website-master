import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'; // Pour la décompression optimisée
import Application from '../Application';
import Debug from '../Utils/Debug';
import PerformanceMonitor from '../Utils/PerformanceMonitor';

export default class Gundam {
    application: Application;
    scene: THREE.Scene;
    resources: any;
    model: THREE.Group;
    modelType: string;
    debug: Debug;
    debugFolder: any;
    
    // Moniteur de performance pour optimiser le chargement
    performanceMonitor: PerformanceMonitor;
    qualitySettings: any;
    isLoading: boolean = false;
    loadingManager: THREE.LoadingManager;
    loadingProgress: number = 0;
    loader: GLTFLoader;
    
    // Liste des modèles disponibles pour la sélection aléatoire
    availableModels: string[] = ['rx78', 'rx0', 'rx93', 'rx93nu', 'gf', 'unicorn'];
    
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
        
        // Initialiser le moniteur de performance
        this.performanceMonitor = PerformanceMonitor.getInstance();
        this.qualitySettings = this.performanceMonitor.getModelSettings();
        
        // S'abonner aux changements de qualité
        this.performanceMonitor.on('qualityChanged', (newQualityLevel: string) => {
            console.log(`Adaptation de la qualité du Gundam: ${newQualityLevel}`);
            this.qualitySettings = this.performanceMonitor.getModelSettings();
            this.updateModelQuality();
        });
        
        // Initialiser le gestionnaire de chargement
        this.setupLoadingManager();
        
        // Initialiser les paramètres spécifiques pour chaque modèle
        this.initModelSettings();
        
        // Initialize debug controls if debug is active
        if(this.debug.active) {
            this.debugFolder = this.debug.ui.addFolder('Gundam');
            
            // Ajouter un contrôle pour le moniteur de performance dans le debug
            const perfFolder = this.debugFolder.addFolder('Performance');            
            perfFolder.add({ quality: this.performanceMonitor.getQualityLevel() }, 'quality')
                .name('Niveau qualité')
                .disable();
                
            // Afficher et mettre à jour le FPS
            const fpsObject = { fps: 0 };
            const fpsCtrl = perfFolder.add(fpsObject, 'fps')
                .name('FPS')
                .listen()
                .disable();
                
            setInterval(() => {
                fpsObject.fps = this.performanceMonitor.getFPS();
            }, 500);
        }
        
        // Créer un cube temporaire pendant le chargement
        this.createReferenceCube();
        
        // Retarder légèrement le chargement du modèle pour laisser l'interface se charger d'abord
        setTimeout(() => {
            // Randomly select a model type au démarrage uniquement
            this.selectRandomModel();
            this.loadGundamModel();
        }, 1000);
    }
    
    /**
     * Initialise le gestionnaire de chargement avec progression
     */
    setupLoadingManager() {
        this.loadingManager = new THREE.LoadingManager();
        
        // Événements de chargement
        this.loadingManager.onProgress = (url, loaded, total) => {
            this.loadingProgress = Math.floor((loaded / total) * 100);
            console.log(`Chargement du Gundam: ${this.loadingProgress}%`);
        };
        
        this.loadingManager.onLoad = () => {
            console.log('Chargement du Gundam terminé');
            this.isLoading = false;
        };
        
        this.loadingManager.onError = (url) => {
            console.error(`Erreur de chargement: ${url}`);
            this.isLoading = false;
        };
        
        // Configurer le loader GLTF avec compression DRACO pour optimiser
        this.loader = new GLTFLoader(this.loadingManager);
        
        // Optimisation: utiliser DRACO si disponible pour les appareils puissants
        if (this.qualitySettings.geometryDetail > 0.5) {
            const dracoLoader = new DRACOLoader();
            dracoLoader.setDecoderPath('/draco/');
            this.loader.setDRACOLoader(dracoLoader);
        }
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
        // Filtrer pour n'inclure que les modèles adaptés au niveau de performance
        const maxModels = this.qualitySettings.maxModelsVisible;
        let modelsToUse = [...this.availableModels];
        
        // Pour les appareils à basses performances, privilégier les modèles plus légers
        if (maxModels <= 2) {
            modelsToUse = ['rx78', 'rx93nu', 'unicorn']; // Les modèles plus légers
        }
        
        const randomIndex = Math.floor(Math.random() * modelsToUse.length);
        this.modelType = modelsToUse[randomIndex];
        
        console.log(`Modèle Gundam sélectionné au hasard: ${this.modelType}`);
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
        
        // Vérifier si un modèle peut être chargé ou non selon les performances
        const maxVisible = this.qualitySettings.maxModelsVisible;
        const totalVisibleModels = this.countVisibleModels();
        
        if (totalVisibleModels >= maxVisible) {
            console.warn(`Limite de modèles atteinte (${totalVisibleModels}/${maxVisible}). Optimisation en cours...`);
            // Ne pas charger plus de modèles si la limite est atteinte
            this.isLoading = false;
            return;
        }
        
        // Utiliser le loader optimisé avec le gestionnaire de chargement
        this.loader.load(
            modelPath,
            (gltf) => {
                console.log(`Modèle Gundam ${this.modelType} chargé avec succès!`);
                
                // Supprimer le cube temporaire
                const cube = this.scene.getObjectByName('tempGundamCube');
                if (cube) {
                    this.scene.remove(cube);
                }
                
                this.model = gltf.scene;
                
                // Appliquer les paramètres spécifiques à ce modèle, ajustés selon les performances
                const settings = this.modelSettings[this.modelType];
                const qualityFactor = this.qualitySettings.scale;
                
                // Appliquer l'échelle spécifique au modèle, adjustée selon les performances
                const scaleFactor = settings.scale * qualityFactor;
                this.model.scale.set(scaleFactor, scaleFactor, scaleFactor);
                
                // Appliquer la position spécifique au modèle
                this.model.position.set(settings.position.x, settings.position.y, settings.position.z);
                
                // Appliquer la rotation spécifique au modèle
                this.model.rotation.set(settings.rotation.x, settings.rotation.y * Math.PI/180, settings.rotation.z);
                
                // Optimisation: Simplifier la géométrie pour les appareils moins performants
                if (this.qualitySettings.geometryDetail < 0.8) {
                    console.log('Application d’optimisations de géométrie pour les performances...');
                    this.optimizeGeometry();
                }
                
                // Appliquer des couleurs différentes aux parties du Gundam
                let partIndex = 0;
                
                // Appliquer le même traitement de texture que pour le chat mais optimisé selon les performances
                this.model.traverse((node: THREE.Object3D) => {
                    if (node instanceof THREE.Mesh) {
                        const mesh = node as THREE.Mesh;
                        
                        // Traiter les matériaux en tenant compte des performances
                        if (Array.isArray(mesh.material)) {
                            // Pour les mesh avec plusieurs matériaux
                            mesh.material = mesh.material.map((mat) => {
                                // Récupérer la texture du matériau si elle existe
                                const texture = mat instanceof THREE.MeshStandardMaterial ? mat.map : null;
                                
                                // Si texture et qualité des textures réduite, optimiser
                                if (texture && this.qualitySettings.textureQuality < 1.0) {
                                    // Réduire la qualité des textures
                                    texture.minFilter = THREE.LinearFilter;
                                    texture.anisotropy = 1; // Réduire l'anisotropie
                                }
                                
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
                            
                            // Optimiser la texture si nécessaire
                            if (texture && this.qualitySettings.textureQuality < 1.0) {
                                texture.minFilter = THREE.LinearFilter;
                                texture.anisotropy = 1;
                            }
                            
                            // Pour les mesh avec un seul matériau, comme le chat
                            mesh.material = new THREE.MeshBasicMaterial({
                                map: texture,
                                side: THREE.DoubleSide,
                                color: 0xffffff  // Couleur blanche pour ne pas altérer la texture
                            });
                        }
                        
                        // Activer les ombres seulement si la qualité le permet
                        mesh.castShadow = this.qualitySettings.enableShadows;
                        mesh.receiveShadow = this.qualitySettings.enableShadows;
                    }
                });
                
                // Optimiser la scène avec frustum culling pour les objets lointains
                this.model.traverse((node: THREE.Object3D) => {
                    // Désactiver le culling seulement pour les gros objets
                    if (node instanceof THREE.Mesh && node.geometry.boundingSphere && 
                        node.geometry.boundingSphere.radius > 50) {
                        node.frustumCulled = true;
                    }
                });
                
                // Mise à jour des optimisations basées sur les performances
                this.updateModelQuality();
                
                // Ajouter à la scène
                this.scene.add(this.model);
                
                // Désactiver le status de chargement
                this.isLoading = false;
            },
            // Progress callback - géré par le loadingManager
            undefined,
            (error) => {
                console.error(`Erreur de chargement du modèle Gundam ${this.modelType}:`, error);
                console.log('Le cube bleu restera visible puisque le modèle n\'a pas pu être chargé');
                
                // Libérer le statut de chargement
                this.isLoading = false;
                
                // Try loading a fallback model (plus léger)
                if(this.modelType !== 'rx78') {
                    console.log('Tentative de chargement du modèle de secours...');
                    this.modelType = 'rx78';
                    setTimeout(() => {
                        this.loadGundamModel();
                    }, 1000); // Délai pour éviter les requêtes en cascade
                }
            }
        );
    }
    
    /**
     * Compte le nombre de modèles 3D visibles dans la scène
     */
    countVisibleModels(): number {
        let count = 0;
        this.scene.traverse((object) => {
            // Compter seulement les grands groupes d'objets (modèles)
            if (object instanceof THREE.Group && object.children.length > 5) {
                count++;
            }
        });
        return count;
    }
    
    /**
     * Compter le nombre de mesh dans un modèle
     */
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
    
    /**
     * Optimise la géométrie des modèles pour les appareils moins performants
     */
    optimizeGeometry(): void {
        if (!this.model) return;
        
        this.model.traverse((node: THREE.Object3D) => {
            if (node instanceof THREE.Mesh && node.geometry) {
                // Simplifier les géométries complexes
                if (node.geometry instanceof THREE.BufferGeometry) {
                    // Simplification: supprimer les attributs non essentiels
                    const geom = node.geometry;
                    
                    // Supprimer les normales si faible qualité
                    if (this.qualitySettings.geometryDetail < 0.5 && geom.getAttribute('normal')) {
                        geom.deleteAttribute('normal');
                    }
                    
                    // Supprimer les tangentes (utilisées pour les normal maps)
                    if (geom.getAttribute('tangent')) {
                        geom.deleteAttribute('tangent');
                    }
                    
                    // Supprimer les UV2 (utilisés pour l'AO)
                    if (geom.getAttribute('uv2')) {
                        geom.deleteAttribute('uv2');
                    }
                }
            }
        });
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
    
    /**
     * Met à jour la qualité du modèle en fonction des paramètres de performance
     */
    updateModelQuality(): void {
        if (!this.model) return;
        
        // Appliquer les réglages de qualité au modèle existant
        const settings = this.modelSettings[this.modelType];
        const qualityFactor = this.qualitySettings.scale;
        
        // Ajuster l'échelle selon les performances
        const newScale = settings.scale * qualityFactor;
        this.model.scale.set(newScale, newScale, newScale);
        
        // Activer/désactiver les ombres selon les performances
        this.model.traverse((node: THREE.Object3D) => {
            if (node instanceof THREE.Mesh) {
                node.castShadow = this.qualitySettings.enableShadows;
                node.receiveShadow = this.qualitySettings.enableShadows;
                
                // Ajuster la qualité des matériaux
                if (Array.isArray(node.material)) {
                    node.material.forEach(mat => {
                        if (mat instanceof THREE.MeshBasicMaterial) {
                            // Rien à faire pour MeshBasicMaterial
                        }
                    });
                }
            }
        });
        
        console.log(`Qualité du modèle Gundam ajustée: échelle=${newScale}, ombres=${this.qualitySettings.enableShadows}`);
    }
    
    /**
     * Libère les ressources pour optimiser les performances après avoir changé de vue ou de modèle
     */
    disposeResources(): void {
        // Ne pas essayer de libérer les ressources s'il n'y a pas de modèle
        if (!this.model) return;
        
        // Supprimer le modèle de la scène
        this.scene.remove(this.model);
        
        // Libérer les ressources GPU
        this.model.traverse((node: THREE.Object3D) => {
            if (node instanceof THREE.Mesh) {
                if (node.geometry) {
                    node.geometry.dispose();
                }
                
                // Libérer les matériaux
                if (Array.isArray(node.material)) {
                    node.material.forEach(material => {
                        material.dispose();
                        // Libérer les textures
                        if (material instanceof THREE.MeshBasicMaterial && material.map) {
                            material.map.dispose();
                        }
                    });
                } else if (node.material) {
                    node.material.dispose();
                    // Libérer les textures
                    if (node.material instanceof THREE.MeshBasicMaterial && node.material.map) {
                        node.material.map.dispose();
                    }
                }
            }
        });
        
        // Forcer le garbage collector à s'exécuter (si possible)
        if (window.gc) {
            try {
                window.gc();
            } catch (e) {
                console.log('Nettoyage mémoire suggéré');
            }
        }
        
        console.log('Ressources du modèle Gundam libérées');
    }
    
    // Mettre à jour le Gundam (appelé à chaque frame par World)
    update() {
        // Pas de rotation automatique comme demandé
        
        // Performance: mettre à jour les contrôles d'optimisation uniquement si nécessaire
        if (this.model && this.performanceMonitor.getFPS() < 30 && !this.qualitySettings.optimized) {
            // Si les FPS chutent et que nous n'avons pas encore optimisé
            this.qualitySettings.optimized = true;
            this.updateModelQuality();
            console.log('Optimisation dynamique du modèle Gundam appliquée');
        }
    }
}
