import { Request, Response } from "express";

export function withParams<T>(
  handler: (
    req: Request,
    res: Response,
    params: T
  ) => Promise<Response<any, Record<string, any>>>,
  params: T
) {
  return async function (req: Request, res: Response) {
    return await handler(req, res, params);
  };
}
