import * as THREE from 'three';

export enum ObstacleType {
  PEG = 'peg',
  SPINNER = 'spinner',
  PLATFORM = 'platform',
  BUMPER = 'bumper',
  FUNNEL_WALL = 'funnel_wall',
  MOVING_PLATFORM = 'moving_platform',
  LAUNCHER = 'launcher',
}

export interface ObstacleData {
  type: ObstacleType;
  mesh: THREE.Object3D;
  position: THREE.Vector3;
  // For pegs
  radius?: number;
  // For platforms
  width?: number;
  height?: number;
  depth?: number;
  gapStart?: number;
  gapEnd?: number;
  // For spinners
  length?: number;
  spinSpeed?: number;
  // For bumpers
  bounceForce?: number;
  // For funnel walls
  normal?: THREE.Vector3;
  // For moving platforms
  moveSpeed?: number;
  moveRange?: number;    // horizontal oscillation amplitude
  moveOffset?: number;   // phase offset so platforms desync
  // For launchers
  launchForce?: number;
  launchAngle?: number;  // radians, standard math convention (0=right, PI/2=up)
  cooldown?: number;     // seconds between activations
  lastLaunchTime?: number;  // accumulated elapsed time of last launch
}

export function createPeg(x: number, y: number, z: number, radius = 0.4): ObstacleData {
  const geometry = new THREE.CylinderGeometry(radius, radius, 3, 16);
  const material = new THREE.MeshStandardMaterial({
    color: 0x95a5a6,
    metalness: 0.8,
    roughness: 0.2,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.rotation.x = Math.PI / 2;

  return {
    type: ObstacleType.PEG,
    mesh,
    position: new THREE.Vector3(x, y, z),
    radius,
  };
}

export function createSpinner(x: number, y: number, z: number, length = 6, speed = 1.5): ObstacleData {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  // Arm
  const armGeo = new THREE.BoxGeometry(length, 0.3, 0.8);
  const armMat = new THREE.MeshStandardMaterial({
    color: 0xe74c3c,
    metalness: 0.6,
    roughness: 0.3,
  });
  const arm = new THREE.Mesh(armGeo, armMat);
  group.add(arm);

  // Center hub
  const hubGeo = new THREE.CylinderGeometry(0.4, 0.4, 1, 16);
  const hubMat = new THREE.MeshStandardMaterial({
    color: 0x7f8c8d,
    metalness: 0.9,
    roughness: 0.1,
  });
  const hub = new THREE.Mesh(hubGeo, hubMat);
  hub.rotation.x = Math.PI / 2;
  group.add(hub);

  return {
    type: ObstacleType.SPINNER,
    mesh: group,
    position: new THREE.Vector3(x, y, z),
    length,
    spinSpeed: speed,
  };
}

export function createPlatform(
  x: number,
  y: number,
  z: number,
  width: number,
  gapStart: number,
  gapEnd: number,
): ObstacleData {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const platformHeight = 0.4;
  const platformDepth = 3;
  const mat = new THREE.MeshStandardMaterial({
    color: 0x34495e,
    metalness: 0.4,
    roughness: 0.6,
    transparent: true,
    opacity: 0.9,
  });

  // Left part
  const leftWidth = gapStart - (-width / 2);
  if (leftWidth > 0.1) {
    const leftGeo = new THREE.BoxGeometry(leftWidth, platformHeight, platformDepth);
    const leftMesh = new THREE.Mesh(leftGeo, mat);
    leftMesh.position.set(-width / 2 + leftWidth / 2, 0, 0);
    group.add(leftMesh);
  }

  // Right part
  const rightWidth = width / 2 - gapEnd;
  if (rightWidth > 0.1) {
    const rightGeo = new THREE.BoxGeometry(rightWidth, platformHeight, platformDepth);
    const rightMesh = new THREE.Mesh(rightGeo, mat);
    rightMesh.position.set(gapEnd + rightWidth / 2, 0, 0);
    group.add(rightMesh);
  }

  return {
    type: ObstacleType.PLATFORM,
    mesh: group,
    position: new THREE.Vector3(x, y, z),
    width,
    height: platformHeight,
    depth: platformDepth,
    gapStart,
    gapEnd,
  };
}

export function createBumper(x: number, y: number, z: number, force = 20): ObstacleData {
  const geometry = new THREE.SphereGeometry(0.6, 16, 16);
  const material = new THREE.MeshStandardMaterial({
    color: 0xf39c12,
    emissive: 0xf39c12,
    emissiveIntensity: 0.3,
    metalness: 0.5,
    roughness: 0.3,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);

  return {
    type: ObstacleType.BUMPER,
    mesh,
    position: new THREE.Vector3(x, y, z),
    radius: 0.6,
    bounceForce: force,
  };
}

export function createFunnelWall(
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
  rotZ: number,
): ObstacleData {
  const geometry = new THREE.BoxGeometry(width, height, 3);
  const material = new THREE.MeshStandardMaterial({
    color: 0x2c3e50,
    metalness: 0.3,
    roughness: 0.7,
    transparent: true,
    opacity: 0.85,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.rotation.z = rotZ;

  // Calculate normal from rotation
  const normal = new THREE.Vector3(-Math.sin(rotZ), Math.cos(rotZ), 0).normalize();

  return {
    type: ObstacleType.FUNNEL_WALL,
    mesh,
    position: new THREE.Vector3(x, y, z),
    width,
    height,
    depth: 3,
    normal,
  };
}

export function createMovingPlatform(
  x: number,
  y: number,
  z: number,
  width: number,
  gapStart: number,
  gapEnd: number,
  moveSpeed: number,
  moveRange: number,
  moveOffset: number,
): ObstacleData {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const platformHeight = 0.4;
  const platformDepth = 3;
  const mat = new THREE.MeshStandardMaterial({
    color: 0xe67e22,
    metalness: 0.5,
    roughness: 0.4,
    emissive: 0xe67e22,
    emissiveIntensity: 0.15,
    transparent: true,
    opacity: 0.9,
  });

  // Left part (from left edge of platform to gap start)
  const leftWidth = gapStart - (-width / 2);
  if (leftWidth > 0.1) {
    const leftGeo = new THREE.BoxGeometry(leftWidth, platformHeight, platformDepth);
    const leftMesh = new THREE.Mesh(leftGeo, mat);
    leftMesh.position.set(-width / 2 + leftWidth / 2, 0, 0);
    group.add(leftMesh);
  }

  // Right part (from gap end to right edge of platform)
  const rightWidth = width / 2 - gapEnd;
  if (rightWidth > 0.1) {
    const rightGeo = new THREE.BoxGeometry(rightWidth, platformHeight, platformDepth);
    const rightMesh = new THREE.Mesh(rightGeo, mat);
    rightMesh.position.set(gapEnd + rightWidth / 2, 0, 0);
    group.add(rightMesh);
  }

  return {
    type: ObstacleType.MOVING_PLATFORM,
    mesh: group,
    position: new THREE.Vector3(x, y, z),
    width,
    height: platformHeight,
    depth: platformDepth,
    gapStart,
    gapEnd,
    moveSpeed,
    moveRange,
    moveOffset,
  };
}

export function createLauncher(
  x: number,
  y: number,
  z: number,
  force: number,
  angle: number,
  cooldown = 1.5,
): ObstacleData {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  // Base cylinder
  const baseGeo = new THREE.CylinderGeometry(0.8, 1.0, 0.5, 16);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xc0392b,
    metalness: 0.6,
    roughness: 0.3,
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.rotation.x = Math.PI / 2;
  group.add(base);

  // Direction cone (points in launch direction)
  const coneGeo = new THREE.ConeGeometry(0.5, 1.2, 12);
  const coneMat = new THREE.MeshStandardMaterial({
    color: 0xe74c3c,
    emissive: 0xe74c3c,
    emissiveIntensity: 0.4,
    metalness: 0.4,
    roughness: 0.3,
  });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  // Rotate cone to point in launch direction (angle is in standard math convention)
  // ConeGeometry points up (+Y) by default, so rotate to align with angle
  cone.rotation.z = angle - Math.PI / 2;
  cone.position.set(
    Math.cos(angle) * 0.6,
    Math.sin(angle) * 0.6,
    0,
  );
  group.add(cone);

  // Glow ring
  const ringGeo = new THREE.TorusGeometry(0.9, 0.08, 8, 24);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xff6b6b,
    emissive: 0xff6b6b,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.7,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  group.add(ring);

  return {
    type: ObstacleType.LAUNCHER,
    mesh: group,
    position: new THREE.Vector3(x, y, z),
    radius: 1.0,
    launchForce: force,
    launchAngle: angle,
    cooldown,
    lastLaunchTime: 0,  // CRITICAL: initialized to 0, not undefined
  };
}
