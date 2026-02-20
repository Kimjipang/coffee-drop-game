import * as THREE from 'three';
import {
  ObstacleData,
  createPeg,
  createSpinner,
  createPlatform,
  createBumper,
  createFunnelWall,
  createMovingPlatform,
  createLauncher,
} from './Obstacle';
import {
  COURSE_WIDTH,
  COURSE_DEPTH,
  SECTION_PEGS_TOP,
  SECTION_PEGS_BOTTOM,
  SECTION_SPINNERS_TOP,
  SECTION_SPINNERS_BOTTOM,
  SECTION_PLATFORMS_TOP,
  SECTION_PLATFORMS_BOTTOM,
  SECTION_FUNNEL_TOP,
  SECTION_FUNNEL_BOTTOM,
  SECTION_FINAL_TOP,
  SECTION_FINAL_BOTTOM,
  FINISH_Y,
} from '../utils/constants';

export class Course {
  obstacles: ObstacleData[] = [];
  private group: THREE.Group;
  private elapsedTime = 0;

  constructor() {
    this.group = new THREE.Group();
  }

  build(scene: THREE.Scene): ObstacleData[] {
    this.obstacles = [];

    this.buildWalls();
    this.buildPegSection();
    this.buildSpinnerSection();
    this.buildPlatformSection();
    this.buildFunnelSection();
    this.buildFinalFunnel();
    this.buildFinishLine();

    scene.add(this.group);
    return this.obstacles;
  }

  private addObstacle(obs: ObstacleData): void {
    this.obstacles.push(obs);
    this.group.add(obs.mesh);
  }

  private buildWalls(): void {
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const halfW = COURSE_WIDTH / 2;
    const wallHeight = 120;

    // Left wall
    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(COURSE_DEPTH, wallHeight),
      wallMat,
    );
    leftWall.position.set(-halfW, 0, 0);
    leftWall.rotation.y = Math.PI / 2;
    this.group.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(
      new THREE.PlaneGeometry(COURSE_DEPTH, wallHeight),
      wallMat,
    );
    rightWall.position.set(halfW, 0, 0);
    rightWall.rotation.y = -Math.PI / 2;
    this.group.add(rightWall);

    // Back wall
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(COURSE_WIDTH, wallHeight),
      wallMat.clone(),
    );
    (backWall.material as THREE.MeshStandardMaterial).opacity = 0.15;
    backWall.position.set(0, 0, -COURSE_DEPTH / 2);
    this.group.add(backWall);
  }

  private buildPegSection(): void {
    const rows = 8;
    const yStep = (SECTION_PEGS_TOP - SECTION_PEGS_BOTTOM) / rows;
    const xRange = COURSE_WIDTH * 0.8;

    for (let row = 0; row < rows; row++) {
      const y = SECTION_PEGS_TOP - row * yStep;
      const cols = row % 2 === 0 ? 7 : 6;
      const offset = row % 2 === 0 ? 0 : xRange / 12;

      for (let col = 0; col < cols; col++) {
        const x = -xRange / 2 + offset + (col / (cols - 1 || 1)) * xRange;
        this.addObstacle(createPeg(x, y, 0, 0.35 + Math.random() * 0.15));
      }
    }
  }

  private buildSpinnerSection(): void {
    const spinners = [
      { x: -3, y: 22, len: 7, speed: 1.8 },
      { x: 4, y: 18, len: 8, speed: -1.5 },
      { x: -2, y: 14, len: 6, speed: 2.0 },
      { x: 3, y: 10, len: 7, speed: -1.7 },
      { x: 0, y: 7, len: 9, speed: 1.3 },
    ];

    for (const s of spinners) {
      this.addObstacle(createSpinner(s.x, s.y, 0, s.len, s.speed));
    }

    // Add some pegs between spinners
    const pegPositions = [
      [-7, 20], [7, 20], [-8, 16], [8, 16],
      [-7, 12], [7, 12], [-8, 8], [8, 8],
    ];
    for (const [x, y] of pegPositions) {
      this.addObstacle(createPeg(x, y, 0, 0.3));
    }
  }

  private buildPlatformSection(): void {
    const platforms = [
      { y: 3,    gapStart: -3,   gapEnd: 3,   rotation: -0.06 },
      { y: -2.5, gapStart: 1,    gapEnd: 7.5, rotation: -0.10 },
      { y: -8,   gapStart: -7.5, gapEnd: -1,  rotation: 0.10 },
      { y: -13,  gapStart: -1.5, gapEnd: 5,   rotation: -0.08 },
    ];

    for (const p of platforms) {
      this.addObstacle(
        createPlatform(0, p.y, 0, COURSE_WIDTH, p.gapStart, p.gapEnd, p.rotation),
      );
    }

    // Bumpers near platforms
    const bumperPositions: [number, number][] = [
      [-6, 0.5], [6, -5], [-5, -10.5],
    ];
    for (const [x, y] of bumperPositions) {
      this.addObstacle(createBumper(x, y, 0, 10));
    }
  }

  private buildFunnelSection(): void {
    // Wide funnel narrowing down
    const funnelLevels = [
      { y: -17, leftX: -7.5, rightX: 7.5, angle: 0.3 },
      { y: -24, leftX: -6, rightX: 6, angle: 0.25 },
      { y: -31, leftX: -5.5, rightX: 5.5, angle: 0.15 },
    ];

    for (const f of funnelLevels) {
      this.addObstacle(createFunnelWall(f.leftX, f.y, 0, 3, 5, f.angle));
      this.addObstacle(createFunnelWall(f.rightX, f.y, 0, 3, 5, -f.angle));
    }

    // Bumpers in funnel
    const bumpers: [number, number][] = [
      [-1.5, -20], [1.5, -27],
    ];
    for (const [x, y] of bumpers) {
      this.addObstacle(createBumper(x, y, 0, 10));
    }
  }

  private buildFinalFunnel(): void {
    // === Zone A: The Divergence (Y: -35 to -40) ===

    // 이동 플랫폼: 갭이 좌우로 움직여서 타이밍 요소
    this.addObstacle(createMovingPlatform(
      0, -36, 0,
      COURSE_WIDTH,
      -2, 2,
      1.5,
      4,
      0
    ));

    // Side launchers: 하향 대각선으로 변환
    this.addObstacle(createLauncher(-4, -38, 0, 15, Math.PI * 1.7));
    this.addObstacle(createLauncher(4, -38, 0, 15, Math.PI * 1.3));

    // === Zone B: The Gauntlet (Y: -41 to -46) ===

    // 이동 플랫폼: Zone A와 반대 위상
    this.addObstacle(createMovingPlatform(
      0, -43, 0,
      COURSE_WIDTH,
      -2.5, 2.5,
      2.0,
      3.5,
      Math.PI
    ));

    // 스피너: 느리고 짧은 막대
    this.addObstacle(createSpinner(0, -45, 0, 4, 1.8));

    // === Zone C: The Final Drop (Y: -47 to -50) ===

    // 중앙 하향 런처: 하향 가속 + 약간의 좌우 편향
    this.addObstacle(createLauncher(0, -47, 0, 12, Math.PI * 1.5));

    // 최종 범퍼: 마지막 역전 기회
    this.addObstacle(createBumper(-2.5, -49, 0, 15));
    this.addObstacle(createBumper(2.5, -49, 0, 15));
  }

  private buildFinishLine(): void {
    const lineGeo = new THREE.PlaneGeometry(COURSE_WIDTH, 0.3);
    const lineMat = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    const line = new THREE.Mesh(lineGeo, lineMat);
    line.position.set(0, FINISH_Y, 0);
    this.group.add(line);

    // Finish text marker posts
    const postGeo = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const leftPost = new THREE.Mesh(postGeo, postMat);
    leftPost.position.set(-COURSE_WIDTH / 2, FINISH_Y, 0);
    this.group.add(leftPost);
    const rightPost = new THREE.Mesh(postGeo, postMat);
    rightPost.position.set(COURSE_WIDTH / 2, FINISH_Y, 0);
    this.group.add(rightPost);
  }

  updateAnimations(dt: number): void {
    this.elapsedTime += dt;

    for (const obs of this.obstacles) {
      if (obs.type === 'spinner') {
        (obs.mesh as THREE.Group).rotation.z += obs.spinSpeed! * dt;
      }
      if (obs.type === 'moving_platform') {
        const offset = Math.sin(this.elapsedTime * obs.moveSpeed! + obs.moveOffset!) * obs.moveRange!;
        obs.mesh.position.x = obs.position.x + offset;
      }
    }
  }

  dispose(): void {
    this.elapsedTime = 0;
    this.group.parent?.remove(this.group);
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  }
}
