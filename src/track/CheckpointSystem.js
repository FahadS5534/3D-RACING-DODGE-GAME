import * as THREE from 'three';

export class CheckpointSystem {
    constructor(scene) {
        this.scene = scene;
        this.checkpoints = [];

        this.initCheckpoints();
        this.createStartFinishVisuals();
    }

    initCheckpoints() {
        // Define sequential trigger boxes around the track loop
        // CP 0: Start / Finish Line at (0, 0, 50)
        // CP 1: Turn 1 at (90, 0, 0)
        // CP 2: Back straight at (0, 0, -50)
        // CP 3: Turn 3 at (-90, 0, 0)

        const gates = [
            { pos: new THREE.Vector3(0, 0, 50), size: new THREE.Vector3(30, 10, 8), isFinish: true },
            { pos: new THREE.Vector3(90, 0, 0), size: new THREE.Vector3(8, 10, 30), isFinish: false },
            { pos: new THREE.Vector3(0, 0, -50), size: new THREE.Vector3(30, 10, 8), isFinish: false },
            { pos: new THREE.Vector3(-90, 0, 0), size: new THREE.Vector3(8, 10, 30), isFinish: false }
        ];

        gates.forEach((gate, index) => {
            const min = gate.pos.clone().sub(gate.size.clone().multiplyScalar(0.5));
            const max = gate.pos.clone().add(gate.size.clone().multiplyScalar(0.5));
            const box = new THREE.Box3(min, max);

            this.checkpoints.push({
                index,
                box,
                position: gate.pos,
                isFinish: gate.isFinish
            });
        });
    }

    createStartFinishVisuals() {
        // Create visible Start/Finish Line structure across the road at (0, 0, 50)
        const group = new THREE.Group();
        group.name = 'StartFinishArchGroup';

        // Checkered line asphalt strip
        const lineGeo = new THREE.PlaneGeometry(24, 4);
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // Draw checkered pattern
        const tileSize = 32;
        for (let x = 0; x < canvas.width; x += tileSize) {
            for (let y = 0; y < canvas.height; y += tileSize) {
                ctx.fillStyle = ((x / tileSize + y / tileSize) % 2 === 0) ? '#ffffff' : '#111111';
                ctx.fillRect(x, y, tileSize, tileSize);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        const lineMat = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.6,
            polygonOffset: true,
            polygonOffsetFactor: -1
        });

        const lineMesh = new THREE.Mesh(lineGeo, lineMat);
        lineMesh.rotation.x = -Math.PI / 2;
        lineMesh.position.set(0, 0.05, 50);
        group.add(lineMesh);

        // Side Arch Pillars
        const pillarGeo = new THREE.BoxGeometry(1.2, 8, 1.2);
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, metalness: 0.7, roughness: 0.3 });

        const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
        leftPillar.position.set(-12, 4, 50);
        leftPillar.castShadow = true;

        const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
        rightPillar.position.set(12, 4, 50);
        rightPillar.castShadow = true;

        // Top Banner Arch
        const archGeo = new THREE.BoxGeometry(25.2, 1.8, 0.8);
        const archMat = new THREE.MeshStandardMaterial({ color: 0x111122, metalness: 0.8, roughness: 0.2 });
        const archMesh = new THREE.Mesh(archGeo, archMat);
        archMesh.position.set(0, 8, 50);
        archMesh.castShadow = true;

        group.add(leftPillar);
        group.add(rightPillar);
        group.add(archMesh);

        this.scene.add(group);
    }

    checkPlayerCheckpoint(playerCar, currentCheckpointIndex, onLapCompleted, onCheckpointPassed) {
        if (!playerCar) return currentCheckpointIndex;

        const nextTargetIndex = currentCheckpointIndex;
        const targetGate = this.checkpoints[nextTargetIndex];

        if (targetGate && targetGate.box.intersectsBox(playerCar.boundingBox)) {
            const nextIndex = (currentCheckpointIndex + 1) % this.checkpoints.length;

            if (onCheckpointPassed) {
                onCheckpointPassed(targetGate.index, targetGate.isFinish);
            }

            if (targetGate.isFinish && currentCheckpointIndex === 0) {
                // Initial start trigger, move to next
                return 1;
            } else if (targetGate.isFinish && currentCheckpointIndex === this.checkpoints.length - 1) {
                // Completed full circuit in order!
                if (onLapCompleted) onLapCompleted();
                return 1; // Reset target checkpoint to CP 1
            } else {
                return nextIndex;
            }
        }

        return currentCheckpointIndex;
    }
}
