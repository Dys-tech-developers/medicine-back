import type { NextFunction, Request, RequestHandler, Response } from "express";

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

export function wrapAsync(handler: AsyncRequestHandler): RequestHandler {
  return function wrapped(req: Request, res: Response, next: NextFunction): void {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
