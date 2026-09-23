import * as THREE from 'three';

export class Lighting {
    constructor(scene) {
        this.scene = scene;
        this.isNight = false;

        // Bright HemisphereLight (Sky: bright blue/white, Ground: warm grass green)
        this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x447744, 1.8);
        this.hemiLight.position.set(0, 100, 0);
        this.scene.add(this.hemiLight);

        // Sun Directional Light (Bright daylight)
        this.sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
        this.sunLight.position.set(80, 120, 60);
        this.sunLight.castShadow = true;

        // Shadow frustum & map size
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 400;

        const d = 150;
        this.sunLight.shadow.camera.left = -d;
        this.sunLight.shadow.camera.right = d;
        this.sunLight.shadow.camera.top = d;
        this.sunLight.shadow.camera.bottom = -d;
        this.sunLight.shadow.bias = -0.0005;

        this.scene.add(this.sunLight);

        // Ambient Fill Light
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(this.ambientLight);

        // Initial setup = Bright Day Mode
        this.setNightMode(false);
    }

    setNightMode(isNight) {
        this.isNight = isNight;
        if (isNight) {
            this.hemiLight.intensity = 0.2;
            this.hemiLight.color.setHex(0x112244);
            this.hemiLight.groundColor.setHex(0x050510);
            this.sunLight.intensity = 0.15;
            this.ambientLight.intensity = 0.1;
            this.scene.background = new THREE.Color(0x060814);
        } else {
            // Bright Day Mode
            this.hemiLight.intensity = 1.8;
            this.hemiLight.color.setHex(0xffffff);
            this.hemiLight.groundColor.setHex(0x447744);
            this.sunLight.intensity = 2.5;
            this.sunLight.color.setHex(0xffffff);
            this.ambientLight.intensity = 0.6;
            this.scene.background = new THREE.Color(0x87ceeb);
        }
    }

    toggleNightMode() {
        this.setNightMode(!this.isNight);
        return this.isNight;
    }
}
