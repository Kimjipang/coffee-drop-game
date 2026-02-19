import * as THREE from 'three';

export class World {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();

    // Gradient background
    this.scene.background = new THREE.Color(0x0f0c29);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0x404060, 1.5);
    this.scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, 2);
    dir.position.set(10, 30, 20);
    dir.castShadow = true;
    dir.shadow.mapSize.width = 1024;
    dir.shadow.mapSize.height = 1024;
    dir.shadow.camera.near = 0.1;
    dir.shadow.camera.far = 150;
    dir.shadow.camera.left = -20;
    dir.shadow.camera.right = 20;
    dir.shadow.camera.top = 60;
    dir.shadow.camera.bottom = -60;
    this.scene.add(dir);

    const fillLight = new THREE.DirectionalLight(0x6688cc, 0.8);
    fillLight.position.set(-10, -10, 15);
    this.scene.add(fillLight);

    // Background gradient mesh (large plane behind the course)
    this.createBackground();

    // Fog for depth
    this.scene.fog = new THREE.FogExp2(0x0f0c29, 0.005);

    window.addEventListener('resize', this.onResize);
  }

  private createBackground(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#4facfe');
    gradient.addColorStop(0.3, '#2c3e8c');
    gradient.addColorStop(0.7, '#1a1a3e');
    gradient.addColorStop(1, '#0f0c29');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 512);

    const texture = new THREE.CanvasTexture(canvas);
    const bgGeo = new THREE.PlaneGeometry(200, 200);
    const bgMat = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const bgMesh = new THREE.Mesh(bgGeo, bgMat);
    bgMesh.position.set(0, 0, -15);
    bgMesh.renderOrder = -1;
    this.scene.add(bgMesh);
  }

  private onResize = (): void => {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  render(camera: THREE.Camera): void {
    this.renderer.render(this.scene, camera);
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
