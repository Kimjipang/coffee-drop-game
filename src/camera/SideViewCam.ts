import * as THREE from 'three';
import { Character } from '../game/Character';
import { SIDE_VIEW_SIZE, CAMERA_LERP } from '../utils/constants';

export class SideViewCam {
  camera: THREE.OrthographicCamera;
  private targetY = 0;

  constructor() {
    const aspect = window.innerWidth / window.innerHeight;
    const halfH = SIDE_VIEW_SIZE / 2;
    const halfW = halfH * aspect;
    this.camera = new THREE.OrthographicCamera(
      -halfW, halfW, halfH, -halfH, 0.1, 200,
    );
    this.camera.position.set(0, 0, 50);
    this.camera.lookAt(0, 0, 0);

    window.addEventListener('resize', this.onResize);
  }

  private onResize = (): void => {
    const aspect = window.innerWidth / window.innerHeight;
    const halfH = SIDE_VIEW_SIZE / 2;
    const halfW = halfH * aspect;
    this.camera.left = -halfW;
    this.camera.right = halfW;
    this.camera.top = halfH;
    this.camera.bottom = -halfH;
    this.camera.updateProjectionMatrix();
  };

  update(characters: Character[]): void {
    // Track average Y of active characters
    const active = characters.filter((c) => !c.finished);
    if (active.length > 0) {
      const avgY =
        active.reduce((s, c) => s + c.position.y, 0) / active.length;
      this.targetY = avgY;
    }

    this.camera.position.y += (this.targetY - this.camera.position.y) * CAMERA_LERP;
    this.camera.lookAt(0, this.camera.position.y, 0);
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
  }
}
