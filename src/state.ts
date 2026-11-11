import type { FlowType } from "./types";

export type Tab = "start" | "explore" | "map" | "journeys" | "compare" | "stakeholders" | "spectrum" | "changelog";
export type View = "strata" | "constellation";

export const S = {
  tab: "start" as Tab,
  approach: "empire",
  view: "strata" as View,
  flows: { request: true, money: true, control: false, location: false } as Record<FlowType, boolean>,
  bundling: false,
  labels: true,
  selected: null as string | null,
  compare: ["empire", "mghpcc", "cscs"] as string[],
  stake: "state",
  mapState: "california", // the Map view's chosen state, as a slug
  mapPick: "", // the system chosen in the Map view's embed (?embed#map.<state>.<approach>)
  journey: "j-empire",
  step: 0,
};

/** ?embed: the library home page frames the 3-D view alone (index.html, styles.css html.embed). */
export const EMBED = typeof location !== "undefined" && /[?&]embed\b/.test(location.search);

export const RM = typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
