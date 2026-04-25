import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const win = process.platform === "win32";

function resolvePython() {
  if (process.env.STREETS_PYTHON) {
    return process.env.STREETS_PYTHON;
  }
  const venvPython = win
    ? path.join(root, ".venv", "Scripts", "python.exe")
    : path.join(root, ".venv", "bin", "python");
  if (existsSync(venvPython)) {
    return venvPython;
  }
  return win ? "python" : "python3";
}

const python = resolvePython();
const backendPath = path.join(root, "backend");

const env = {
  ...process.env,
  PYTHONPATH: backendPath,
  STREETS_CORS_ORIGINS:
    process.env.STREETS_CORS_ORIGINS ??
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001"
};

const child = spawn(
  python,
  ["-m", "uvicorn", "app.main:app", "--reload", "--host", "127.0.0.1", "--port", "8000"],
  {
    cwd: root,
    env,
    stdio: "inherit",
    shell: false
  }
);

child.on("error", (err) => {
  console.error("Failed to start API:", err.message);
  console.error("Install deps with: pip install -r backend/requirements.txt");
  console.error("Use a repo-root .venv or set STREETS_PYTHON to your python executable.");
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.exit(1);
  }
  process.exit(code ?? 0);
});
