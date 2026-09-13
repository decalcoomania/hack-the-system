// Базовий початковий стан гри
export const getInitialGameState = () => ({
  currentMission: 1,
  currentServer: null, // null = NEXUS Terminal
  accessLevel: "NEXUS",
  authenticatedUser: null,
  detection: 20,
  xp: 0,
  history: [
    { text: "NEXUS TERMINAL v1.0", type: "system" },
    { text: "Secure connection established.", type: "system" },
    { text: "", type: "system" },
    { text: "Type 'help' to see available commands.", type: "system" }
  ],
  gameStatus: "PLAYING", // PLAYING, VICTORY, FAILED
  dataDownloaded: false,
  logsCleared: false,
  foundTargetUser: false,
  server04Unlocked: false,
});

const VIRTUAL_NETWORK = {
  "CC-GATEWAY": {
    name: "CC-GATEWAY",
    system: "CYBERCORE ENTRY POINT",
    accessLevel: "GUEST",
    files: {},
    servers: ["SERVER-01", "SERVER-02", "SERVER-03", "SERVER-04", "SERVER-05"]
  },
  "SERVER-01": {
    name: "SERVER-01",
    system: "EMPLOYEE SERVICES",
    accessLevel: "GUEST",
    files: {
      "about.txt": "CYBERCORE Employee Services Node v2.4.\nFor issues contact IT admin.",
      "employees.txt": "EMPLOYEE DIRECTORY:\n- admin (Department: System)\n- user_08 (Department: Sales)\n- operator_17 (Department: Research) [SUSPICIOUS ACTIVITY FLAGGED]\n- operator_22 (Department: Logistics)",
      "maintenance.log": "[2025-11-18 22:10] Scheduled checkup completed.\n[2025-11-18 23:44] Anomaly detected on user account: operator_17.",
      "notes.txt": "Internal Note: Operator 17 was working late on the research database.",
      "archive.txt": "Old archives moved to SERVER-03."
    }
  },
  "SERVER-02": {
    name: "SERVER-02",
    system: "HR SERVICES",
    accessLevel: "GUEST",
    files: {
      "employees.db": "EMPLOYEE RECORD\n\nID: EMP-017\nUsername: operator_17\nDepartment: Research\nStatus: Active\n\nBackup reference: NEX-7241",
      "schedule.txt": "Shift Schedule: operator_17 - Night Shift.",
      "internal_notes.txt": "INTERNAL NOTES\n\nEmployee access credentials are generated from the employee's backup reference.\nFormat: NEX-XXXX\nThe reference must be converted to an access code before login.\nSee SECURITY REPORT for the conversion rule.",
      "security_report.txt": "SECURITY REPORT #204\n\nPrevious access system used a simple reference conversion.\nExample: NEX-4821 -> ACCESS-4821\nThe NEX prefix is replaced with ACCESS.\nNo other characters are changed.",
      "archive.txt": "HR records 2024-2025."
    }
  },
  "SERVER-03": {
    name: "SERVER-03",
    system: "DATABASE",
    accessLevel: "EMPLOYEE",
    files: {
      "access.log": "DATABASE ACCESS LOG\n[23:12] user_08 -> DATABASE\n[23:18] admin -> DATABASE\n[23:31] service_backup -> DATABASE\n[23:44] operator_17 -> DATABASE\n[23:45] operator_17 -> BACKUP_SERVICE\n[23:47] service_backup -> DATABASE\n[00:02] user_08 -> DATABASE",
      "incident.log": "SECURITY INCIDENT REPORT\nIncident: INC-1744\nDate: 2025-11-18\n\n23:44 - Employee account accessed database.\n23:45 - Backup service connection established.\n23:46 - Temporary backup created.\nUser involved: operator_17",
      "backup_index.txt": "BACKUP INDEX\nDATA-08 -> employee_08\nDATA-11 -> system_service\nDATA-14 -> archive\nDATA-17 -> employee_17\nDATA-21 -> old_database\n\nBACKUP REFERENCES\nDATA-08 -> INC-1708\nDATA-14 -> INC-1712\nDATA-17 -> INC-1744\nDATA-21 -> INC-1601",
      "database_notes.txt": "DATABASE INFRASTRUCTURE\n\nSERVER-02: HR_SERVICE\nSERVER-03: DATABASE\nSERVER-04: BACKUP_SERVICE [STATUS: LOCKED]\nSERVER-05: SECURITY MONITOR\n\nEmployee backups are handled by BACKUP_SERVICE.\n\n*** RESTRICTED ACCESS NOTICE ***\nBACKUP_SERVICE port is protected.\nTARGET PORT: PORT-8443\n\nTo grant connection access, execute authorization command:\nunlock PORT-8443",
      "system.log": "System health: OPTIMAL.",
      "credentials.enc": "LOCKED: Requires ADMIN privilege."
    }
  },
  "SERVER-04": {
    name: "SERVER-04",
    system: "BACKUP_SERVICE",
    accessLevel: "EMPLOYEE",
    files: {
      "backup_log.txt": "BACKUP SERVICE LOG\n[23:30] Scheduled backup started.\n[23:42] System backup completed.\n[23:44] Employee backup request received.\n[23:45] DATA-17 created.\n[23:46] Backup verification completed.\n[23:47] Backup service returned to standby.\nReference: INC-1744\nStatus: VERIFIED",
      "access_history.txt": "BACKUP ACCESS HISTORY\n[23:44] operator_17 -> backup request\n[23:45] DATA-17 -> created\n[23:46] DATA-17 -> verified\n\nREFERENCE: INC-1744\nFILES ACCESSED:\nsystem_backup.enc\ndata_17.enc",
      "old_projects.txt": "ARCHIVED PROJECTS\nproject_x.enc (Status: ARCHIVED)\nreport_final.enc (Status: OLD REPORT)\narchive_17.enc (Status: EMPLOYEE ARCHIVE)\nThese files are not part of current employee backup system.",
      "system_backup.enc": "ENC_SYS_RAW_DATA",
      "data_17.enc": "ENC_PROJECT_NOVA_CONFIDENTIAL",
      "archive_17.enc": "ENC_OLD_ARCHIVE",
      "report_final.enc": "ENC_OLD_REPORT",
      "project_x.enc": "ENC_PROJECT_X"
    }
  }
};

export function processCommand(input, state) {
  const trimmed = input.trim();
  if (!trimmed) return state;

  const parts = trimmed.split(" ");
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  let newState = { ...state };
  let responseLines = [];
  let detectionDelta = 0;

  newState.history = [...newState.history, { text: `> ${trimmed}`, type: "user" }];

  if (newState.gameStatus !== "PLAYING") {
    newState.history.push({ text: "GAME OVER. Please restart mission.", type: "error" });
    return newState;
  }

  switch (cmd) {
    case "gattouz":
        responseLines = [
            "--------------------------------------------------",
            "REDIRECTING TO EXTERNAL LINK...",
            "ACCESSING SECRET REPOSITORY...",
            "--------------------------------------------------"
        ];
        newState.redirectUrl = "https://rt.pornhub.com/model/gattouz0"; // Замініть на потрібне вам посилання!
        break;

    case "help":
      responseLines = [
        "AVAILABLE COMMANDS:",
        "--------------------------------------------------",
        "  scan              - Scan network for targets/nodes",
        "  connect <target>  - Connect to a remote node/server",
        "  disconnect        - Disconnect from current server",
        "  ls                - List files on current server",
        "  cat <file>        - View file contents",
        "  login <user>      - Authenticate as system user",
        "  pass <password>   - Submit user password",
        "  unlock <port>     - [SECURITY] Authorize & open hidden access port",
        "  decrypt <file>    - Decrypt protected data file",
        "  download <file>   - Extract file to local storage",
        "  clear_logs        - Erase session traces (-10% Detection)",
        "  status            - Display operational telemetry",
        "  whoami            - Display active session identity",
        "  clear             - Clear terminal screen output",
        "  exit              - Terminate NEXUS session",
        "--------------------------------------------------"
      ];
      break;

    case "clear":
      newState.history = [];
      return newState;

    case "status":
      responseLines = [
        `CONNECTION: ${newState.currentServer ? newState.currentServer : "LOCAL (NEXUS)"}`,
        `ACCESS LEVEL: ${newState.accessLevel}`,
        `AUTHENTICATED USER: ${newState.authenticatedUser || "NONE"}`,
        `CURRENT MISSION: 0${newState.currentMission}`,
        `DETECTION LEVEL: ${newState.detection}%`,
        `TOTAL XP: ${newState.xp}`
      ];
      break;

    case "whoami":
      responseLines = [
        `USER: ${newState.authenticatedUser || "agent_nexus"}`,
        `ROLE: ${newState.accessLevel}`
      ];
      break;

    case "scan":
      if (!newState.currentServer) {
        responseLines = [
          "SCANNING...",
          "[01] CC-GATEWAY",
          "[02] PUBLIC-NODE",
          "[03] MAIL-RELAY",
          "",
          "3 nodes detected."
        ];
      } else if (newState.currentServer === "CC-GATEWAY") {
        responseLines = [
          "SCANNING REMOTE SYSTEM...",
          "[01] SERVER-01",
          "[02] SERVER-02",
          "[03] SERVER-03",
          "[04] SERVER-04",
          "[05] SERVER-05",
          "",
          "5 servers detected."
        ];
      } else {
        responseLines = [`No additional sub-nodes detected on ${newState.currentServer}.`];
      }
      break;

    case "connect":
      if (!args[0]) {
        responseLines = ["Usage: connect <server_name>"];
      } else {
        const target = args[0].toUpperCase();
        if (target === "PUBLIC-NODE" || target === "MAIL-RELAY") {
          detectionDelta += 10;
          responseLines = ["CONNECTION FAILED.", "NODE IS NOT AVAILABLE."];
        } else if (VIRTUAL_NETWORK[target]) {
          const srv = VIRTUAL_NETWORK[target];

          // Перевірка 1: Чи заблоковано SERVER-04
          if (target === "SERVER-04" && !newState.server04Unlocked) {
            detectionDelta += 10;
            responseLines = [
              "CONNECTION FAILED.",
              "ERROR: SERVER-04 PORT IS LOCKED.",
              "ACCESS PORT AUTHORIZATION REQUIRED.",
              "HINT: Check database notes on SERVER-03 for the required port."
            ];
          } 
          // Перевірка 2: Потрібен рівень доступу EMPLOYEE
          else if (srv.accessLevel === "EMPLOYEE" && newState.accessLevel !== "EMPLOYEE") {
            detectionDelta += 10;
            responseLines = ["ACCESS DENIED.", "EMPLOYEE CREDENTIALS REQUIRED."];
          } 
          // Успішне підключення
          else {
            newState.currentServer = target;
            responseLines = [
              "CONNECTING...",
              `Connection established.`,
              `REMOTE SYSTEM: CYBERCORE`,
              `SERVER: ${target}`,
              `ACCESS LEVEL: ${srv.accessLevel}`
            ];

            if (target === "SERVER-01" && newState.currentMission === 1) {
              responseLines.push(
                "",
                "[MISSION 01 — FIND THE ENTRY]",
                "Objective: Investigate the employee system and identify the user connected to the suspicious activity."
              );
            }
            if (target === "SERVER-02" && newState.currentMission === 2) {
              responseLines.push(
                "",
                "[MISSION 02 — GET ACCESS]",
                "Objective: Obtain valid credentials for user operator_17."
              );
            }
            if (target === "SERVER-03" && newState.currentMission === 3) {
              responseLines.push(
                "",
                "[MISSION 03 — FOLLOW THE TRAIL]",
                "Objective: Determine where operator_17 accessed the backup system and unlock its access port."
              );
            }
            if (target === "SERVER-04" && newState.currentMission === 3) {
              newState.currentMission = 4;
              newState.xp += 100;
              responseLines.push(
                "",
                "MISSION OBJECTIVE UPDATED:",
                "Find DATA-17.",
                "MISSION 03 COMPLETE. XP +100",
                "",
                "[MISSION 04 — STEAL THE DATA]"
              );
            }
          }
        } else {
          detectionDelta += 5;
          responseLines = [`UNKNOWN HOST: ${target}`];
        }
      }
      break;

    case "unlock":
      if (!args[0]) {
        responseLines = ["Usage: unlock <port_name>"];
      } else if (args[0].toUpperCase() === "PORT-8443") {
        if (newState.currentServer !== "SERVER-03") {
          responseLines = [
            "ACCESS DENIED.",
            "PORT AUTHORIZATION COMMAND MUST BE EXECUTED FROM DATABASE (SERVER-03)."
          ];
        } else {
          newState.server04Unlocked = true;
          responseLines = [
            "--------------------------------------------------",
            "AUTHORIZING PORT-8443...",
            "PORT UNLOCKED SUCCESSFULLY.",
            "FIREWALL RULE UPDATED: SERVER-04 IS NOW ACCESSIBLE.",
            "--------------------------------------------------",
            "NEXT STEP: Execute 'connect SERVER-04'"
          ];
        }
      } else {
        detectionDelta += 5;
        responseLines = [
          "AUTHORIZATION FAILED.",
          `INVALID PORT IDENTIFIER: ${args[0].toUpperCase()}`
        ];
      }
      break;

    case "disconnect":
      if (!newState.currentServer) {
        responseLines = ["Not connected to any remote server."];
      } else {
        const prevServer = newState.currentServer;
        newState.currentServer = null;
        responseLines = [`DISCONNECTING FROM ${prevServer}...`, "Connection closed."];
      }
      break;

    case "ls":
      if (!newState.currentServer || !VIRTUAL_NETWORK[newState.currentServer]) {
        responseLines = ["Local filesystem restricted."];
      } else {
        const files = Object.keys(VIRTUAL_NETWORK[newState.currentServer].files);
        responseLines = files.length > 0 ? files : ["(Directory empty)"];
      }
      break;

    case "cat":
      if (!args[0]) {
        responseLines = ["Usage: cat <filename>"];
      } else if (!newState.currentServer) {
        responseLines = ["No remote host connected."];
      } else {
        const fileName = args[0].toLowerCase();
        const serverFiles = VIRTUAL_NETWORK[newState.currentServer].files;
        if (serverFiles && serverFiles[fileName]) {
          responseLines = serverFiles[fileName].split("\n");

          if (newState.currentMission === 1 && (fileName === "employees.txt" || fileName === "notes.txt")) {
            if (!newState.foundTargetUser) {
              newState.foundTargetUser = true;
              newState.currentMission = 2;
              newState.xp += 50;
              responseLines.push(
                "",
                "----------------------------------------",
                "TARGET IDENTIFIED.",
                "USER: operator_17",
                "MISSION 01 COMPLETE. XP +50",
                "NEXT OBJECTIVE: Obtain employee access credentials."
              );
            }
          }
        } else {
          responseLines = [`cat: ${fileName}: No such file`];
        }
      }
      break;

    case "login":
      if (!args[0]) {
        responseLines = ["Usage: login <username>"];
      } else if (newState.currentServer !== "SERVER-02") {
        responseLines = ["LOGIN SERVICE UNAVAILABLE ON THIS NODE."];
      } else {
        const user = args[0];
        if (user === "operator_17") {
          newState.pendingLoginUser = "operator_17";
          responseLines = ["USERNAME ACCEPTED.", "Enter password using: pass <password>"];
        } else {
          detectionDelta += 15;
          responseLines = ["AUTHENTICATION FAILED. Invalid username."];
        }
      }
      break;

    case "pass":
      if (!newState.pendingLoginUser) {
        responseLines = ["No pending login session."];
      } else if (args[0] === "ACCESS-7241") {
        newState.authenticatedUser = "operator_17";
        newState.accessLevel = "EMPLOYEE";
        newState.pendingLoginUser = null;
        if (newState.currentMission === 2) {
          newState.currentMission = 3;
          newState.xp += 75;
          responseLines = [
            "AUTHENTICATION SUCCESSFUL.",
            "Welcome, operator_17.",
            "ACCESS LEVEL: EMPLOYEE",
            "SERVER-03 UNLOCKED.",
            "MISSION 02 COMPLETE. XP +75"
          ];
        }
      } else {
        detectionDelta += 15;
        newState.pendingLoginUser = null;
        responseLines = ["AUTHENTICATION FAILED. Incorrect password."];
      }
      break;

    case "decrypt":
      if (!args[0]) {
        responseLines = ["Usage: decrypt <filename>"];
      } else if (newState.currentServer !== "SERVER-04") {
        responseLines = ["NO DECRYPTION TOOL LOADED."];
      } else {
        const fileToDecrypt = args[0].toLowerCase();
        if (fileToDecrypt === "data_17.enc") {
          responseLines = [
            "DECRYPTION SUCCESSFUL.",
            "FILE ID: DATA-17",
            "OWNER: operator_17",
            "PROJECT DATA FOUND.",
            "PROJECT: PROJECT_NOVA",
            "CLASSIFICATION: CONFIDENTIAL",
            "STATUS: VERIFIED"
          ];
        } else {
          detectionDelta += 5;
          responseLines = [
            "DECRYPTION FAILED.",
            `FILE TYPE: ${fileToDecrypt.toUpperCase()}`,
            "ACCESS DENIED."
          ];
        }
      }
      break;

    case "download":
      if (!args[0]) {
        responseLines = ["Usage: download <filename>"];
      } else if (newState.currentServer !== "SERVER-04" || args[0].toLowerCase() !== "data_17.enc") {
        responseLines = ["FILE NOT FOUND OR ACCESS RESTRICTED."];
      } else {
        detectionDelta += 23;
        newState.dataDownloaded = true;
        newState.currentMission = 5;
        newState.xp += 200;
        responseLines = [
          "DOWNLOADING...",
          "[████████████████████] 100%",
          "DOWNLOAD COMPLETE.",
          "PROJECT_NOVA successfully extracted.",
          "WARNING: Unusual network activity detected.",
          "",
          "MISSION 04 COMPLETE. XP +200",
          "PROJECT_NOVA STATUS: EXTRACTED",
          "",
          "[MISSION 05 — GET OUT]",
          "Objective: Erase your session traces and leave the system."
        ];
      }
      break;

    case "clear_logs":
      if (newState.currentMission !== 5) {
        responseLines = ["No active breach traces to clear."];
      } else if (newState.logsCleared) {
        responseLines = ["Session logs already cleared."];
      } else {
        newState.logsCleared = true;
        detectionDelta -= 10;
        responseLines = [
          "CLEARING SESSION LOGS...",
          "Temporary session data removed.",
          "Access traces minimized.",
          "DETECTION REDUCED BY 10%"
        ];
      }
      break;

    case "exit":
      if (newState.currentMission === 5 && newState.dataDownloaded) {
        newState.xp += 250;
        if (newState.detection <= 30) newState.xp += 100;
        else if (newState.detection <= 60) newState.xp += 50;

        newState.gameStatus = "VICTORY";
        responseLines = [
          "CLOSING NEXUS SESSION...",
          "Connection terminated.",
          "PROJECT_NOVA: EXTRACTED",
          `FINAL DETECTION: ${newState.detection}%`,
          "STATUS: UNDETECTED",
          "",
          "NEXUS OPERATION — COMPLETE!"
        ];
      } else {
        responseLines = ["NEXUS session paused. Use terminal buttons to close window."];
      }
      break;

    default:
      responseLines = [`Command not recognized: '${cmd}'. Type 'help' for options.`];
      break;
  }

  newState.detection = Math.max(0, Math.min(100, newState.detection + detectionDelta));

  if (newState.detection >= 100) {
    newState.gameStatus = "FAILED";
    responseLines.push(
      "",
      "!!! SYSTEM ALERT !!!",
      "INTRUSION DETECTED.",
      "NEXUS CONNECTION TERMINATED.",
      "PROJECT_NOVA: LOST",
      "MISSION FAILED."
    );
  }

  responseLines.forEach((line) => {
    let type = "system";
    if (line.includes("FAILED") || line.includes("ALERT") || line.includes("DENIED") || line.includes("ERROR")) type = "error";
    if (line.includes("COMPLETE") || line.includes("SUCCESSFUL") || line.includes("UNLOCKED")) type = "success";
    newState.history.push({ text: line, type });
  });

  return newState;
}