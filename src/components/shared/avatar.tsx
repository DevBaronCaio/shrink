"use client";

export function Avatar({
  name,
  email,
  image,
  small = false,
}: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  small?: boolean;
}) {
  const initials = (name || email || "S")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <span className={`avatar${small ? " small" : ""}`} aria-hidden="true">
      {initials}
      {image?.startsWith("https://") && (
        // eslint-disable-next-line @next/next/no-img-element -- Avatar remoto é solicitado pelo navegador para evitar fetching arbitrário no servidor.
        <img
          src={image}
          alt=""
          referrerPolicy="no-referrer"
          width={32}
          height={32}
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      )}
    </span>
  );
}
