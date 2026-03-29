import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// This file uses .mts extension so Playwright loads it as ESM via dynamic
// import() — required for consistency with global-setup.mts.
// process.cwd() is the project root when Playwright runs from there.
const STATE_FILE = path.resolve(process.cwd(), "e2e", ".e2e-state.json");

async function globalTeardown() {
  if (fs.existsSync(STATE_FILE)) {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));

    // Kill the Next.js dev server
    if (state.devServerPid) {
      try {
        process.kill(state.devServerPid, "SIGTERM");
        process.stderr.write(`[globalTeardown] Killed dev server (pid ${state.devServerPid})\n`);
      } catch {
        // Process may already be gone
      }
    }

    // Stop the container by ID
    try {
      execSync(`docker stop ${state.containerId}`, { stdio: "pipe" });
      execSync(`docker rm ${state.containerId}`, { stdio: "pipe" });
      process.stderr.write("[globalTeardown] Container stopped and removed\n");
    } catch {
      // Container may already be stopped
    }

    fs.unlinkSync(STATE_FILE);
  }
}

export default globalTeardown;
