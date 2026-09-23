import * as THREE from 'three';
import { VehicleBase } from './VehicleBase.js';
import { shortenAngle, clamp } from '../utils/MathUtils.js';

export class AICar extends VehicleBase {
    constructor(gltfModel, waypoints, name = 'AI Car', cruiseSpeed = 36) {
        const group = new THREE.Group();
        group.name = `AICarGroup_${name.replace(/\s+/g, '')}`;

        super(group, name);

        this.gltf = gltfModel;
        this.waypoints = waypoints || [];
        this.cruiseSpeed = cruiseSpeed;
        this.currentWaypointIndex = 0;

        this.currentLap = 1;
        this.completedCheckpoints = 0;
        this.distanceToNextWaypoint = 0;

        this.initModel();
    }

    initModel() {
        if (!this.gltf) return;

        const model = this.gltf.scene;

        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);

        console.log(`--- ${this.name} GLB DIAGNOSTICS ---`);
        console.log('Original Size:', size);

        // Normalize AI car size (length ~ 4.5 units)
        const maxDim = Math.max(size.x, size.y, size.z);
        let scaleFactor = 1.0;
        if (maxDim > 0) {
            scaleFactor = 4.5 / maxDim;
        }

        model.scale.set(scaleFactor, scaleFactor, scaleFactor);

        const scaledBox = new THREE.Box3().setFromObject(model);
        model.position.x = -center.x * scaleFactor;
        model.position.y = -scaledBox.min.y;
        model.position.z = -center.z * scaleFactor;

        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    child.material.depthWrite = true;
                }
            }
        });

        this.modelGroup.add(model);
        this.updateBoundingBox();
    }

    update(deltaTime, isPaused = false) {
        if (isPaused || this.waypoints.length === 0) return;

        const targetWp = this.waypoints[this.currentWaypointIndex];
        const currentPos = this.position;

        const dx = targetWp.x - currentPos.x;
        const dz = targetWp.z - currentPos.z;
        this.distanceToNextWaypoint = Math.hypot(dx, dz);

        const targetAngle = Math.atan2(-dx, -dz);
        const angleDiff = shortenAngle(targetAngle - this.rotationY);

        const steerInput = clamp(angleDiff * 1.5, -1, 1);
        const accelInput = 1.0;
        this.maxSpeed = this.cruiseSpeed;

        this.applyPhysics(deltaTime, accelInput, steerInput, false);

        if (this.distanceToNextWaypoint < 12.0) {
            this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
            this.completedCheckpoints++;

            if (this.currentWaypointIndex === 0) {
                this.currentLap++;
            }
        }
    }

    reset(startPos, startRotY = 0) {
        super.reset(startPos, startRotY);
        this.currentWaypointIndex = 0;
        this.currentLap = 1;
        this.completedCheckpoints = 0;
        this.distanceToNextWaypoint = 0;
    }
}
