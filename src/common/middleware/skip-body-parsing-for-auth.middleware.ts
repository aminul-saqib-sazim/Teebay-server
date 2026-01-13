import type { NestMiddleware } from "@nestjs/common";
import { Injectable } from "@nestjs/common";

import type { NextFunction, Request, Response } from "express";
import * as express from "express";

@Injectable()
export class SkipBodyParsingForAuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.baseUrl.startsWith("/auth") || req.originalUrl.startsWith("/auth")) {
      next();
      return;
    }

    express.json()(req, res, (err) => {
      if (err) {
        next(err);
        return;
      }
      express.urlencoded({ extended: true })(req, res, next);
    });
  }
}
