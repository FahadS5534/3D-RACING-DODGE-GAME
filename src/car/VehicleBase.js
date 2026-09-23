import * as THREE from 'three';
import { clamp } from '../utils/MathUtils.js';

export class VehicleBase {
    constructor(modelGroup, name = 'Vehicle') {
        this.modelGroup = modelGroup;
        this.name = name;

        // Vehicle physics parameters
        this.speed = 0;
        this.maxSpeed = 45;
        this.reverseMaxSpeed = -15;
        this.acceleration = 22;
        this.brakeForce = 35;
        this.friction = 8;
        this.steeringRate = 2.2;

        // Steering angle state
        this.steeringAngle = 0;
        this.rotationY = 0;

        // Position vector
        this.position = new THREE.Vector3();

        // Bounding box for collisions
        this.boundingBox = new THREE.Box3();
        this.boundingRadius = 2.5; // Default sphere radius fallback

        if (this.modelGroup) {
            this.modelGroup.position.copy(this.position);
            this.updateBoundingBox();
        }
    }

    setPosition(x, y, z) {
        this.position.set(x, y, z);
        if (this.modelGroup) {
            this.modelGroup.position.copy(this.position);
        }
        this.updateBoundingBox();
    }

    setRotationY(angle) {
        this.rotationY = angle;
        if (this.modelGroup) {
            this.modelGroup.rotation.y = angle;
        }
        this.updateBoundingBox();
    }

    updateBoundingBox() {
        if (!this.modelGroup) return;
        this.boundingBox.setFromObject(this.modelGroup);

        // Compute sphere radius from bounding box size
        const size = new THREE.Vector3();
        this.boundingBox.getSize(size);
        this.boundingRadius = Math.max(size.x, size.z) * 0.45;
    }

    applyPhysics(deltaTime, accelInput, steerInput, handbrake = false) {
        if (deltaTime > 0.1) deltaTime = 0.1; // Cap large delta frame spikes

        // Acceleration / Braking logic
        if (accelInput > 0) {
            // Forward driving
            if (this.speed < 0) {
                // Apply braking when moving backwards
                this.speed += this.brakeForce * deltaTime;
            } else {
                this.speed += this.acceleration * accelInput * deltaTime;
            }
        } else if (accelInput < 0) {
            // Reverse driving or braking
            if (this.speed > 0) {
                // Apply braking when moving forwards
                this.speed -= this.brakeForce * deltaTime;
            } else {
                this.speed += this.acceleration * accelInput * deltaTime;
            }
        } else {
            // Natural friction deceleration when no input
            if (this.speed > 0) {
                this.speed = Math.max(0, this.speed - this.friction * deltaTime);
            } else if (this.speed < 0) {
                this.speed = Math.min(0, this.speed + this.friction * deltaTime);
            }
        }

        // Handbrake extra friction
        if (handbrake) {
            if (this.speed > 0) {
                this.speed = Math.max(0, this.speed - this.brakeForce * 1.5 * deltaTime);
            } else if (this.speed < 0) {
                this.speed = Math.min(0, this.speed + this.brakeForce * 1.5 * deltaTime);
            }
        }

        // Clamp speed
        this.speed = clamp(this.speed, this.reverseMaxSpeed, this.maxSpeed);

        // Speed-dependent steering calculation
        const speedRatio = clamp(Math.abs(this.speed) / this.maxSpeed, 0, 1);
        const effectiveSteer = steerInput * (0.3 + 0.7 * speedRatio);

        // Turn vehicle
        if (Math.abs(this.speed) > 0.1 && Math.abs(steerInput) > 0.01) {
            const dir = this.speed >= 0 ? 1 : -1;
            this.rotationY -= effectiveSteer * this.steeringRate * dir * deltaTime;
        }

        // Apply movement displacement along vehicle facing direction
        const forwardX = -Math.sin(this.rotationY);
        const forwardZ = -Math.cos(this.rotationY);

        this.position.x += forwardX * this.speed * deltaTime;
        this.position.z += forwardZ * this.speed * deltaTime;

        // Sync model group transformations
        if (this.modelGroup) {
            this.modelGroup.position.copy(this.position);
            this.modelGroup.rotation.y = this.rotationY;
        }

        this.updateBoundingBox();
    }

    reset(startPos, startRotY = 0) {
        this.speed = 0;
        this.steeringAngle = 0;
        if (startPos) {
            this.setPosition(startPos.x, startPos.y, startPos.z);
        }
        this.setRotationY(startRotY);
    }
}
