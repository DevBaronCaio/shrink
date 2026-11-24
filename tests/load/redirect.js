import http from "k6/http";
import { check, sleep } from "k6";

const { SHRINK_URL, SHRINK_SLUG, OWNED_TARGET } = __ENV;
if (
  OWNED_TARGET !== "yes" ||
  !SHRINK_URL ||
  !/^[a-z0-9][a-z0-9_-]{1,46}[a-z0-9]$/.test(SHRINK_SLUG || "")
) {
  throw new Error(
    "Defina SHRINK_URL, SHRINK_SLUG e OWNED_TARGET=yes para um ambiente próprio e autorizado.",
  );
}

export const options = {
  vus: Number(__ENV.VUS || 5),
  duration: __ENV.DURATION || "30s",
  summaryTrendStats: ["avg", "med", "p(50)", "p(95)", "p(99)", "max"],
  thresholds: { http_req_failed: ["rate<0.01"], checks: ["rate>0.99"] },
};

http.setResponseCallback(http.expectedStatuses(302, 410));

export default function redirect() {
  const res = http.get(SHRINK_URL.replace(/\/$/, "") + "/r/" + SHRINK_SLUG, {
    redirects: 0,
    timeout: "10s",
  });
  check(res, {
    "aceito ou limite atingido": (response) =>
      response.status === 302 || response.status === 410,
    "não usa cache": (response) =>
      String(response.headers["Cache-Control"]).includes("no-store"),
  });
  sleep(0.15);
}
