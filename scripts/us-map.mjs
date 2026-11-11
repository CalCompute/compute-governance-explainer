// The Map view's shapes: the 50 states and the District of Columbia as SVG paths, from U.S. Census Bureau boundaries
// through the us-atlas package (its Albers USA file, already projected to 975 x 610). Run once, and again only if a
// boundary changes:
//
//   npm i --no-save us-atlas topojson-client && node scripts/us-map.mjs
//
// Writes src/us-states.json. The two packages are needed for this run only; the explorer does not depend on them.
import fs from "node:fs";
import { createRequire } from "node:module";
import { feature } from "topojson-client";

const us = JSON.parse(fs.readFileSync(createRequire(import.meta.url).resolve("us-atlas/states-albers-10m.json"), "utf8"));
const W = 975, H = 610;
// A ring as a path, to the whole pixel: enough at this size, and a quarter of the bytes.
const ring = (r) => "M" + r.map(([x, y]) => `${Math.round(x)},${Math.round(y)}`).filter((p, i, a) => p !== a[i - 1]).join("L") + "Z";
// Area and centre of a ring (shoelace), to put the label on the state's largest piece.
function centre(r) {
  let a = 0, x = 0, y = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const f = r[j][0] * r[i][1] - r[i][0] * r[j][1]; a += f; x += (r[j][0] + r[i][0]) * f; y += (r[j][1] + r[i][1]) * f; }
  return { area: Math.abs(a / 2), x: x / (3 * a), y: y / (3 * a) };
}
const states = feature(us, us.objects.states).features.map((f) => {
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  const main = polys.map((p) => centre(p[0])).sort((a, b) => b.area - a.area)[0];
  return { name: f.properties.name, d: polys.flat().map(ring).join(""), x: Math.round(main.x), y: Math.round(main.y) };
}).sort((a, b) => a.name.localeCompare(b.name));
if (states.length !== 51) throw new Error(`expected 50 states and the District of Columbia; got ${states.length}`);

fs.writeFileSync("src/us-states.json", JSON.stringify({ width: W, height: H, states }) + "\n");
console.log(`${states.length} shapes, ${Math.round(fs.statSync("src/us-states.json").size / 1024)} KB`);
