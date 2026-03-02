import type { Request, Response } from "express"

declare module "telefunc" {
  namespace Telefunc {
    interface Context {
      req: Request
      res: Response
    }
  }
}

export {}
