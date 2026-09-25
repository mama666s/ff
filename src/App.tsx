import { useEffect, useRef, useState } from 'react';
import { Game } from './game/Game';

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [health, setHealth] = useState(100);
  const [shield, setShield] = useState(50);
  const [materials, setMaterials] = useState({ wood: 200, stone: 100, metal: 50 });
  const [ammo, setAmmo] = useState(30);
  const [maxAmmo] = useState(30);
  const [weapon, setWeapon] = useState('AR');
  const [killCount, setKillCount] = useState(0);
  const [playersAlive, setPlayersAlive] = useState(50);
  const [buildMode, setBuildMode] = useState(false);
  const [buildType, setBuildType] = useState('wall');
  const [showMenu, setShowMenu] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [stormPhase, setStormPhase] = useState(1);
  const [stormTimer, setStormTimer] = useState(120);

  useEffect(() => {
    if (!containerRef.current || !gameStarted) return;

    const game = new Game(containerRef.current, {
      onHealthChange: setHealth,
      onShieldChange: setShield,
      onMaterialsChange: setMaterials,
      onAmmoChange: setAmmo,
      onKill: () => setKillCount(k => k + 1),
      onPlayerDeath: () => { setGameOver(true); },
      onPlayersAliveChange: setPlayersAlive,
      onStormPhaseChange: setStormPhase,
      onStormTimerChange: setStormTimer,
    });
    gameRef.current = game;
    game.start();

    return () => {
      game.dispose();
    };
  }, [gameStarted]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'b' || e.key === 'B') {
        setBuildMode(prev => !prev);
      }
      if (e.key === '1') setBuildType('wall');
      if (e.key === '2') setBuildType('floor');
      if (e.key === '3') setBuildType('ramp');
      if (e.key === 'Escape') {
        setShowMenu(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const startGame = () => {
    setGameStarted(true);
    setShowMenu(false);
    setGameOver(false);
    setHealth(100);
    setShield(50);
    setKillCount(0);
    setPlayersAlive(50);
  };

  return (
    <div className="w-full h-screen overflow-hidden relative bg-black">
      {/* Game Canvas Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Main Menu */}
      {showMenu && gameStarted && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-center text-white">
            <h2 className="text-4xl font-bold mb-4">ПАУЗА</h2>
            <p className="mb-4">Нажмите ESC чтобы продолжить</p>
            <button
              onClick={() => setShowMenu(false)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-xl"
            >
              Продолжить
            </button>
          </div>
        </div>
      )}

      {/* Start Screen */}
      {!gameStarted && (
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900 via-blue-900 to-black flex items-center justify-center z-50">
          <div className="text-center text-white">
            <h1 className="text-7xl font-black mb-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              FORTCRAFT
            </h1>
            <p className="text-2xl text-blue-300 mb-8">BATTLE ROYALE 3D</p>
            <div className="mb-8 text-left max-w-md mx-auto bg-white/10 p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-3 text-yellow-400">Управление:</h3>
              <ul className="space-y-1 text-sm">
                <li><span className="text-blue-300">WASD</span> - Движение</li>
                <li><span className="text-blue-300">Мышь</span> - Обзор</li>
                <li><span className="text-blue-300">ЛКМ</span> - Стрельба / Строительство</li>
                <li><span className="text-blue-300">ПКМ</span> - Ломать объекты (сбор ресурсов)</li>
                <li><span className="text-blue-300">Пробел</span> - Прыжок</li>
                <li><span className="text-blue-300">Shift</span> - Бег</li>
                <li><span className="text-blue-300">B</span> - Режим строительства</li>
                <li><span className="text-blue-300">1/2/3</span> - Стена / Пол / Пандус</li>
                <li><span className="text-blue-300">R</span> - Перезарядка</li>
                <li><span className="text-blue-300">F</span> - Подобрать предмет</li>
                <li><span className="text-blue-300">ESC</span> - Пауза</li>
              </ul>
            </div>
            <button
              onClick={startGame}
              className="px-12 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 rounded-xl text-2xl font-bold transform hover:scale-105 transition-all shadow-lg shadow-orange-500/50"
            >
              🎮 ИГРАТЬ
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="text-center text-white">
            <h2 className="text-5xl font-bold mb-4 text-red-500">ПОРАЖЕНИЕ</h2>
            <p className="text-2xl mb-2">Место: #{playersAlive + 1}</p>
            <p className="text-xl mb-2">Убийства: {killCount}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-xl"
            >
              Играть снова
            </button>
          </div>
        </div>
      )}

      {/* HUD */}
      {gameStarted && !showMenu && !gameOver && (
        <>
          {/* Crosshair */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
            {buildMode ? (
              <div className="w-8 h-8 border-2 border-green-400 rounded-sm opacity-80" />
            ) : (
              <>
                <div className="w-0.5 h-4 bg-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-80" />
                <div className="w-4 h-0.5 bg-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-80" />
                <div className="w-1 h-1 bg-red-500 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </>
            )}
          </div>

          {/* Top Bar - Storm & Players */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
            <div className="flex items-center gap-4 bg-black/60 px-6 py-2 rounded-full">
              <div className="text-white text-sm">
                <span className="text-purple-400">⚡ Шторм:</span> Фаза {stormPhase}
              </div>
              <div className="text-white text-sm">
                <span className="text-red-400">⏱</span> {Math.floor(stormTimer / 60)}:{(stormTimer % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-white text-sm">
                <span className="text-blue-400">👥</span> {playersAlive} осталось
              </div>
            </div>
          </div>

          {/* Kill Feed */}
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-black/60 px-4 py-2 rounded-lg">
              <p className="text-yellow-400 font-bold">☠ Убийства: {killCount}</p>
            </div>
          </div>

          {/* Bottom HUD */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
            <div className="flex items-end gap-4">
              {/* Health & Shield */}
              <div className="bg-black/70 p-3 rounded-xl min-w-[200px]">
                {/* Shield */}
                <div className="mb-1">
                  <div className="flex justify-between text-xs text-blue-300 mb-0.5">
                    <span>🛡 Щит</span>
                    <span>{shield}/100</span>
                  </div>
                  <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-300 transition-all duration-300"
                      style={{ width: `${shield}%` }}
                    />
                  </div>
                </div>
                {/* Health */}
                <div>
                  <div className="flex justify-between text-xs text-green-300 mb-0.5">
                    <span>❤ Здоровье</span>
                    <span>{health}/100</span>
                  </div>
                  <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-300 transition-all duration-300"
                      style={{ width: `${health}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Weapon & Ammo */}
              <div className="bg-black/70 p-3 rounded-xl text-center">
                <div className="text-2xl mb-1">🔫</div>
                <div className="text-white font-bold text-sm">{weapon}</div>
                <div className="text-yellow-400 text-sm">
                  {ammo}/{maxAmmo}
                </div>
              </div>

              {/* Build Mode */}
              <div className={`bg-black/70 p-3 rounded-xl text-center ${buildMode ? 'ring-2 ring-green-400' : ''}`}>
                <div className="text-2xl mb-1">{buildType === 'wall' ? '🧱' : buildType === 'floor' ? '⬜' : '📐'}</div>
                <div className="text-white font-bold text-xs">
                  {buildMode ? 'СТРОИТЬ' : 'B-режим'}
                </div>
                <div className="text-gray-400 text-xs">
                  {buildType === 'wall' ? 'Стена' : buildType === 'floor' ? 'Пол' : 'Пандус'}
                </div>
              </div>

              {/* Materials */}
              <div className="bg-black/70 p-3 rounded-xl">
                <div className="flex gap-3 text-sm">
                  <div className="text-center">
                    <div className="text-amber-600">🪵</div>
                    <div className="text-white">{materials.wood}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400">🪨</div>
                    <div className="text-white">{materials.stone}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-blue-300">⚙️</div>
                    <div className="text-white">{materials.metal}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mini Map */}
          <div className="absolute top-4 left-4 z-10">
            <div className="w-32 h-32 bg-black/70 rounded-lg border border-white/20 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-900/50 to-green-700/50" />
              <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-1 left-1 text-[8px] text-white/60">MINI MAP</div>
              {/* Storm circle */}
              <div className="absolute inset-2 border-2 border-purple-500/50 rounded-full" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
