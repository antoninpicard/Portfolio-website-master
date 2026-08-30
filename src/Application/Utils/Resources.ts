import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Application from '../Application';
import UIEventBus from '../UI/EventBus';
import EventEmitter from './EventEmitter';
import Loading from './Loading';
import getDracoLoader from './dracoLoader';

export default class Resources extends EventEmitter {
    sources: Resource[];
    // Not sure about this one
    items: {
        texture: { [name: string]: LoadedTexture };
        cubeTexture: { [name: string]: LoadedCubeTexture };
        gltfModel: { [name: string]: LoadedModel };
        audio: { [name: string]: LoadedAudio };
    };
    toLoad: number;
    loaded: number;
    loaders: {
        gltfLoader: GLTFLoader;
        textureLoader: THREE.TextureLoader;
        cubeTextureLoader: THREE.CubeTextureLoader;
        audioLoader: THREE.AudioLoader;
    };
    application: Application;
    loading: Loading;
    stallTimeout: ReturnType<typeof setTimeout>;

    constructor(sources: Resource[]) {
        super();

        this.sources = sources;

        this.items = { texture: {}, cubeTexture: {}, gltfModel: {}, audio: {} };
        this.toLoad = this.sources.length;
        this.loaded = 0;
        this.application = new Application();
        this.loading = this.application.loading;

        this.setLoaders();
        this.startLoading();

        // Belt-and-suspenders: a request that neither resolves nor errors
        // (a connection that just stalls) would otherwise leave the loading
        // screen stuck forever. Force completion if it takes too long.
        this.stallTimeout = setTimeout(() => this.forceFinish(), 20000);
    }

    setLoaders() {
        const gltfLoader = new GLTFLoader();
        gltfLoader.setDRACOLoader(getDracoLoader());

        this.loaders = {
            gltfLoader,
            textureLoader: new THREE.TextureLoader(),
            cubeTextureLoader: new THREE.CubeTextureLoader(),
            audioLoader: new THREE.AudioLoader(),
        };
    }

    startLoading() {
        // Load each source
        for (const source of this.sources) {
            const onError = (error: unknown) => {
                console.error(`Failed to load resource "${source.name}" (${source.path}):`, error);
                this.sourceFailed(source);
            };

            if (source.type === 'gltfModel') {
                this.loaders.gltfLoader.load(
                    source.path,
                    (file) => this.sourceLoaded(source, file),
                    undefined,
                    onError
                );
            } else if (source.type === 'texture') {
                this.loaders.textureLoader.load(
                    source.path,
                    (file) => {
                        file.encoding = THREE.sRGBEncoding;
                        this.sourceLoaded(source, file);
                    },
                    undefined,
                    onError
                );
            } else if (source.type === 'cubeTexture') {
                this.loaders.cubeTextureLoader.load(
                    source.path,
                    (file) => this.sourceLoaded(source, file),
                    undefined,
                    onError
                );
            } else if (source.type === 'audio') {
                this.loaders.audioLoader.load(
                    source.path,
                    (buffer) => this.sourceLoaded(source, buffer),
                    undefined,
                    onError
                );
            }
        }
    }

    // A resource that fails to load (network blip, timeout, 404, ...) must
    // still count towards `loaded`, otherwise the loading screen's progress
    // bar never reaches 1 and the site is stuck forever on the boot screen.
    sourceFailed(source: Resource) {
        this.loaded++;
        this.checkFinished(source.name);
    }

    sourceLoaded(source: Resource, file: LoadedResource) {
        this.items[source.type][source.name] = file;

        this.loaded++;
        this.checkFinished(source.name);
    }

    checkFinished(sourceName: string) {
        this.loading.trigger('loadedSource', [
            sourceName,
            this.loaded,
            this.toLoad,
        ]);

        if (this.loaded >= this.toLoad) {
            clearTimeout(this.stallTimeout);
            this.trigger('ready');
        }
    }

    // Called if loading hasn't naturally finished within the stall timeout:
    // jump straight to 100% so the site becomes usable rather than staying
    // stuck on the boot screen forever.
    forceFinish() {
        if (this.loaded >= this.toLoad) return;

        console.warn(
            `Resource loading stalled (${this.loaded}/${this.toLoad}). Forcing completion.`
        );
        this.loaded = this.toLoad;
        this.checkFinished('timeout');
    }
}
