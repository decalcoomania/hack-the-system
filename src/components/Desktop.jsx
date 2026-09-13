import { useState, useEffect, useRef } from "react";
import { Rnd } from "react-rnd";
import hexBg from "../assets/hex-background.png";

import terminalImg from "../assets/terminal-icon.png";
import filesImg from "../assets/files-icon.png";
import networkImg from "../assets/network-icon.png";
import securityImg from "../assets/security-icon.png";

import { getInitialGameState, processCommand } from "../game/engine";
import { soundFx } from "../game/audio";

const BACKEND_URL = "https://nexus-os-backend-wft7.onrender.com/"; // Змініть на свій Render URL при деплої

// Файли для вікна Files (з твоїми посиланнями)
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

  // 1. Автоматичне збереження прогресу
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

  // Збереження прогресу в LocalStorage
  useEffect(() => {
    localStorage.setItem("nexus_game_state", JSON.stringify(gameState));
  }, [gameState]);

  useEffect(() => {
    if (terminalOpen) {
      terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [gameState.history, terminalOpen]);

  // Завантаження лідерборду для Network
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
    soundFx.playKeyPress(); // Звук при кожному натисканні клавіші
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!inputVal.trim()) return;

      const prevDet = gameState.detection;
      const updated = processCommand(inputVal, gameState);

      // Якщо зросла тривога
      if (updated.detection > prevDet) soundFx.playAlert();
      // Якщо команда видала помилку
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

  return (
    <div
      className={`desktop ${gameState.detection >= 80 ? "glitch-alert" : ""}`}
      style={{
        backgroundImage: `linear-gradient(rgba(20, 20, 20, 0.55), rgba(20, 20, 20, 0.55)), url(${hexBg})`,
      }}
    >
      {/* TOP BAR */}
      <div className="topbar">
        <div className="topbar-left">
          <span className="os-name">NEXUS OS</span>
          <span className="divider">|</span>
          <span className="clock">04:04</span>
        </div>

        <div className="topbar-right">
          <span className="network">
            NETWORK: {gameState.currentServer ? gameState.currentServer : "CONNECTED"}
          </span>
          <span className="cpu">CPU: 24%</span>
          <div className="status-icons">
            <span>🕒</span>
            <span>📶</span>
            <span>🔋</span>
            <span>⚙</span>
          </div>
        </div>
      </div>

      {/* DESKTOP ICONS */}
      <div className="desktop-icons">
        <button className="desktop-shortcut" onClick={() => setTerminalOpen(true)}>
          <img src={terminalImg} alt="Terminal" className="shortcut-img" />
          <span className="shortcut-label">Terminal</span>
        </button>

        {/* FILES ICON */}
        <button className="desktop-shortcut" onClick={() => setFilesOpen(true)}>
          <img src={filesImg} alt="Files" className="shortcut-img" />
          <span className="shortcut-label">Files</span>
        </button>

        {/* NETWORK ICON (LEADERBOARD) */}
        <button className="desktop-shortcut" onClick={handleOpenNetwork}>
          <img src={networkImg} alt="Network" className="shortcut-img" />
          <span className="shortcut-label">Network</span>
        </button>

        <button className="desktop-shortcut">
          <img src={securityImg} alt="Security" className="shortcut-img" />
          <span className="shortcut-label">Security</span>
        </button>
      </div>

      {/* TERMINAL WINDOW */}
      {terminalOpen && (
        <Rnd
          default={{
            x: window.innerWidth / 2 - 490,
            y: window.innerHeight / 2 - 320,
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
              <span className="terminal-title">NEXUS TERMINAL</span>
              <button className="terminal-close" onClick={() => setTerminalOpen(false)}>
                ×
              </button>
            </div>

            <div className="terminal-body">
              {gameState.history.map((item, index) => (
                <div key={index} className={`terminal-line ${item.type}`}>
                  {item.text}
                </div>
              ))}

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
                CONNECTION:{" "}
                <span className={gameState.detection >= 100 ? "failed-text" : "active-text"}>
                  {gameState.gameStatus === "FAILED" ? "TERMINATED" : "ACTIVE"}
                </span>
              </div>
            </div>
          </div>
        </Rnd>
      )}

      {/* FILES WINDOW (ВІКНО З ПОСИЛАННЯМИ) */}
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
              <span className="terminal-title">NEXUS FILES — SYSTEM DOCUMENTS</span>
              <button className="terminal-close" onClick={() => setFilesOpen(false)}>
                ×
              </button>
            </div>

            <div className="files-body">
              <p className="files-hint">Encrypted agent resources. Click to access external link:</p>
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

      {/* NETWORK WINDOW (LEADERBOARD) */}
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
              <span className="terminal-title">NEXUS NETWORK — GLOBAL HIGH SCORES</span>
              <button className="terminal-close" onClick={() => setNetworkOpen(false)}>
                ×
              </button>
            </div>

            <div className="network-body">
              {loadingLeaderboard ? (
                <div className="loading-text">FETCHING DATABASE RECORDS...</div>
              ) : (
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>AGENT / NICKNAME</th>
                      <th>XP</th>
                      <th>DETECTION</th>
                      <th>DATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: "center" }}>
                          NO DATABASE RECORDS FOUND
                        </td>
                      </tr>
                    ) : (
                      leaderboardData.map((row, idx) => (
                        <tr key={row.id || idx}>
                          <td>{idx + 1}</td>
                          <td className="nick-col">{row.nickname}</td>
                          <td className="xp-col">{row.xp}</td>
                          <td className="det-col">{row.detection}%</td>
                          <td className="date-col">{row.date}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </Rnd>
      )}

      {/* MODAL: VICTORY / GAME OVER */}
      {gameState.gameStatus !== "PLAYING" && (
        <div className="game-modal-overlay">
          <div className={`game-modal ${gameState.gameStatus.toLowerCase()}`}>
            <h2>
              {gameState.gameStatus === "VICTORY"
                ? "🏆 MISSION SUCCESS"
                : "🚨 MISSION FAILED"}
            </h2>
            <div className="modal-content">
              {gameState.gameStatus === "VICTORY" ? (
                <>
                  <p>TARGET: CYBERCORE</p>
                  <p>DATA: PROJECT_NOVA</p>
                  <p>STATUS: EXTRACTED</p>
                  <p>FINAL DETECTION: {gameState.detection}%</p>
                  <p className="highlight">TOTAL XP: {gameState.xp}</p>

                  {!isSubmitted ? (
                    <div className="score-submit-box">
                      <input
                        type="text"
                        placeholder="ENTER AGENT NICKNAME..."
                        className="nick-input"
                        value={playerNick}
                        onChange={(e) => setPlayerNick(e.target.value)}
                      />
                      <button className="submit-btn" onClick={handleScoreSubmit}>
                        SAVE SCORE
                      </button>
                    </div>
                  ) : (
                    <p className="success-text">SCORE SAVED TO DATABASE!</p>
                  )}
                </>
              ) : (
                <>
                  <p>INTRUSION DETECTED BY CYBERCORE</p>
                  <p>CONNECTION TERMINATED</p>
                  <p>PROJECT_NOVA: LOST</p>
                </>
              )}
            </div>
            <button className="restart-btn" onClick={handleRestart}>
              RESTART OPERATION
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Desktop;