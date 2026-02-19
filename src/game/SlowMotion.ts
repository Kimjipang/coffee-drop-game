import { Character } from './Character';
import { SLOW_MOTION_SCALE, SLOW_MOTION_LERP, FINISH_Y } from '../utils/constants';

export class SlowMotion {
  timeScale = 1;
  active = false;
  private targetScale = 1;
  private triggerThreshold: number;
  private recoveryDelay = 0;

  constructor(private totalCharacters: number) {
    this.triggerThreshold = Math.max(2, Math.min(3, totalCharacters - 1));
  }

  update(characters: Character[], dt: number): number {
    const unfinished = characters.filter((c) => !c.finished);
    const finishedCount = characters.length - unfinished.length;

    // Trigger when remaining characters are close to being the deciding ones
    const remaining = unfinished.length;

    if (remaining <= this.triggerThreshold && remaining > 0 && finishedCount > 0) {
      // Check if remaining characters are near the finish
      const nearFinish = unfinished.some(
        (c) => c.position.y < FINISH_Y + 20,
      );

      if (nearFinish) {
        this.active = true;
        this.targetScale = SLOW_MOTION_SCALE;
        this.recoveryDelay = 0;
      }
    }

    if (remaining <= 1 && this.active) {
      this.recoveryDelay += dt;
      if (this.recoveryDelay > 0.5) {
        this.active = false;
        this.targetScale = 1;
      }
    }

    // Smoothly interpolate time scale
    this.timeScale += (this.targetScale - this.timeScale) * SLOW_MOTION_LERP;
    if (Math.abs(this.timeScale - this.targetScale) < 0.01) {
      this.timeScale = this.targetScale;
    }

    return this.timeScale;
  }

  reset(): void {
    this.timeScale = 1;
    this.targetScale = 1;
    this.active = false;
    this.recoveryDelay = 0;
  }

  /** Returns unfinished characters closest to finish for camera targeting */
  getFocusTargets(characters: Character[]): Character[] {
    const unfinished = characters
      .filter((c) => !c.finished)
      .sort((a, b) => a.position.y - b.position.y);
    return unfinished.slice(0, 3);
  }
}
