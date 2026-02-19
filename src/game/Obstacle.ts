import * as THREE from 'three';

export enum ObstacleType {
  PEG = 'peg',
  SPINNER = 'spinner',
  PLATFORM = 'platform',
  BUMPER = 'bumper',
  FUNNEL_WALL = 'funnel_wall',
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
