import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

interface LanDryRunOutput {
  allowedDevOrigins: string[];
  bindHost: string;
  port: string;
  urls: string[];
}

async function printOrigins(env: Record<string, string>) {
  const scriptPath = join(process.cwd(), "scripts", "dev-lan.mjs");
  const { stdout } = await execFileAsync(process.execPath, [scriptPath, "--print-origins", "--port", "3131"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...env,
    },
  });

  return JSON.parse(stdout) as LanDryRunOutput;
}

describe("dev LAN origin wrapper", () => {
  it("normalizes manual origins and includes detected LAN addresses", async () => {
    const output = await printOrigins({
      NEXT_ALLOWED_DEV_ORIGINS: " http://phone.local:3001 , manual.local:3001 , *.test.local ",
      SKY_BEACON_DEV_LAN_ADDRESSES: "192.168.10.96, 10.0.0.8:3001",
      SKY_BEACON_DEV_LAN_HOSTNAME: "Test-Host",
    });

    expect(output.bindHost).toBe("0.0.0.0");
    expect(output.port).toBe("3131");
    expect(output.allowedDevOrigins).toEqual(
      expect.arrayContaining([
        "localhost",
        "127.0.0.1",
        "test-host",
        "192.168.10.96",
        "10.0.0.8",
        "phone.local",
        "manual.local",
        "*.test.local",
      ]),
    );
    expect(output.allowedDevOrigins).not.toContain("http://phone.local:3001");
    expect(output.allowedDevOrigins).not.toContain("manual.local:3001");
    expect(output.urls).toEqual(["http://192.168.10.96:3131", "http://10.0.0.8:3131"]);
  });
});
