import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class ModelLoader {
    constructor() {
        this.manager = new THREE.LoadingManager();
        this.loader = new GLTFLoader(this.manager);
        this.models = {};
    }

    loadAll(onProgress, onLoadComplete, onError) {
        this.manager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progress = (itemsLoaded / itemsTotal) * 100;
            if (onProgress) onProgress(progress, url);
        };

        this.manager.onLoad = () => {
            console.log('All models loaded successfully!');
            if (onLoadComplete) onLoadComplete(this.models);
        };

        this.manager.onError = (url) => {
            console.error(`Error loading model at path: ${url}`);
            if (onError) onError(url);
        };

        const assets = [
            { key: 'track', url: '/assets/track/basictrack.glb' },
            { key: 'enduranceCar', url: '/assets/cars/endurance-car.glb' },
            { key: 'sportsCar', url: '/assets/cars/sports-car.glb' },
            { key: 'suv', url: '/assets/cars/suv.glb' }
        ];

        assets.forEach(asset => {
            this.loader.load(
                asset.url,
                (gltf) => {
                    this.models[asset.key] = gltf;
                },
                undefined,
                (err) => {
                    console.error(`Failed to load GLB: ${asset.key}`, err);
                }
            );
        });
    }
}
