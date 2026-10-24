import { verifyToken, ProxyNotConfiguredError } from "@/app/lib/proxy/signing";
import { handleSegment } from "@/app/lib/proxy/segment-handler";
export const runtime = "edge";
export async function GET(req: Request) { const token = new URL(req.url).searchParams.get("t"); if (!token) return new Response("invalid or expired token", { status: 403 }); try { return await handleSegment(req, await verifyToken(token)); } catch (error) { const configured = !(error instanceof ProxyNotConfiguredError); return new Response(configured ? "invalid or expired token" : "proxy_not_configured", { status: configured ? 403 : 500 }); } }
export function OPTIONS() { return new Response(null, { status: 204 }); }
