import * as THREE from 'three';

export class RoadEnvironment {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.group.name = 'RoadEnvironmentGroup';

        this.laneDashes = [];
        this.sceneryProps = [];
        this.streetLights = [];

        this.initRoad();
        this.initGrassTerrain();
        this.initLaneDashes();
        this.initRoadsideScenery();
        this.initStreetLightPoles();

        this.scene.add(this.group);
    }

    initRoad() {
        // Dark Asphalt 3-Lane Road
        const roadGeo = new THREE.PlaneGeometry(16.0, 300);
        this.roadMat = new THREE.MeshStandardMaterial({
            color: 0x22252a,
            roughness: 0.8,
            metalness: 0.1
        });

        const roadMesh = new THREE.Mesh(roadGeo, this.roadMat);
        roadMesh.rotation.x = -Math.PI / 2;
        roadMesh.position.set(0, 0, -100);
        roadMesh.receiveShadow = true;
        this.group.add(roadMesh);

        // Curbs
        const curbMatRed = new THREE.MeshStandardMaterial({ color: 0xeb3b5a, roughness: 0.4 });
        const curbMatWhite = new THREE.MeshStandardMaterial({ color: 0xf5f6fa, roughness: 0.4 });

        const curbLength = 300;
        const segmentLen = 4;
        const count = Math.floor(curbLength / segmentLen);

        for (let i = 0; i < count; i++) {
            const isRed = (i % 2 === 0);
            const mat = isRed ? curbMatRed : curbMatWhite;
            const curbGeo = new THREE.BoxGeometry(0.5, 0.25, segmentLen);

            const leftCurb = new THREE.Mesh(curbGeo, mat);
            leftCurb.position.set(-8.25, 0.12, -240 + (i * segmentLen));
            leftCurb.receiveShadow = true;
            leftCurb.castShadow = true;
            this.group.add(leftCurb);

            const rightCurb = new THREE.Mesh(curbGeo, mat);
            rightCurb.position.set(8.25, 0.12, -240 + (i * segmentLen));
            rightCurb.receiveShadow = true;
            rightCurb.castShadow = true;
            this.group.add(rightCurb);
        }
    }

    initGrassTerrain() {
        const grassMat = new THREE.MeshStandardMaterial({ color: 0x388e3c, roughness: 0.9 });
        const grassGeo = new THREE.PlaneGeometry(300, 300);

        const leftGrass = new THREE.Mesh(grassGeo, grassMat);
        leftGrass.rotation.x = -Math.PI / 2;
        leftGrass.position.set(-158, -0.05, -100);
        leftGrass.receiveShadow = true;
        this.group.add(leftGrass);

        const rightGrass = new THREE.Mesh(grassGeo, grassMat);
        rightGrass.rotation.x = -Math.PI / 2;
        rightGrass.position.set(158, -0.05, -100);
        rightGrass.receiveShadow = true;
        this.group.add(rightGrass);
    }

    initLaneDashes() {
        const dashGeo = new THREE.BoxGeometry(0.18, 0.04, 3.5);
        const dashMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        const lanePositions = [-2.66, 2.66];
        const startZ = -240;
        const endZ = 30;
        const spacing = 8.0;

        for (let z = startZ; z <= endZ; z += spacing) {
            lanePositions.forEach(x => {
                const dash = new THREE.Mesh(dashGeo, dashMat);
                dash.position.set(x, 0.03, z);
                this.laneDashes.push(dash);
                this.group.add(dash);
            });
        }
    }

    initRoadsideScenery() {
        const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 2.0, 8);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x795548 });
        const foliageGeo = new THREE.ConeGeometry(1.8, 3.5, 8);
        const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.8 });

        for (let z = -240; z <= 30; z += 20) {
            [-12, 12].forEach(sideX => {
                const treeGroup = new THREE.Group();
                const trunk = new THREE.Mesh(trunkGeo, trunkMat);
                trunk.position.y = 1.0;
                trunk.castShadow = true;

                const foliage = new THREE.Mesh(foliageGeo, foliageMat);
                foliage.position.y = 3.2;
                foliage.castShadow = true;

                treeGroup.add(trunk);
                treeGroup.add(foliage);

                treeGroup.position.set(sideX + (Math.random() * 2 - 1), 0, z);
                this.sceneryProps.push(treeGroup);
                this.group.add(treeGroup);
            });
        }
    }

    initStreetLightPoles() {
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8 });
        const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfffaed });

        for (let z = -240; z <= 30; z += 40) {
            const poleGroup = new THREE.Group();

            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 6.0), poleMat);
            pole.position.y = 3.0;

            const arm = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.12, 0.12), poleMat);
            arm.position.set(1.0, 5.8, 0);

            const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), bulbMat);
            bulb.position.set(2.0, 5.6, 0);

            const light = new THREE.PointLight(0xfffaed, 0, 20);
            light.position.set(2.0, 5.4, 0);

            poleGroup.add(pole);
            poleGroup.add(arm);
            poleGroup.add(bulb);
            poleGroup.add(light);

            poleGroup.position.set(-9.5, 0, z);
            this.streetLights.push({ group: poleGroup, light });
            this.sceneryProps.push(poleGroup);
            this.group.add(poleGroup);
        }
    }

    setNightMode(isNight) {
        this.streetLights.forEach(item => {
            item.light.intensity = isNight ? 1.8 : 0;
        });
    }

    setWetRoad(isWet) {
        if (this.roadMat) {
            this.roadMat.roughness = isWet ? 0.25 : 0.8;
            this.roadMat.metalness = isWet ? 0.35 : 0.1;
        }
    }

    update(deltaTime, roadSpeed) {
        const moveDist = roadSpeed * deltaTime;

        this.laneDashes.forEach(dash => {
            dash.position.z += moveDist;
            if (dash.position.z > 25) dash.position.z -= 270;
        });

        this.sceneryProps.forEach(prop => {
            prop.position.z += moveDist;
            if (prop.position.z > 25) prop.position.z -= 270;
        });
    }
}
