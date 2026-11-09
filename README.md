# Compute Governance Explorer

An interactive explainer of who owns, hosts, runs, funds, governs and allocates shared AI and HPC compute. It was built to inform the governance section of the CalCompute framework report under California SB 53 (Government Code section 11546.8).

It is published as a page of the CalCompute Research Library: https://research.californiacompute.org/explorer/

* **Explore**: sixteen configurations (seven approaches, five variants, four international contrast cases) in two WebGL views, Strata and Constellation, with request, money, control and location flows.
* **Journeys**: eleven user stories that follow a request down the stack, with friction points tagged to SB 53's purposes.
* **Compare**, **Stakeholders**, **Bundling spectrum** and **Changelog**.

Facts are tagged as verified, reported, not public, and inferred and are linked to their sources.

## Where the data lives

All content comes from one workbook: `data/explorer-master.xlsx`. Only update the .xlsx for updates to the visuals.

1. Edit the workbook.
2. Commit it to `cc-integration`, the branch Cloudflare builds.
3. Cloudflare runs `npm run build`, which converts it to `src/generated/explorer.json`, checks every reference (organizations, layers, sources, journeys), type-checks the code and builds the page. If a reference is broken, the build log names the sheet and row and nothing deploys.

Rows with `public = No` are left out of the site. The workbook itself is visible to anyone if the repository is public.

## Run it on your computer

Requires Node.js 20 or later.

```bash
npm ci
npm run dev        # converts the workbook and serves http://localhost:5173/explorer/
npm run build      # the same checks and build Cloudflare runs, into dist/explorer/
```

## Project structure

```
data/explorer-master.xlsx     the master workbook (single source of truth)
scripts/build-data.mjs        workbook → JSON, with reference checks
src/generated/explorer.json   generated; do not edit by hand
src/stage.ts                  WebGL views (three.js)
src/views/                    explore, journeys, compare, stakeholders, spectrum, changelog
src/styles.css                the explorer's layout, in the Research Library's colours and type
src/chrome.css                a copy of the Research Library's header, footer and base styles
public/assets/logos/          logo files
wrangler.jsonc                the Cloudflare Worker and its route
```

## How it is served

The page lives on the Research Library's host but deploys from this repo. A Cloudflare Worker, `governance-explainer` (`wrangler.jsonc`), serves `dist/` and takes the route `research.californiacompute.org/explorer*`. The library's own Worker (`CalCompute/library-site`) serves everything else on that host. Cloudflare builds and deploys this Worker on every push to **`cc-integration`**, the branch that carries the library integration (this file, `wrangler.jsonc`, `src/chrome.css`, the `/explorer/` base path).

`main` is the original standalone version of the explorer and is left as it was. `.github/workflows/deploy.yml` publishes it to GitHub Pages at https://calcompute.github.io/compute-governance-explainer/ on every push to `main`; it does not run for `cc-integration`.

Because it shares the host, the page uses the library's fonts, wordmark and icons from the library's own paths (`/fonts/`, `/images/`, `/favicons/`); `npm run dev` proxies them from the live library. `index.html` and `src/chrome.css` carry a copy of the library's header and footer, from `library-site/src/layouts/Layout.astro`. When the library changes its header or footer, copy the change here.

The footer's newsletter sign-up and every **Suggest a correction** button (the source sheet, an organization's panel, the line under the page) use the library's forms. The sign-up posts to `/api/subscribe` on this host, which the library's Worker answers; `src/forms.ts` is a copy of `library-site/src/lib/forms.js`. A correction button opens the library's Suggest or correct form, filled in with the item. A person reads every suggestion; nothing changes the workbook by itself. The workbook's `footer.issue` and `footer.issue.url` rows in UI Text are no longer read.

## License

Code: MIT (`LICENSE`). Data and text: CC BY 4.0 (`LICENSE-DATA.md`). Logos remain the trademarks of their owners.

