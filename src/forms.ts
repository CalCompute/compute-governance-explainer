// The footer's newsletter sign-up. A copy of CalCompute/library-site src/lib/forms.js, which also serves the library's
// Suggest or correct form: keep the two the same. It posts to /api/subscribe on this host, which the library's Worker
// answers (research.californiacompute.org); Cloudflare Turnstile checks each post is from a person.
declare const turnstile: {
  render(el: HTMLElement, o: { sitekey: string; appearance: string }): string;
  reset(id: string): void;
  getResponse(id: string): string | undefined;
};
const LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
// Turnstile's always-pass test key on a local server.
const SITEKEY = LOCAL ? "1x00000000000000000000AA" : "0x4AAAAAAF6V6KNm2begVrOQ";
const FAIL = "Something went wrong. Please try again, or email team@californiacompute.org.";

let script: Promise<unknown> | undefined;
const ready = () => (script ??= new Promise((ok, fail) => {
  const s = document.createElement("script");
  s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  s.async = true; s.onload = ok; s.onerror = fail;
  document.head.append(s);
}));

async function check(form: HTMLFormElement) {
  const box = form.querySelector<HTMLElement>("[data-turnstile]")!;
  await ready();
  if (box.dataset.widget) turnstile.reset(box.dataset.widget);
  else box.dataset.widget = turnstile.render(box, { sitekey: SITEKEY, appearance: "interaction-only" });
}

async function send(form: HTMLFormElement, path: string, thanks: string) {
  const status = form.querySelector<HTMLElement>("[data-status]")!, button = form.querySelector<HTMLButtonElement>('[type="submit"]')!;
  const box = form.querySelector<HTMLElement>("[data-turnstile]")!;
  button.disabled = true; status.textContent = "Sending…";
  try {
    if (!box.dataset.widget) await check(form);
    for (let i = 0; i < 40 && !turnstile.getResponse(box.dataset.widget!); i++) await new Promise((r) => setTimeout(r, 250));
    (form.elements.namedItem("page") as HTMLInputElement).value = location.href;
    const r = await fetch(`/api/${path}`, { method: "POST", body: new FormData(form) });
    const j = await r.json().catch(() => ({}));
    status.textContent = r.ok ? thanks : j.error ?? FAIL;
    return r.ok;
  } catch {
    status.textContent = FAIL;
    return false;
  } finally {
    button.disabled = false;
    if (box.dataset.widget) turnstile.reset(box.dataset.widget);
  }
}

export function initNewsletter() {
  document.querySelectorAll<HTMLFormElement>("form[data-newsletter]").forEach((form) => {
    const email = form.elements.namedItem("email") as HTMLInputElement;
    email.addEventListener("focus", () => check(form).catch(() => {}), { once: true });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      if (await send(form, "subscribe", "Thank you. You're on the list.")) email.value = "";
    });
  });
}

// A link to the library's Suggest or correct form, filled in with what the visitor was looking at.
export const correctionHref = (about: string, link = "") =>
  `/?${new URLSearchParams({ kind: "correction", about: `Compute Governance Explorer: ${about}`, ...(link ? { link } : {}) })}#suggest`;
