import { useState, useEffect, useRef } from "react";
import { Rnd } from "react-rnd";
import hexBg from "../assets/hex-background.png";

import terminalImg from "../assets/terminal-icon.png";
import filesImg from "../assets/files-icon.png";
import networkImg from "../assets/network-icon.png";
import securityImg from "../assets/security-icon.png";

import { getInitialGameState, processCommand } from "../game/engine";
import { soundFx } from "../game/audio";

const BACKEND_URL = "https://nexus-os-backend.onrender.com"; // Ваша адреса Render

const NEXUS_FILES = [
  { name: "github_profile.url", label: "GitHub Repository", url: "https://github.com" },
  { name: "linkedin_profile.url", label: "LinkedIn Contact", url: "https://linkedin.com" },
  { name: "secret_portfolio.url", label: "Personal Portfolio", url: "https://google.com" },
  { name: "gattouz_vault.url", label: "Gattouz Special Vault", url: "https://youtube.com" }
];

function Desktop() {
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [networkOpen, setNetworkOpen] = useState(false);
  const [filesOpen, setFilesOpen] = useState(false);
  
  const [hintOpen, setHintOpen] = useState(false);
  const [showCmdHint, setShowCmdHint] = useState(false);

  const [gameState, setGameState] = useState(() => {
    const saved = localStorage.getItem("nexus_game_state");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return getInitialGameState();
  });

  const [inputVal, setInputVal] = useState("");
  const [playerNick, setPlayerNick] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const terminalEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("nexus_game_state", JSON.stringify(gameState));
  }, [gameState]);

  useEffect(() => {
    if (terminalOpen) {
      terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [gameState.history, terminalOpen]);

  // НОВІ ТОНКІ ТА НЕОЧЕВИДНІ ПІДКАЗКИ
  const getCurrentHint = () => {
    if (!terminalOpen && !gameState.currentServer) {
      return {
        title: "ІНІЦІАЛІЗАЦІЯ СИСТЕМИ",
        sequence: "Термінал — це твій головний інструмент. Запусти його з робочого столу, щоб побачити доступні вузли.",
        cmdHint: "Вузол CC-GATEWAY є первинним шлюзом. Використай утиліту огляду мережі для пошуку та підключення."
      };
    }

    if (!gameState.currentServer) {
      return {
        title: "ЛОКАЛЬНИЙ СЕКТОР",
        sequence: "Шлюз CyberCore прийме підключення тільки після виявлення точної назви вузла.",
        cmdHint: "Здійсни аналіз мережі локальною командою та перейди на виявлений шлюз CC-GATEWAY."
      };
    }

    if (gameState.currentServer === "CC-GATEWAY") {
      return {
        title: "ВУЗОЛ CC-GATEWAY",
        sequence: "Шлюз відкриває доступ до внутрішніх серверів компанії. Оглянь їхній перелік.",
        cmdHint: "Проскануй систему шлюзу та спробуй увійти на перший сервер обслуговування (SERVER-01)."
      };
    }

    switch (gameState.currentMission) {
      case 1:
        return {
          title: "МІСІЯ 01 — ПОШУК СЛІДІВ",
          sequence: "У службових файлах серверу є записи про підозрілі дії одного з акаунтів.",
          cmdHint: "Перевірте список документів та вивчіть тексти списків співробітників і журналів роботи."
        };
      case 2:
        return {
          title: "МІСІЯ 02 — КЛЮЧІ ДОСТУПУ",
          sequence: "Кадрові файли містять код референсу. Звіти про безпеку пояснюють алгоритм його конвертації в пароль.",
          cmdHint: "На SERVER-02 прочитайте базу кадрів та безпековий звіт. Змініть префікс коду і проведіть авторизацію користувача."
        };
      case 3:
        return {
          title: "МІСІЯ 03 — ПРИХОВАНИЙ ПОРТ",
          sequence: "Сервер баз даних блокує доступ до служб резервування. Знайдіть примітку про захищений порт.",
          cmdHint: "Вивчіть нотатки бази даних на SERVER-03. Використайте утиліту зняття блокування порту для відкриття SERVER-04."
        };
      case 4:
        return {
          title: "МІСІЯ 04 — КРИПТО-АРХІВ",
          sequence: "На сервері резервування лежать зашифровані архиви. Тільки зняття шифрування дозволить забрати дані.",
          cmdHint: "Знайдіть цільовий .enc файл в історії доступу SERVER-04. Застосуйте декодер перед його викачуванням."
        };
      case 5:
        return {
          title: "МІСІЯ 05 — ЕВАКУАЦІЯ",
          sequence: "Система виявлення активована. Потрібно негайно зменшити слід вашої сесії та закрити з'єднання.",
          cmdHint: "Запустіть стирання логів сесії для скидання %, відключіться від сервера та завершіть сеанс термінала."
        };
      default:
        return {
          title: "ДИРЕКТИВА БЕЗПЕКИ",
          sequence: "Для перегляду всіх доступних системних команд використайте базову довідку.",
          cmdHint: "Команда help відображає весь перелік операторів."
        };
    }
  };

  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/leaderboard`);
      const data = await res.json();
      setLeaderboardData(data);
    } catch (err) {
      console.error("Помилка БД:", err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const handleOpenNetwork = () => {
    setNetworkOpen(true);
    fetchLeaderboard();
  };

  const handleInputChange = (e) => {
    setInputVal(e.target.value);
    soundFx.playKeyPress();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!inputVal.trim()) return;

      const prevDet = gameState.detection;
      const updated = processCommand(inputVal, gameState);

      if (updated.detection > prevDet) soundFx.playAlert();
      const lastHist = updated.history[updated.history.length - 1];
      if (lastHist && lastHist.type === "error") soundFx.playError();

      if (updated.redirectUrl) {
        window.open(updated.redirectUrl, "_blank");
        delete updated.redirectUrl;
      }

      setGameState(updated);
      setInputVal("");
    }
  };

  const handleRestart = () => {
    const freshState = getInitialGameState();
    setGameState(freshState);
    localStorage.setItem("nexus_game_state", JSON.stringify(freshState));
    setIsSubmitted(false);
    setPlayerNick("");
    setTerminalOpen(true);
  };

  const handleScoreSubmit = async () => {
    if (!playerNick.trim()) return;
    try {
      await fetch(`${BACKEND_URL}/api/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: playerNick,
          xp: gameState.xp,
          detection: gameState.detection,
        }),
      });
      setIsSubmitted(true);
      fetchLeaderboard();
    } catch (err) {
      console.error("Помилка відправки в БД:", err);
    }
  };

  const activeHint = getCurrentHint();

  return (
    <div
      className={`desktop ${gameState.detection >= 80 ? "glitch-alert" : ""}`}
      style={{
        backgroundImage: `linear-gradient(rgba(10, 10, 15, 0.65), rgba(10, 10, 15, 0.65)), url(${hexBg})`,
      }}
    >
      {/* VERHNIA PANEN (TOPBAR) */}
      <div className="topbar">
        <div className="topbar-left">
          <span className="os-name">NEXUS OS v2.4</span>
          <span className="divider">|</span>
          <span className="clock">04:04 AM</span>
        </div>

        <div className="topbar-right">
          <span className="network">
            NODE: {gameState.currentServer ? gameState.currentServer : "LOCAL"}
          </span>
          <span className="cpu">CPU: 18%</span>
          <div className="status-icons">
            <span>📶</span>
            <span>🛡️</span>
          </div>
        </div>
      </div>

      {/* DESKTOP SHORTCUTS */}
      <div className="desktop-icons">
        <button className="desktop-shortcut" onClick={() => setTerminalOpen(true)}>
          <img src={terminalImg} alt="Terminal" className="shortcut-img" />
          <span className="shortcut-label">Terminal</span>
        </button>

        <button className="desktop-shortcut" onClick={() => setFilesOpen(true)}>
          <img src={filesImg} alt="Files" className="shortcut-img" />
          <span className="shortcut-label">Files</span>
        </button>

        <button className="desktop-shortcut" onClick={handleOpenNetwork}>
          <img src={networkImg} alt="Network" className="shortcut-img" />
          <span className="shortcut-label">Network</span>
        </button>

        <button className="desktop-shortcut">
          <img src={securityImg} alt="Security" className="shortcut-img" />
          <span className="shortcut-label">Security</span>
        </button>
      </div>

      {/* NYZHNYA PANEN (TASKBAR) */}
      <div className="bottom-taskbar">
        <div className="taskbar-left">
          <button className="start-btn" onClick={() => setTerminalOpen(true)}>⚡ NEXUS</button>
          <div className="taskbar-items">
            {terminalOpen && (
              <div className="taskbar-item active" onClick={() => setTerminalOpen(true)}>
                📟 Terminal
              </div>
            )}
            {filesOpen && (
              <div className="taskbar-item active" onClick={() => setFilesOpen(true)}>
                📁 Files
              </div>
            )}
            {networkOpen && (
              <div className="taskbar-item active" onClick={() => setNetworkOpen(true)}>
                🌐 Network
              </div>
            )}
          </div>
        </div>
        <div className="taskbar-right">
          <span>CYBERNET SECURE CONNECTION</span>
        </div>
      </div>

      {/* HINT BUTTON */}
      <button 
        className="hint-fab-btn" 
        onClick={() => {
          setHintOpen(true);
          setShowCmdHint(false);
        }} 
        title="Підказка по місії"
      >
        👁️
      </button>

      {/* HINT MODAL (БЕЗ ЖОВТОГО КОЛЬОРУ) */}
      {hintOpen && (
        <div className="game-modal-overlay" onClick={() => setHintOpen(false)}>
          <div className="game-modal hint-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hint-header">
              <h3>⚡ {activeHint.title}</h3>
              <button className="hint-close-btn" onClick={() => setHintOpen(false)}>×</button>
            </div>
            
            <div className="modal-content text-left">
              <div className="hint-section">
                <span className="hint-subtitle">📌 АНАЛІЗ СИТУАЦІЇ:</span>
                <p className="sequence-text">{activeHint.sequence}</p>
              </div>

              {showCmdHint ? (
                <div className="hint-section cmd-hint-box">
                  <span className="hint-subtitle">🔍 ТАКТИЧНИЙ НАТЯК:</span>
                  <p className="cmd-text">{activeHint.cmdHint}</p>
                </div>
              ) : (
                <button 
                  className="reveal-hint-btn" 
                  onClick={() => setShowCmdHint(true)}
                >
                  [?] Запитати розширену підказку аналітика
                </button>
              )}
            </div>

            <button className="restart-btn" onClick={() => setHintOpen(false)}>
              ПРИЙНЯТО
            </button>
          </div>
        </div>
      )}

      {/* TERMINAL WINDOW */}
      {terminalOpen && (
        <Rnd
          default={{
            x: window.innerWidth / 2 - 490,
            y: window.innerHeight / 2 - 340,
            width: 980,
            height: 640,
          }}
          minWidth={550}
          minHeight={400}
          dragHandleClassName="terminal-header"
          bounds="parent"
          className="rnd-terminal"
        >
          <div className={`terminal-window ${gameState.detection >= 80 ? "crt-glitch" : ""}`}>
            <div className="terminal-header">
              <span className="terminal-title">NEXUS TERMINAL v1.0</span>
              <button className="terminal-close" onClick={() => setTerminalOpen(false)}>
                ×
              </button>
            </div>

            <div className="terminal-body">
              <div className="terminal-history">
                {gameState.history.map((item, index) => (
                  <div key={index} className={`terminal-line ${item.type}`}>
                    {item.text}
                  </div>
                ))}
              </div>

              {/* STICKY INPUT AT BOTTOM OF TERMINAL */}
              {gameState.gameStatus === "PLAYING" && (
                <div className="input-line">
                  <span className="prompt">&gt;</span>
                  <input
                    type="text"
                    className="cmd-input"
                    value={inputVal}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    autoFocus
                  />
                </div>
              )}
              <div ref={terminalEndRef} />
            </div>

            <div className="terminal-status">
              <div className="status-xp">XP: {gameState.xp}</div>

              <div className="detection">
                <span className="detection-label">DETECTION:</span>
                <span className="segments">
                  {Array.from({ length: 10 }).map((_, idx) => {
                    const activeCount = Math.floor(gameState.detection / 10);
                    return (
                      <span
                        key={idx}
                        className={`segment ${idx < activeCount ? "active" : ""}`}
                      />
                    );
                  })}
                </span>
                <span className="detection-percent">{gameState.detection}%</span>
              </div>

              <div className="status-connection">
                STATUS: <span className="active-text">ACTIVE</span>
              </div>
            </div>
          </div>
        </Rnd>
      )}

      {/* FILES WINDOW */}
      {filesOpen && (
        <Rnd
          default={{
            x: window.innerWidth / 2 - 300,
            y: window.innerHeight / 2 - 200,
            width: 600,
            height: 400,
          }}
          minWidth={400}
          minHeight={250}
          dragHandleClassName="files-header"
          bounds="parent"
          className="rnd-terminal"
        >
          <div className="terminal-window files-window">
            <div className="terminal-header files-header">
              <span className="terminal-title">NEXUS FILES</span>
              <button className="terminal-close" onClick={() => setFilesOpen(false)}>×</button>
            </div>

            <div className="files-body">
              <div className="files-grid">
                {NEXUS_FILES.map((file, i) => (
                  <div
                    key={i}
                    className="file-card"
                    onClick={() => window.open(file.url, "_blank")}
                  >
                    <div className="file-icon">📄</div>
                    <div className="file-info">
                      <span className="file-name">{file.name}</span>
                      <span className="file-label">{file.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Rnd>
      )}

      {/* NETWORK WINDOW */}
      {networkOpen && (
        <Rnd
          default={{
            x: window.innerWidth / 2 - 350,
            y: window.innerHeight / 2 - 250,
            width: 700,
            height: 500,
          }}
          minWidth={450}
          minHeight={300}
          dragHandleClassName="network-header"
          bounds="parent"
          className="rnd-terminal"
        >
          <div className="terminal-window network-window">
            <div className="terminal-header network-header">
              <span className="terminal-title">GLOBAL LEADERBOARD</span>
              <button className="terminal-close" onClick={() => setNetworkOpen(false)}>×</button>
            </div>

            <div className="network-body">
              {loadingLeaderboard ? (
                <div className="loading-text">FETCHING RECORDS...</div>
              ) : (
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>AGENT</th>
                      <th>XP</th>
                      <th>DETECTION</th>
                      <th>DATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.map((row, idx) => (
                      <tr key={row.id || idx}>
                        <td>{idx + 1}</td>
                        <td className="nick-col">{row.nickname}</td>
                        <td className="xp-col">{row.xp}</td>
                        <td className="det-col">{row.detection}%</td>
                        <td className="date-col">{row.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </Rnd>
      )}

      {/* MODAL VICTORY/FAIL */}
      {gameState.gameStatus !== "PLAYING" && (
        <div className="game-modal-overlay">
          <div className={`game-modal ${gameState.gameStatus.toLowerCase()}`}>
            <h2>{gameState.gameStatus === "VICTORY" ? "🏆 MISSION SUCCESS" : "🚨 MISSION FAILED"}</h2>
            <div className="modal-content">
              {gameState.gameStatus === "VICTORY" ? (
                <>
                  <p>PROJECT_NOVA: EXTRACTED</p>
                  <p>FINAL DETECTION: {gameState.detection}%</p>
                  <p className="highlight">XP: {gameState.xp}</p>
                  {!isSubmitted ? (
                    <div className="score-submit-box">
                      <input
                        type="text"
                        placeholder="ENTER AGENT NICKNAME..."
                        className="nick-input"
                        value={playerNick}
                        onChange={(e) => setPlayerNick(e.target.value)}
                      />
                      <button className="submit-btn" onClick={handleScoreSubmit}>SAVE</button>
                    </div>
                  ) : (
                    <p className="success-text">SCORE SAVED TO NETWORK!</p>
                  )}
                </>
              ) : (
                <p>INTRUSION DETECTED. CONNECTION TERMINATED.</p>
              )}
            </div>
            <button className="restart-btn" onClick={handleRestart}>RESTART</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Desktop;