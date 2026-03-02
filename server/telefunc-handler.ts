import { enhance, type UniversalHandler } from "@universal-middleware/core";
import { telefunc } from "telefunc";

export const telefuncHandler: UniversalHandler = enhance(
  async (request, context, runtime) => {
    const httpResponse = await telefunc({
      url: request.url.toString(),
      method: request.method,
      body: await request.text(),
      context: {
        ...context,
        ...runtime,
        req: runtime.req,
        res: runtime.res,
      },
    });

    const { body, statusCode, contentType } = httpResponse;

    const headers = new Headers();
    headers.set("content-type", contentType);

    const setCookie = runtime?.res?.getHeader?.("set-cookie");
    if (setCookie) {
      if (Array.isArray(setCookie)) {
        for (const c of setCookie) headers.append("set-cookie", String(c));
      } else {
        headers.append("set-cookie", String(setCookie));
      }
    }

    return new Response(body, { status: statusCode, headers });
  },
  {
    name: "my-app:telefunc-handler",
    path: "/_telefunc",
    method: ["GET", "POST"],
    immutable: false,
  }
);
