import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Application from '../Application';
import { TextureLoader, AnimationMixer, AnimationClip, AnimationAction, LoopRepeat } from 'three';

export default class MovingObject {
    application: Application;
    scene: THREE.Scene;
    
    // Position properties
    position: THREE.Vector3;
    floorY: number = -550; // Floor level - position sur le bureau
    
    // Animation properties
    mixer: THREE.AnimationMixer | null = null;
    catModel: THREE.Group | null = null;
    animationClock: THREE.Clock = new THREE.Clock();
    
    // Animation ranges (frames)
    animationRanges: {[key: string]: {start: number, end: number}} = {
        'IdleSit': { start: 300, end: 465 },
        'IdleLayDown': { start: 470, end: 630 },
        'IdleSleep': { start: 635, end: 755 },
        'LickPaw': { start: 1030, end: 1150 },
        'Stretch': { start: 1240, end: 1370 },
    };
    
    // Liste des animations disponibles (pour pouvoir les parcourir facilement)
    availableAnimations: string[] = [
        'IdleSit',
        'IdleLayDown',
        'IdleSleep',
        'LickPaw',
        'Stretch'
    ];
    
    // Mode de sélection d'animation (manuel ou aléatoire)
    animationSelectionMode: 'manual' | 'random' = 'random';
    
    // Paramètres de position, rotation, et vitesse pour chaque animation
    animationSettings: {[key: string]: {
        position: {x: number, y: number, z: number},
        rotation: {x: number, y: number, z: number},
        scale: number,
        speed: number  // Facteur de vitesse pour l'animation (1.0 = vitesse normale)
    }} = {
        'IdleSit': { 
            position: {x: -1600, y: -100, z: 0},
            rotation: {x: Math.PI, y: 0, z: 0},
            scale: 1700,
            speed: 0.5
        },
        'IdleLayDown': { 
            position: {x: 0, y: 1220, z: 150},
            rotation: {x: Math.PI, y: -60, z: 0}, // -60 degrés sur Y
            scale: 1700,
            speed: 0.5
        },
        'IdleSleep': { 
            position: {x: 0, y: 1610, z: 100},
            rotation: {x: Math.PI, y: -60, z: 0}, // -60 degrés sur Y
            scale: 1700,
            speed: 0.5
        },
        'LickPaw': { 
            position: {x: -1600, y: -100, z: 0},
            rotation: {x: Math.PI, y: 0, z: 0},
            scale: 1700,
            speed: 0.5  // Un peu plus lent pour l'action de toilettage
        },
        'Stretch': { 
            position: {x: -2250, y: -450, z: 100},
            rotation: {x: Math.PI, y: 0, z: 0}, // Légèrement vers l'avant pour l'étirement
            scale: 1700,
            speed: 0.5  // Lent pour un étirement détendu
        },
    };
    
    // Nom de l'animation actuellement sélectionnée
    currentAnimation: string = '';
    
    constructor() {
        this.application = new Application();
        this.scene = this.application.scene;
        
        // Générer une position aléatoire pour le bureau
        this.position = this.generateRandomPosition();
        console.log(`Position aléatoire du chat générée: ${this.position.x}, ${this.position.y}, ${this.position.z}`);
        
        // Ajouter de l'éclairage
        this.addLighting();
        
        // Charger le modèle du chat
        this.loadCatModel();
    }
    
    // Sélectionner une animation aléatoire et renvoyer sa position par défaut
    generateRandomPosition() {
        // Sélectionner une animation aléatoire
        const randomIndex = Math.floor(Math.random() * this.availableAnimations.length);
        const randomAnimation = this.availableAnimations[randomIndex];
        
        // Position par défaut - ne sera pas utilisée directement
        let position = new THREE.Vector3(0, 0, 0);
        
        // Forcer l'animation aléatoire comme animation actuelle
        this.currentAnimation = randomAnimation;
        console.log(`Animation sélectionnée aléatoirement au démarrage: ${randomAnimation}`);
        
        return position;
    }
    
    // Le raccourci clavier a été supprimé car nous utilisons maintenant un mode aléatoire pour les animations
    
    addLighting() {
        // N'ajoutons pas de lumières supplémentaires pour éviter d'interférer avec l'éclairage global
        // L'éclairage existant de la scène sera utilisé pour le modèle du chat
        console.log('Utilisation de l\'\u00e9clairage existant pour le chat');
    }
    

    
    loadCatModel() {
        console.log('Chargement du modèle de chat avec textures explicites...');
        
        // Créer un cube rouge temporaire en attendant que le modèle se charge
        this.createReferenceCube();
        
        // Charger les textures en premier
        const textureLoader = new TextureLoader();
        const baseColorTexturePath = '/models/Cat/textures/Cat_Shorthair_baseColor.png';
        const normalTexturePath = '/models/Cat/textures/Cat_Shorthair_normal.png';
        
        console.log(`Chargement des textures: ${baseColorTexturePath} et ${normalTexturePath}`);
        
        // Pré-charger les textures
        const baseColorTexture = textureLoader.load(baseColorTexturePath);
        const normalTexture = textureLoader.load(normalTexturePath);
        
        // Configurer les textures
        baseColorTexture.encoding = THREE.sRGBEncoding;
        baseColorTexture.flipY = false; // Important pour les modèles GLTF
        
        normalTexture.flipY = false;
        
        // Ensuite charger le modèle
        const modelPath = '/models/Cat/scene.gltf';
        console.log(`Chargement du modèle: ${modelPath}`);
        
        const loader = new GLTFLoader();
        
        // Charger le modèle avec le chemin absolu
        loader.load(
            modelPath,
            (gltf) => {
                console.log('Modèle chargé avec succès!');
                
                // Supprimer le cube rouge temporaire
                const cube = this.scene.getObjectByName('tempCube');
                if (cube) {
                    this.scene.remove(cube);
                }
                
                // Ajouter le modèle à la scène
                const model = gltf.scene;
                
                // Assurons-nous que la position est (0,0,0) au départ
                model.position.set(0, 0, 0);
                
                // Ajouter le modèle au cat pour pouvoir le manipuler plus tard
                this.catModel = model;
                
                // Appliquer la position et rotation par défaut
                // Les ajustements spécifiques à l'animation seront appliqués plus tard
                model.scale.set(1700, 1700, 1700);
                
                // Orientation de base du chat
                model.rotation.x = Math.PI; // Rotation de 180 degrés autour de l'axe X pour retourner le chat
                model.rotation.y = 0;
                model.rotation.z = 0; 
                
                // Appliquer manuellement les textures à chaque partie du modèle
                model.traverse((node: THREE.Object3D) => {
                    if ((node as THREE.Mesh).isMesh) {
                        const mesh = node as THREE.Mesh;
                        
                        // Créer un nouveau matériau avec les textures chargées
                        // Utiliser MeshBasicMaterial qui n'est pas affecté par la lumière
                        // Le chat sera toujours visible avec sa texture originale
                        const newMaterial = new THREE.MeshBasicMaterial({
                            map: baseColorTexture,
                            side: THREE.DoubleSide,
                            color: 0xffffff  // Couleur blanche pour ne pas altérer la texture
                        });
                        
                        // Remplacer l'ancien matériau par le nouveau
                        mesh.material = newMaterial;
                        
                        // Activer les ombres
                        mesh.castShadow = true;
                        mesh.receiveShadow = true;
                        
                        console.log(`Nouvelles textures appliquées à ${node.name}`);
                    }
                });
                
                // Avec MeshBasicMaterial, aucune lumière n'est nécessaire
                // Le chat sera toujours visible indépendamment de l'éclairage de la scène
                console.log('Chat configuré pour être toujours visible, indépendamment de la lumière ambiante');
                
                // Ajouter à la scène
                this.scene.add(model);
                console.log('Chat avec textures explicites ajouté à la scène');
                
                // Sauvegarder une référence au modèle
                this.catModel = model;
                
                // Vérifier si le modèle contient des animations
                console.log('Vérification des animations du modèle...');
                if (gltf.animations && gltf.animations.length > 0) {
                    console.log(`Le modèle contient ${gltf.animations.length} animation(s)`);
                    this.setupAnimation(gltf.animations);
                } else {
                    // Créer une animation à partir des plages définies
                    this.createAnimationFromRanges();
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
                console.error('Erreur de chargement du modèle:', error);
                console.log('Le cube rouge restera visible puisque le modèle n\'a pas pu être chargé');
            }
        );
    }
    
    createReferenceCube() {
        // Créer un cube rouge comme référence visuelle en cas d'échec du chargement
        const geometry = new THREE.BoxGeometry(500, 500, 500);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.copy(this.position);
        cube.name = 'tempCube'; // Donner un nom pour pouvoir le supprimer plus tard
        this.scene.add(cube);
        
        // Ajouter un texte pour indiquer que le chat devrait être ici
        console.log('Cube rouge créé à la position du chat');
    }
    

    

    

    
    // Configurer les animations à partir des animations GLTF existantes
    setupAnimation(animations: THREE.AnimationClip[]) {
        if (!this.catModel) {
            console.error('Modèle du chat non disponible pour configurer les animations');
            return;
        }
        
        console.log('Configuration du mixer d\'animation...');
        this.mixer = new THREE.AnimationMixer(this.catModel);
        
        // Vérifier si nous avons des animations
        if (animations.length > 0) {
            console.log(`Animations disponibles: ${animations.length}`);
            for (let i = 0; i < animations.length; i++) {
                console.log(`Animation ${i}: ${animations[i].name}, durée: ${animations[i].duration}`);
            }
            
            // Sélectionner l'animation en fonction du mode actuel
            if (this.animationSelectionMode === 'random') {
                // L'animation aléatoire a déjà été sélectionnée dans generateRandomPosition
                // On s'assure juste que currentAnimation est bien défini
                if (!this.currentAnimation) {
                    const randomIndex = Math.floor(Math.random() * this.availableAnimations.length);
                    this.currentAnimation = this.availableAnimations[randomIndex];
                }
                console.log(`Animation utilisée: ${this.currentAnimation}`);
            } else {
                // Mode manuel - commencer avec la première animation disponible
                this.currentAnimation = this.availableAnimations[0];
                console.log(`Animation manuelle définie: ${this.currentAnimation} (pour paramétrage)`);
            }
            
            // Sauvegarder les animations dans le modèle pour y accéder plus tard
            this.catModel.animations = animations;
            
            // Utiliser la nouvelle méthode pour créer l'animation
            this.createAnimationFromName(this.currentAnimation);
            
            // Appliquer les paramètres spécifiques pour cette animation
            this.applyAnimationSettings();
            
            // Démarrer l'horloge d'animation
            this.animationClock.start();
            
            console.log(`Configuré l'animation ${this.currentAnimation}`);
        } else {
            console.warn('Aucune animation trouvée dans le modèle');
        }
    }

    // Créer une animation à partir des plages définies
    createAnimationFromRanges() {
        console.log('Création d\'une animation à partir des plages définies...');
        
        // Si nous avons un modèle de chat mais pas d'animations, on peut créer notre propre animation
        if (this.catModel) {
            // Pour l'instant, on utilise simplement l'animation Idle par défaut
            // Démarrer l'animation pour le mode actuel
            this.createAnimationFromName(this.currentAnimation);
        }
    }

    // Créer une animation à partir de son nom
    createAnimationFromName(animationName: string) {
        if (!this.mixer || !this.catModel) {
            console.warn('Impossible de créer l\'animation : mixer ou modèle non disponible');
            return;
        }
        
        console.log(`Création de l'animation ${animationName}...`);
        
        // Récupérer les clips d'animation disponibles
        let animations: THREE.AnimationClip[] = [];
        
        // Obtenir les animations depuis le modèle s'il en a
        if (this.catModel.animations && this.catModel.animations.length > 0) {
            animations = this.catModel.animations;
            console.log(`Animations trouvées dans catModel.animations: ${this.catModel.animations.length}`);
        } else if (this.catModel.userData && this.catModel.userData.animations) {
            animations = this.catModel.userData.animations;
            console.log(`Animations trouvées dans userData: ${this.catModel.userData.animations.length}`);
        }
        
        if (animations.length > 0) {
            console.log(`Animation disponible: ${animations[0].name}, durée: ${animations[0].duration}`);
            const originalClip = animations[0];
            const range = this.animationRanges[animationName];
            
            if (range) {
                console.log(`Plage trouvée pour ${animationName}: ${range.start} - ${range.end}`);
                try {
                    // Convertir les numéros de frame en temps (en secondes)
                    const frameRate = 30; // Taux de frames typique
                    
                    // Créer le sous-clip pour l'animation spécifique
                    const clip = THREE.AnimationUtils.subclip(
                        originalClip, 
                        animationName, 
                        Math.floor(range.start), 
                        Math.floor(range.end), 
                        frameRate
                    );
                    
                    console.log(`Sous-clip créé avec succès: ${clip.name}, durée: ${clip.duration}`);
                    
                    // Créer et configurer l'action d'animation
                    const action = this.mixer.clipAction(clip);
                    action.setLoop(THREE.LoopRepeat, Infinity);
                    action.clampWhenFinished = true;
                    
                    // Ajuster la vitesse si définie
                    if (this.animationSettings[animationName] && 
                        this.animationSettings[animationName].speed) {
                        action.timeScale = this.animationSettings[animationName].speed;
                        console.log(`Vitesse de l'animation ajustée à ${this.animationSettings[animationName].speed}`);
                    }
                    
                    // Démarrer l'horloge d'animation
                    this.animationClock.start();
                    console.log('Horloge d\'animation démarrée');
                    
                    // Jouer l'animation
                    action.play();
                    console.log(`Animation ${animationName} démarrée`);
                    
                } catch (error) {
                    console.error(`Erreur lors de la création de l'animation ${animationName}:`, error);
                }
            } else {
                console.warn(`Aucune plage définie pour l'animation ${animationName}`);
            }
        } else {
            console.warn('Aucune animation disponible dans le modèle');
        }
    }
    
    // Méthode pour passer à l'animation suivante
    nextAnimation() {
        if (!this.availableAnimations || !this.currentAnimation) return;
        
        // Trouver l'index de l'animation actuelle
        const currentIndex = this.availableAnimations.indexOf(this.currentAnimation);
        
        // Calculer l'index de la prochaine animation
        const nextIndex = (currentIndex + 1) % this.availableAnimations.length;
        const nextAnimation = this.availableAnimations[nextIndex];
        
        console.log(`Passage de l'animation ${this.currentAnimation} à ${nextAnimation}`);
        
        // Mettre à jour l'animation actuelle
        this.currentAnimation = nextAnimation;
        
        // Recréer l'animation avec la nouvelle plage
        if (this.mixer) {
            // Stopper toutes les actions en cours
            this.mixer.stopAllAction();
            
            // Recréer l'animation
            this.createAnimationFromName(this.currentAnimation);
            
            // Assurons-nous que le modèle est à 0,0,0 avant d'appliquer les paramètres
            if (this.catModel) {
                this.catModel.position.set(0, 0, 0);
                console.log('Position du modèle réinitialisée à (0,0,0) avant application des paramètres');
            }
            
            // Appliquer les paramètres pour l'animation sélectionnée
            this.applyAnimationSettings();
        }
    }
    
    // Activer le mode de sélection aléatoire
    enableRandomMode() {
        this.animationSelectionMode = 'random';
        console.log('Mode de sélection aléatoire activé');
    }
    
    // Appliquer les paramètres spécifiques à l'animation sélectionnée
    applyAnimationSettings() {
        if (!this.catModel || !this.currentAnimation) {
            console.warn('Impossible d\'appliquer les paramètres : modèle ou animation non définis');
            return;
        }
        
        // Vérifier si nous avons des paramètres pour cette animation
        if (this.animationSettings[this.currentAnimation]) {
            const settings = this.animationSettings[this.currentAnimation];
            console.log(`Application des paramètres pour l'animation ${this.currentAnimation}:`, settings);
            
            // IMPORTANT: Assurer que le modèle est disponible dans la scène
            if (!this.scene.getObjectById(this.catModel.id)) {
                console.warn('Le modèle n\'est pas dans la scène. Ajout du modèle...');
                this.scene.add(this.catModel);
            }
            
            // Appliquer l'échelle
            this.catModel.scale.set(settings.scale, settings.scale, settings.scale);
            
            // FORCER la position absolue définie pour cette animation
            this.catModel.position.set(
                settings.position.x,
                settings.position.y,
                settings.position.z
            );
            
            console.log(`Position FORCÉE: x=${settings.position.x}, y=${settings.position.y}, z=${settings.position.z}`);
            
            // Déterminer si nous utilisons des rotations spéciales
            if (this.currentAnimation === 'IdleLayDown' || this.currentAnimation === 'IdleSleep') {
                // Convertir -60 degrés en radians
                this.catModel.rotation.set(
                    Math.PI,  // en X (inversion complète)
                    -60 * (Math.PI / 180),  // en Y (conversion de degrés en radians)
                    0  // en Z
                );
                console.log(`Rotation spéciale pour ${this.currentAnimation}: x=PI, y=-60°, z=0`); 
            } else {
                // Pour les autres animations
                this.catModel.rotation.set(
                    settings.rotation.x,
                    settings.rotation.y,
                    settings.rotation.z
                );
                console.log(`Rotation standard pour ${this.currentAnimation}`); 
            }
            
            console.log(`Rotation appliquée: x=${this.catModel.rotation.x}, y=${this.catModel.rotation.y}, z=${this.catModel.rotation.z}`);
            console.log(`Paramètres appliqués avec succès pour ${this.currentAnimation}`);
        } else {
            console.warn(`Aucun paramètre défini pour l'animation ${this.currentAnimation}`);
        }
    }
    
    update() {
        // Mettre à jour l'animation à chaque frame
        if (this.mixer) {
            const delta = this.animationClock.getDelta();
            this.mixer.update(delta);
            
            // Forcer la position à chaque frame pour éviter tout problème
            if (this.catModel && this.currentAnimation && this.animationSettings[this.currentAnimation]) {
                const settings = this.animationSettings[this.currentAnimation];
                
                // Forcer la position exacte à chaque frame
                this.catModel.position.set(
                    settings.position.x,
                    settings.position.y,
                    settings.position.z
                );
                
                // Forcer les rotations spécifiques pour certaines animations
                if (this.currentAnimation === 'IdleLayDown' || this.currentAnimation === 'IdleSleep') {
                    this.catModel.rotation.x = Math.PI;
                    this.catModel.rotation.y = -60 * (Math.PI / 180);
                    this.catModel.rotation.z = 0;
                }
            }
            
            // Déboguer les animations (une fois par seconde)
            if (Math.random() < 0.01) { // ~1% de chance par frame = environ une fois par seconde
                console.log(`Mise à jour du mixer avec delta: ${delta}`);
                if (this.catModel) {
                    console.log(`Position du chat: x=${this.catModel.position.x}, y=${this.catModel.position.y}, z=${this.catModel.position.z}`);
                    console.log(`Rotation du chat: x=${this.catModel.rotation.x}, y=${this.catModel.rotation.y}, z=${this.catModel.rotation.z}`);
                }
            }
        }
    }
}
