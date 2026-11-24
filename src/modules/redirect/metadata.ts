import { createHmac } from "node:crypto";
import { UAParser } from "ua-parser-js";
import { clientIp } from "@/lib/rate-limit";

export function referrerDomain(value: string | null) {
  if (!value || value.length > 4096) return null;
  try {
    const parsed = new URL(value);
    if (
      !["https:", "http:"].includes(parsed.protocol) ||
      !parsed.hostname ||
      parsed.username ||
      parsed.password
    )
      return null;
    const hostname = parsed.hostname.toLowerCase().replace(/\.+$/, "");
    return hostname && hostname.length <= 253 ? hostname : null;
  } catch {
    return null;
  }
}

const knownBots =
  /bot\b|crawler|spider|preview|facebookexternalhit|slackbot|discordbot|telegrambot|headlesschrome|curl\/|wget\//i;

export function clickMetadata(headers: Headers, at = new Date()) {
  const agent = headers.get("user-agent")?.slice(0, 512);
  const parsed = agent ? new UAParser(agent).getResult() : null;
  const purpose = headers.get("sec-purpose") || headers.get("purpose") || "";
  const isBot = Boolean(
    (agent && knownBots.test(agent)) || /prefetch|prerender/i.test(purpose),
  );
  const ip = clientIp(headers);
  const secret = process.env.ANALYTICS_HASH_SECRET;
  const epoch = Math.floor(at.getTime() / (90 * 86400000));
  const key =
    secret && secret.length >= 32
      ? createHmac("sha256", secret).update(`visitor-key:${epoch}`).digest()
      : null;
  const networkDigest =
    !isBot && ip && key
      ? createHmac("sha256", key).update(`visitor|${ip}`).digest("hex")
      : null;

  const country =
    process.env.VERCEL === "1" ? headers.get("x-vercel-ip-country") : null;
  const region =
    process.env.VERCEL === "1"
      ? headers.get("x-vercel-ip-country-region")
      : null;
  return {
    country:
      country && /^[A-Z]{2}$/.test(country) && country !== "XX"
        ? country
        : null,
    region: country && region && /^[A-Z0-9]{1,3}$/.test(region) ? region : null,
    device:
      parsed?.device.type ??
      (parsed?.os.name && /windows|macos|linux|chrome os/i.test(parsed.os.name)
        ? "desktop"
        : null),
    browser: parsed?.browser.name ?? null,
    os: parsed?.os.name ?? null,
    referrer: referrerDomain(headers.get("referer")),
    networkDigest,
    isBot,
  };
}
