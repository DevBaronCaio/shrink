import { queryString } from "@/lib/query";

export const MAX_DESTINATION_LENGTH = 2048;

export function newLinkPath(destination: string) {
  return `/dashboard/links/novo${queryString({ destino: destination })}`;
}
