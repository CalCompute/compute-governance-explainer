import "./chrome.css";
import "./styles.css";
import { AMAP, D, ui } from "./data";
import { nav, parseHash, syncHash } from "./router";
import { S, type Tab } from "./state";
import { correctionHref, initNewsletter } from "./forms";
import { $, closeOverlay, esc, initGlossary, overlay, overlayOpen, toast } from "./ui";
import { hideExplore, initExplore, setApproach, showExplore } from "./views/explore";
import { renderStart } from "./views/start";
import { closePresenter, presenterOpen, renderJourneys, step, stopPlay, togglePlay } from "./views/journeys";
import { renderChangelog, renderCompare, renderSpectrum, renderStakeholders } from "./views/pages";

function applyUiText() {
  document.querySelectorAll<HTMLElement>("[data-ui]").forEach((el) => { const t = ui(el.dataset.ui!); if (t) el.textContent = t; });
  $("#year").textContent = String(new Date().getFullYear());
  $("#verifiedLine").textContent = `Data last verified ${D.lastVerified}`;
  const latest = D.changelog[0];
  $("#footerVersion").textContent = latest ? `Version ${latest.version} · ${latest.date}` : "";
  $("#footerIssue").innerHTML = `<a href="${correctionHref("the whole explorer")}">Suggest a correction</a>`;
}

function go(tab: Tab) {
  S.tab = tab;
  document.querySelectorAll<HTMLElement>(".tab").forEach((b) => { const on = b.dataset.tab === tab; b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1; });
  document.querySelectorAll<HTMLElement>("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== tab));
  if (tab !== "explore") hideExplore();
  if (tab !== "journeys") stopPlay();
  if (tab === "start") renderStart();
  if (tab === "explore") showExplore();
  if (tab === "journeys") renderJourneys();
  if (tab === "compare") renderCompare();
  if (tab === "stakeholders") renderStakeholders();
  if (tab === "spectrum") renderSpectrum();
  if (tab === "changelog") renderChangelog();
  syncHash();
}
nav.go = go;
nav.openApproach = (id: string) => { if (!AMAP[id]) return; setApproach(id); go("explore"); };

/* ---------- copy link ---------- */
function copyLink() {
  syncHash();
  const url = location.href;
  const fallback = () => {
    overlay(`<div class="sheet-head"><h3>Copy this link</h3><button class="btn" type="button" data-close>Close</button></div><p>It opens this exact view.</p><div class="copybox"><input id="copyField" readonly value="${esc(url)}" aria-label="Link to this view"></div>`, "Copy link", "modal");
    setTimeout(() => $<HTMLInputElement>("#copyField")?.select(), 50);
  };
  try { navigator.clipboard.writeText(url).then(() => toast("Link copied"), fallback); } catch { fallback(); }
}

/* ---------- keyboard ---------- */
function keys(e: KeyboardEvent) {
  if (e.key === "Escape") { if (presenterOpen()) { closePresenter(); return; } if (overlayOpen()) { closeOverlay(); return; } }
  const t = e.target as HTMLElement, tag = t.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "canvas") return;
  if (t.getAttribute("role") === "tab" && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
    const tabs = [...document.querySelectorAll<HTMLElement>(".tab")]; const i = tabs.indexOf(t);
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length]; next.focus(); go(next.dataset.tab as Tab); e.preventDefault(); return;
  }
  if (presenterOpen() || S.tab === "journeys") {
    if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    else if (e.key === " " && presenterOpen()) { e.preventDefault(); togglePlay(); }
  }
}

function init() {
  parseHash();
  applyUiText();
  initExplore();
  initGlossary();
  initNewsletter();
  document.querySelectorAll<HTMLElement>(".tab").forEach((b) => b.addEventListener("click", () => go(b.dataset.tab as Tab)));
  $("#copyLinkBtn").addEventListener("click", copyLink);
  const brand = $(".brand"); brand.setAttribute("role", "link"); brand.tabIndex = 0; brand.title = ui("start.tab", "Start here");
  brand.addEventListener("click", () => go("start"));
  brand.addEventListener("keydown", (e) => { if (e.key === "Enter") go("start"); });
  document.addEventListener("keydown", keys);
  window.addEventListener("hashchange", () => { parseHash(); go(S.tab); });
  let rt = 0;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = window.setTimeout(() => { if (S.tab === "spectrum") renderSpectrum(); }, 120); });
  go(S.tab);
}
init();
