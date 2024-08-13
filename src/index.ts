import fs from "fs";
import path from "path";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import glob from "glob";
import chokidar from "chokidar";

function generateRobotsTxt(publicPath: string, siteUrl: string): void {
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml`;

  fs.writeFileSync(path.join(publicPath, "robots.txt"), robotsTxt);
  console.log("robots.txt generated successfully");
}

function generateSitemapXml(
  publicPath: string,
  siteUrl: string,
  routes: string[]
): void {
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
  const routes = new Set<string>();
  routes.add("/");

  const files = glob.sync("**/*.{js,jsx,ts,tsx}", { cwd: projectPath });

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
            routes.add(path.node.value);
          }
        },
        TemplateLiteral(path) {
          const value = path.get("quasis")[0].node.value.raw;
          if (value.startsWith("/") && !value.includes("*")) {
            routes.add(value);
          }
        },
      });
    } catch (error) {
      console.warn(`Error parsing file ${file}: ${(error as Error).message}`);
    }
  });

  return Array.from(routes);
}

function watchProjectAndGenerate(
  siteUrl: string,
  projectPath: string,
  publicPath: string
) {
  console.log(`Watching for changes in ${projectPath}...`);

  const watcher = chokidar.watch(projectPath, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
  });

  const generateFiles = () => {
    const routes = getRoutesFromProject(projectPath);
    generateRobotsTxt(publicPath, siteUrl);
    generateSitemapXml(publicPath, siteUrl, routes);
    console.log("Files regenerated due to project changes.");
  };

  watcher
    .on("add", generateFiles)
    .on("change", generateFiles)
    .on("unlink", generateFiles);

  console.log("Initial generation...");
  generateFiles();
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 3 || args.length > 4) {
    console.error(
      "Usage: npx react-robosite-generator <site-url> <project-path> <public-path> [--watch]"
    );
    process.exit(1);
  }

  const [siteUrl, projectPath, publicPath] = args.slice(0, 3);
  const watchMode = args[3] === "--watch";

  if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath, { recursive: true });
  }

  if (watchMode) {
    watchProjectAndGenerate(siteUrl, projectPath, publicPath);
  } else {
    const routes = getRoutesFromProject(projectPath);
    generateRobotsTxt(publicPath, siteUrl);
    generateSitemapXml(publicPath, siteUrl, routes);
  }
}

main();
