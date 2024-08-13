# React Robosite Generator

A command-line tool to generate robots.txt and sitemap.xml files for your React project.

## Installation

You can use this package without installing it by using `npx`:

```bash
npx react-robosite-generator http://your-site.com ./src/pages
```

Or, if you prefer to install it globally:

```bash
npm install -g react-robosite-generator
react-robosite-generator http://your-site.com ./src/pages
```

## Usage

Run the command in your React project's root directory:

```bash
npx react-robosite-generator <site-url> <pages-path>
```

- `<site-url>`: The base URL of your website (e.g., http://your-site.com)
- `<pages-path>`: The path to your pages directory (e.g., ./src/pages)

Example:

```bash
npx react-robosite-generator http://your-site.com ./src/pages
```

This will generate `robots.txt` and `sitemap.xml` files in the `public` folder of your React project.

## Requirements

- Node.js >= 12.0.0

## License

MIT
