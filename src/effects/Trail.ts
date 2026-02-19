import * as THREE from 'three';
import { Character } from '../game/Character';
import { TRAIL_LENGTH, TRAIL_OPACITY } from '../utils/constants';

interface TrailData {
  points: THREE.Vector3[];
  meshes: THREE.Mesh[];
}

export class Trail {
  private trails: Map<Character, TrailData> = new Map();
  private scene: THREE.Scene;
  private frameCount = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  addCharacter(char: Character): void {
    const data: TrailData = { points: [], meshes: [] };
    this.trails.set(char, data);
  }

  update(): void {
    this.frameCount++;
    // Only update trail every 2 frames for performance
    if (this.frameCount % 2 !== 0) return;

    this.trails.forEach((data, char) => {
      if (char.finished) return;

      // Add current position
      data.points.push(char.position.clone());

      // Limit trail length
      while (data.points.length > TRAIL_LENGTH) {
        data.points.shift();
        const oldMesh = data.meshes.shift();
        if (oldMesh) {
          this.scene.remove(oldMesh);
          oldMesh.geometry.dispose();
          (oldMesh.material as THREE.Material).dispose();
        }
      }

      // Create trail sphere
      const geo = new THREE.SphereGeometry(char.radius * 0.6, 8, 8);
      const mat = new THREE.MeshBasicMaterial({
        color: char.color,
        transparent: true,
        opacity: TRAIL_OPACITY * 0.3,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(char.position);
      this.scene.add(mesh);
      data.meshes.push(mesh);

      // Update opacity of existing trail meshes (fade out)
      for (let i = 0; i < data.meshes.length; i++) {
        const t = i / data.meshes.length;
        (data.meshes[i].material as THREE.MeshBasicMaterial).opacity =
          t * TRAIL_OPACITY * 0.4;
        const scale = 0.3 + t * 0.7;
        data.meshes[i].scale.setScalar(scale);
      }
    });
  }

  clear(): void {
    this.trails.forEach((data) => {
      for (const mesh of data.meshes) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }
      data.points = [];
      data.meshes = [];
    });
    this.trails.clear();
  }
}
