import * as THREE from 'three';
import { CHARACTER_RADIUS } from '../utils/constants';

export class Character {
  name: string;
  color: number;
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  radius: number;
  finished: boolean;
  finishTime: number;
  finishRank: number;
  labelDiv: HTMLDivElement | null = null;

  constructor(name: string, color: number, startX: number, startY: number) {
    this.name = name;
    this.color = color;
    this.radius = CHARACTER_RADIUS;
    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      0,
      (Math.random() - 0.5) * 0.5,
    );
    this.finished = false;
    this.finishTime = 0;
    this.finishRank = 0;

    const geometry = new THREE.SphereGeometry(this.radius, 24, 24);
    const material = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.3,
      roughness: 0.4,
      emissive: color,
      emissiveIntensity: 0.15,
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(startX, startY, 0);
    this.mesh.castShadow = true;
    this.mesh.userData = { character: this };
  }

  get position(): THREE.Vector3 {
    return this.mesh.position;
  }

  createLabel(container: HTMLElement): void {
    this.labelDiv = document.createElement('div');
    this.labelDiv.className = 'character-label';
    this.labelDiv.textContent = this.name;
    this.labelDiv.style.cssText = `
      position: absolute;
      color: #${this.color.toString(16).padStart(6, '0')};
      font-size: 12px;
      font-weight: bold;
      text-shadow: 0 0 4px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.9);
      pointer-events: none;
      white-space: nowrap;
      transform: translate(-50%, -100%);
      z-index: 10;
    `;
    container.appendChild(this.labelDiv);
  }

  updateLabel(camera: THREE.Camera, renderer: THREE.WebGLRenderer): void {
    if (!this.labelDiv) return;
    if (this.finished) {
      this.labelDiv.style.display = 'none';
      return;
    }
    this.labelDiv.style.display = 'block';

    const pos = this.mesh.position.clone();
    pos.y += this.radius + 0.6;
    pos.project(camera);

    const canvas = renderer.domElement;
    const x = (pos.x * 0.5 + 0.5) * canvas.clientWidth;
    const y = (-pos.y * 0.5 + 0.5) * canvas.clientHeight;

    if (pos.z > 1) {
      this.labelDiv.style.display = 'none';
      return;
    }

    this.labelDiv.style.left = `${x}px`;
    this.labelDiv.style.top = `${y}px`;
  }

  removeLabel(): void {
    if (this.labelDiv && this.labelDiv.parentElement) {
      this.labelDiv.parentElement.removeChild(this.labelDiv);
    }
    this.labelDiv = null;
  }
}
