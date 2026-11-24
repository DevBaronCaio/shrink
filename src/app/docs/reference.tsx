"use client";

import dynamic from "next/dynamic";

const Scalar = dynamic(() => import("./scalar"), {
  ssr: false,
  loading: () => (
    <div className="panel" role="status">
      Carregando referência OpenAPI…
    </div>
  ),
});
export function Reference() {
  return <Scalar />;
}
