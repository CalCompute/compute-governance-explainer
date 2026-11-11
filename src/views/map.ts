import { AMAP, APPROACHES, approachLabel, ui } from "../data";
import { nav, syncHash } from "../router";
import { EMBED, S } from "../state";
import { $, esc, logo } from "../ui";
import type { ApproachView } from "../types";
import usMap from "../us-states.json";

/* ---------- map: the documented systems by place ---------- */
// A system is placed by the state its workbook location names. "National ..." is the national row, a contrast case is
// abroad. scripts/build-data.mjs fails the build when a U.S. system names no state, so none can fall off the map.
const STATE_NAMES = usMap.states.map((s) => s.name).sort((a, b) => b.length - a.length); // "West Virginia" before "Virginia"
export const stateOf = (a: { group: string; location: string }): string | null =>
  a.group === "contrast" || /^National\b/.test(a.location) ? null : STATE_NAMES.find((n) => a.location.includes(n)) ?? null;
const slug = (name: string) => name.toLowerCase().replace(/[^a-z]+/g, "-");
const HOME = "California";

function card(a: ApproachView, where = a.location): string {
  return `<article class="map-card"><div class="row">${logo(a.logo, a.tag)}<div><b>${esc(a.name)}</b><span class="muted">${esc(approachLabel(a))} · ${esc(where)}</span></div></div>
    <p>${esc(a.kind)}</p>
    <div class="row"><button type="button" class="btn btn-primary" data-open="${a.id}">${esc(ui("map.open", "Open in Explore"))}</button><button type="button" class="btn" data-compare="${a.id}">${esc(ui("map.compare", "Add to Compare"))}</button></div></article>`;
}

export function renderMap() {
  const byState = new Map<string, ApproachView[]>();
  const national: ApproachView[] = [], abroad: ApproachView[] = [];
  for (const a of APPROACHES) {
    const st = stateOf(a);
    if (st) byState.set(st, [...(byState.get(st) ?? []), a]);
    else (a.group === "contrast" ? abroad : national).push(a);
  }
  // S.mapState is a slug from the address; an unknown one falls back to California.
  const sel = [...byState.keys()].find((n) => slug(n) === S.mapState) ?? (byState.has(HOME) ? HOME : [...byState.keys()][0]);
  S.mapState = slug(sel);
  const here = byState.get(sel) ?? [];
  const states = [...byState.keys()].sort((a, b) => (b === HOME ? 1 : 0) - (a === HOME ? 1 : 0) || a.localeCompare(b));
  const count = (n: number) => `${n} ${n === 1 ? "system" : "systems"}`;

  // Filled states are the buttons; the rest is backdrop. The selected state is drawn last, so its outline is whole.
  const shape = (s: (typeof usMap.states)[number]) => {
    const list = byState.get(s.name);
    if (!list) return `<path class="st" d="${s.d}" aria-hidden="true"/>`;
    const on = s.name === sel;
    return `<path class="st has${on ? " sel" : ""}${s.name === HOME ? " home" : ""}" d="${s.d}" role="button" tabindex="0" aria-pressed="${on}" data-state="${esc(s.name)}" aria-label="${esc(`${s.name}, ${count(list.length)}: ${list.map((a) => a.name).join(", ")}`)}"><title>${esc(`${s.name}: ${list.map((a) => a.name).join(", ")}`)}</title></path>`;
  };
  const label = (s: (typeof usMap.states)[number]) => {
    const list = byState.get(s.name); if (!list) return "";
    const text = list.map((a) => a.tag).join(" · "), w = text.length * 7 + 14;
    return `<g class="map-pin${s.name === sel ? " sel" : ""}" aria-hidden="true"><rect x="${s.x - w / 2}" y="${s.y - 10}" width="${w}" height="20" rx="10"/><text x="${s.x}" y="${s.y + 4.5}" text-anchor="middle">${esc(text)}</text></g>`;
  };
  const drawn = [...usMap.states].sort((a, b) => Number(a.name === sel) - Number(b.name === sel) || Number(byState.has(a.name)) - Number(byState.has(b.name)));
  const svg = `<svg class="us-map" viewBox="0 0 ${usMap.width} ${usMap.height}" role="group" aria-label="${esc(ui("map.aria", "Map of the United States. The states with a documented system are buttons; the list beside the map gives the same choices."))}">${drawn.map(shape).join("")}${usMap.states.map(label).join("")}</svg>`;

  // ?embed#map: the library home page's frame. The map and a key to every system. Inside a frame, a click chooses a
  // system: it is marked here and the page is told (it shows that system in the 3-D frame beside this one). Opened by
  // itself, the same lines are links into the full explorer.
  if (EMBED) {
    const framed = window.parent !== window;
    const chosen = AMAP[S.mapPick] ?? here[0];
    const chosenState = stateOf(chosen);
    const line = (a: ApproachView, where: string) => `<li><a href="${location.pathname}#explore.${a.id}" target="_top" data-pick="${a.id}"${a.id === chosen.id ? ' aria-current="true"' : ""}><b>${esc(a.tag)}</b><span>${esc(a.name)}</span><span class="muted">${esc(where)}</span></a></li>`;
    const group = (title: string, items: ApproachView[], where: (a: ApproachView) => string) => (items.length ? `<li class="map-group">${esc(title)}</li>${items.map((a) => line(a, where(a))).join("")}` : "");
    const key = states.flatMap((n) => byState.get(n)!.map((a) => line(a, n))).join("")
      + group(ui("map.national", "National"), national, () => "U.S.")
      + group(ui("map.abroad", "Outside the United States"), abroad, (a) => a.location);
    const linked = [...usMap.states].sort((a, b) => Number(a.name === chosenState) - Number(b.name === chosenState) || Number(byState.has(a.name)) - Number(byState.has(b.name))).map((s) => {
      const list = byState.get(s.name);
      if (!list) return `<path class="st" d="${s.d}" aria-hidden="true"/>`;
      const names = `${s.name}: ${list.map((a) => a.name).join(", ")}`;
      return `<a href="${location.pathname}#map.${slug(s.name)}" target="_top" data-pick="${list[0].id}" aria-label="${esc(names)}"><path class="st has${s.name === chosenState ? " sel" : ""}${s.name === HOME ? " home" : ""}" d="${s.d}"><title>${esc(names)}</title></path></a>`;
    }).join("");
    const body = $("#mapBody");
    body.innerHTML = `<div class="map-embed"><svg class="us-map" viewBox="0 0 ${usMap.width} ${usMap.height}" role="group" aria-label="${esc(ui("map.aria.embed", "Map of the United States, with the states that host a documented system marked. The list gives the same choices."))}">${linked}${usMap.states.map(label).join("")}</svg><ol class="map-list">${key}</ol></div>`;
    body.onclick = framed ? (e) => {
      const a = (e.target as Element).closest<HTMLElement | SVGElement>("[data-pick]"); if (!a) return;
      e.preventDefault();
      const id = a.dataset.pick!, st = stateOf(AMAP[id]);
      S.mapPick = id; if (st) S.mapState = slug(st);
      renderMap(); syncHash();
      window.parent.postMessage({ type: "explorer:select", approach: id }, "*"); // an id only; the page checks who sent it
    } : null;
    document.documentElement.classList.add("ready"); // an embed stays hidden until its view has drawn (index.html)
    return;
  }

  const list = `<ul class="map-states">${states.map((n) => `<li><button type="button" class="chip" data-state="${esc(n)}" aria-pressed="${n === sel}">${esc(n)} <span class="muted">${byState.get(n)!.map((a) => esc(a.tag)).join(" · ")}</span></button></li>`).join("")}</ul>`;
  const row = (title: string, items: ApproachView[]) => (items.length
    ? `<section class="map-row"><h3>${esc(title)}</h3><div class="map-cards">${items.map((a) => card(a)).join("")}</div></section>` : "");

  const body = $("#mapBody");
  body.innerHTML = `<div class="map-grid">
      <div class="card map-stage">${svg}<p class="muted map-key"><span><i class="sw has"></i>${esc(ui("map.key.has", "A system this explorer documents; the number is its approach"))}</span><span><i class="sw"></i>${esc(ui("map.key.none", "None documented here"))}</span></p>${list}</div>
      <div class="map-side" aria-live="polite"><h3>${esc(sel)} <span class="muted">${count(here.length)}</span></h3>${here.map((a) => card(a)).join("")}</div>
    </div>
    ${row(ui("map.national", "National"), national)}
    ${row(ui("map.abroad", "Outside the United States"), abroad)}
    <p class="muted map-foot">${esc(ui("map.foot", "The map shows only the systems this explorer documents. A state with no mark may still have a program."))} ${esc(ui("map.epoch", "For AI clusters worldwide, see"))} <a href="https://epoch.ai/data/gpu-clusters" target="_blank" rel="noopener">Epoch AI's data on GPU clusters ↗</a>.</p>`;

  const pick = (name: string) => { if (!byState.has(name)) return; S.mapState = slug(name); renderMap(); syncHash(); document.querySelector<HTMLElement>(`.us-map [data-state="${CSS.escape(name)}"]`)?.focus({ preventScroll: true }); };
  body.onclick = (e) => {
    const t = e.target as Element;
    const st = t.closest<HTMLElement | SVGElement>("[data-state]"); if (st) { pick(st.dataset.state!); return; }
    const open = t.closest<HTMLElement>("[data-open]"); if (open) { nav.openApproach(open.dataset.open!); return; }
    const cmp = t.closest<HTMLElement>("[data-compare]");
    if (cmp && AMAP[cmp.dataset.compare!]) { S.compare = [...new Set([cmp.dataset.compare!, ...S.compare])].slice(0, 3); nav.go("compare"); }
  };
  body.onkeydown = (e) => {
    const st = (e.target as Element).closest<SVGElement>("path[data-state]");
    if (st && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); pick(st.dataset.state!); }
  };
}
