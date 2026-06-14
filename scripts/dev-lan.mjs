/* global console, process */
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { networkInterfaces, hostname as systemHostname } from "node:os";
import { URL, fileURLToPath } from "node:url";

const DEFAULT_PORT = "3001";
const HOST = "0.0.0.0";
const INTERNAL_ADDRESS_ENV = "SKY_BEACON_DEV_LAN_ADDRESSES";
const INTERNAL_HOSTNAME_ENV = "SKY_BEACON_DEV_LAN_HOSTNAME";
const NEXT_BIN = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));

export function normalizeAllowedDevOrigin(value) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("*.")) {
    return trimmed.toLowerCase();
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.hostname) {
      return parsed.hostname.toLowerCase();
    }
  } catch {
    // Values in NEXT_ALLOWED_DEV_ORIGINS are often hostnames without protocols.
  }

  const hostLike = trimmed.split("/")[0]?.trim();

  if (!hostLike) {
    return null;
  }

  if (hostLike.startsWith("[") && hostLike.includes("]")) {
    return hostLike.slice(1, hostLike.indexOf("]")).toLowerCase();
  }

  const withoutPort = hostLike.includes(":") ? hostLike.split(":")[0] : hostLike;
  return withoutPort.toLowerCase();
}

export function splitOriginList(value) {
  return value
    .split(",")
    .map(normalizeAllowedDevOrigin)
    .filter(Boolean);
}

export function findLocalIPv4Addresses(env = process.env) {
  const override = env[INTERNAL_ADDRESS_ENV];

  if (override) {
    return splitOriginList(override);
  }

  const addresses = [];
  const interfaces = networkInterfaces();

  for (const networkInterface of Object.values(interfaces)) {
    for (const address of networkInterface ?? []) {
      if (address.family === "IPv4" && !address.internal) {
        addresses.push(address.address);
      }
    }
  }

  return addresses;
}

export function buildLanConfig(env = process.env) {
  const port = env.PORT || env.NEXT_PORT || DEFAULT_PORT;
  const hostname = env[INTERNAL_HOSTNAME_ENV] || systemHostname();
  const detectedAddresses = findLocalIPv4Addresses(env);
  const manualOrigins = splitOriginList(env.NEXT_ALLOWED_DEV_ORIGINS ?? "");
  const allowedDevOrigins = [
    "localhost",
    "127.0.0.1",
    hostname,
    ...detectedAddresses,
    ...manualOrigins,
  ]
    .map(normalizeAllowedDevOrigin)
    .filter(Boolean);
  const uniqueAllowedDevOrigins = Array.from(new Set(allowedDevOrigins));
  const urls = detectedAddresses.map((address) => `http://${address}:${port}`);

  return {
    allowedDevOrigins: uniqueAllowedDevOrigins,
    bindHost: HOST,
    port,
    urls,
  };
}

function shouldIgnorePortProbeError(error) {
  return error?.code === "EAFNOSUPPORT" || error?.code === "EADDRNOTAVAIL";
}

function checkSinglePortAvailable(port, host) {
  return new Promise((resolve) => {
    const server = createServer();
    let settled = false;

    function finish(result) {
      if (settled) {
        return;
      }

      settled = true;
      resolve(result);
    }

    server.once("error", (error) => {
      finish({ available: false, error });
    });

    server.once("listening", () => {
      server.close(() => finish({ available: true }));
    });

    server.listen(Number(port), host);
  });
}

export async function checkPortAvailable(port, host = HOST) {
  const hosts = Array.from(new Set([host, "::", "127.0.0.1", "::1"]));

  for (const hostToCheck of hosts) {
    const result = await checkSinglePortAvailable(port, hostToCheck);

    if (!result.available && !shouldIgnorePortProbeError(result.error)) {
      return { ...result, host: hostToCheck };
    }
  }

  return { available: true };
}

function readArgs(args) {
  const options = {
    printOrigins: false,
    port: undefined,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--print-origins" || arg === "--dry-run") {
      options.printOrigins = true;
      continue;
    }

    if (arg === "--port" || arg === "-p") {
      options.port = args[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith("--port=")) {
      options.port = arg.slice("--port=".length);
    }
  }

  return options;
}

function printLanUrls(config) {
  console.log(`Starting Sky Beacon LAN dev server on http://localhost:${config.port}`);
  console.log(`Allowed Next dev origins: ${config.allowedDevOrigins.join(", ")}`);

  if (config.urls.length > 0) {
    console.log("Open one of these URLs from your phone on the same Wi-Fi:");
    for (const url of config.urls) {
      console.log(`  ${url}`);
    }
  } else {
    console.log("No non-internal IPv4 address was detected. Check Wi-Fi/VPN settings if the phone cannot connect.");
  }
}

function printPortUnavailable(port, error, host) {
  console.error(`Port ${port} is already in use or unavailable.`);
  console.error("An old Sky Beacon dev server may still be running, so your phone can keep hitting stale config.");
  console.error(`Failed port probe host: ${host ?? "unknown"}`);

  if (error?.message) {
    console.error(`Node reported: ${error.message}`);
  }

  console.error("");
  console.error("Find the process on Windows:");
  console.error(`  Get-NetTCPConnection -LocalPort ${port} | Select-Object LocalAddress,LocalPort,State,OwningProcess`);
  console.error("  Get-CimInstance Win32_Process -Filter \"ProcessId = <OwningProcess>\" | Select-Object ProcessId,ParentProcessId,CommandLine");
  console.error("");
  console.error("Stop the stale process, then run npm run dev:lan again.");
}

const args = readArgs(process.argv.slice(2));
const env = {
  ...process.env,
  ...(args.port ? { PORT: args.port } : {}),
};
const config = buildLanConfig(env);

if (args.printOrigins) {
  console.log(JSON.stringify(config, null, 2));
} else {
  const portCheck = await checkPortAvailable(config.port, config.bindHost);

  if (!portCheck.available) {
    printPortUnavailable(config.port, portCheck.error, portCheck.host);
    process.exit(1);
  }

  printLanUrls(config);

  const child = spawn(process.execPath, [NEXT_BIN, "dev", "-H", config.bindHost, "-p", config.port], {
    env: {
      ...process.env,
      NEXT_ALLOWED_DEV_ORIGINS: config.allowedDevOrigins.join(","),
      PORT: config.port,
    },
    stdio: "inherit",
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}
