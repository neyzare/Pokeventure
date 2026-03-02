import type { Request, Response } from "express"

declare module "vike/types" {
    interface PageContextServer {
        req?: Request
        res?: Response
    }
}
