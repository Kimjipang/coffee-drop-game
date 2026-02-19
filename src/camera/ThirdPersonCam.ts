import * as THREE from 'three';
import { Character } from '../game/Character';
import {
  THIRD_PERSON_OFFSET_Y,
  THIRD_PERSON_OFFSET_Z,
  CAMERA_LERP,
} from '../utils/constants';

export class ThirdPersonCam {
  camera: THREE.PerspectiveCamera;

  constructor() {
    this.camera = new THREE.PerspectiveCamera(
      60,
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

    const targetPos = new THREE.Vector3(
      pos.x,
      pos.y + THIRD_PERSON_OFFSET_Y,
      pos.z + THIRD_PERSON_OFFSET_Z,
    );

    this.camera.position.lerp(targetPos, CAMERA_LERP);

    const lookTarget = new THREE.Vector3(pos.x, pos.y - 2, pos.z);
    const currentLook = new THREE.Vector3();
    this.camera.getWorldDirection(currentLook);
    currentLook.add(this.camera.position);
    currentLook.lerp(lookTarget, CAMERA_LERP * 1.5);
    this.camera.lookAt(lookTarget);
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
  }
}
