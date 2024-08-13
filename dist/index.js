"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const parser_1 = require("@babel/parser");
const traverse_1 = __importDefault(require("@babel/traverse"));
const glob_1 = __importDefault(require("glob"));
const chokidar_1 = __importDefault(require("chokidar"));
function generateRobotsTxt(publicPath, siteUrl) {
    console.log("Generating robots.txt...");
    const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml`;
    fs_1.default.writeFileSync(path_1.default.join(publicPath, "robots.txt"), robotsTxt);
    console.log("robots.txt generated successfully");
}
function generateSitemapXml(publicPath, siteUrl, routes) {
    console.log("Generating sitemap.xml...");
    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${routes
        .map((route) => `
  <url>
    <loc>${siteUrl}${route}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>`)
        .join("")}
</urlset>`;
    fs_1.default.writeFileSync(path_1.default.join(publicPath, "sitemap.xml"), sitemapXml);
    console.log("sitemap.xml generated successfully");
}
function getRoutesFromProject(projectPath) {
    console.log("Scanning project for routes...");
    const routes = new Set();
    routes.add("/");
    const files = glob_1.default.sync("**/*.{js,jsx,ts,tsx}", { cwd: projectPath });
    console.log(`Found ${files.length} files to scan`);
    let scannedFiles = 0;
    files.forEach((file) => {
        const filePath = path_1.default.join(projectPath, file);
        const content = fs_1.default.readFileSync(filePath, "utf-8");
        try {
            const ast = (0, parser_1.parse)(content, {
                sourceType: "module",
                plugins: ["jsx", "typescript"],
            });
            (0, traverse_1.default)(ast, {
                StringLiteral(path) {
                    if (path.node.value.startsWith("/") &&
                        !path.node.value.includes("*")) {
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
        }
        catch (error) {
            console.warn(`Error parsing file ${file}: ${error.message}`);
        }
        scannedFiles++;
        if (scannedFiles % 10 === 0) {
            console.log(`Scanned ${scannedFiles} files...`);
        }
    });
    console.log(`Scanning complete. Found ${routes.size} unique routes.`);
    return Array.from(routes);
}
function watchProjectAndGenerate(siteUrl, projectPath, publicPath) {
    console.log(`Starting watch mode. Watching for changes in ${projectPath}...`);
    const watcher = chokidar_1.default.watch(projectPath, {
        ignored: /(^|[\/\\])\../,
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
        console.error("Usage: npx react-robosite-generator <site-url> <project-path> <public-path> [--watch]");
        process.exit(1);
    }
    const [siteUrl, projectPath, publicPath] = args.slice(0, 3);
    const watchMode = args[3] === "--watch";
    console.log(`Site URL: ${siteUrl}`);
    console.log(`Project path: ${projectPath}`);
    console.log(`Public path: ${publicPath}`);
    if (!fs_1.default.existsSync(publicPath)) {
        console.log(`Public directory does not exist. Creating ${publicPath}...`);
        fs_1.default.mkdirSync(publicPath, { recursive: true });
    }
    if (watchMode) {
        watchProjectAndGenerate(siteUrl, projectPath, publicPath);
    }
    else {
        console.log("Running in single generation mode...");
        const routes = getRoutesFromProject(projectPath);
        generateRobotsTxt(publicPath, siteUrl);
        generateSitemapXml(publicPath, siteUrl, routes);
        console.log("Generation complete. Exiting...");
    }
}
main();
