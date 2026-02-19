export interface SetupResult {
  names: string[];
  winRank: number; // 1-based, e.g., "last" = names.length
  winMode: 'last' | 'first' | 'custom';
}

export class SetupScreen {
  private container: HTMLDivElement;
  private resolve: ((result: SetupResult) => void) | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'setup-screen';
    this.container.innerHTML = `
      <div class="setup-backdrop"></div>
      <div class="setup-card">
        <h1 class="setup-title">
          <span class="coffee-icon">&#9749;</span>
          커피 낙하 내기
        </h1>
        <p class="setup-subtitle">누가 커피를 쏠까? 하늘에서 떨어져 봐!</p>

        <div class="setup-field">
          <label for="names-input">참가자 이름</label>
          <textarea
            id="names-input"
            placeholder="이름을 입력하세요 (줄바꿈 또는 쉼표로 구분)&#10;예: 김철수&#10;이영희&#10;박민수"
            rows="5"
          ></textarea>
        </div>

        <div class="setup-field">
          <label>당첨 방식 (커피 사는 사람)</label>
          <div class="rank-buttons">
            <button class="rank-btn active" data-mode="last">꼴찌</button>
            <button class="rank-btn" data-mode="first">1등</button>
            <button class="rank-btn" data-mode="custom">직접 입력</button>
          </div>
          <div class="custom-rank" style="display:none;">
            <input type="number" id="custom-rank-input" min="1" value="2" />
            <span>등</span>
          </div>
        </div>

        <button id="start-btn" class="start-button" disabled>
          시작!
        </button>
        <p class="setup-hint" id="setup-hint">최소 2명 이상 입력해주세요</p>
      </div>
    `;
  }

  show(): Promise<SetupResult> {
    document.body.appendChild(this.container);

    return new Promise((resolve) => {
      this.resolve = resolve;

      const textarea = this.container.querySelector('#names-input') as HTMLTextAreaElement;
      const startBtn = this.container.querySelector('#start-btn') as HTMLButtonElement;
      const hint = this.container.querySelector('#setup-hint') as HTMLParagraphElement;
      const rankBtns = this.container.querySelectorAll('.rank-btn');
      const customDiv = this.container.querySelector('.custom-rank') as HTMLDivElement;

      let winMode: 'last' | 'first' | 'custom' = 'last';

      const parseNames = (): string[] => {
        const text = textarea.value.trim();
        if (!text) return [];
        return text
          .split(/[,\n]+/)
          .map((n) => n.trim())
          .filter((n) => n.length > 0);
      };

      const validate = (): void => {
        const names = parseNames();
        if (names.length >= 2) {
          startBtn.disabled = false;
          hint.textContent = `${names.length}명 참가`;
          hint.style.color = '#2ed573';
        } else {
          startBtn.disabled = true;
          hint.textContent = '최소 2명 이상 입력해주세요';
          hint.style.color = '#ff6b81';
        }
      };

      textarea.addEventListener('input', validate);

      rankBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          rankBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          winMode = btn.getAttribute('data-mode') as 'last' | 'first' | 'custom';
          customDiv.style.display = winMode === 'custom' ? 'flex' : 'none';
        });
      });

      startBtn.addEventListener('click', () => {
        const names = parseNames();
        if (names.length < 2) return;

        let winRank: number;
        if (winMode === 'last') {
          winRank = names.length;
        } else if (winMode === 'first') {
          winRank = 1;
        } else {
          const input = this.container.querySelector('#custom-rank-input') as HTMLInputElement;
          winRank = Math.max(1, Math.min(names.length, parseInt(input.value) || 1));
        }

        this.hide();
        this.resolve!({ names, winRank, winMode });
      });

      // Focus textarea
      setTimeout(() => textarea.focus(), 100);
    });
  }

  hide(): void {
    this.container.classList.add('fade-out');
    setTimeout(() => {
      this.container.remove();
    }, 500);
  }
}
