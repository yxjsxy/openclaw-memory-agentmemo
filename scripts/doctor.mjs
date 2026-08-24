#!/usr/bin/env node
/**
 * Probe AgentMemo health so first-run / ClawHub installs fail fast
 * instead of hanging on a dead memory backend.
 *
 * Usage:
 *   npm run doctor
 *   node scripts/doctor.mjs
 *   node scripts/doctor.mjs http://localhost:8790/health
 *
 * AgentMemo: https://github.com/yxjsxy/agentMemo
 */

const DEFAULT_URL = "http://localhost:8790/health";
const TIMEOUT_MS = 5000;

const url = process.argv[2] ?? DEFAULT_URL;

async function main() {
  console.log(`AgentMemo doctor: GET ${url} (timeout ${TIMEOUT_MS}ms)`);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      console.error(
        `AgentMemo health check failed: HTTP ${res.status} ${res.statusText}`,
      );
      console.error(
        "Start the AgentMemo server first: https://github.com/yxjsxy/agentMemo",
      );
      process.exit(1);
    }

    let body = "";
    try {
      body = await res.text();
    } catch {
      // Status was OK; body is optional.
    }

    console.log(`OK ${res.status}${body ? ` ${body}` : ""}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const timedOut =
      (err instanceof Error && err.name === "TimeoutError") ||
      /abort|timeout/i.test(message);

    if (timedOut) {
      console.error(
        `AgentMemo health check timed out after ${TIMEOUT_MS}ms: ${url}`,
      );
    } else {
      console.error(`AgentMemo health check failed: ${message}`);
    }
    console.error(
      "Start the AgentMemo server first: https://github.com/yxjsxy/agentMemo",
    );
    process.exit(1);
  }
}

await main();
