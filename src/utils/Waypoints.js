import * as THREE from 'three';

/**
 * Track Waypoints for AI Navigation and Minimap Track Boundary
 */
export const TRACK_WAYPOINTS = [
    new THREE.Vector3(0, 0, 50),     // Start / Finish area
    new THREE.Vector3(30, 0, 50),    // Main straight towards turn 1
    new THREE.Vector3(65, 0, 45),
    new THREE.Vector3(90, 0, 25),    // Turn 1 curve
    new THREE.Vector3(95, 0, 0),
    new THREE.Vector3(90, 0, -25),   // Turn 2 exit
    new THREE.Vector3(65, 0, -45),
    new THREE.Vector3(30, 0, -50),   // Back straight
    new THREE.Vector3(0, 0, -50),
    new THREE.Vector3(-30, 0, -50),
    new THREE.Vector3(-65, 0, -45),
    new THREE.Vector3(-90, 0, -25),  // Turn 3 curve
    new THREE.Vector3(-95, 0, 0),
    new THREE.Vector3(-90, 0, 25),   // Turn 4 exit
    new THREE.Vector3(-65, 0, 45),
    new THREE.Vector3(-30, 0, 50)
];

export class WaypointDebugVisualizer {
    constructor(scene, waypoints) {
        this.scene = scene;
        this.waypoints = waypoints;
        this.group = new THREE.Group();
        this.group.name = 'WaypointDebugGroup';
        this.group.visible = false; // Hidden by default (F3 toggles)
        this.initVisuals();
    }

    initVisuals() {
        const sphereGeo = new THREE.SphereGeometry(1.2, 16, 16);
        const mat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, wireframe: true });

        const linePoints = [];

        this.waypoints.forEach((wp, index) => {
            const sphere = new THREE.Mesh(sphereGeo, mat);
            sphere.position.copy(wp);
            sphere.position.y += 1.0;
            this.group.add(sphere);

            linePoints.push(sphere.position.clone());
        });

        // Close the line loop
        linePoints.push(linePoints[0].clone());

        const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
        const lineMat = new THREE.LineBasicMaterial({ color: 0x00ffcc, linewidth: 2 });
        const line = new THREE.Line(lineGeo, lineMat);
        this.group.add(line);

        this.scene.add(this.group);
    }

    toggle() {
        this.group.visible = !this.group.visible;
        return this.group.visible;
    }
}
