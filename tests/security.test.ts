import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, assertLocalRequest, assertSameOrigin, takeRateLimit } from "../src/lib/locator/security.ts";
test("senha usa salt, valida o hash e rejeita segredo incorreto ou hash corrompido", async () => {
  const hash = await hashPassword("test-only-password");
  assert.ok(!hash.includes("test-only-password"));
  assert.notEqual(hash, await hashPassword("test-only-password"));
  assert.equal(await verifyPassword("test-only-password", hash), true);
  assert.equal(await verifyPassword("wrong", hash), false);
  assert.equal(await verifyPassword("wrong", "invalid"), false);
});
test("demo local bloqueia host externo e operações de outra origem", () => {
  assert.throws(() => assertLocalRequest(new Request("https://example.com/api"), true));
  assert.doesNotThrow(() => assertLocalRequest(new Request("http://localhost:3218/api"), true));
  assert.throws(() => assertSameOrigin(new Request("http://localhost:3218/api", {headers:{origin:"https://evil.example"}})));
  assert.throws(() => assertSameOrigin(new Request("http://localhost:3218/api")));
  assert.doesNotThrow(() => assertSameOrigin(new Request("http://localhost:3218/api", {headers:{origin:"http://localhost:3218"}})));
});
test("limite de tentativas impede abuso e volta a liberar depois da janela", () => {
  const key = "test-" + Math.random();
  assert.equal(takeRateLimit(key, 2, 1000, 0), true);
  assert.equal(takeRateLimit(key, 2, 1000, 100), true);
  assert.equal(takeRateLimit(key, 2, 1000, 200), false);
  assert.equal(takeRateLimit(key, 2, 1000, 1001), true);
});
test("origem usa o Host real quando o Next normaliza a URL interna para localhost", () => {
  assert.doesNotThrow(() => assertSameOrigin(new Request("http://localhost:3218/api", {headers:{host:"127.0.0.1:3218",origin:"http://127.0.0.1:3218"}})));
  assert.throws(() => assertLocalRequest(new Request("http://localhost:3218/api", {headers:{host:"externo.example"}}),true));
  assert.throws(() => assertSameOrigin(new Request("http://localhost:3218/api", {headers:{host:"127.0.0.1:3218",origin:"http://localhost:3218"}})));
});

