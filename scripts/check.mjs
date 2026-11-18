import { readFile, stat } from "node:fs/promises";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFile(path.join(root, file), "utf8");
const html = await read("index.html");
const css = await read("styles.css");
const js = await read("app.js");
const pkg = JSON.parse(await read("package.json"));
const contract = "EHuyvYuz6umJ7URnb8B81YJBjrJ9EFoTjFVdhecepump";

assert.equal(pkg.name, "apeonx-1000x-site", "package metadata must match the project");
assert.ok(html.includes("<title>APEONX 1000× — Big Ape Energy</title>"), "page title is missing");
assert.ok(html.includes("/assets/apeonx-campaign.webp"), "campaign artwork must be used");
assert.ok(html.includes(contract), "contract address is missing from the page");
assert.ok(html.includes("https://t.me/apeonx1000x"), "Telegram link is missing");
assert.ok(html.includes("https://x.com/ChiefRoastAI"), "X link is missing");
assert.ok(html.includes("20,000,000"), "creator lock amount is missing");
assert.ok(html.includes("14 DEC 2026"), "lock date is missing");
assert.ok(js.includes("api.dexscreener.com/token-pairs/v1/solana/"), "live DexScreener endpoint is missing");
assert.ok(js.includes("window.setInterval(refreshMarketData, REFRESH_MS)"), "market refresh loop is missing");
assert.ok(js.includes("renderNoPool"), "empty market response must be handled without fake data");
assert.ok(css.includes("prefers-reduced-motion"), "reduced-motion support is missing");
assert.ok(html.includes("Skip to content"), "skip link is missing");
assert.ok(html.includes("lock wallet"), "lock verification caveat is missing");

const image = await stat(path.join(root, "assets/apeonx-campaign.webp"));
assert.ok(image.size > 10_000, "campaign artwork file looks unexpectedly small");
assert.ok(image.size < 1_000_000, "campaign artwork should be web-optimized");

const referenced = [...html.matchAll(/(?:src|href)="\/(?!\/)([^"?#]+)"/g)].map((match) => match[1]);
for (const asset of referenced) {
  if (asset === "styles.css" || asset === "app.js" || asset === "favicon.svg" || asset.startsWith("assets/")) {
    await stat(path.join(root, asset));
  }
}

assert.ok(!/TODO|FIXME|YOUR_[A-Z_]+|REPLACE_ME|example\.com/i.test(html + css + js), "unresolved development placeholders found");
console.log("APEONX checks passed: metadata, links, contract, lock disclosure, live API, accessibility, assets, and no placeholders.");