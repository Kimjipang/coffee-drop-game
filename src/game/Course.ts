import * as THREE from 'three';
import {
  ObstacleData,
  createPeg,
  createSpinner,
  createPlatform,
  createBumper,
  createFunnelWall,
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
      { y: 3, gapStart: -2, gapEnd: 0 },
      { y: 0, gapStart: 2, gapEnd: 5 },
      { y: -3, gapStart: -5, gapEnd: -2 },
      { y: -6, gapStart: 0, gapEnd: 3 },
      { y: -9, gapStart: -3, gapEnd: 0 },
      { y: -12, gapStart: 3, gapEnd: 6 },
    ];

    for (const p of platforms) {
      this.addObstacle(
        createPlatform(0, p.y, 0, COURSE_WIDTH, p.gapStart, p.gapEnd),
      );
    }

    // Bumpers near platforms
    const bumperPositions = [
      [-4, 1], [5, -2], [-6, -5], [4, -8], [-3, -11],
    ];
    for (const [x, y] of bumperPositions) {
      this.addObstacle(createBumper(x, y, 0, 15 + Math.random() * 10));
    }
  }

  private buildFunnelSection(): void {
    // Wide funnel narrowing down
    const funnelLevels = [
      { y: -18, leftX: -7, rightX: 7, angle: 0.4 },
      { y: -23, leftX: -5.5, rightX: 5.5, angle: 0.35 },
      { y: -28, leftX: -4, rightX: 4, angle: 0.3 },
      { y: -32, leftX: -3, rightX: 3, angle: 0.25 },
    ];

    for (const f of funnelLevels) {
      this.addObstacle(createFunnelWall(f.leftX, f.y, 0, 3, 5, f.angle));
      this.addObstacle(createFunnelWall(f.rightX, f.y, 0, 3, 5, -f.angle));
    }

    // Bumpers in funnel
    const bumpers = [
      [0, -17], [-2, -21], [2, -25], [0, -29], [-1, -33], [1, -31],
    ];
    for (const [x, y] of bumpers) {
      this.addObstacle(createBumper(x, y, 0, 12 + Math.random() * 8));
    }
  }

  private buildFinalFunnel(): void {
    // Very narrow final funnel
    const leftWall = createFunnelWall(-3, -42, 0, 2, 14, 0.15);
    const rightWall = createFunnelWall(3, -42, 0, 2, 14, -0.15);
    this.addObstacle(leftWall);
    this.addObstacle(rightWall);

    // Extra pegs near the narrow exit
    this.addObstacle(createPeg(-1, -38, 0, 0.25));
    this.addObstacle(createPeg(1, -38, 0, 0.25));
    this.addObstacle(createPeg(0, -40, 0, 0.25));
    this.addObstacle(createPeg(-0.8, -43, 0, 0.25));
    this.addObstacle(createPeg(0.8, -43, 0, 0.25));

    // Final narrow gap
    this.addObstacle(
      createPlatform(0, -48, 0, COURSE_WIDTH, -1.5, 1.5),
    );
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

  updateSpinners(dt: number): void {
    for (const obs of this.obstacles) {
      if (obs.type === 'spinner') {
        (obs.mesh as THREE.Group).rotation.z += obs.spinSpeed! * dt;
      }
    }
  }

  dispose(): void {
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
