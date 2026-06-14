import { execFile } from "node:child_process";
import { createServer, type Server } from "node:net";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const scriptPath = join(process.cwd(), "scripts", "dev-lan.mjs");
let occupiedServer: Server | null = null;

async function occupyPort(host = "0.0.0.0") {
  const server = createServer();

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, host, () => resolve());
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Could not reserve a TCP port for test.");
  }

  occupiedServer = server;

  return address.port;
}

async function closeOccupiedServer() {
  if (!occupiedServer) {
    return;
  }

  const server = occupiedServer;
  occupiedServer = null;

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

describe("dev LAN port preflight", () => {
  afterEach(async () => {
    await closeOccupiedServer();
  });

  async function expectPortPreflightToFail(port: number) {
    await execFileAsync(process.execPath, [scriptPath, "--port", String(port)], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        SKY_BEACON_DEV_LAN_ADDRESSES: "192.168.10.96",
        SKY_BEACON_DEV_LAN_HOSTNAME: "Test-Host",
      },
      timeout: 5_000,
    });
  }

  async function assertOccupiedPortFailure(port: number) {
    try {
      await expectPortPreflightToFail(port);

      throw new Error("Expected dev-lan script to fail when port is occupied.");
    } catch (error) {
      const commandError = error as Error & {
        code?: number | string;
        stderr?: string;
        stdout?: string;
      };
      const output = `${commandError.stdout ?? ""}${commandError.stderr ?? ""}`;

      expect(commandError.code).not.toBe(0);
      expect(output).toContain(`Port ${port} is already in use or unavailable.`);
      expect(output).toContain("Stop the stale process");
      expect(output).not.toContain("Next.js");
      expect(output).not.toContain("Ready in");
    }
  }

  it("exits before starting Next when the requested port is already occupied", async () => {
    const port = await occupyPort();

    await assertOccupiedPortFailure(port);
  });

  it("detects an occupied IPv6 wildcard listener like Next uses on Windows", async () => {
    let port: number;

    try {
      port = await occupyPort("::");
    } catch {
      return;
    }

    await assertOccupiedPortFailure(port);
  });
});
