import { ImageResponse } from "next/og";

export const alt = "Shrink — Links menores. Insights maiores.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        flexDirection: "column",
        justifyContent: "center",
        background: "#09090b",
        color: "#fafafa",
        padding: 88,
      }}
    >
      <div
        style={{
          display: "flex",
          color: "#facc15",
          fontSize: 37,
          marginBottom: 38,
        }}
      >
        Shrink.
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 86,
          fontWeight: 700,
          letterSpacing: -5,
        }}
      >
        Links menores.
      </div>
      <div
        style={{
          display: "flex",
          color: "#facc15",
          fontSize: 86,
          fontWeight: 700,
          letterSpacing: -5,
        }}
      >
        Insights maiores.
      </div>
      <div
        style={{
          display: "flex",
          color: "#a1a1aa",
          fontSize: 28,
          marginTop: 36,
        }}
      >
        Encurtamento, gerenciamento e analytics de links.
      </div>
    </div>,
    size,
  );
}
