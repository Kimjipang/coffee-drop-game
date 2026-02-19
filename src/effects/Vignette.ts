export class Vignette {
  private element: HTMLDivElement;
  private intensity = 0;
  private targetIntensity = 0;

  constructor(container: HTMLElement) {
    this.element = document.createElement('div');
    this.element.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      pointer-events: none;
      z-index: 50;
      transition: box-shadow 0.3s ease;
    `;
    container.appendChild(this.element);
  }

  setActive(active: boolean): void {
    this.targetIntensity = active ? 1 : 0;
  }

  update(dt: number): void {
    this.intensity += (this.targetIntensity - this.intensity) * dt * 3;

    if (this.intensity > 0.01) {
      const spread = 150 + (1 - this.intensity) * 100;
      const alpha = this.intensity * 0.7;
      this.element.style.boxShadow = `inset 0 0 ${spread}px rgba(0, 0, 0, ${alpha})`;
    } else {
      this.element.style.boxShadow = 'none';
    }
  }

  dispose(): void {
    this.element.remove();
  }
}
