import { useState, useEffect, useRef } from "react";
import { Rnd } from "react-rnd";
import hexBg from "../assets/hex-background.png";

import terminalImg from "../assets/terminal-icon.png";
import filesImg from "../assets/files-icon.png";
import networkImg from "../assets/network-icon.png";
import securityImg from "../assets/security-icon.png";

import { getInitialGameState, processCommand } from "../game/engine";
import { soundFx } from "../game/audio";

const BACKEND_URL = "https://nexus-os-backend-wft7.onrender.com";

const NEXUS_FILES = [
  { name: "github_profile.url", label: "GitHub Repository", url: "https://github.com" },
  { name: "linkedin_profile.url", label: "LinkedIn Contact", url: "https://linkedin.com" },
  { name: "secret_portfolio.url", label: "Personal Portfolio", url: "https://google.com" },
  { name: "gattouz_vault.url", label: "Gattouz Special Vault", url: "https://youtube.com" }
];

function Desktop({ userNickname }) {
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
  const [playerNick, setPlayerNick] = useState(userNickname || "");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  const terminalEndRef = useRef(null);

  useEffect(() => {
    if (userNickname) {
      setPlayerNick(userNickname);
    }
  }, [userNickname]);

  useEffect(() => {
    localStorage.setItem("nexus_game_state", JSON.stringify(gameState));
  }, [gameState]);

  useEffect(() => {
    if (terminalOpen) {
      terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [gameState.history, terminalOpen]);

  // СИСТЕМА ПІДКАЗОК
  const getCurrentHint = () => {
    if (!terminalOpen && !gameState.currentServer) {
      return {
        title: "SYSTEM INITIALIZATION",
        sequence: "Start by opening the Terminal window from your desktop.",
        cmdHint: "Use 'scan' to list available network nodes, then type 'connect CC-GATEWAY'."
      };
    }

    if (!gameState.currentServer) {
      return {
        title: "LOCAL NETWORK",
        sequence: "You need to scan the network to find the gateway address first.",
        cmdHint: "Type 'scan' in the terminal, then enter 'connect CC-GATEWAY'."
      };
    }

    if (gameState.currentServer === "CC-GATEWAY") {
      return {
        title: "CC-GATEWAY NODE",
        sequence: "You are at the main gateway. Find the internal servers list.",
        cmdHint: "Run 'scan' to discover target servers, then type 'connect SERVER-01'."
      };
    }

    switch (gameState.currentMission) {
      case 1:
        return {
          title: "MISSION 01 — FIND THE TARGET",
          sequence: "Check the files on SERVER-01 to find which employee account is acting suspicious.",
          cmdHint: "Type 'ls' to list files. Then read 'employees.txt' and 'notes.txt' using 'cat <filename>' to find the suspect (operator_17)."
        };
      case 2:
        return {
          title: "MISSION 02 — GET CREDENTIALS",
          sequence: "Move to SERVER-02. Find the employee ID code and check security rules to turn it into a password.",
          cmdHint: "Use 'connect SERVER-02'. Read 'employees.db' (find code NEX-7241) and 'security_report.txt'. Change NEX- to ACCESS- (password is ACCESS-7241). Then type 'login operator_17' followed by 'pass ACCESS-7241'."
        };
      case 3:
        return {
          title: "MISSION 03 — UNLOCK PORT",
          sequence: "Go to SERVER-03. Read the database notes to find the blocked port number, then unlock it.",
          cmdHint: "Use 'connect SERVER-03'. Read 'database_notes.txt'. Unlock the port using 'unlock PORT-8443', then connect using 'connect SERVER-04'."
        };
      case 4:
        return {
          title: "MISSION 04 — EXTRACT DATA",
          sequence: "Check history files on SERVER-04 to find the target .enc file. Decrypt it before downloading.",
          cmdHint: "Read 'access_history.txt' to find 'data_17.enc'. First run 'decrypt data_17.enc', then run 'download data_17.enc'."
        };
      case 5:
        return {
          title: "MISSION 05 — ESCAPE SYSTEM",
          sequence: "Detection is high! Lower your detection level, disconnect from the server, and end session.",
          cmdHint: "Type 'clear_logs' to reduce detection by 10%. Then run 'disconnect' and finally 'exit' to complete the game."
        };
      default:
        return {
          title: "SYSTEM DIRECTIVE",
          sequence: "Check the command manual for system guidance.",
          cmdHint: "Type 'help' in the terminal to view all available commands."
        };
    }
  };

  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/leaderboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error(`Server returned status code ${res.status}`);
      }

      const data = await res.json();

      if (Array.isArray(data)) {
        setLeaderboardData(data);
      } else {
        console.warn("Unexpected leaderboard data format:", data);
        setLeaderboardData([]);
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard from database:", err);
      setLeaderboardData([]);
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
      const updated = processCommand(inputVal, gameState, userNickname);

      if (updated.detection > prevDet) soundFx.playAlert();
      const lastHist = updated.history ? updated.history[updated.history.length - 1] : null;
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
    setTerminalOpen(true);
  };

  const handleScoreSubmit = async () => {
    if (isSubmitted) return;

    const nickToSave = playerNick.trim() || userNickname || "Anonymous";
    setIsSubmitted(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: nickToSave,
          xp: gameState.xp,
          detection: gameState.detection,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      await fetchLeaderboard();
      setNetworkOpen(true);
    } catch (err) {
      console.error("Database save error:", err);
      setIsSubmitted(false);
      alert("Не вдалося зберегти результат.");
    }
  };

  const activeHint = getCurrentHint();

  return (
    <div
      className={`desktop ${gameState.detection >= 80 ? "alert-state glitch-alert" : ""}`}
      style={{
        backgroundImage: `linear-gradient(rgba(10, 10, 15, 0.65), rgba(10, 10, 15, 0.65)), url(${hexBg})`,
      }}
    >
      {/* ЕКРАННИЙ ГЛЮК ПРИ ДЕТЕКШНІ >= 80% */}
      {gameState.detection >= 80 && <div className="glitch-overlay" />}

      {/* TOPBAR */}
      <div className="topbar">
        <div className="topbar-left">
          <span className="os-name">NEXUS OS v2.4</span>
          <span className="divider">|</span>
          <span className="clock">04:04 AM</span>
          {userNickname && (
            <>
              <span className="divider">|</span>
              <span className="user-badge" style={{ color: '#00ff66', fontWeight: 'bold' }}>
                OP: {userNickname}
              </span>
            </>
          )}
        </div>

        <div className="topbar-right">
          <span className="network">
            NODE: {gameState.currentServer ? gameState.currentServer : "LOCAL"}
          </span>
          <span className="cpu">CPU: 18%</span>
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

      {/* HINT BUTTON */}
      <button 
        className="hint-fab-btn" 
        onClick={() => {
          setHintOpen(true);
          setShowCmdHint(false);
        }} 
        title="Mission Hint"
      >
        HINT
      </button>

      {/* HINT MODAL */}
      {hintOpen && (
        <div className="game-modal-overlay" onClick={() => setHintOpen(false)}>
          <div className="game-modal hint-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hint-header">
              <h3>[HINT] {activeHint.title}</h3>
              <button className="hint-close-btn" onClick={() => setHintOpen(false)}>×</button>
            </div>
            
            <div className="modal-content text-left">
              <div className="hint-section">
                <span className="hint-subtitle">OBJECTIVE:</span>
                <p className="sequence-text">{activeHint.sequence}</p>
              </div>

              {showCmdHint ? (
                <div className="hint-section cmd-hint-box">
                  <span className="hint-subtitle">COMMAND DETAILS:</span>
                  <p className="cmd-text">{activeHint.cmdHint}</p>
                </div>
              ) : (
                <button 
                  className="reveal-hint-btn" 
                  onClick={() => setShowCmdHint(true)}
                >
                  [?] Show exact commands hint
                </button>
              )}
            </div>

            <button className="restart-btn" onClick={() => setHintOpen(false)}>
              CLOSE
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
                {gameState.history && gameState.history.map((item, index) => (
                  <div key={index} className={`terminal-line ${item.type}`}>
                    {item.text}
                  </div>
                ))}
              </div>

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
                    <div className="file-icon">[DOC]</div>
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
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.map((row, idx) => (
                      <tr key={row.id || idx}>
                        <td>{idx + 1}</td>
                        <td className="nick-col">{row.nickname}</td>
                        <td className="xp-col">{row.xp}</td>
                        <td className="det-col">{row.detection}%</td>
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
            <h2>{gameState.gameStatus === "VICTORY" ? "[SUCCESS] MISSION COMPLETE" : "[FAILED] MISSION OVER"}</h2>
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
                      <button 
                        className="submit-btn" 
                        onClick={handleScoreSubmit}
                        disabled={isSubmitted}
                      >
                        {isSubmitted ? "SAVING..." : "SAVE"}
                      </button>
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