import * as THREE from 'three';
import { World } from './World';
import { Physics } from './Physics';
import { Character } from './Character';
import { Course } from './Course';
import { SlowMotion } from './SlowMotion';
import { CameraManager, CameraMode } from '../camera/CameraManager';
import { Trail } from '../effects/Trail';
import { Confetti } from '../effects/Confetti';
import { Vignette } from '../effects/Vignette';
import { GameHUD } from '../ui/GameHUD';
import { ResultScreen } from '../ui/ResultScreen';
import { getColor } from '../utils/colors';
import { START_Y, COURSE_WIDTH, FINISH_Y } from '../utils/constants';

export type GameState = 'countdown' | 'running' | 'finished';

export class Game {
  private world: World;
  private physics: Physics;
  private course: Course;
  private slowMotion: SlowMotion;
  private cameraManager: CameraManager;
  private trail: Trail;
  private confetti: Confetti;
  private vignette: Vignette;
  private hud: GameHUD;
  private characters: Character[] = [];
  private state: GameState = 'countdown';
  private finishCount = 0;
  private winRank: number;
  private names: string[];
  private animId = 0;
  private lastTime = 0;
  private labelContainer: HTMLDivElement;
  private onRestart: () => void;

  constructor(
    container: HTMLElement,
    names: string[],
    winRank: number,
    onRestart: () => void,
  ) {
    this.names = names;
    this.winRank = winRank;
    this.onRestart = onRestart;

    // World
    this.world = new World(container);

    // Label container
    this.labelContainer = document.createElement('div');
    this.labelContainer.style.cssText =
      'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:hidden;z-index:5;';
    container.appendChild(this.labelContainer);

    // Physics
    this.physics = new Physics();

    // Course
    this.course = new Course();
    const obstacles = this.course.build(this.world.scene);
    this.physics.setObstacles(obstacles);

    // Characters
    this.createCharacters();

    // Camera
    this.cameraManager = new CameraManager();
    this.cameraManager.setCharacters(this.characters);

    // Effects
    this.trail = new Trail(this.world.scene);
    this.characters.forEach((c) => this.trail.addCharacter(c));
    this.confetti = new Confetti(this.world.scene);
    this.vignette = new Vignette(container);

    // Slow motion
    this.slowMotion = new SlowMotion(this.characters.length);

    // HUD
    this.hud = new GameHUD();
    this.hud.show((mode) => {
      this.cameraManager.setMode(mode);
    });

    // Keyboard shortcuts
    this.setupKeyboard();

    // Click to select character
    this.world.renderer.domElement.addEventListener('click', this.onClick);

    // Start countdown
    this.startCountdown();
  }

  private createCharacters(): void {
    const count = this.names.length;
    const spacing = Math.min(2, (COURSE_WIDTH - 2) / count);
    const startX = -(count - 1) * spacing * 0.5;

    for (let i = 0; i < count; i++) {
      const x = startX + i * spacing + (Math.random() - 0.5) * 0.3;
      const char = new Character(this.names[i], getColor(i), x, START_Y);
      char.createLabel(this.labelContainer);
      this.world.scene.add(char.mesh);
      this.characters.push(char);
    }
  }

  private setupKeyboard(): void {
    window.addEventListener('keydown', this.onKeyDown);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === '1') {
      this.cameraManager.setMode(CameraMode.FIRST_PERSON);
      this.hud.setCameraMode(CameraMode.FIRST_PERSON);
    } else if (e.key === '2') {
      this.cameraManager.setMode(CameraMode.THIRD_PERSON);
      this.hud.setCameraMode(CameraMode.THIRD_PERSON);
    } else if (e.key === '3') {
      this.cameraManager.setMode(CameraMode.SIDE_VIEW);
      this.hud.setCameraMode(CameraMode.SIDE_VIEW);
    }
  };

  private onClick = (e: MouseEvent): void => {
    if (this.cameraManager.mode === CameraMode.SIDE_VIEW) return;
    const picked = this.cameraManager.pickCharacter(e, this.world.renderer);
    if (picked) {
      this.cameraManager.trackCharacter(picked);
    }
  };

  private async startCountdown(): Promise<void> {
    this.state = 'countdown';

    // Freeze characters
    this.characters.forEach((c) => {
      c.velocity.set(0, 0, 0);
    });

    const counts = [3, 2, 1];
    for (const num of counts) {
      this.hud.showCountdown(num);
      await this.delay(1000);
    }
    this.hud.showCountdown('GO!');
    await this.delay(500);
    this.hud.hideCountdown();

    // Give random initial velocities
    this.characters.forEach((c) => {
      c.velocity.set(
        (Math.random() - 0.5) * 4,
        -2 - Math.random() * 3,
        (Math.random() - 0.5) * 0.5,
      );
    });

    this.state = 'running';
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  private gameLoop = (time: number): void => {
    this.animId = requestAnimationFrame(this.gameLoop);

    const rawDt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;

    if (this.state !== 'running') return;

    // Slow motion
    const timeScale = this.slowMotion.update(this.characters, rawDt);
    const dt = rawDt * timeScale;

    // Physics
    this.physics.update(this.characters, dt, rawDt, this.slowMotion.active, (char) => this.onCharacterFinish(char));

    // Course spinners
    this.course.updateAnimations(dt);

    // Camera
    if (this.slowMotion.active) {
      const targets = this.slowMotion.getFocusTargets(this.characters);
      this.cameraManager.focusOnTargets(targets);
    }
    this.cameraManager.update();

    // Effects
    this.trail.update();
    this.confetti.update(rawDt);
    this.vignette.setActive(this.slowMotion.active);
    this.vignette.update(rawDt);

    // HUD
    this.hud.updateRanks(this.characters, this.winRank);
    this.hud.setSlowMotion(this.slowMotion.active);

    // Labels
    this.characters.forEach((c) => {
      c.updateLabel(this.cameraManager.activeCamera, this.world.renderer);
    });

    // Render
    this.world.render(this.cameraManager.activeCamera);
  };

  private onCharacterFinish(char: Character): void {
    this.finishCount++;
    char.finishRank = this.finishCount;

    // Emit confetti at finish
    const confettiPos = new THREE.Vector3(char.position.x, FINISH_Y, char.position.z);
    this.confetti.emit(confettiPos, 50);

    // Check if all finished
    if (this.finishCount >= this.characters.length) {
      this.onAllFinished();
    }
  }

  private onAllFinished(): void {
    this.state = 'finished';
    this.slowMotion.reset();
    this.vignette.setActive(false);
    this.hud.setSlowMotion(false);

    // Big confetti for winner
    const winner = this.characters.find((c) => c.finishRank === this.winRank);
    if (winner) {
      this.confetti.emit(new THREE.Vector3(0, FINISH_Y + 5, 0), 300);
    }

    // Show result after a short delay
    setTimeout(() => {
      this.hud.hide();
      const result = new ResultScreen();
      result.show(this.characters, this.winRank, () => {
        this.dispose();
        this.onRestart();
      });
    }, 1500);
  }

  dispose(): void {
    cancelAnimationFrame(this.animId);
    window.removeEventListener('keydown', this.onKeyDown);
    this.world.renderer.domElement.removeEventListener('click', this.onClick);

    this.characters.forEach((c) => {
      this.world.scene.remove(c.mesh);
      c.removeLabel();
    });

    this.trail.clear();
    this.confetti.clear();
    this.vignette.dispose();
    this.course.dispose();
    this.cameraManager.dispose();
    this.world.dispose();

    this.labelContainer.remove();

    // Remove canvas
    this.world.renderer.domElement.remove();
  }
}
