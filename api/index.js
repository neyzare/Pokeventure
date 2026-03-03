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

    // SSR with Vike
    const pageContext = await renderPage({ urlOriginal: url });
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
}
