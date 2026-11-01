import test from "node:test";
import assert from "node:assert/strict";
import { healthCheckResponse } from "../src/app/api/health/health-diagnostics.ts";

const logPrefix = "[api/health] PostgreSQL connection failed ";
const syntheticSecret = "synthetic-secret-do-not-log";

function errorWith(message: string, code?: string, syscall?: string): Error {
  return Object.assign(new Error(message), { code, syscall });
}

test("health route loads and keeps its generic 500 response when DATABASE_URL is missing", async () => {
  assert.equal("DATABASE_URL" in process.env, false);

  const logLines: string[] = [];
  const originalError = console.error;
  console.error = (...values: unknown[]) => logLines.push(values.join(" "));
  try {
    const { GET } = await import("../src/app/api/health/route.ts");
    const response = await GET();

    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { ok: false });
  } finally {
    console.error = originalError;
  }

  assert.equal(logLines.length, 1);
  assert.deepEqual(JSON.parse(logLines[0].slice(logPrefix.length)), {
    category: "missing_configuration",
  });
  assert.ok(!logLines[0].includes(syntheticSecret));
});

test("health check returns the original success response without logging", async () => {
  const logLines: string[] = [];
  const response = await healthCheckResponse(async () => undefined, (line) => logLines.push(line));

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.deepEqual(logLines, []);
});

const failures: Array<{
  name: string;
  error: Error;
  expected: Record<string, string>;
}> = [
  {
    name: "PostgreSQL authentication failure",
    error: errorWith(`password rejected for ${syntheticSecret}`, "28P01"),
    expected: { category: "authentication", code: "28P01" },
  },
  {
    name: "DNS resolution failure",
    error: errorWith(`lookup failed for ${syntheticSecret}`, "ENOTFOUND", "getaddrinfo"),
    expected: { category: "dns", code: "ENOTFOUND", syscall: "getaddrinfo" },
  },
  {
    name: "connection refused",
    error: errorWith(`connection failed for ${syntheticSecret}`, "ECONNREFUSED", "connect"),
    expected: { category: "connection_refused", code: "ECONNREFUSED", syscall: "connect" },
  },
  {
    name: "connection timeout",
    error: errorWith(`Connection terminated due to connection timeout: ${syntheticSecret}`),
    expected: { category: "timeout" },
  },
  {
    name: "TLS negotiation failure",
    error: errorWith(`TLS failure involving ${syntheticSecret}`, "ERR_SSL_WRONG_VERSION_NUMBER"),
    expected: { category: "tls", code: "ERR_SSL_WRONG_VERSION_NUMBER" },
  },
  {
    name: "additional Node TLS code",
    error: errorWith("TLS handshake failed", "ERR_SSL_TLSV1_ALERT_HANDSHAKE_FAILURE"),
    expected: { category: "tls", code: "ERR_SSL_TLSV1_ALERT_HANDSHAKE_FAILURE" },
  },
  {
    name: "other PostgreSQL SQLSTATE remains visible",
    error: errorWith("database returned a safe SQLSTATE", "3D000"),
    expected: { category: "other", code: "3D000" },
  },
  {
    name: "missing DATABASE_URL",
    error: errorWith("DATABASE_URL is required"),
    expected: { category: "missing_configuration" },
  },
  {
    name: "unknown and unsafe diagnostic fields",
    error: errorWith(syntheticSecret, syntheticSecret, syntheticSecret),
    expected: { category: "other" },
  },
];

for (const scenario of failures) {
  test(`health failure logs safe diagnostics for ${scenario.name}`, async () => {
    const logLines: string[] = [];
    const response = await healthCheckResponse(
      async () => {
        throw scenario.error;
      },
      (line) => logLines.push(line),
    );

    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { ok: false });
    assert.equal(logLines.length, 1);
    assert.deepEqual(JSON.parse(logLines[0].slice(logPrefix.length)), scenario.expected);
    assert.ok(!logLines[0].includes(syntheticSecret));
  });
}

