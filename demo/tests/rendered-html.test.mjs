import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the HablaPE demo", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(
    html,
    /<title>HablaPE — Orientación clara para actuar informado<\/title>/i,
  );
  assert.match(html, /Conoce el procedimiento\./);
  assert.match(html, /Control de identidad policial/);
  assert.match(html, /Reclamo por una compra/);
  assert.match(html, /Demo · is_synthetic=true/);
  assert.match(html, /No es asesoría legal/);
  assert.match(html, /https:\/\/www\.tc\.gob\.pe/);
  assert.doesNotMatch(html, /Your site is taking shape|react-loading-skeleton/);
});

test("renders Spanish metadata and privacy guardrails", async () => {
  const response = await render();
  const html = await response.text();

  assert.match(html, /<html[^>]*lang=["']es["']/i);
  assert.match(html, /Sin guardar tus datos/);
  assert.match(html, /No escribas nombres, DNI, dirección ni otros datos reales/);
  assert.match(html, /is_synthetic=true/);
  assert.match(html, /og\.png/);
});
