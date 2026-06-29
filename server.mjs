import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const contentTypes = {
  ".html":"text/html; charset=utf-8",
  ".js":"text/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8",
  ".svg":"image/svg+xml",
  ".json":"application/json; charset=utf-8"
};
const publicFiles = new Set(["index.html","app.js","styles.css"]);
let cachedWorldCup = null;
let pendingWorldCupRequest = null;

async function fetchWorldCup(token) {
  if (cachedWorldCup?.expiresAt > Date.now()) return cachedWorldCup;
  if (pendingWorldCupRequest) return pendingWorldCupRequest;

  pendingWorldCupRequest = (async () => {
    const upstream = await fetch("https://api.football-data.org/v4/competitions/WC/matches?season=2026",{
      headers:{
        "X-Auth-Token":token,
        "X-Unfold-Goals":"true"
      }
    });
    const body = await upstream.text();
    const headers = {"content-type":upstream.headers.get("content-type") || "application/json"};
    for (const name of ["x-requests-available-minute","x-requestcounter-reset","retry-after"]) {
      const value = upstream.headers.get(name);
      if (value) headers[name] = value;
    }

    const result = {status:upstream.status,body,headers,expiresAt:Date.now() + 45_000};
    if (upstream.ok) cachedWorldCup = result;
    return result;
  })().finally(() => {
    pendingWorldCupRequest = null;
  });

  return pendingWorldCupRequest;
}

async function proxyWorldCup(request,response) {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) {
    response.writeHead(503,{"content-type":"application/json"});
    response.end(JSON.stringify({message:"FOOTBALL_DATA_TOKEN is not configured on the server"}));
    return;
  }

  try {
    const result = await fetchWorldCup(token);
    response.writeHead(result.status,{
      ...result.headers,
      "cache-control":"public, max-age=15, s-maxage=45, stale-while-revalidate=60"
    });
    response.end(result.body);
  } catch {
    response.writeHead(502,{"content-type":"application/json"});
    response.end(JSON.stringify({message:"Unable to reach football-data.org"}));
  }
}

async function serveFile(request,response) {
  const pathname = new URL(request.url,"http://localhost").pathname;
  const requested = pathname === "/" ? "index.html" : pathname.slice(1);
  const isPublic = publicFiles.has(requested) || requested.startsWith("assets/");
  if (!isPublic || requested.includes("..")) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }
  const filename = path.resolve(root,requested);
  if (!filename.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  try {
    const body = await readFile(filename);
    response.writeHead(200,{"content-type":contentTypes[path.extname(filename)] || "application/octet-stream"});
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}

http.createServer(async (request,response) => {
  if (request.url?.startsWith("/api/world-cup")) {
    await proxyWorldCup(request,response);
    return;
  }
  await serveFile(request,response);
}).listen(port,"0.0.0.0",()=>{
  console.log(`World Cup bracket running at http://localhost:${port}`);
});
