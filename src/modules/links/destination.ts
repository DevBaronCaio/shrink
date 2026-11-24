import ipaddr from "ipaddr.js";
import { appUrl } from "@/config/site";
import { applyUtm, type Utm } from "@/modules/campaigns/utm";
import { AppError } from "@/lib/errors";

const localSuffixes = [
  "localhost",
  "local",
  "localdomain",
  "internal",
  "lan",
  "test",
  "invalid",
  "onion",
  "home.arpa",
];

function hostname(value: string) {
  return value
    .toLowerCase()
    .replace(/^\[|\]$/g, "")
    .replace(/\.+$/, "");
}

function matches(host: string, domain: string) {
  return host === domain || host.endsWith(`.${domain}`);
}

export function validateDestination(input: string, utm?: Utm | null) {
  try {
    const destination = applyUtm(input, utm);
    if (destination.length > 2048) throw new Error();
    const host = hostname(new URL(destination).hostname);
    const isAddress = ipaddr.isValid(host);
    if (
      isAddress
        ? ipaddr.process(host).range() !== "unicast"
        : !host.includes(".") ||
          localSuffixes.some((suffix) => matches(host, suffix))
    ) {
      throw new Error();
    }
    const owned = [
      new URL(appUrl()).hostname,
      process.env.VERCEL_URL,
      process.env.VERCEL_BRANCH_URL,
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
      process.env.NEXTAUTH_URL,
    ]
      .filter((alias): alias is string => Boolean(alias))
      .map((alias) =>
        hostname(
          new URL(alias.includes("://") ? alias : `https://${alias}`).hostname,
        ),
      );
    const blocked = (process.env.BLOCKED_DOMAINS || "")
      .split(",")
      .map((domain) => hostname(domain.trim()))
      .filter(Boolean);
    if (owned.includes(host) || blocked.some((domain) => matches(host, domain)))
      throw new Error();
    return destination;
  } catch {
    throw new AppError(
      422,
      "INVALID_DESTINATION",
      "Use uma URL pública HTTP ou HTTPS permitida, com até 2048 caracteres.",
    );
  }
}
