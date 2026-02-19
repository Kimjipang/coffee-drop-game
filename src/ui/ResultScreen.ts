import { Character } from '../game/Character';

export class ResultScreen {
  private container: HTMLDivElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'result-screen';
  }

  show(
    characters: Character[],
    winRank: number,
    onRestart: () => void,
  ): void {
    const sorted = [...characters].sort((a, b) => a.finishRank - b.finishRank);
    const winner = sorted.find((c) => c.finishRank === winRank);
    const winnerName = winner ? winner.name : '???';
    const winnerColor = winner
      ? '#' + winner.color.toString(16).padStart(6, '0')
      : '#ff4757';

    let rankHtml = '';
    sorted.forEach((char) => {
      const colorHex = '#' + char.color.toString(16).padStart(6, '0');
      const isWinner = char.finishRank === winRank;
      rankHtml += `
        <div class="result-rank-item ${isWinner ? 'result-winner' : ''}">
          <span class="result-rank-num">${char.finishRank}</span>
          <span class="result-rank-dot" style="background:${colorHex}"></span>
          <span class="result-rank-name">${char.name}</span>
          ${isWinner ? '<span class="result-coffee">&#9749;</span>' : ''}
        </div>
      `;
    });

    this.container.innerHTML = `
      <div class="result-backdrop"></div>
      <div class="result-card">
        <div class="result-winner-announce">
          <span class="result-coffee-big">&#9749;</span>
          <h2 class="result-winner-text" style="color:${winnerColor}">
            ${winnerName}님이 커피 쏩니다!
          </h2>
          <p class="result-winner-rank">${winRank}등 당첨!</p>
        </div>
        <div class="result-rank-list">
          <h3>최종 순위</h3>
          ${rankHtml}
        </div>
        <button class="restart-button" id="restart-btn">다시하기</button>
      </div>
    `;

    document.body.appendChild(this.container);

    // Animate in
    requestAnimationFrame(() => {
      this.container.classList.add('visible');
    });

    const restartBtn = this.container.querySelector('#restart-btn') as HTMLButtonElement;
    restartBtn.addEventListener('click', () => {
      this.hide();
      onRestart();
    });
  }

  hide(): void {
    this.container.classList.remove('visible');
    setTimeout(() => {
      this.container.remove();
    }, 500);
  }
}
