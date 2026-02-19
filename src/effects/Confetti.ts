import * as THREE from 'three';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  rotSpeed: THREE.Vector3;
  life: number;
}

export class Confetti {
  private particles: Particle[] = [];
  private scene: THREE.Scene;
  private active = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  emit(position: THREE.Vector3, count = 200): void {
    this.active = true;
    const colors = [0xff4757, 0x2ed573, 0x1e90ff, 0xffa502, 0xa55eea, 0xff6b81, 0xf7b731];

    for (let i = 0; i < count; i++) {
      const isFlat = Math.random() > 0.3;
      const geo = isFlat
        ? new THREE.PlaneGeometry(0.3 + Math.random() * 0.4, 0.15 + Math.random() * 0.2)
        : new THREE.BoxGeometry(0.15, 0.15, 0.15);

      const mat = new THREE.MeshBasicMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);
      mesh.position.x += (Math.random() - 0.5) * 5;
      mesh.position.y += Math.random() * 3;
      mesh.position.z += (Math.random() - 0.5) * 5;

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        Math.random() * 25 + 10,
        (Math.random() - 0.5) * 20,
      );

      const rotSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        rotSpeed,
        life: 3 + Math.random() * 2,
      });
    }
  }

  update(dt: number): void {
    if (!this.active) return;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
        continue;
      }

      p.velocity.y -= 15 * dt; // gravity
      p.velocity.x *= 0.99;
      p.velocity.z *= 0.99;

      p.mesh.position.x += p.velocity.x * dt;
      p.mesh.position.y += p.velocity.y * dt;
      p.mesh.position.z += p.velocity.z * dt;

      p.mesh.rotation.x += p.rotSpeed.x * dt;
      p.mesh.rotation.y += p.rotSpeed.y * dt;
      p.mesh.rotation.z += p.rotSpeed.z * dt;

      // Fade out in last second
      if (p.life < 1) {
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = p.life;
      }
    }

    if (this.particles.length === 0) {
      this.active = false;
    }
  }

  clear(): void {
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.Material).dispose();
    }
    this.particles = [];
    this.active = false;
  }
}
