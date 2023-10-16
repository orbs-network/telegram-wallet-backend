const _crypto = require("crypto");

export function verifyData(botToken: string, queryString: string) {
  const params = new URLSearchParams(queryString);
  const hash = params.get("hash");

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
