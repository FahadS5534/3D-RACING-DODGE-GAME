import * as THREE from 'three';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;

        // Active Mesh Particles (Smoke, Nitro, Crash)
        this.particles = [];

        // Rain Particle System (THREE.Points for high performance)
        this.rainPoints = null;
        this.rainGeo = null;
        this.isRaining = false;

        this.initRain();
    }

    initRain() {
        const count = 1200;
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 60; // X
            positions[i * 3 + 1] = Math.random() * 40;       // Y
            positions[i * 3 + 2] = -Math.random() * 120;     // Z
        }

        this.rainGeo = new THREE.BufferGeometry();
        this.rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const rainMat = new THREE.PointsMaterial({
            color: 0xaaccff,
            size: 0.25,
            transparent: true,
            opacity: 0.65
        });

        this.rainPoints = new THREE.Points(this.rainGeo, rainMat);
        this.rainPoints.visible = false;
        this.scene.add(this.rainPoints);
    }

    setRain(isRaining) {
        this.isRaining = isRaining;
        if (this.rainPoints) {
            this.rainPoints.visible = isRaining;
        }
    }

    emitTireSmoke(position) {
        const geo = new THREE.SphereGeometry(0.18 + Math.random() * 0.1, 6, 6);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xdddddd,
            transparent: true,
            opacity: 0.6
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(position);
        mesh.position.x += (Math.random() - 0.5) * 0.6;
        mesh.position.y += 0.2;

        this.scene.add(mesh);
        this.particles.push({
            mesh,
            vx: (Math.random() - 0.5) * 0.5,
            vy: 0.8 + Math.random() * 0.5,
            vz: 1.5,
            life: 0.35,
            maxLife: 0.35
        });
    }

    emitNitroFlames(leftExhaustPos, rightExhaustPos) {
        const colors = [0x00f0ff, 0xff793f, 0xfffa65];

        [leftExhaustPos, rightExhaustPos].forEach(pos => {
            const color = colors[Math.floor(Math.random() * colors.length)];
            const geo = new THREE.SphereGeometry(0.15 + Math.random() * 0.1, 6, 6);
            const mat = new THREE.MeshBasicMaterial({
                color,
                transparent: true,
                opacity: 0.9
            });

            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(pos);
            mesh.position.x += (Math.random() - 0.5) * 0.15;
            mesh.position.z += (Math.random() - 0.5) * 0.2;

            this.scene.add(mesh);
            this.particles.push({
                mesh,
                vx: (Math.random() - 0.5) * 0.2,
                vy: (Math.random() - 0.5) * 0.2,
                vz: 8.0 + Math.random() * 4.0, // Burst backward
                life: 0.2,
                maxLife: 0.2
            });
        });
    }

    emitCrashDebris(position) {
        const count = 35;
        const colors = [0xeb3b5a, 0xf7b731, 0x2d3436, 0xffffff];

        for (let i = 0; i < count; i++) {
            const geo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
            const mat = new THREE.MeshBasicMaterial({
                color: colors[Math.floor(Math.random() * colors.length)]
            });

            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(position);

            this.scene.add(mesh);
            this.particles.push({
                mesh,
                vx: (Math.random() - 0.5) * 16.0,
                vy: 4.0 + Math.random() * 12.0,
                vz: (Math.random() - 0.5) * 16.0,
                life: 1.2,
                maxLife: 1.2
            });
        }
    }

    update(deltaTime, roadSpeed) {
        // 1. Update Rain Particles
        if (this.isRaining && this.rainPoints) {
            const posAttr = this.rainGeo.attributes.position;
            const posArr = posAttr.array;
            const fallSpeed = 35.0 + roadSpeed * 0.5;

            for (let i = 0; i < posArr.length / 3; i++) {
                posArr[i * 3 + 1] -= fallSpeed * deltaTime; // Fall Y
                posArr[i * 3 + 2] += roadSpeed * deltaTime * 0.4; // Wind Z

                if (posArr[i * 3 + 1] < 0) {
                    posArr[i * 3 + 1] = 35.0; // Reset to top
                    posArr[i * 3 + 2] = -Math.random() * 120;
                }
            }
            posAttr.needsUpdate = true;
        }

        // 2. Update Mesh Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= deltaTime;

            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                this.particles.splice(i, 1);
            } else {
                p.mesh.position.x += p.vx * deltaTime;
                p.mesh.position.y += p.vy * deltaTime;
                p.mesh.position.z += p.vz * deltaTime;

                const opacity = p.life / p.maxLife;
                p.mesh.material.opacity = opacity;
                p.mesh.scale.setScalar(0.5 + (1.0 - opacity) * 1.2);
            }
        }
    }
}
