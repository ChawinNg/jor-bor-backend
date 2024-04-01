import { Request, Response } from "express";

export function withAuth(
  handler: (
    req: Request,
    res: Response
  ) => Promise<Response<any, Record<string, any>>>
) {
  return async function (req: Request, res: Response) {
    let userId = req.cookies.session;
    if (userId === undefined)
      return res.status(401).send({ message: "required login" });

    res.locals.userId = userId;
    return await handler(req, res);
  };
}
