import './style.css';
import { SetupScreen } from './ui/SetupScreen';
import { Game } from './game/Game';

const app = document.getElementById('app')!;

async function startSetup(): Promise<void> {
  const setup = new SetupScreen();
  const result = await setup.show();

  // Clear app container
  app.innerHTML = '';

  new Game(app, result.names, result.winRank, () => {
    app.innerHTML = '';
    startSetup();
  });
}

startSetup();
