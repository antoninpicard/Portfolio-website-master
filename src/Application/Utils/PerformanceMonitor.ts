/**
 * Classe pour surveiller les performances et ajuster les paramètres graphiques
 * en fonction des capacités de l'appareil
 */
export default class PerformanceMonitor {
    // Niveaux de qualité
    static QUALITY_LOW = 'low';
    static QUALITY_MEDIUM = 'medium';
    static QUALITY_HIGH = 'high';
    
    // Paramètres système
    private static instance: PerformanceMonitor;
    private qualityLevel: string;
    private fps: number = 0;
    private fpsHistory: number[] = [];
    private lastTime: number = 0;
    private frameCount: number = 0;
    private lowPerformanceMode: boolean = false;
    private devicePixelRatio: number;
    
    // Event emitter pour les changements de qualité
    private callbacks: {[key: string]: Function[]} = {};
    
    /**
     * Constructeur privé (singleton)
     */
    private constructor() {
        this.devicePixelRatio = window.devicePixelRatio || 1;
        this.qualityLevel = this.detectInitialQuality();
        this.setupFPSMonitor();
    }
    
    /**
     * Obtenir l'instance unique
     */
    public static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }
    
    /**
     * Détecte le niveau de qualité initial en fonction des caractéristiques de l'appareil
     */
    private detectInitialQuality(): string {
        // Vérifier le nombre de cœurs CPU
        const cpuCores = navigator.hardwareConcurrency || 2;
        
        // Vérifier le user agent pour mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Vérifier WebGL
        let webGLVersion = 1;
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl2');
            if (gl) {
                webGLVersion = 2;
            }
        } catch (e) {
            console.warn('WebGL2 not supported, falling back to WebGL1');
        }
        
        // Critères de qualité
        if (isMobile || cpuCores <= 2 || webGLVersion < 2 || this.devicePixelRatio < 1) {
            console.log('🔧 Basse qualité détectée - Optimisation pour appareils moins puissants');
            return PerformanceMonitor.QUALITY_LOW;
        } else if (cpuCores <= 4 || this.devicePixelRatio < 2) {
            console.log('🔧 Qualité moyenne détectée');
            return PerformanceMonitor.QUALITY_MEDIUM;
        } else {
            console.log('🔧 Haute qualité détectée - Expérience optimale');
            return PerformanceMonitor.QUALITY_HIGH;
        }
    }
    
    /**
     * Configure le moniteur de FPS
     */
    private setupFPSMonitor(): void {
        // Moniteur FPS
        this.lastTime = performance.now();
        this.frameCount = 0;
        
        const measureFPS = (): void => {
            this.frameCount++;
            const currentTime = performance.now();
            const elapsed = currentTime - this.lastTime;
            
            if (elapsed >= 1000) {
                this.fps = Math.round((this.frameCount * 1000) / elapsed);
                this.fpsHistory.push(this.fps);
                
                // Garder un historique limité
                if (this.fpsHistory.length > 10) {
                    this.fpsHistory.shift();
                }
                
                // Détecter des problèmes de performance et ajuster si nécessaire
                this.checkPerformance();
                
                this.frameCount = 0;
                this.lastTime = currentTime;
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }
    
    /**
     * Vérifie les performances et ajuste la qualité si nécessaire
     */
    private checkPerformance(): void {
        if (this.fpsHistory.length < 5) return; // Besoin de plus de données
        
        // Calculer la moyenne des FPS
        const avgFPS = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
        
        let newQuality = this.qualityLevel;
        
        // Adapter la qualité en fonction des FPS
        if (avgFPS < 30 && this.qualityLevel !== PerformanceMonitor.QUALITY_LOW) {
            // Performances faibles, réduire la qualité
            newQuality = PerformanceMonitor.QUALITY_LOW;
            this.lowPerformanceMode = true;
            console.warn(`🔧 FPS bas (${avgFPS.toFixed(1)}), passage en basse qualité`);
        } else if (avgFPS > 55 && this.lowPerformanceMode && this.qualityLevel === PerformanceMonitor.QUALITY_LOW) {
            // Si les performances s'améliorent, permettre de revenir à qualité moyenne
            newQuality = PerformanceMonitor.QUALITY_MEDIUM;
            this.lowPerformanceMode = false;
            console.log(`🔧 FPS stable (${avgFPS.toFixed(1)}), passage en qualité moyenne`);
        }
        
        // Si la qualité a changé, émettre un événement
        if (newQuality !== this.qualityLevel) {
            this.qualityLevel = newQuality;
            this.emitEvent('qualityChanged', newQuality);
        }
    }
    
    /**
     * Enregistre un callback pour un événement
     */
    public on(event: string, callback: Function): void {
        if (!this.callbacks[event]) {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push(callback);
    }
    
    /**
     * Émet un événement avec des données
     */
    private emitEvent(event: string, data: any): void {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => callback(data));
        }
    }
    
    /**
     * Retourne le niveau de qualité actuel
     */
    public getQualityLevel(): string {
        return this.qualityLevel;
    }
    
    /**
     * Retourne les FPS actuels
     */
    public getFPS(): number {
        return this.fps;
    }
    
    /**
     * Retourne les paramètres recommandés pour un modèle 3D
     * en fonction du niveau de qualité actuel
     */
    public getModelSettings(): {
        textureQuality: number;  // 0-1, où 1 est la qualité maximale
        geometryDetail: number;  // 0-1, où 1 est le détail maximal
        maxModelsVisible: number;
        scale: number;           // Facteur d'échelle pour les modèles
        enableShadows: boolean;
    } {
        switch (this.qualityLevel) {
            case PerformanceMonitor.QUALITY_LOW:
                return {
                    textureQuality: 0.5,
                    geometryDetail: 0.3,
                    maxModelsVisible: 2,
                    scale: 0.7,
                    enableShadows: false
                };
            case PerformanceMonitor.QUALITY_MEDIUM:
                return {
                    textureQuality: 0.8,
                    geometryDetail: 0.7,
                    maxModelsVisible: 3,
                    scale: 0.85,
                    enableShadows: true
                };
            case PerformanceMonitor.QUALITY_HIGH:
            default:
                return {
                    textureQuality: 1.0,
                    geometryDetail: 1.0,
                    maxModelsVisible: 5,
                    scale: 1.0,
                    enableShadows: true
                };
        }
    }
}
