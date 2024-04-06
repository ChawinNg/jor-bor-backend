import { Request, Response } from "express";
import { readFileSync } from "fs";
import path from "path";

interface IRoute {
  method: string;
  path: string;
}

export async function routeHTML(req: Request, res: Response, routes: IRoute[]) {
  const html = readFileSync(path.join(__dirname, "../../public/routes.html"));
  const content = [...routes]
    .sort((a, b) => (a.path < b.path ? -1 : 1))
    .map(
      (r) => `
      <tr class="container">
        <td class="method ${r.method}">${r.method}</td>
        <td>${r.path}</td>
      </tr>
      `
    )
    .join("\n");

  return res.send(html.toString().replace("@content", content));
}
