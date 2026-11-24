import { queryString } from "@/lib/query";
import { webUrl } from "@/modules/campaigns/utm";
import {
  MAX_DESTINATION_LENGTH,
  newLinkPath,
} from "@/modules/links/new-link-path";
import { safeDashboardPath } from "./schema";

function linkDestination(value: unknown) {
  if (typeof value !== "string" || value.length > MAX_DESTINATION_LENGTH)
    return;
  try {
    webUrl(value);
    return value.trim();
  } catch {
    return undefined;
  }
}

export function authContinuation(query: {
  destino?: unknown;
  callbackUrl?: unknown;
}) {
  const destination = linkDestination(query.destino);
  const callback = destination
    ? newLinkPath(destination)
    : safeDashboardPath(query.callbackUrl);
  const params = destination
    ? { destino: destination }
    : {
        callbackUrl: callback === "/dashboard" ? undefined : callback,
      };
  return { destination, callback, query: queryString(params) };
}
