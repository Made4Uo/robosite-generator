# React Robosite Generator

[![npm version](https://badge.fury.io/js/react-robosite-generator.svg)](https://badge.fury.io/js/react-robosite-generator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A command-line tool to generate robots.txt and sitemap.xml files for your React project by scanning your entire project for route definitions. Works with various React frameworks and routing libraries!

## Installation

You can use this package without installing it by using `npx`:

```bash
npx react-robosite-generator http://your-site.com ./src ./public [--watch]
```

Or, if you prefer to install it globally:

```bash
npm install -g react-robosite-generator
react-robosite-generator http://your-site.com ./src ./public [--watch]
```

## Usage

Run the command in your React project's root directory:

```bash
npx react-robosite-generator <site-url> <project-path> <public-path> [--watch]
```

- `<site-url>`: The base URL of your website (e.g., http://your-site.com)
- `<project-path>`: The path to your project's source files (e.g., ./src)
- `<public-path>`: The path to your public directory where the files will be generated (e.g., ./public)
- `--watch`: (Optional) Enable watch mode to automatically regenerate files when any project file changes

Example:

```bash
npx react-robosite-generator http://your-site.com ./src ./public --watch
```

This will generate `robots.txt` and `sitemap.xml` files in the specified public folder of your React project and continue watching for changes to any project files.

## How it works

This tool scans your entire project directory for potential route definitions. It looks for string literals and template literals that start with a forward slash ('/'), which are likely to be route paths. This approach works across different React frameworks and routing libraries, including but not limited to:

- Next.js
- React Router
- Gatsby
- React Location

The tool then uses these discovered routes to generate a comprehensive sitemap.xml file. This approach ensures that your sitemap accurately reflects your application's structure, regardless of the routing solution you're using.

In watch mode, the tool will continue running and regenerate the files whenever changes are detected in any project file.

## Contributing

We welcome contributions to React Robosite Generator! Please see our [Contributing Guide](CONTRIBUTING.md) for more details on how to get started.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Requirements

- Node.js >= 12.0.0
- A React project (compatible with various routing solutions)
