import * as THREE from 'three';
import { VehicleBase } from './VehicleBase.js';
import { audioSystem } from '../utils/AudioSystem.js';

export class PlayerCar extends VehicleBase {
    constructor(gltfModel) {
        const group = new THREE.Group();
        group.name = 'PlayerCarGroup';

        super(group, 'Endurance Race Car (Player)');

        this.gltf = gltfModel;
        this.wheels = [];
        this.headlights = [];

        this.initModel();
        this.initInputs();
    }

    initModel() {
        if (!this.gltf) return;

        const model = this.gltf.scene;
        model.name = 'EnduranceRaceCarMesh';

        // Diagnostic Bounding Box & Scale Normalization
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);

        console.log('--- PLAYER CAR GLB DIAGNOSTICS ---');
        console.log('Original Size:', size);
        console.log('Original Center:', center);

        // Normalize car size: target length (max dimension X/Z) ~ 4.8 units
        const maxDim = Math.max(size.x, size.y, size.z);
        let scaleFactor = 1.0;
        if (maxDim > 0) {
            scaleFactor = 4.8 / maxDim;
        }

        console.log('Applied Car Scale Factor:', scaleFactor);

        model.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // Re-calculate scaled bounding box to align bottom flush with Y=0
        const scaledBox = new THREE.Box3().setFromObject(model);
        model.position.x = -center.x * scaleFactor;
        model.position.y = -scaledBox.min.y; // Bottom of wheels flush on asphalt
        model.position.z = -center.z * scaleFactor;

        // Traverse mesh for shadows and material brightness
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                if (child.material) {
                    child.material.depthWrite = true;
                    // Ensure materials look bright under sunlight
                    if (child.material.roughness !== undefined) {
                        child.material.roughness = Math.min(child.material.roughness, 0.6);
                    }
                }

                const lowerName = child.name.toLowerCase();
                if (lowerName.includes('wheel') || lowerName.includes('rim') || lowerName.includes('tire')) {
                    this.wheels.push(child);
                }
            }
        });

        this.modelGroup.add(model);

        // Add Headlights (Spotlights)
        const leftHeadlight = new THREE.SpotLight(0xfffaed, 3.0, 50, Math.PI / 6, 0.5, 1);
        leftHeadlight.position.set(-0.8, 0.8, -2.0);
        leftHeadlight.target.position.set(-0.8, 0, -15);

        const rightHeadlight = new THREE.SpotLight(0xfffaed, 3.0, 50, Math.PI / 6, 0.5, 1);
        rightHeadlight.position.set(0.8, 0.8, -2.0);
        rightHeadlight.target.position.set(0.8, 0, -15);

        leftHeadlight.visible = false;
        rightHeadlight.visible = false;

        this.modelGroup.add(leftHeadlight);
        this.modelGroup.add(leftHeadlight.target);
        this.modelGroup.add(rightHeadlight);
        this.modelGroup.add(rightHeadlight.target);

        this.headlights = [leftHeadlight, rightHeadlight];

        this.updateBoundingBox();
    }

    setHeadlights(visible) {
        this.headlights.forEach(hl => {
            hl.visible = visible;
        });
    }

    initInputs() {
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            space: false
        };

        window.addEventListener('keydown', (e) => {
            const code = e.code;
            if (code === 'KeyW' || code === 'ArrowUp') this.keys.up = true;
            if (code === 'KeyS' || code === 'ArrowDown') this.keys.down = true;
            if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = true;
            if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = true;
            if (code === 'Space') this.keys.space = true;
        });

        window.addEventListener('keyup', (e) => {
            const code = e.code;
            if (code === 'KeyW' || code === 'ArrowUp') this.keys.up = false;
            if (code === 'KeyS' || code === 'ArrowDown') this.keys.down = false;
            if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = false;
            if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = false;
            if (code === 'Space') this.keys.space = false;
        });
    }

    update(deltaTime, isPaused = false) {
        if (isPaused) return;

        let accel = 0;
        if (this.keys.up) accel += 1;
        if (this.keys.down) accel -= 1;

        let steer = 0;
        if (this.keys.left) steer += 1;
        if (this.keys.right) steer -= 1;

        this.applyPhysics(deltaTime, accel, steer, this.keys.space);

        if (this.wheels.length > 0 && Math.abs(this.speed) > 0.1) {
            const rotDelta = (this.speed / 1.5) * deltaTime;
            this.wheels.forEach(wheel => {
                wheel.rotation.x += rotDelta;
            });
        }

        const speedRatio = this.speed / this.maxSpeed;
        audioSystem.updateEngineSound(speedRatio, this.keys.up);
    }
}
