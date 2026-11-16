import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:5173";
const RATE = Number(__ENV.RATE || 10);
const DURATION = __ENV.DURATION || "60s";
const TIERS = ["ALL", "GOLD", "DIAMOND"];
const QUEUES = ["COMPETITIVE", "QUICK_PLAY"];
const RANGE_DAYS = [14, 30, 60, 90];
const HOUR_MILLISECONDS = 3600 * 1000;
const DAY_MILLISECONDS = 24 * HOUR_MILLISECONDS;

export const options = {
  scenarios: {
    history: {
      executor: "constant-arrival-rate",
      rate: RATE,
      timeUnit: "1s",
      duration: DURATION,
      preAllocatedVUs: 20,
      maxVUs: 100,
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    "http_req_duration{endpoint:history}": ["p(95)<500"],
    checks: ["rate>0.99"],
  },
};

export function setup() {
  const response = http.get(`${BASE_URL}/api/heroes`);
  const heroes = response.json().map((hero) => hero.slug);
  if (heroes.length === 0) {
    throw new Error("The hero list is empty: collect statistics first");
  }
  return { heroes };
}

function pick(values) {
  return values[Math.floor(Math.random() * values.length)];
}

export default function (data) {
  const now = Date.now();
  const to = new Date(now - Math.floor(Math.random() * 3) * HOUR_MILLISECONDS);
  const from = new Date(to.getTime() - pick(RANGE_DAYS) * DAY_MILLISECONDS);
  const query = [
    `queue=${pick(QUEUES)}`,
    `tier=${pick(TIERS)}`,
    "platform=PC",
    "region=EUROPE",
    `from=${encodeURIComponent(from.toISOString())}`,
    `to=${encodeURIComponent(to.toISOString())}`,
  ].join("&");
  const response = http.get(
    `${BASE_URL}/api/stats/hero/${pick(data.heroes)}/history?${query}`,
    { tags: { endpoint: "history" } },
  );
  check(response, {
    "status is 200": (result) => result.status === 200,
    "has points": (result) => result.body.length > 2,
  });
}
