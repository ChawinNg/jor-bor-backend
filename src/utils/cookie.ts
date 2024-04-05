export function parseCookie(cookie: string): { [key: string]: string } {
  let cookies: { [key: string]: string } = {};

  cookie.split(";").forEach((c) => {
    let t = c.trim();
    let i = t.indexOf("=");
    cookies[t.slice(0, i)] = t.slice(i + 1);
  });

  return cookies;
}
