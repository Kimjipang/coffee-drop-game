import * as THREE from 'three';
import { FirstPersonCam } from './FirstPersonCam';
import { ThirdPersonCam } from './ThirdPersonCam';
import { SideViewCam } from './SideViewCam';
import { Character } from '../game/Character';

export enum CameraMode {
  FIRST_PERSON = 0,
  THIRD_PERSON = 1,
  SIDE_VIEW = 2,
}

export class CameraManager {
  mode: CameraMode = CameraMode.SIDE_VIEW;
  trackedCharacter: Character | null = null;
  private firstPerson: FirstPersonCam;
  private thirdPerson: ThirdPersonCam;
  private sideView: SideViewCam;
  private characters: Character[] = [];

  constructor() {
    this.firstPerson = new FirstPersonCam();
    this.thirdPerson = new ThirdPersonCam();
    this.sideView = new SideViewCam();
  }

  setCharacters(chars: Character[]): void {
    this.characters = chars;
    if (chars.length > 0) {
      this.trackedCharacter = chars[0];
    }
  }

  setMode(mode: CameraMode): void {
    this.mode = mode;
  }

  trackCharacter(char: Character): void {
    this.trackedCharacter = char;
  }

  get activeCamera(): THREE.Camera {
    switch (this.mode) {
      case CameraMode.FIRST_PERSON:
        return this.firstPerson.camera;
      case CameraMode.THIRD_PERSON:
        return this.thirdPerson.camera;
      case CameraMode.SIDE_VIEW:
        return this.sideView.camera;
    }
  }

  update(): void {
    // If tracked character is finished, switch to next unfinished
    if (this.trackedCharacter?.finished) {
      const next = this.characters.find((c) => !c.finished);
      if (next) this.trackedCharacter = next;
    }

    switch (this.mode) {
      case CameraMode.FIRST_PERSON:
        this.firstPerson.update(this.trackedCharacter);
        break;
      case CameraMode.THIRD_PERSON:
        this.thirdPerson.update(this.trackedCharacter);
        break;
      case CameraMode.SIDE_VIEW:
        this.sideView.update(this.characters);
        break;
    }
  }

  /** Zoom camera towards slow motion focus targets */
  focusOnTargets(targets: Character[]): void {
    if (targets.length === 0) return;
    if (this.mode === CameraMode.SIDE_VIEW) {
      // In side view, we just let it track normally
      return;
    }
    // Track the leading unfinished character
    const leader = targets[0];
    if (leader && !leader.finished) {
      this.trackedCharacter = leader;
    }
  }

  pickCharacter(event: MouseEvent, renderer: THREE.WebGLRenderer): Character | null {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, this.activeCamera);

    for (const char of this.characters) {
      const intersects = raycaster.intersectObject(char.mesh);
      if (intersects.length > 0) {
        return char;
      }
    }
    return null;
  }

  dispose(): void {
    this.firstPerson.dispose();
    this.thirdPerson.dispose();
    this.sideView.dispose();
  }
}
