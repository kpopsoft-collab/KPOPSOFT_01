import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";

const port = 4173;
const widgetPath = resolve(process.cwd(), "public/widgets/kpopsoft-billing.v1.js");

function send(response, status, type, body) {
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Type": `${type}; charset=utf-8`,
  });
  response.end(body);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);
  if (url.pathname === "/health") {
    send(response, 200, "text/plain", "ok");
    return;
  }
  if (url.pathname === "/widgets/kpopsoft-billing.v1.js") {
    send(response, 200, "text/javascript", await readFile(widgetPath, "utf8"));
    return;
  }
  if (url.pathname === "/token") {
    send(response, 200, "application/json", JSON.stringify({ token: "fixture.payload" }));
    return;
  }
  if (url.pathname === "/token-denied") {
    send(response, 401, "application/json", JSON.stringify({ error: "AUTHENTICATION_REQUIRED" }));
    return;
  }
  if (url.pathname === "/pay/handoff/synthetic") {
    send(response, 200, "text/html", "<!doctype html><title>결제 세션</title><h1>합성 결제 세션</h1>");
    return;
  }
  if (url.pathname === "/") {
    const tokenEndpoint = url.searchParams.get("token") === "denied" ? "/token-denied" : "/token";
    send(
      response,
      200,
      "text/html",
      `<!doctype html>
<html lang="ko">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Billing Widget Fixture</title>
<style>html,body{margin:0;padding:0}main{width:min(100% - 24px,720px);margin:24px auto}</style>
<main>
  <script src="/widgets/kpopsoft-billing.v1.js" defer></script>
  <kpopsoft-billing public-id="wgt_fixture_public" token-endpoint="${tokenEndpoint}"></kpopsoft-billing>
</main>
</html>`,
    );
    return;
  }
  send(response, 404, "text/plain", "not found");
});

server.listen(port, "127.0.0.1");

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
