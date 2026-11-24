export type PageQuery = Record<string, string | string[] | undefined>;

export function pageQuery(input: PageQuery, keys: readonly string[]) {
  return Object.fromEntries(
    keys.flatMap((key) => {
      const value = input[key];
      return typeof value === "string" && value !== "" ? [[key, value]] : [];
    }),
  );
}

export function queryString(
  values: Record<string, string | number | undefined>,
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values))
    if (value !== undefined && value !== "") query.set(key, String(value));
  return query.size ? `?${query}` : "";
}
