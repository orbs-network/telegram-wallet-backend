import { token } from "../telegram-bot";

const _crypto = require("crypto");

// const MAX_ALLOWED_TTL_MS = 3600 * 1000;
const MAX_ALLOWED_TTL_MS = 3600 * 1000 * 24;

export function verifyData(botToken: string, queryString: string) {
  const params = new URLSearchParams(queryString);
  const hash = params.get("hash");

  if (
    new Date().getTime() - parseInt(params.get("auth_date")!) * 1000 >
    MAX_ALLOWED_TTL_MS
  ) {
    throw new Error("auth_date expired");
  }

  // Create data_check_string
  params.delete("hash");
  const keys = Array.from(params.keys()).sort();
  const dataCheckString = keys
    .map((key) => `${key}=${decodeURIComponent(params.get(key)!)}`)
    .join("\n");

  // Generate secret_key
  const hmac = _crypto.createHmac("sha256", "WebAppData");
  hmac.update(botToken);
  const secretKey = hmac.digest();

  // Verify hash
  const dataHmac = _crypto.createHmac("sha256", secretKey);
  dataHmac.update(dataCheckString);
  const calculatedHash = dataHmac.digest("hex");

  return calculatedHash === hash;
}

export const tgAuthMiddleware = (req: any, res: any, next: any) => {
  if (process.env.SKIP_TG_AUTH === "1") {
    req.tgUserId = `test-${new Date().getTime()}`;
    next();
    return;
  }

  if (!verifyData(token!, req.body.queryData)) {
    res.sendStatus(400);
    console.log(JSON.stringify(req.body));
    return;
  }
  req.tgUserId = JSON.parse(
    new URLSearchParams(req.body.queryData).get("user")!
  ).id?.toString();
  next();
};
