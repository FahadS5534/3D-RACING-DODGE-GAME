import * as THREE from 'three';

export class HandbuiltCar {
    constructor() {
        this.group = new THREE.Group();
        this.group.name = 'PlayerRacingCarGroup';

        // Vehicle transform state
        this.targetX = 0;
        this.currentX = 0;
        this.lateralSpeed = 16.0;
        this.minX = -5.2;
        this.maxX = 5.2;

        this.wheels = [];
        this.steeringTilt = 0;

        // Customization Options
        this.currentColor = 0xeb3b5a; // Red default
        this.currentStripeColor = null; // None default
        this.isUnderglowOn = false;

        this.buildCarMesh();
    }

    buildCarMesh() {
        // Clear previous meshes if updating
        while (this.group.children.length > 0) {
            this.group.remove(this.group.children[0]);
        }
        this.wheels = [];

        // Materials
        this.bodyMat = new THREE.MeshStandardMaterial({
            color: this.currentColor,
            roughness: 0.25,
            metalness: 0.5
        });

        const accentMat = new THREE.MeshStandardMaterial({
            color: 0x22252a,
            roughness: 0.3
        });

        const cabinMat = new THREE.MeshStandardMaterial({
            color: 0x1e272e, // Tinted glass
            roughness: 0.1,
            metalness: 0.9
        });

        const wheelMat = new THREE.MeshStandardMaterial({
            color: 0x2d3436,
            roughness: 0.8
        });

        const rimMat = new THREE.MeshStandardMaterial({
            color: 0xdcdde1,
            metalness: 0.85,
            roughness: 0.15
        });

        const lightYellowMat = new THREE.MeshStandardMaterial({
            color: 0xfffa65,
            emissive: 0xfffa65,
            emissiveIntensity: 0.9
        });

        const lightRedMat = new THREE.MeshStandardMaterial({
            color: 0xff3838,
            emissive: 0xff3838,
            emissiveIntensity: 0.9
        });

        // 1. Lower Main Body (Width: 2.2, Height: 0.5, Length: 4.2)
        const bodyGeo = new THREE.BoxGeometry(2.2, 0.5, 4.2);
        this.bodyMesh = new THREE.Mesh(bodyGeo, this.bodyMat);
        this.bodyMesh.position.y = 0.5;
        this.bodyMesh.castShadow = true;
        this.bodyMesh.receiveShadow = true;
        this.group.add(this.bodyMesh);

        // Optional Racing Stripe along hood and roof
        if (this.currentStripeColor !== null) {
            const stripeMat = new THREE.MeshStandardMaterial({ color: this.currentStripeColor, roughness: 0.3 });
            const stripeGeo = new THREE.BoxGeometry(0.4, 0.52, 4.22);
            const stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
            stripeMesh.position.y = 0.51;
            this.group.add(stripeMesh);
        }

        // 2. Front Hood
        const hoodGeo = new THREE.BoxGeometry(1.8, 0.2, 1.6);
        const hoodMesh = new THREE.Mesh(hoodGeo, accentMat);
        hoodMesh.position.set(0, 0.72, -1.1);
        hoodMesh.castShadow = true;
        this.group.add(hoodMesh);

        // 3. Cabin / Cockpit
        const cabinGeo = new THREE.BoxGeometry(1.6, 0.65, 2.0);
        const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
        cabinMesh.position.set(0, 1.0, 0.1);
        cabinMesh.castShadow = true;
        this.group.add(cabinMesh);

        // 4. Rear Spoiler Wing
        const wingPillarGeo = new THREE.BoxGeometry(0.15, 0.5, 0.3);
        const wingLeft = new THREE.Mesh(wingPillarGeo, this.bodyMat);
        wingLeft.position.set(-0.6, 1.0, 1.8);
        const wingRight = new THREE.Mesh(wingPillarGeo, this.bodyMat);
        wingRight.position.set(0.6, 1.0, 1.8);

        const wingBladeGeo = new THREE.BoxGeometry(2.4, 0.12, 0.6);
        const wingBlade = new THREE.Mesh(wingBladeGeo, accentMat);
        wingBlade.position.set(0, 1.25, 1.8);
        wingBlade.castShadow = true;

        this.group.add(wingLeft);
        this.group.add(wingRight);
        this.group.add(wingBlade);

        // 5. Front & Rear Bumpers
        const bumperGeo = new THREE.BoxGeometry(2.3, 0.25, 0.3);
        const frontBumper = new THREE.Mesh(bumperGeo, accentMat);
        frontBumper.position.set(0, 0.35, -2.15);
        const rearBumper = new THREE.Mesh(bumperGeo, accentMat);
        rearBumper.position.set(0, 0.35, 2.15);
        this.group.add(frontBumper);
        this.group.add(rearBumper);

        // 6. Side Mirrors
        const mirrorGeo = new THREE.BoxGeometry(0.3, 0.15, 0.2);
        const mirrorL = new THREE.Mesh(mirrorGeo, this.bodyMat);
        mirrorL.position.set(-1.2, 0.95, -0.4);
        const mirrorR = new THREE.Mesh(mirrorGeo, this.bodyMat);
        mirrorR.position.set(1.2, 0.95, -0.4);
        this.group.add(mirrorL);
        this.group.add(mirrorR);

        // 7. Wheels
        const wheelPositions = [
            { x: -1.2, y: 0.45, z: -1.3 },
            { x: 1.2, y: 0.45, z: -1.3 },
            { x: -1.2, y: 0.45, z: 1.3 },
            { x: 1.2, y: 0.45, z: 1.3 }
        ];

        const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.35, 16);
        const rimGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.37, 12);

        wheelPositions.forEach(pos => {
            const wGroup = new THREE.Group();
            const wMesh = new THREE.Mesh(wheelGeo, wheelMat);
            wMesh.rotation.z = Math.PI / 2;
            wMesh.castShadow = true;

            const rMesh = new THREE.Mesh(rimGeo, rimMat);
            rMesh.rotation.z = Math.PI / 2;

            wGroup.add(wMesh);
            wGroup.add(rMesh);
            wGroup.position.set(pos.x, pos.y, pos.z);

            this.wheels.push(wGroup);
            this.group.add(wGroup);
        });

        // 8. Headlights & Tail Lights
        const lightGeo = new THREE.BoxGeometry(0.4, 0.2, 0.1);
        const lightL = new THREE.Mesh(lightGeo, lightYellowMat);
        lightL.position.set(-0.7, 0.6, -2.12);
        const lightR = new THREE.Mesh(lightGeo, lightYellowMat);
        lightR.position.set(0.7, 0.6, -2.12);
        this.group.add(lightL);
        this.group.add(lightR);

        const tailL = new THREE.Mesh(lightGeo, lightRedMat);
        tailL.position.set(-0.7, 0.65, 2.12);
        const tailR = new THREE.Mesh(lightGeo, lightRedMat);
        tailR.position.set(0.7, 0.65, 2.12);
        this.group.add(tailL);
        this.group.add(tailR);

        // 9. Dual Exhaust Pipes (Left & Right rear)
        const exhaustGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 12);
        exhaustGeo.rotateX(Math.PI / 2);
        const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.9 });

        this.leftExhaust = new THREE.Mesh(exhaustGeo, exhaustMat);
        this.leftExhaust.position.set(-0.55, 0.35, 2.2);

        this.rightExhaust = new THREE.Mesh(exhaustGeo, exhaustMat);
        this.rightExhaust.position.set(0.55, 0.35, 2.2);

        this.group.add(this.leftExhaust);
        this.group.add(this.rightExhaust);

        // 10. Optional Underglow Light Plate
        if (this.isUnderglowOn) {
            const glowGeo = new THREE.PlaneGeometry(2.0, 3.8);
            const glowMat = new THREE.MeshBasicMaterial({
                color: 0x00f0ff,
                side: THREE.DoubleSide
            });
            const glowMesh = new THREE.Mesh(glowGeo, glowMat);
            glowMesh.rotation.x = Math.PI / 2;
            glowMesh.position.y = 0.05;
            this.group.add(glowMesh);
        }
    }

    setCustomization(colorHex, stripeHex = null, underglow = false) {
        this.currentColor = colorHex;
        this.currentStripeColor = stripeHex;
        this.isUnderglowOn = underglow;
        this.buildCarMesh();
    }

    getExhaustPositions() {
        const leftWorld = new THREE.Vector3();
        const rightWorld = new THREE.Vector3();

        if (this.leftExhaust && this.rightExhaust) {
            this.leftExhaust.getWorldPosition(leftWorld);
            this.rightExhaust.getWorldPosition(rightWorld);
        } else {
            leftWorld.copy(this.group.position).add(new THREE.Vector3(-0.55, 0.35, 2.2));
            rightWorld.copy(this.group.position).add(new THREE.Vector3(0.55, 0.35, 2.2));
        }

        return { left: leftWorld, right: rightWorld };
    }

    getRearWheelPositions() {
        const posL = this.group.position.clone().add(new THREE.Vector3(-1.2, 0.2, 1.3));
        const posR = this.group.position.clone().add(new THREE.Vector3(1.2, 0.2, 1.3));
        return { left: posL, right: posR };
    }

    update(deltaTime, leftPressed, rightPressed, roadSpeed, particleSys) {
        if (leftPressed) this.targetX -= this.lateralSpeed * deltaTime;
        if (rightPressed) this.targetX += this.lateralSpeed * deltaTime;

        this.targetX = THREE.MathUtils.clamp(this.targetX, this.minX, this.maxX);

        const lastX = this.group.position.x;
        this.group.position.x = THREE.MathUtils.lerp(this.group.position.x, this.targetX, 0.22);

        // Steering tilt roll animation
        const dx = this.group.position.x - lastX;
        this.steeringTilt = THREE.MathUtils.lerp(this.steeringTilt, -dx * 0.9, 0.2);
        this.group.rotation.z = this.steeringTilt;

        // Emit tire smoke if steering hard
        if (particleSys && Math.abs(dx) > 0.08) {
            const wheels = this.getRearWheelPositions();
            particleSys.emitTireSmoke(wheels.left);
            particleSys.emitTireSmoke(wheels.right);
        }

        // Wheel rotations
        const rotDelta = (roadSpeed * 0.1) * deltaTime;
        this.wheels.forEach(w => {
            w.children.forEach(mesh => {
                mesh.rotation.x += rotDelta;
            });
        });
    }

    reset() {
        this.targetX = 0;
        this.currentX = 0;
        this.group.position.set(0, 0, 3.5);
        this.group.rotation.set(0, 0, 0);
        this.steeringTilt = 0;
    }
}
