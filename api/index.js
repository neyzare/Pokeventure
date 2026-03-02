import { renderPage } from "vike/server";

export default async function handler(req, res) {
    const { httpResponse } = await renderPage({
        urlOriginal: req.url,
    });

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