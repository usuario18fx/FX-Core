import { handleFx } from "../server/fxHandler";

function parseBody(body: unknown) {
  if (!body) return {};
  if (typeof body === "object") return body;
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return {};
}

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }

  try {
    const out = await handleFx(parseBody(req.body));
    res.status(out.status).json(out.body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "internal_error";
    res.status(500).json({
      ok: false,
      text: "FX API encountered an internal error.",
      error: message,
    });
  }
}
