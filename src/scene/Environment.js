import * as THREE from 'three';

export class Environment {
    constructor(scene) {
        this.scene = scene;
        this.fogDay = new THREE.FogExp2(0x87ceeb, 0.0015);
        this.fogNight = new THREE.FogExp2(0x060814, 0.006);

        this.scene.fog = this.fogDay;
    }

    setNightMode(isNight) {
        this.scene.fog = isNight ? this.fogNight : this.fogDay;
    }
}
