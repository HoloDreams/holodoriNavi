import { writeFile } from "node:fs/promises";

const origin = "https://www.hololive-dreams.com";
const response = await fetch(origin + "/news/", {
  signal: AbortSignal.timeout(20_000),
});
if (!response.ok) throw new Error("Official news HTTP " + response.status);

const html = await response.text();
const articles = html.matchAll(/<a\b[^>]*href="(\/news\/detail\/[\w-]+\/?)"[^>]*>([\s\S]*?)<\/a>/g);
const posts = new Map();
const entities = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">" };
const decode = value => value.replace(/&(amp|quot|apos|lt|gt|#39);/g,
  (_, entity) => entity === "#39" ? "'" : entities[entity]);

for (const [, path, body] of articles) {
  const heading = body.match(/<p\b[^>]*class="NewsList__item__title"[^>]*>([\s\S]*?)<\/p>/);
  const thumbnail = body.match(/<source\b[^>]*srcset="(https:\/\/images\.microcms-assets\.io\/[^\s"]+)/);
  const title = decode(heading?.[1].replace(/<[^>]*>/g, "").trim() ?? "");
  if (!title) continue;

  const href = new URL(path.replace(/\/$/, "") + "/", origin).href;
  const card = { href, title };
  if (thumbnail) {
    const image = new URL(decode(thumbnail[1]));
    image.searchParams.set("w", "640");
    card.image = image.href;
  }
  posts.set(href, card);
  if (posts.size === 5) break;
}
if (!posts.size) throw new Error("No official news cards found. Keeping the previous feed.");

const data = JSON.stringify([...posts.values()], null, 2);
await writeFile(new URL("./official-news.js", import.meta.url),
  "window.officialNewsPosts = " + data + ";\n", "utf8");
console.log("Official news: " + posts.size + " articles.");
