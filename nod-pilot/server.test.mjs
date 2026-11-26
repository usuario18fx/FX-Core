import test from "node:test";
import assert from "node:assert/strict";
import { createPilotServer } from "./server.mjs";

const TOKEN = "test-only-token-1234567890-abcdefghijklmnopqrstuvwxyz";
async function withServer(run) {
  const server = createPilotServer({
    token: TOKEN,
    readPage: async (pageId) => ({ pageId, title: "Fixture", excerpt: "Public page only", readOnly: true }),
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const url = "http://127.0.0.1:" + address.port;
  try { await run(url); } finally {
    await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
  }
}
const rpc = (method, params = {}, id = 1) => ({
  jsonrpc: "2.0", id, method, params,
});
async function request(url, body, token = TOKEN, headers = {}) {
  return fetch(url + "/mcp", {
    method: "POST",
    headers: { "content-type": "application/json",
      ...(token ? { authorization: "Bearer " + token } : {}), ...headers },
    body: JSON.stringify(body),
  });
}
test("health is safe and server listens only where chosen", async () => {
  await withServer(async (url) => {
    const r = await fetch(url + "/health");
    assert.equal(r.status, 200);
    assert.equal((await r.json()).readOnly, true);
  });
});
test("requires a strong bearer token", async () => {
  assert.throws(() => createPilotServer({ token: "weak" }));
  await withServer(async (url) => {
    assert.equal((await request(url, rpc("tools/list"), "")).status, 401);
    assert.equal((await request(url, rpc("tools/list"), "wrong-token")).status, 401);
    assert.equal((await request(url, rpc("tools/list"))).status, 200);
  });
});
test("supports MCP handshake and exposes exactly one read tool", async () => {
  await withServer(async (url) => {
    const init = await (await request(url, rpc("initialize"))).json();
    assert.equal(init.result.protocolVersion, "2025-06-18");
    const result = await (await request(url, rpc("tools/list"))).json();
    assert.deepEqual(result.result.tools.map(t => t.name), ["fx_read_public_page"]);
    assert.equal(result.result.tools[0].annotations.readOnlyHint, true);
  });
});
test("rejects arbitrary URLs, unknown tools and extra arguments", async () => {
  await withServer(async (url) => {
    for (const [name, args] of [
      ["fx_read_public_page", { pageId: "http://127.0.0.1:4444/admin" }],
      ["fx_read_public_page", { pageId: "fxcity", url: "http://localhost/" }],
      ["fx_write_file", { path: "x" }],
    ]) {
      const result = await (await request(url, rpc("tools/call", { name, arguments: args }))).json();
      assert.equal(result.error.code, -32602);
    }
  });
});
test("approved call returns only the public read result", async () => {
  await withServer(async (url) => {
    const result = await (await request(url, rpc("tools/call", {
      name: "fx_read_public_page", arguments: { pageId: "nod_docs" },
    }))).json();
    assert.equal(result.result.isError, false);
    assert.equal(JSON.parse(result.result.content[0].text).pageId, "nod_docs");
  });
});
test("refuses browser origin attacks, writes, and unsupported methods", async () => {
  await withServer(async (url) => {
    assert.equal((await request(url, rpc("tools/list"), TOKEN, {
      origin: "https://attacker.example",
    })).status, 403);
    assert.equal((await fetch(url + "/mcp")).status, 405);
    assert.equal((await request(url, rpc("exec", { command: "rm -rf /" }))).status, 200);
    const unknown = await (await request(url, rpc("exec"))).json();
    assert.equal(unknown.error.code, -32601);
  });
});
test("MCP notification is accepted without creating a tool result", async () => {
  await withServer(async (url) => {
    const r = await request(url, { jsonrpc: "2.0", method: "notifications/initialized" });
    assert.equal(r.status, 202);
    assert.equal(await r.text(), "");
  });
});
