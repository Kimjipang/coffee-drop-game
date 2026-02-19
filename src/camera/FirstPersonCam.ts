import * as THREE from 'three';
import { Character } from '../game/Character';
import { FIRST_PERSON_OFFSET_Y, CAMERA_LERP } from '../utils/constants';

export class FirstPersonCam {
  camera: THREE.PerspectiveCamera;

  constructor() {
    this.camera = new THREE.PerspectiveCamera(
      90,
      window.innerWidth / window.innerHeight,
      0.1,
      300,
    );
    window.addEventListener('resize', this.onResize);
  }

  private onResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  };

  update(target: Character | null): void {
    if (!target) return;
    const pos = target.position;

    // Position at character, looking slightly ahead (down)
    const targetPos = new THREE.Vector3(
      pos.x,
      pos.y + FIRST_PERSON_OFFSET_Y,
      pos.z + 0.5,
    );

    this.camera.position.lerp(targetPos, CAMERA_LERP * 2);
    this.camera.lookAt(pos.x, pos.y - 10, pos.z);
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
  }
}
