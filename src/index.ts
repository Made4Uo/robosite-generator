#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import glob from "glob";
import chokidar from "chokidar";

function generateRobotsTxt(publicPath: string, siteUrl: string): void {
  console.log("Generating robots.txt...");
  const robotsTxt = `# robots.txt for ${new URL(siteUrl).hostname}
# Block known scrapers and bots
User-agent: AhrefsBot
Disallow: /
User-agent: MJ12bot
Disallow: /
User-agent: SEMrushBot
Disallow: /
User-agent: Baiduspider
Disallow: /
User-agent: YandexBot
Disallow: /
User-agent: BLEXBot
Disallow: /
User-agent: dotbot
Disallow: /

# Block specific directories and files for all user agents
User-agent: *
Disallow: /private/
Disallow: /temp/
Disallow: /noindex/

# Allow crawling of all other content
Allow: /

# Allow all pages for Googlebot, Bingbot, and other legitimate search engines
User-agent: Googlebot
Disallow:
User-agent: Bingbot
Disallow:

# Block all other bots by default
User-agent: *
Disallow: /

# Sitemap location
Sitemap: ${siteUrl}/sitemap.xml`;

  fs.writeFileSync(path.join(publicPath, "robots.txt"), robotsTxt);
  console.log("robots.txt generated successfully");
}

function generateSitemapXml(
  publicPath: string,
  siteUrl: string,
  routes: string[]
): void {
  console.log("Generating sitemap.xml...");
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${routes
    .map(
      (route) => `
  <url>
    <loc>${siteUrl}${route}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>`
    )
    .join("")}
</urlset>`;

  fs.writeFileSync(path.join(publicPath, "sitemap.xml"), sitemapXml);
  console.log("sitemap.xml generated successfully");
}

function getRoutesFromProject(projectPath: string): string[] {
  console.log("Scanning project for routes...");
  const routes = new Set<string>();
  routes.add("/"); // Always include the root route

  const files = glob.sync("**/*.{js,jsx,ts,tsx}", { cwd: projectPath });
  console.log(`Found ${files.length} files to scan`);

  let scannedFiles = 0;
  files.forEach((file) => {
    const filePath = path.join(projectPath, file);
    const content = fs.readFileSync(filePath, "utf-8");
    try {
      const ast = parse(content, {
        sourceType: "module",
        plugins: ["jsx", "typescript"],
      });

      traverse(ast, {
        StringLiteral(path) {
          if (
            path.node.value.startsWith("/") &&
            !path.node.value.includes("*")
          ) {
            addRouteIfValid(routes, path.node.value);
          }
        },
        TemplateLiteral(path) {
          const value = path.get("quasis")[0].node.value.raw;
          if (value.startsWith("/") && !value.includes("*")) {
            addRouteIfValid(routes, value);
          }
        },
      });
    } catch (error) {
      console.warn(`Error parsing file ${file}: ${(error as Error).message}`);
    }
    scannedFiles++;
    if (scannedFiles % 10 === 0) {
      console.log(`Scanned ${scannedFiles} files...`);
    }
  });

  console.log(`Scanning complete. Found ${routes.size} unique routes.`);
  return Array.from(routes);
}

function addRouteIfValid(routes: Set<string>, route: string) {
  const excludedExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".mp3",
    ".wav",
    ".ogg",
    ".css",
    ".scss",
    ".less",
  ];
  const excludedDirectories = [
    "/images/",
    "/img/",
    "/assets/",
    "/sounds/",
    "/audio/",
    "/styles/",
    "/style/",
    "/css/",
  ];

  const isExcludedExtension = excludedExtensions.some((ext) =>
    route.endsWith(ext)
  );
  const isExcludedDirectory = excludedDirectories.some((dir) =>
    route.includes(dir)
  );

  if (!isExcludedExtension && !isExcludedDirectory) {
    routes.add(route);
  }
}

function watchProjectAndGenerate(
  siteUrl: string,
  projectPath: string,
  publicPath: string
) {
  console.log(`Starting watch mode. Watching for changes in ${projectPath}...`);

  const watcher = chokidar.watch(projectPath, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
  });

  const generateFiles = () => {
    console.log("Changes detected. Regenerating files...");
    const routes = getRoutesFromProject(projectPath);
    generateRobotsTxt(publicPath, siteUrl);
    generateSitemapXml(publicPath, siteUrl, routes);
    console.log("File regeneration complete.");
  };

  watcher
    .on("add", (path) => {
      console.log(`File ${path} has been added`);
      generateFiles();
    })
    .on("change", (path) => {
      console.log(`File ${path} has been changed`);
      generateFiles();
    })
    .on("unlink", (path) => {
      console.log(`File ${path} has been removed`);
      generateFiles();
    });

  console.log("Performing initial generation...");
  generateFiles();
}

function main() {
  console.log("React Robosite Generator starting...");
  const args = process.argv.slice(2);
  if (args.length < 3 || args.length > 4) {
    console.error(
      "Usage: npx react-robosite-generator <site-url> <project-path> <public-path> [--watch]"
    );
    process.exit(1);
  }

  const [siteUrl, projectPath, publicPath] = args.slice(0, 3);
  const watchMode = args[3] === "--watch";

  console.log(`Site URL: ${siteUrl}`);
  console.log(`Project path: ${projectPath}`);
  console.log(`Public path: ${publicPath}`);

  if (!fs.existsSync(publicPath)) {
    console.log(`Public directory does not exist. Creating ${publicPath}...`);
    fs.mkdirSync(publicPath, { recursive: true });
  }

  if (watchMode) {
    watchProjectAndGenerate(siteUrl, projectPath, publicPath);
  } else {
    console.log("Running in single generation mode...");
    const routes = getRoutesFromProject(projectPath);
    generateRobotsTxt(publicPath, siteUrl);
    generateSitemapXml(publicPath, siteUrl, routes);
    console.log("Generation complete. Exiting...");
  }
}

main();
