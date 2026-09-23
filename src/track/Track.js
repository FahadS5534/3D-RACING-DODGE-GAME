import * as THREE from 'three';
import { TRACK_WAYPOINTS } from '../utils/Waypoints.js';

export class Track {
    constructor(scene, gltfModel) {
        this.scene = scene;
        this.gltf = gltfModel;
        this.modelGroup = new THREE.Group();
        this.modelGroup.name = 'TrackGroup';
        this.boundaryBoxes = [];

        this.initEnvironmentGround();
        this.initCircuitAsphaltAndCurbs();
        this.initTrackGLB();
    }

    initEnvironmentGround() {
        // Large Vibrant Green Grass Terrain Plane
        const grassGeo = new THREE.PlaneGeometry(600, 600);
        const grassMat = new THREE.MeshStandardMaterial({
            color: 0x3a7d34, // Rich vibrant grass green
            roughness: 0.9,
            metalness: 0.1
        });

        const grassMesh = new THREE.Mesh(grassGeo, grassMat);
        grassMesh.rotation.x = -Math.PI / 2;
        grassMesh.position.y = -0.05; // Slightly below asphalt
        grassMesh.receiveShadow = true;
        this.modelGroup.add(grassMesh);
    }

    initCircuitAsphaltAndCurbs() {
        // Create an explicit closed-loop racing circuit road following waypoints
        const roadGroup = new THREE.Group();
        roadGroup.name = 'ProceduralCircuitRoad';

        const points = TRACK_WAYPOINTS.map(wp => new THREE.Vector2(wp.x, wp.z));
        const curve = new THREE.CatmullRomCurve3(
            TRACK_WAYPOINTS,
            true, // Closed loop
            'centripetal',
            0.5
        );

        // Asphalt Road Surface geometry (Tube along curve)
        const roadWidth = 18;
        const curvePoints = curve.getSpacedPoints(200);

        // Create asphalt strip geometry using extruded ribbon or tube
        const roadShape = new THREE.Shape();
        roadShape.moveTo(-roadWidth / 2, 0);
        roadShape.lineTo(roadWidth / 2, 0);

        const roadMat = new THREE.MeshStandardMaterial({
            color: 0x22252a,
            roughness: 0.8,
            metalness: 0.1
        });

        // Generate Road Extrusion or Planes along waypoints
        for (let i = 0; i < curvePoints.length; i++) {
            const p1 = curvePoints[i];
            const p2 = curvePoints[(i + 1) % curvePoints.length];

            const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
            const normal = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
            const dist = p1.distanceTo(p2);

            // Road Segment Plane
            const segGeo = new THREE.PlaneGeometry(roadWidth, dist + 0.2);
            const segMesh = new THREE.Mesh(segGeo, roadMat);
            segMesh.rotation.x = -Math.PI / 2;

            const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
            segMesh.position.set(mid.x, 0.02, mid.z);
            segMesh.rotation.z = -Math.atan2(dir.z, dir.x) + Math.PI / 2;
            segMesh.receiveShadow = true;
            roadGroup.add(segMesh);

            // Red & White Corner Curbs on Outer Edges
            const isCurbSegment = (i % 4 < 2);
            const curbMat = new THREE.MeshStandardMaterial({
                color: isCurbSegment ? 0xdd2222 : 0xffffff,
                roughness: 0.4
            });

            // Left Curb
            const leftCurbGeo = new THREE.BoxGeometry(0.8, 0.3, dist);
            const leftCurb = new THREE.Mesh(leftCurbGeo, curbMat);
            const leftPos = p1.clone().addScaledVector(normal, roadWidth / 2 + 0.4);
            leftCurb.position.set(leftPos.x, 0.15, leftPos.z);
            leftCurb.rotation.y = Math.atan2(dir.x, dir.z);
            leftCurb.castShadow = true;
            leftCurb.receiveShadow = true;
            roadGroup.add(leftCurb);

            // Right Curb
            const rightCurb = new THREE.Mesh(leftCurbGeo, curbMat);
            const rightPos = p1.clone().addScaledVector(normal, -(roadWidth / 2 + 0.4));
            rightCurb.position.set(rightPos.x, 0.15, rightPos.z);
            rightCurb.rotation.y = Math.atan2(dir.x, dir.z);
            rightCurb.castShadow = true;
            rightCurb.receiveShadow = true;
            roadGroup.add(rightCurb);
        }

        this.modelGroup.add(roadGroup);
    }

    initTrackGLB() {
        if (!this.gltf) return;

        const model = this.gltf.scene;
        model.name = 'BasicTrackGLBMesh';

        // Calculate bounding box and dimensions
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);

        console.log('--- TRACK GLB DIAGNOSTICS ---');
        console.log('Track size:', size);
        console.log('Track center:', center);

        // Position track GLB flush with scene floor
        model.position.x = -center.x;
        model.position.y = -box.min.y;
        model.position.z = -center.z;

        model.traverse((child) => {
            if (child.isMesh) {
                child.receiveShadow = true;
                child.castShadow = true;

                // Adjust material brightness if texture was too dark
                if (child.material) {
                    child.material.depthWrite = true;
                    if (child.material.color) {
                        // Ensure materials respond brightly to daylight
                        child.material.roughness = Math.min(child.material.roughness || 0.7, 0.8);
                    }
                }
            }
        });

        this.modelGroup.add(model);
        this.scene.add(this.modelGroup);

        this.createBoundaryColliders();
    }

    createBoundaryColliders() {
        const outerMargin = 120;
        this.boundaryBoxes = [
            new THREE.Box3(new THREE.Vector3(-outerMargin, -5, -outerMargin), new THREE.Vector3(outerMargin, 20, -outerMargin + 2)),
            new THREE.Box3(new THREE.Vector3(-outerMargin, -5, outerMargin - 2), new THREE.Vector3(outerMargin, 20, outerMargin)),
            new THREE.Box3(new THREE.Vector3(-outerMargin, -5, -outerMargin), new THREE.Vector3(-outerMargin + 2, 20, outerMargin)),
            new THREE.Box3(new THREE.Vector3(outerMargin - 2, -5, -outerMargin), new THREE.Vector3(outerMargin, 20, outerMargin))
        ];
    }
}
