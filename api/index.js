import { renderPage } from "vike/server";
import { telefunc } from "telefunc";

/**
 * Vercel serverless handler for SSR + Telefunc
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export default async function handler(req, res) {
    const url = req.url ?? "/";

    // Handle Telefunc RPC
    if (url.startsWith("/_telefunc")) {
        const contentType = req.headers["content-type"] || "";

        // Add res.clearCookie for logout (Express compatibility)
        const resWithCookie = Object.assign(res, {
            clearCookie(name, opts = {}) {
                const { path = "/", ...rest } = opts;
                res.setHeader(
                    "Set-Cookie",
                    `${name}=; Path=${path}; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly`
                );
            },
        });

        const httpResponse = await telefunc({
            url,
            method: req.method ?? "GET",
            readable: req,
            contentType,
            context: { req, res: resWithCookie },
        });

        res.statusCode = httpResponse.statusCode;
        res.setHeader("content-type", httpResponse.contentType);
        res.end(httpResponse.body);
        return;
    }

    // SSR with Vike - use original URL from Vercel rewrite if available
    const originalUrl = req.headers["x-invoke-path"] ?? req.headers["x-middleware-request-path"] ?? url;
    let urlToRender = originalUrl.startsWith("/") ? originalUrl : url;
    // Vercel rewrite can pass /api as url - fallback to / for SPA routing
    if (urlToRender === "/api") urlToRender = "/";

    try {
        const pageContext = await renderPage({ urlOriginal: urlToRender });
        const { httpResponse } = pageContext;

        if (!httpResponse) {
            res.statusCode = 404;
            res.end("Not found");
            return;
        }

        const { body, statusCode, headers } = httpResponse;
        res.statusCode = statusCode;
        for (const [key, value] of headers) {
            res.setHeader(key, value);
        }
        res.end(body);
    } catch (err) {
        console.error("[SSR Error]", err);
        const errMsg = err?.message ?? String(err);
        const errStack = err?.stack ?? "";
        res.statusCode = 500;
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(
            `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Erreur</title></head><body style="font-family:sans-serif;padding:2rem;max-width:800px;margin:0 auto"><h1>Une erreur s'est produite</h1><p><strong>Détails :</strong> ${escapeHtml(errMsg)}</p><pre style="background:#f5f5f5;padding:1rem;overflow:auto;font-size:12px">${escapeHtml(errStack)}</pre></body></html>`
        );
    }
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
