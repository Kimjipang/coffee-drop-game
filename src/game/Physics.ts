import * as THREE from 'three';
import { Character } from './Character';
import { ObstacleData, ObstacleType } from './Obstacle';
import {
  GRAVITY,
  RESTITUTION,
  FRICTION,
  COURSE_WIDTH,
  COURSE_DEPTH,
  MAX_VELOCITY,
  FINISH_Y,
  STUCK_CHECK_INTERVAL,
  STUCK_THRESHOLD_DIST,
  STUCK_GENTLE_TIME,
  STUCK_FORCE_TIME,
  STUCK_NUDGE_FORCE,
  STUCK_PUSH_FORCE,
  PLATFORM_GAP_SEEK_FORCE,
  LAUNCHER_RADIUS,
} from '../utils/constants';

export class Physics {
  private obstacles: ObstacleData[] = [];
  private tempVec = new THREE.Vector3();
  private elapsedTime = 0;
  private stuckTrackers: Map<Character, {
    lastCheckTime: number;
    lastCheckPos: THREE.Vector3;
    stuckDuration: number;
  }> = new Map();

  setObstacles(obstacles: ObstacleData[]): void {
    this.obstacles = obstacles;
  }

  update(
    characters: Character[],
    dt: number,
    rawDt: number,
    isSlowMotion: boolean,
    onFinish: (c: Character) => void,
  ): void {
    this.elapsedTime += dt;

    for (const char of characters) {
      if (char.finished) continue;
      this.applyGravity(char, dt);
      this.integratePosition(char, dt);
      this.checkObstacleCollisions(char);
      this.checkCharacterCollisions(char, characters);
      this.checkBounds(char);
      this.clampVelocity(char);
      this.checkStuck(char, rawDt, isSlowMotion);

      if (char.position.y <= FINISH_Y) {
        char.finished = true;
        char.finishTime = performance.now();
        onFinish(char);
        this.stuckTrackers.delete(char);
      }
    }
  }

  private applyGravity(char: Character, dt: number): void {
    char.velocity.y -= GRAVITY * dt;
  }

  private integratePosition(char: Character, dt: number): void {
    char.position.x += char.velocity.x * dt;
    char.position.y += char.velocity.y * dt;
    char.position.z += char.velocity.z * dt;
  }

  private checkObstacleCollisions(char: Character): void {
    for (const obs of this.obstacles) {
      switch (obs.type) {
        case ObstacleType.PEG:
          this.collidePeg(char, obs);
          break;
        case ObstacleType.SPINNER:
          this.collideSpinner(char, obs);
          break;
        case ObstacleType.PLATFORM:
          this.collidePlatform(char, obs);
          break;
        case ObstacleType.BUMPER:
          this.collideBumper(char, obs);
          break;
        case ObstacleType.FUNNEL_WALL:
          this.collideFunnelWall(char, obs);
          break;
        case ObstacleType.MOVING_PLATFORM:
          this.collideMovingPlatform(char, obs);
          break;
        case ObstacleType.LAUNCHER:
          this.collideLauncher(char, obs);
          break;
      }
    }
  }

  private collidePeg(char: Character, obs: ObstacleData): void {
    const r = obs.radius! + char.radius;
    const dx = char.position.x - obs.position.x;
    const dy = char.position.y - obs.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < r && dist > 0.001) {
      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = r - dist;
      char.position.x += nx * overlap;
      char.position.y += ny * overlap;

      const dot = char.velocity.x * nx + char.velocity.y * ny;
      if (dot < 0) {
        const randomFactor = 0.85 + Math.random() * 0.3;
        char.velocity.x -= (1 + RESTITUTION * randomFactor) * dot * nx;
        char.velocity.y -= (1 + RESTITUTION * randomFactor) * dot * ny;
        // Add slight randomness
        char.velocity.x += (Math.random() - 0.5) * 2;
      }
    }
  }

  private collideSpinner(char: Character, obs: ObstacleData): void {
    const mesh = obs.mesh as THREE.Group;
    const angle = mesh.rotation.z;
    const halfLen = obs.length! / 2;
    const armThickness = 0.3;

    // Transform character position to spinner local space
    const localX = char.position.x - obs.position.x;
    const localY = char.position.y - obs.position.y;

    const cosA = Math.cos(-angle);
    const sinA = Math.sin(-angle);
    const rotX = localX * cosA - localY * sinA;
    const rotY = localX * sinA + localY * cosA;

    // Check collision with arm (box)
    const closestX = Math.max(-halfLen, Math.min(halfLen, rotX));
    const closestY = Math.max(-armThickness, Math.min(armThickness, rotY));
    const dx = rotX - closestX;
    const dy = rotY - closestY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < char.radius && dist > 0.001) {
      // Push out
      const nx = dx / dist;
      const ny = dy / dist;

      // Transform normal back to world space
      const cosAi = Math.cos(angle);
      const sinAi = Math.sin(angle);
      const worldNx = nx * cosAi - ny * sinAi;
      const worldNy = nx * sinAi + ny * cosAi;

      const overlap = char.radius - dist;
      char.position.x += worldNx * overlap * 1.1;
      char.position.y += worldNy * overlap * 1.1;

      const dot = char.velocity.x * worldNx + char.velocity.y * worldNy;
      if (dot < 0) {
        char.velocity.x -= (1 + RESTITUTION) * dot * worldNx;
        char.velocity.y -= (1 + RESTITUTION) * dot * worldNy;

        // Spinner imparts rotational velocity
        const spinDir = obs.spinSpeed! > 0 ? 1 : -1;
        char.velocity.x += spinDir * Math.abs(obs.spinSpeed!) * 3 * (Math.random() * 0.5 + 0.5);
      }
    }
  }

  private collidePlatform(char: Character, obs: ObstacleData): void {
    const halfW = obs.width! / 2;
    const halfH = obs.height! / 2;
    const halfD = obs.depth! / 2;

    const relX = char.position.x - obs.position.x;
    const relY = char.position.y - obs.position.y;
    const relZ = char.position.z - obs.position.z;

    // Check if in gap
    if (relX >= obs.gapStart! && relX <= obs.gapEnd!) {
      return; // In the gap, no collision
    }

    // Check AABB collision
    if (
      Math.abs(relX) < halfW + char.radius &&
      Math.abs(relY) < halfH + char.radius &&
      Math.abs(relZ) < halfD + char.radius
    ) {
      // Determine collision face
      const overlapX = halfW + char.radius - Math.abs(relX);
      const overlapY = halfH + char.radius - Math.abs(relY);

      if (overlapY < overlapX) {
        // Vertical collision
        const sign = relY > 0 ? 1 : -1;
        char.position.y = obs.position.y + sign * (halfH + char.radius);
        if (sign > 0 && char.velocity.y < 0) {
          char.velocity.y *= -RESTITUTION * (0.7 + Math.random() * 0.3);
          char.velocity.x *= FRICTION;
          // Push towards gap
          const gapCenter = (obs.gapStart! + obs.gapEnd!) / 2 + obs.position.x;
          char.velocity.x += (gapCenter - char.position.x) * PLATFORM_GAP_SEEK_FORCE;
          char.velocity.x += (Math.random() - 0.5) * 3;
        } else if (sign < 0 && char.velocity.y > 0) {
          char.velocity.y *= -RESTITUTION;
        }
      } else {
        // Horizontal collision
        const sign = relX > 0 ? 1 : -1;
        char.position.x = obs.position.x + sign * (halfW + char.radius);
        char.velocity.x *= -RESTITUTION;
      }
    }
  }

  private collideBumper(char: Character, obs: ObstacleData): void {
    const r = obs.radius! + char.radius;
    const dx = char.position.x - obs.position.x;
    const dy = char.position.y - obs.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < r && dist > 0.001) {
      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = r - dist;
      char.position.x += nx * overlap;
      char.position.y += ny * overlap;

      // Strong bounce
      const force = obs.bounceForce! * (0.8 + Math.random() * 0.4);
      char.velocity.x = nx * force + (Math.random() - 0.5) * 5;
      char.velocity.y = ny * force;
    }
  }

  private collideFunnelWall(char: Character, obs: ObstacleData): void {
    const mesh = obs.mesh as THREE.Mesh;
    const halfW = obs.width! / 2;
    const halfH = obs.height! / 2;
    const rotZ = mesh.rotation.z;

    // Transform to wall local space
    const dx = char.position.x - obs.position.x;
    const dy = char.position.y - obs.position.y;
    const cosA = Math.cos(-rotZ);
    const sinA = Math.sin(-rotZ);
    const localX = dx * cosA - dy * sinA;
    const localY = dx * sinA + dy * cosA;

    // Check if within wall bounds
    if (Math.abs(localX) < halfW && Math.abs(localY) < halfH + char.radius) {
      const wallDist = Math.abs(localY) - halfH;
      if (wallDist < char.radius) {
        // Push out using wall normal
        const normal = obs.normal!;
        const side = localY > 0 ? 1 : -1;
        const pushDist = char.radius - wallDist;

        char.position.x += normal.x * pushDist * side;
        char.position.y += normal.y * pushDist * side;

        // Reflect velocity
        const vDotN = char.velocity.x * normal.x * side + char.velocity.y * normal.y * side;
        if (vDotN < 0) {
          char.velocity.x -= (1 + RESTITUTION * 0.5) * vDotN * normal.x * side;
          char.velocity.y -= (1 + RESTITUTION * 0.5) * vDotN * normal.y * side;
        }
      }
    }
  }

  private collideMovingPlatform(char: Character, obs: ObstacleData): void {
    const offset = Math.sin(this.elapsedTime * obs.moveSpeed! + obs.moveOffset!) * obs.moveRange!;
    const currentBaseX = obs.position.x + offset;

    const halfW = obs.width! / 2;
    const halfH = obs.height! / 2;
    const halfD = obs.depth! / 2;

    const relX = char.position.x - currentBaseX;
    const relY = char.position.y - obs.position.y;
    const relZ = char.position.z - obs.position.z;

    if (relX >= obs.gapStart! && relX <= obs.gapEnd!) {
      return;
    }

    if (
      Math.abs(relX) < halfW + char.radius &&
      Math.abs(relY) < halfH + char.radius &&
      Math.abs(relZ) < halfD + char.radius
    ) {
      const overlapX = halfW + char.radius - Math.abs(relX);
      const overlapY = halfH + char.radius - Math.abs(relY);

      if (overlapY < overlapX) {
        const sign = relY > 0 ? 1 : -1;
        char.position.y = obs.position.y + sign * (halfH + char.radius);
        if (sign > 0 && char.velocity.y < 0) {
          char.velocity.y *= -RESTITUTION * (0.7 + Math.random() * 0.3);
          char.velocity.x *= FRICTION;
          const gapCenter = (obs.gapStart! + obs.gapEnd!) / 2 + currentBaseX;
          char.velocity.x += (gapCenter - char.position.x) * PLATFORM_GAP_SEEK_FORCE;
          char.velocity.x += (Math.random() - 0.5) * 3;
        } else if (sign < 0 && char.velocity.y > 0) {
          char.velocity.y *= -RESTITUTION;
        }
      } else {
        const sign = relX > 0 ? 1 : -1;
        char.position.x = currentBaseX + sign * (halfW + char.radius);
        char.velocity.x *= -RESTITUTION;
      }
    }
  }

  private collideLauncher(char: Character, obs: ObstacleData): void {
    const r = LAUNCHER_RADIUS + char.radius;
    const dx = char.position.x - obs.position.x;
    const dy = char.position.y - obs.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < r && dist > 0.001) {
      if (this.elapsedTime - obs.lastLaunchTime! >= obs.cooldown!) {
        const force = obs.launchForce!;
        const angle = obs.launchAngle!;
        char.velocity.x = Math.cos(angle) * force + (Math.random() - 0.5) * force * 0.2;
        char.velocity.y = Math.sin(angle) * force + (Math.random() - 0.5) * force * 0.1;

        obs.lastLaunchTime = this.elapsedTime;

        const pushDist = r - dist + 0.5;
        if (dist > 0.001) {
          char.position.x += (dx / dist) * pushDist;
          char.position.y += (dy / dist) * pushDist;
        }
      } else {
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = r - dist;
        char.position.x += nx * overlap;
        char.position.y += ny * overlap;
      }
    }
  }

  private checkCharacterCollisions(char: Character, characters: Character[]): void {
    for (const other of characters) {
      if (other === char || other.finished) continue;
      const dx = char.position.x - other.position.x;
      const dy = char.position.y - other.position.y;
      const dz = char.position.z - other.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const minDist = char.radius + other.radius;

      if (dist < minDist && dist > 0.001) {
        const nx = dx / dist;
        const ny = dy / dist;
        const nz = dz / dist;
        const overlap = minDist - dist;

        // Push apart
        char.position.x += nx * overlap * 0.5;
        char.position.y += ny * overlap * 0.5;
        char.position.z += nz * overlap * 0.5;
        other.position.x -= nx * overlap * 0.5;
        other.position.y -= ny * overlap * 0.5;
        other.position.z -= nz * overlap * 0.5;

        // Exchange velocity along collision normal
        const relVx = char.velocity.x - other.velocity.x;
        const relVy = char.velocity.y - other.velocity.y;
        const relVz = char.velocity.z - other.velocity.z;
        const relVDot = relVx * nx + relVy * ny + relVz * nz;

        if (relVDot < 0) {
          const impulse = relVDot * RESTITUTION;
          char.velocity.x -= impulse * nx;
          char.velocity.y -= impulse * ny;
          char.velocity.z -= impulse * nz;
          other.velocity.x += impulse * nx;
          other.velocity.y += impulse * ny;
          other.velocity.z += impulse * nz;
        }
      }
    }
  }

  private checkBounds(char: Character): void {
    const halfW = COURSE_WIDTH / 2;
    const halfD = COURSE_DEPTH / 2;

    if (char.position.x < -halfW + char.radius) {
      char.position.x = -halfW + char.radius;
      char.velocity.x = Math.abs(char.velocity.x) * RESTITUTION;
    }
    if (char.position.x > halfW - char.radius) {
      char.position.x = halfW - char.radius;
      char.velocity.x = -Math.abs(char.velocity.x) * RESTITUTION;
    }
    if (char.position.z < -halfD + char.radius) {
      char.position.z = -halfD + char.radius;
      char.velocity.z = Math.abs(char.velocity.z) * RESTITUTION;
    }
    if (char.position.z > halfD - char.radius) {
      char.position.z = halfD - char.radius;
      char.velocity.z = -Math.abs(char.velocity.z) * RESTITUTION;
    }
  }

  private clampVelocity(char: Character): void {
    const speed = char.velocity.length();
    if (speed > MAX_VELOCITY) {
      char.velocity.multiplyScalar(MAX_VELOCITY / speed);
    }
    // Dampen Z velocity to keep things mostly 2D
    char.velocity.z *= 0.95;
  }

  private checkStuck(char: Character, rawDt: number, isSlowMotion: boolean): void {
    if (!this.stuckTrackers.has(char)) {
      this.stuckTrackers.set(char, {
        lastCheckTime: 0,
        lastCheckPos: char.position.clone(),
        stuckDuration: 0,
      });
    }

    const tracker = this.stuckTrackers.get(char)!;

    if (isSlowMotion) {
      tracker.stuckDuration = 0;
      tracker.lastCheckTime = 0;
      tracker.lastCheckPos.copy(char.position);
      return;
    }

    tracker.lastCheckTime += rawDt;

    if (tracker.lastCheckTime >= STUCK_CHECK_INTERVAL) {
      const dist = char.position.distanceTo(tracker.lastCheckPos);

      if (dist < STUCK_THRESHOLD_DIST) {
        tracker.stuckDuration += tracker.lastCheckTime;
      } else {
        tracker.stuckDuration = 0;
      }

      tracker.lastCheckPos.copy(char.position);
      tracker.lastCheckTime = 0;

      if (tracker.stuckDuration >= STUCK_FORCE_TIME) {
        char.velocity.x += (Math.random() - 0.5) * 2 * STUCK_PUSH_FORCE;
        char.velocity.y -= STUCK_PUSH_FORCE;
        char.position.y += 0.5;
        tracker.stuckDuration = 0;
      } else if (tracker.stuckDuration >= STUCK_GENTLE_TIME) {
        char.velocity.x += (Math.random() - 0.5) * 2 * STUCK_NUDGE_FORCE;
        char.velocity.y -= STUCK_NUDGE_FORCE * 0.5;
      }
    }
  }
}
