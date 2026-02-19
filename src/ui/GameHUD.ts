import { Character } from '../game/Character';
import { CameraMode } from '../camera/CameraManager';

export class GameHUD {
  private container: HTMLDivElement;
  private rankList: HTMLDivElement;
  private cameraButtons: HTMLDivElement;
  private countdownEl: HTMLDivElement;
  private slowMoLabel: HTMLDivElement;
  private onCameraChange: ((mode: CameraMode) => void) | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'game-hud';
    this.container.innerHTML = `
      <div class="hud-rank-panel">
        <div class="hud-rank-title">실시간 순위</div>
        <div class="hud-rank-list" id="hud-rank-list"></div>
      </div>
      <div class="hud-camera-bar" id="hud-camera-bar">
        <button class="cam-btn" data-mode="0">1인칭</button>
        <button class="cam-btn" data-mode="1">3인칭</button>
        <button class="cam-btn active" data-mode="2">2D</button>
      </div>
      <div class="hud-countdown" id="hud-countdown" style="display:none;"></div>
      <div class="hud-slowmo" id="hud-slowmo" style="display:none;">SLOW MOTION</div>
    `;

    this.rankList = this.container.querySelector('#hud-rank-list') as HTMLDivElement;
    this.cameraButtons = this.container.querySelector('#hud-camera-bar') as HTMLDivElement;
    this.countdownEl = this.container.querySelector('#hud-countdown') as HTMLDivElement;
    this.slowMoLabel = this.container.querySelector('#hud-slowmo') as HTMLDivElement;
  }

  show(onCameraChange: (mode: CameraMode) => void): void {
    this.onCameraChange = onCameraChange;
    document.body.appendChild(this.container);

    const btns = this.cameraButtons.querySelectorAll('.cam-btn');
    btns.forEach((btn) => {
      btn.addEventListener('click', () => {
        btns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = parseInt(btn.getAttribute('data-mode')!) as CameraMode;
        this.onCameraChange?.(mode);
      });
    });
  }

  updateRanks(characters: Character[], winRank: number): void {
    // Sort: finished first (by rank), then unfinished (by Y position, lower = closer to finish)
    const sorted = [...characters].sort((a, b) => {
      if (a.finished && b.finished) return a.finishRank - b.finishRank;
      if (a.finished && !b.finished) return -1;
      if (!a.finished && b.finished) return 1;
      return a.position.y - b.position.y; // lower Y = closer to finish
    });

    let html = '';
    sorted.forEach((char, idx) => {
      const rank = char.finished ? char.finishRank : idx + 1;
      const colorHex = '#' + char.color.toString(16).padStart(6, '0');
      const finished = char.finished ? 'finished' : '';
      const isWinner = char.finished && char.finishRank === winRank ? 'winner-rank' : '';

      html += `
        <div class="rank-item ${finished} ${isWinner}">
          <span class="rank-num">${rank}</span>
          <span class="rank-dot" style="background:${colorHex}"></span>
          <span class="rank-name">${char.name}</span>
          ${char.finished ? '<span class="rank-check">&#10003;</span>' : ''}
        </div>
      `;
    });

    this.rankList.innerHTML = html;
  }

  showCountdown(num: number | string): void {
    this.countdownEl.style.display = 'flex';
    this.countdownEl.textContent = String(num);
    this.countdownEl.classList.remove('countdown-pop');
    // Trigger reflow for animation
    void this.countdownEl.offsetWidth;
    this.countdownEl.classList.add('countdown-pop');
  }

  hideCountdown(): void {
    this.countdownEl.style.display = 'none';
  }

  setSlowMotion(active: boolean): void {
    this.slowMoLabel.style.display = active ? 'block' : 'none';
  }

  setCameraMode(mode: CameraMode): void {
    const btns = this.cameraButtons.querySelectorAll('.cam-btn');
    btns.forEach((btn) => {
      btn.classList.toggle('active', parseInt(btn.getAttribute('data-mode')!) === mode);
    });
  }

  hide(): void {
    this.container.remove();
  }
}
