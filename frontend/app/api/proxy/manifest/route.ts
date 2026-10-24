import { verifyToken, signToken, ProxyNotConfiguredError } from "@/app/lib/proxy/signing";
import { safeFetch } from "@/app/lib/proxy/upstream";
export const runtime = "edge";
const bad = (status:number, message:string) => new Response(message, { status });
async function make(kind:string, url:string, base:string, headers:any) { return `/api/proxy/${kind}?t=${encodeURIComponent(await signToken({u:new URL(url, base).toString(), h:headers}))}`; }
async function route(req:Request) {
  if (req.method === "OPTIONS") return new Response(null,{status:204});
  const token = new URL(req.url).searchParams.get("t"); if (!token) return bad(403,"invalid or expired token");
  let payload:any; try { payload = await verifyToken(token); } catch (error) { const configured = error instanceof ProxyNotConfiguredError; return bad(configured?500:403, configured?"proxy_not_configured":"invalid or expired token"); }
  let upstream:any; try { upstream = await safeFetch(payload.u,{headers:payload.h,timeoutMs:15000}); } catch { return bad(502,"upstream fetch failed"); }
  if (!upstream.response.ok) return bad(502,`upstream status ${upstream.response.status}`);
  const text = await upstream.response.text(); if (text.length > 3000000) return bad(502,"playlist too large");
  if (!text.replace(/^\uFEFF/,"").trimStart().startsWith("#EXTM3U")) return bad(502,"upstream did not return a playlist");
  const lines=text.split(/\r?\n/), out:string[]=[]; let variant=false;
  for (const line of lines) { if (line.startsWith("#EXT-X-STREAM-INF")) { variant=true; out.push(line); continue; } if (line.startsWith("#")) { const kind=line.includes("EXT-X-MEDIA")||line.includes("EXT-X-I-FRAME-STREAM-INF")?"manifest":"segment"; let next=line; for (const match of line.matchAll(/URI="([^"]+)"/g)) next=next.replace(`URI="${match[1]}"`,`URI="${await make(kind,match[1],upstream.finalUrl,payload.h)}"`); out.push(next); continue; } if (!line.trim()) { out.push(line); continue; } out.push(await make(variant?"manifest":"segment",line,upstream.finalUrl,payload.h)); variant=false; }
  const output=out.join("\n"); const ended=output.includes("#EXT-X-ENDLIST");
  return new Response(output,{headers:{"content-type":"application/vnd.apple.mpegurl","cache-control":ended?"private, max-age=300":"private, max-age=0, must-revalidate"}});
}
export async function GET(req:Request) { try { return await route(req); } catch (error) { const configured=error instanceof ProxyNotConfiguredError; return bad(configured?500:502,configured?"proxy_not_configured":"upstream error"); } }
export function OPTIONS() { return new Response(null,{status:204}); }
