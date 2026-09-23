import * as THREE from 'three';

export const OBSTACLE_TYPES = {
    CONE: 0,
    TIRES: 1,
    BARRIER: 2,
    SLOW_CAR: 3,
    CRATE: 4
};

export class ObstacleManager {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.group.name = 'ObstacleGroup';
        this.scene.add(this.group);

        this.obstacles = [];
        this.lanePositions = [-3.8, 0.0, 3.8];
        this.spawnTimer = 0;
        this.spawnInterval = 1.6; // Seconds between obstacle waves

        // Pre-create shared geometries and materials
        this.initMaterials();
    }

    initMaterials() {
        this.matOrange = new THREE.MeshStandardMaterial({ color: 0xff793f, roughness: 0.3 });
        this.matWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
        this.matTire = new THREE.MeshStandardMaterial({ color: 0x2d3436, roughness: 0.9 });
        this.matBarrier = new THREE.MeshStandardMaterial({ color: 0xd63031, roughness: 0.4 });
        this.matCrate = new THREE.MeshStandardMaterial({ color: 0xcd6133, roughness: 0.8 });

        // Slow Traffic Car Palette
        this.matTrafficCar = new THREE.MeshStandardMaterial({ color: 0x0984e3, roughness: 0.3, metalness: 0.4 });
        this.matGlass = new THREE.MeshStandardMaterial({ color: 0x2d3436, roughness: 0.1, metalness: 0.8 });
    }

    createObstacleMesh(type) {
        const obsGroup = new THREE.Group();
        let boundRadius = 1.2;

        if (type === OBSTACLE_TYPES.CONE) {
            // Traffic Cone
            const coneGeo = new THREE.ConeGeometry(0.55, 1.2, 12);
            const cone = new THREE.Mesh(coneGeo, this.matOrange);
            cone.position.y = 0.6;
            cone.castShadow = true;

            const stripeGeo = new THREE.CylinderGeometry(0.35, 0.42, 0.3, 12);
            const stripe = new THREE.Mesh(stripeGeo, this.matWhite);
            stripe.position.y = 0.55;

            obsGroup.add(cone);
            obsGroup.add(stripe);
            boundRadius = 0.7;

        } else if (type === OBSTACLE_TYPES.TIRES) {
            // Tire Stack (3 stacked tires)
            const tireGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.4, 16);
            for (let i = 0; i < 3; i++) {
                const tire = new THREE.Mesh(tireGeo, this.matTire);
                tire.position.y = 0.2 + (i * 0.38);
                tire.castShadow = true;
                obsGroup.add(tire);
            }
            boundRadius = 0.85;

        } else if (type === OBSTACLE_TYPES.BARRIER) {
            // Traffic Barrier Block
            const barrierGeo = new THREE.BoxGeometry(2.2, 0.9, 0.8);
            const barrier = new THREE.Mesh(barrierGeo, this.matBarrier);
            barrier.position.y = 0.45;
            barrier.castShadow = true;
            obsGroup.add(barrier);
            boundRadius = 1.2;

        } else if (type === OBSTACLE_TYPES.SLOW_CAR) {
            // Slow Traffic Vehicle
            const bGeo = new THREE.BoxGeometry(2.0, 0.55, 3.8);
            const bMesh = new THREE.Mesh(bGeo, this.matTrafficCar);
            bMesh.position.y = 0.5;
            bMesh.castShadow = true;

            const cGeo = new THREE.BoxGeometry(1.5, 0.6, 1.8);
            const cMesh = new THREE.Mesh(cGeo, this.matGlass);
            cMesh.position.set(0, 0.95, 0);

            obsGroup.add(bMesh);
            obsGroup.add(cMesh);
            boundRadius = 1.8;

        } else {
            // Wooden Crate Box
            const crateGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
            const crate = new THREE.Mesh(crateGeo, this.matCrate);
            crate.position.y = 0.6;
            crate.castShadow = true;
            obsGroup.add(crate);
            boundRadius = 0.9;
        }

        obsGroup.userData = {
            type,
            boundRadius,
            box: new THREE.Box3()
        };

        return obsGroup;
    }

    spawnWave() {
        // Pick 1 or 2 lanes to place obstacles (Leave at least 1 lane free!)
        const availableLanes = [0, 1, 2];
        const numObstacles = Math.random() < 0.6 ? 1 : 2; // 60% chance for 1 obstacle, 40% for 2

        for (let i = 0; i < numObstacles; i++) {
            if (availableLanes.length <= 1) break; // Guarantee at least 1 open lane!

            const laneIdx = Math.floor(Math.random() * availableLanes.length);
            const lane = availableLanes.splice(laneIdx, 1)[0];
            const laneX = this.lanePositions[lane];

            // Random obstacle type
            const type = Math.floor(Math.random() * 5);
            const obsMesh = this.createObstacleMesh(type);

            // Spawn far ahead at z = -180
            obsMesh.position.set(laneX, 0, -180 - (Math.random() * 10));

            this.group.add(obsMesh);
            this.obstacles.push(obsMesh);
        }
    }

    update(deltaTime, roadSpeed, isPlaying) {
        if (!isPlaying) return;

        // Spawn timer progression
        this.spawnTimer += deltaTime;

        // Dynamic spawn frequency based on road speed (faster speed = faster spawn rate)
        const adjustedInterval = Math.max(0.9, 1.8 - (roadSpeed - 20) * 0.02);

        if (this.spawnTimer >= adjustedInterval) {
            this.spawnTimer = 0;
            this.spawnWave();
        }

        // Scroll obstacles toward camera (+Z direction)
        const moveDist = roadSpeed * deltaTime;

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.position.z += moveDist;

            // Update bounding box
            obs.userData.box.setFromObject(obs);

            // Recycle / Remove obstacles that have passed behind camera (z > 20)
            if (obs.position.z > 20) {
                this.group.remove(obs);
                this.obstacles.splice(i, 1);
            }
        }
    }

    checkPlayerCollision(playerCarGroup) {
        if (!playerCarGroup) return false;

        const playerBox = new THREE.Box3().setFromObject(playerCarGroup);

        for (let i = 0; i < this.obstacles.length; i++) {
            const obs = this.obstacles[i];
            const obsBox = obs.userData.box;

            // Precise Box3 intersection check
            if (playerBox.intersectsBox(obsBox)) {
                console.log('CRASH COLLISION DETECTED with obstacle type:', obs.userData.type);
                return true; // Collision occurred!
            }
        }

        return false;
    }

    reset() {
        // Clear all active obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            this.group.remove(this.obstacles[i]);
        }
        this.obstacles = [];
        this.spawnTimer = 0;
    }
}
