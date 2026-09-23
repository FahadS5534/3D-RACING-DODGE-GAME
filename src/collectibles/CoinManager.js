import * as THREE from 'three';

export class CoinManager {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.group.name = 'CoinGroup';
        this.scene.add(this.group);

        this.coins = [];
        this.lanePositions = [-3.8, 0.0, 3.8];
        this.spawnTimer = 0;
        this.spawnInterval = 2.2;

        this.initCoinMaterial();
    }

    initCoinMaterial() {
        this.coinGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.12, 16);
        this.coinGeo.rotateX(Math.PI / 2); // Stand coin upright facing forward

        this.coinMat = new THREE.MeshStandardMaterial({
            color: 0xf7b731, // Metallic Gold
            metalness: 0.9,
            roughness: 0.2,
            emissive: 0xffaa00,
            emissiveIntensity: 0.3
        });
    }

    spawnCoinPattern() {
        const patternType = Math.floor(Math.random() * 3); // 0: Single, 1: Line, 2: ZigZag
        const startLane = Math.floor(Math.random() * 3);
        const startZ = -190;

        if (patternType === 0) {
            // Single Coin
            this.createCoin(this.lanePositions[startLane], startZ);
        } else if (patternType === 1) {
            // 5-Coin Line in same lane
            for (let i = 0; i < 5; i++) {
                this.createCoin(this.lanePositions[startLane], startZ - (i * 3.5));
            }
        } else {
            // 5-Coin Zig-Zag pattern across lanes
            for (let i = 0; i < 5; i++) {
                const laneIdx = (startLane + i) % 3;
                this.createCoin(this.lanePositions[laneIdx], startZ - (i * 4.0));
            }
        }
    }

    createCoin(x, z) {
        const mesh = new THREE.Mesh(this.coinGeo, this.coinMat.clone());
        mesh.position.set(x, 0.8, z);
        mesh.castShadow = true;

        const coinObj = {
            mesh,
            box: new THREE.Box3(),
            isCollected: false,
            shrinkTimer: 1.0
        };

        this.group.add(mesh);
        this.coins.push(coinObj);
    }

    update(deltaTime, roadSpeed, isPlaying, onCoinCollected) {
        if (!isPlaying) return;

        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnCoinPattern();
        }

        const moveDist = roadSpeed * deltaTime;

        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];

            if (coin.isCollected) {
                // Shrink animation when collected
                coin.shrinkTimer -= deltaTime * 4.0;
                coin.mesh.scale.setScalar(Math.max(0, coin.shrinkTimer));
                if (coin.shrinkTimer <= 0) {
                    this.group.remove(coin.mesh);
                    this.coins.splice(i, 1);
                }
            } else {
                // Normal coin movement & 3D rotation
                coin.mesh.position.z += moveDist;
                coin.mesh.rotation.y += 3.0 * deltaTime;

                coin.box.setFromObject(coin.mesh);

                if (coin.mesh.position.z > 20) {
                    this.group.remove(coin.mesh);
                    this.coins.splice(i, 1);
                }
            }
        }
    }

    checkPlayerCollection(playerCarGroup, onCoinCollected) {
        if (!playerCarGroup) return;

        const playerBox = new THREE.Box3().setFromObject(playerCarGroup);

        for (let i = 0; i < this.coins.length; i++) {
            const coin = this.coins[i];
            if (!coin.isCollected && playerBox.intersectsBox(coin.box)) {
                coin.isCollected = true;
                if (onCoinCollected) onCoinCollected();
            }
        }
    }

    reset() {
        for (let i = this.coins.length - 1; i >= 0; i--) {
            this.group.remove(this.coins[i].mesh);
        }
        this.coins = [];
        this.spawnTimer = 0;
    }
}
