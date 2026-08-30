import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

let dracoLoader: DRACOLoader | null = null;

export default function getDracoLoader(): DRACOLoader {
    if (!dracoLoader) {
        dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('/draco/gltf/');
    }
    return dracoLoader;
}
