"use client";

import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";

export default function Scalar() {
  return (
    <ApiReferenceReact
      configuration={{
        url: "/api/v1/openapi",
        layout: "classic",
        theme: "default",
        darkMode: true,
        hideTestRequestButton: true,
        withDefaultFonts: false,
        telemetry: false,
        customCss:
          ":root { --scalar-font: 'Geist Variable', system-ui; --scalar-font-code: 'Geist Mono Variable', monospace; }",
      }}
    />
  );
}
