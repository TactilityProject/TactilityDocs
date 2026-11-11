import { InputPathToUrlTransformPlugin } from "@11ty/eleventy";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import markdownIt from "markdown-it";
import anchor from "markdown-it-anchor";
import alerts from "markdown-it-github-alerts";
import container from "markdown-it-container";
import * as pagefind from "pagefind";

const input = "docs";
const fonts = "node_modules/@fontsource-variable";

// A version is a folder in docs/ with a _sidebar.md. "main" comes first, then
// the releases from new to old.
function loadVersions() {
  const release = (id) => id.replace(/^v/, "").split(".").map(Number);
  const ids = fs
    .readdirSync(input)
    .filter((name) => fs.existsSync(path.join(input, name, "_sidebar.md")))
    .sort((a, b) => {
      if (a === "main" || b === "main") return a === "main" ? -1 : b === "main" ? 1 : 0;
      const [x, y] = [release(a), release(b)];
      for (let i = 0; i < Math.max(x.length, y.length); i++) {
        if ((x[i] || 0) !== (y[i] || 0)) return (y[i] || 0) - (x[i] || 0);
      }
      return 0;
    });
  const latest = ids.find((id) => id !== "main");
  return ids.map((id) => {
    const sections = parseSidebar(id);
    return {
      id,
      url: `/${id}/`,
      development: id === "main",
      latest: id === latest,
      sections,
      pages: sections.flatMap((section) => section.items).filter((item) => item.url.startsWith(`/${id}/`)),
    };
  });
}

// _sidebar.md is a list of links, optionally grouped under a title:
//   - Group title
//     - [Page](folder/page.md)
function parseSidebar(id) {
  const sections = [{ title: null, items: [{ label: "Overview", url: `/${id}/` }] }];
  const lines = fs.readFileSync(path.join(input, id, "_sidebar.md"), "utf8").split("\n");
  for (const line of lines) {
    const entry = /^(\s*)[-*]\s+(.*\S)\s*$/.exec(line);
    if (!entry) continue;
    const link = /^\[(.+)\]\((.+)\)$/.exec(entry[2]);
    if (!link) {
      sections.push({ title: entry[2], items: [] });
      continue;
    }
    if (!entry[1] && sections.at(-1).title) sections.push({ title: null, items: [] });
    const file = path.posix.normalize(path.posix.join(id, link[2]));
    if (!fs.existsSync(path.join(input, file))) {
      throw new Error(`${id}/_sidebar.md links to ${link[2]}, which doesn't exist`);
    }
    sections.at(-1).items.push({ label: link[1], url: fileUrl(file) });
  }
  return sections.filter((section) => section.items.length);
}

// "main/app-development/ui.md" -> "/main/app-development/ui/"
function fileUrl(file) {
  const url = "/" + file.replace(/\.md$/, "/").replace(/(^|\/)index\/$/, "$1");
  return url;
}

// Path of a page inside docs/, e.g. "main/app-development/ui.md"
const relativeInput = (inputPath) => path.posix.relative(input, inputPath.replaceAll(path.sep, "/"));

function versionOf(versions, inputPath) {
  const id = relativeInput(inputPath).split("/")[0];
  return versions.find((version) => version.id === id);
}

// PlantUML diagrams are rendered by the PlantUML server: the image URL
// contains the compressed source.
function plantUmlUrl(source) {
  if (!/skinparam\s+backgroundColor/i.test(source)) {
    source = source.replace(/@startuml[^\n]*\n/, "$&skinparam backgroundColor transparent\n");
  }
  const from = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const to = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";
  const encoded = zlib
    .deflateRawSync(Buffer.from(source, "utf8"), { level: 9 })
    .toString("base64")
    .replace(/=+$/, "")
    .replace(/[A-Za-z0-9+/]/g, (char) => to[from.indexOf(char)]);
  return `https://www.plantuml.com/plantuml/svg/${encoded}`;
}

export default function (eleventyConfig) {
  // Lets markdown link to other pages by file name, e.g. [Simulator](simulator.md)
  eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);
  eleventyConfig.addPlugin(syntaxHighlight);

  // The sidebars are data, not pages
  eleventyConfig.ignores.add(`${input}/**/_sidebar.md`);
  eleventyConfig.addWatchTarget(`${input}/**/_sidebar.md`);

  eleventyConfig.addGlobalData("versions", loadVersions);
  eleventyConfig.addGlobalData("layout", "page");
  eleventyConfig.addGlobalData("eleventyComputed", {
    version: (data) => (data.page.inputPath ? versionOf(data.versions, data.page.inputPath) : undefined),
    // Title for the browser tab: the frontmatter title, else the first
    // heading of the page, else the label in the sidebar
    docTitle: (data) => {
      if (data.title) return data.title;
      if (!data.page.inputPath?.endsWith(".md")) return undefined;
      const source = fs.readFileSync(data.page.inputPath, "utf8").split("```")[0];
      const heading = /^# +(.+)$/m.exec(source);
      if (heading) return heading[1].trim();
      const version = versionOf(data.versions, data.page.inputPath);
      const url = fileUrl(relativeInput(data.page.inputPath));
      return version?.pages.find((item) => item.url === url)?.label;
    },
  });

  // {{versionLabel}} in a page is the name of its version folder, which is
  // also the name of the branch or tag in the Tactility repository
  eleventyConfig.addPreprocessor("versionLabel", "md", (data, content) => {
    if (!content.includes("{{versionLabel}}")) return content;
    return content.replaceAll("{{versionLabel}}", relativeInput(data.page.inputPath).split("/")[0]);
  });

  // Tabbed card in markdown, without JavaScript (radio buttons + CSS):
  //   :::: tabs
  //   ::: tab Linux / macOS
  //   ...
  //   :::
  //   ::: tab Windows
  //   ...
  //   :::
  //   ::::
  let tabGroup = 0;
  let tabIndex = 0;
  const escapeHtml = markdownIt().utils.escapeHtml;

  const md = markdownIt({ html: true, linkify: true })
    .use(anchor, {
      level: 2,
      // Same ids as the old Docsify site, e.g. "Manifest.properties" -> "manifestproperties"
      slugify: (text) =>
        text
          .trim()
          .toLowerCase()
          .replace(/[^\p{L}\p{N}\s_-]/gu, "")
          .replace(/\s+/g, "-"),
      permalink: anchor.permalink.headerLink({ safariReaderFix: true }),
    })
    .use(alerts)
    .use(container, "tabs", {
      render(tokens, idx) {
        if (tokens[idx].nesting !== 1) return "</div>\n";
        tabGroup++;
        tabIndex = 0;
        return '<div class="tabs">\n';
      },
    })
    .use(container, "tab", {
      render(tokens, idx) {
        if (tokens[idx].nesting !== 1) return "</div>\n";
        const title = escapeHtml(tokens[idx].info.trim().replace(/^tab\s*/, ""));
        const id = `tab-${tabGroup}-${++tabIndex}`;
        const checked = tabIndex === 1 ? " checked" : "";
        return (
          `<input class="tab-input" type="radio" name="tabs-${tabGroup}" id="${id}"${checked}>` +
          `<label class="tab-label" for="${id}">${title}</label>\n<div class="tab-panel">\n`
        );
      },
    });

  // ```plantuml code blocks become diagrams
  const fence = md.renderer.rules.fence;
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    if (token.info.trim() !== "plantuml") return fence(tokens, idx, options, env, self);
    return `<p class="diagram"><img src="${plantUmlUrl(token.content)}" alt="Diagram" loading="lazy"></p>\n`;
  };

  eleventyConfig.setLibrary("md", md);

  eleventyConfig.addPassthroughCopy(`${input}/images`);
  eleventyConfig.addPassthroughCopy(`${input}/assets`);
  eleventyConfig.addPassthroughCopy(`${input}/CNAME`);
  eleventyConfig.addPassthroughCopy({
    [`${fonts}/inter/files/inter-latin-wght-normal.woff2`]: "assets/fonts/inter.woff2",
    [`${fonts}/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2`]: "assets/fonts/jetbrains-mono.woff2",
  });

  // URL of the same page in another version, or the start page of that
  // version when it doesn't have the page
  eleventyConfig.addFilter("inVersion", (inputPath, version) => {
    const [, ...rest] = relativeInput(inputPath).split("/");
    const file = [version.id, ...rest].join("/");
    return fs.existsSync(path.join(input, file)) ? fileUrl(file) : version.url;
  });

  // The pages before and after a page, in the order of the sidebar
  eleventyConfig.addFilter("neighbours", (version, url) => {
    const index = version.pages.findIndex((item) => item.url === url);
    if (index < 0) return {};
    return { previous: version.pages[index - 1], next: version.pages[index + 1] };
  });

  // Second and third level headings of rendered content, for the "On this page" list
  eleventyConfig.addFilter("headings", (html) =>
    [...String(html).matchAll(/<h([23]) id="([^"]+)"[^>]*>(.*?)<\/h\1>/gs)].map((m) => ({
      level: Number(m[1]),
      id: m[2],
      text: m[3].replace(/<[^>]+>/g, ""),
    })),
  );

  // Search index (Pagefind), written next to the built pages
  eleventyConfig.on("eleventy.after", async ({ directories }) => {
    const { index } = await pagefind.createIndex();
    const { page_count } = await index.addDirectory({ path: directories.output });
    await index.writeFiles({ outputPath: path.join(directories.output, "pagefind") });
    await pagefind.close();
    console.log(`[pagefind] Indexed ${page_count} pages`);
  });

  return {
    dir: { input, output: "_site" },
    markdownTemplateEngine: false,
  };
}
