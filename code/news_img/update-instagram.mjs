import {readFile, writeFile} from "node:fs/promises";


const account = "hololivedreams_info";
const profile = "https://www.instagram.com/" + account + "/";
const limit = 20;
const historyPath = new URL("./instagram-live.js", import.meta.url);
const prefix = "window.instagramLivePosts = ";

function thumbnail(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function readPosts(html) {
  const contexts = html.matchAll(/"contextJSON"\s*:\s*("(?:[^"\\]|\\.)*")/g);
  for (const [, encoded] of contexts) {
    const {context} = JSON.parse(JSON.parse(encoded));
    if (context?.username !== account || !Array.isArray(context.graphql_media)) continue;
    return context.graphql_media.flatMap(entry => {
      const post = entry.shortcode_media ?? entry.node ?? entry;
      const id = post.shortcode;
      const timestamp = post.taken_at_timestamp;
      if (typeof id !== "string" || !/^[\w-]+$/.test(id) ||
          !Number.isSafeInteger(timestamp) || timestamp <= 0) return [];
      const video = post.product_type === "clips";
      return [{
        id,
        status: "news",
        href: "https://www.instagram.com/" + (video ? "reel/" : "p/") + id + "/",
        image: thumbnail(post.display_url ?? post.thumbnail_src),
        channel: "@" + account,
        title: post.edge_media_to_caption?.edges?.[0]?.node?.text?.replace(/\s+/g, " ").trim().slice(0, 240) || "Instagramの投稿",
        timestamp
      }];
    });
  }
  return [];
}

async function readHistory() {
  try {
    return JSON.parse((await readFile(historyPath, "utf8")).trim().slice(prefix.length, -1)).filter(post =>
      post.channel === "@" + account && Number.isSafeInteger(post.timestamp));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

const response = await fetch(profile + "embed/", {
  headers: {Accept: "text/html"},
  signal: AbortSignal.timeout(20_000)
});
if (!response.ok) throw new Error("Instagram public embed HTTP " + response.status);
const posts = readPosts(await response.text());
const imagePosts = posts.filter(post => post.image);
if (!imagePosts.length) throw new Error("No posts found in the public Instagram embed.");

const history = new Map((await readHistory()).map(post => [post.id, post]));
for (const post of imagePosts) history.set(post.id, post);
const latest = [...history.values()].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
await writeFile(historyPath, prefix + JSON.stringify(latest, null, 2) + ";\n", "utf8");
console.log(`Instagram: fetched ${imagePosts.length}, retained ${latest.length} posts.`);
