import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import net from "net";

// This file uses .mts extension so Playwright loads it as ESM via dynamic
// import() — required because @testcontainers/postgresql is a pure ESM package.
// process.cwd() is the project root when Playwright runs from there.
const STATE_FILE = path.resolve(process.cwd(), "e2e", ".e2e-state.json");

function waitForPort(port: number, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    function tryConnect() {
      const socket = new net.Socket();
      socket.setTimeout(1000);
      socket.on("connect", () => {
        socket.destroy();
        resolve();
      });
      socket.on("error", () => {
        socket.destroy();
        if (Date.now() > deadline) {
          reject(new Error(`Port ${port} not available after ${timeoutMs}ms`));
        } else {
          setTimeout(tryConnect, 500);
        }
      });
      socket.on("timeout", () => {
        socket.destroy();
        if (Date.now() > deadline) {
          reject(new Error(`Port ${port} timeout after ${timeoutMs}ms`));
        } else {
          setTimeout(tryConnect, 500);
        }
      });
      socket.connect(port, "127.0.0.1");
    }
    tryConnect();
  });
}

async function globalSetup() {
  const container = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("anymall_e2e")
    .withUsername("test")
    .withPassword("test")
    .start();

  const databaseUrl = container.getConnectionUri();

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    DATABASE_URL_UNPOOLED: databaseUrl,
  };

  // Run migrations
  execSync("npx prisma migrate deploy", { env, stdio: "pipe" });

  // Run seed
  execSync("npx prisma db seed", { env, stdio: "pipe" });

  // Spawn Next.js dev server in the background with the test DB URL.
  // We cannot use Playwright's webServer config for this because the webServer
  // plugin runs before globalSetup in Playwright's task queue, which would
  // deadlock: the server can't start without the DB URL, but globalSetup can't
  // run until the server finishes starting.
  const devServer = spawn("npm", ["run", "dev"], {
    env: {
      ...env,
      SENDGRID_API_KEY: "placeholder",
      EMAIL_FROM: "test@localhost",
      ADMIN_PIN: "0000",
    },
    stdio: "pipe",
    detached: false,
  });

  devServer.on("error", (err: Error) => {
    process.stderr.write(`[globalSetup] Next.js spawn error: ${err}\n`);
  });

  // Wait for port 3000 to be available before handing control back to Playwright
  await waitForPort(3000, 120_000);

  // Save state for teardown
  fs.writeFileSync(STATE_FILE, JSON.stringify({
    containerId: container.getId(),
    databaseUrl,
    devServerPid: devServer.pid,
  }));

  // Set env vars for any in-process access
  process.env.DATABASE_URL = databaseUrl;
  process.env.DATABASE_URL_UNPOOLED = databaseUrl;
}

export default globalSetup;
