# create-wp-plugin

Interactive scaffold generator for modern, production-ready WordPress plugins — built with PSR-4 autoloading, WPCS/VIP coding standards, PHPUnit unit tests, WP-CLI command integration, and optional React asset build pipeline (`@wordpress/scripts`).

## Usage

### Quick Start via NPX
Run directly without installing:
```bash
npx github:akshat009/create-wp-plugin
```

> **Note:** `npx create-wp-plugin` is not published to npm registry yet — use `npx github:akshat009/create-wp-plugin`.

### Local Usage
```bash
node index.js
```

### CLI Flags (Non-Interactive Mode)
```bash
node index.js --yes --name "My Plugin" --prefix myp --namespace MyPlugin --out ./my-plugin
```

Available flags: `--help`, `--version`, `--yes`, `--name`, `--slug`, `--namespace`, `--prefix`, `--author`, `--email`, `--author-uri`, `--description`, `--min-php`, `--out`, `--modules`, `--react`, `--no-react`.

## After Generating

After running the generator, perform the following steps to initialize your project:

```bash
cd <slug>
composer install        # installs PHPCS/WPCS/VIP rulesets, PHPUnit (required
                        # before composer lint / composer test will work)
composer lint
composer test
git init && git add -A && git commit -m "scaffold"
```

> **Note:** `composer install` may prompt to allow the `dealerdirect/phpcodesniffer-composer-installer` plugin — answer **yes**, as it registers the WPCS/VIP rulesets with PHPCS.

## Features
- ⚡ **PSR-4 Autoloading**: Clean `src/` directory layout with automatic fallback.
- 🎨 **WordPress Coding Standards**: Full WPCS, Docs, VIP Go, and PHPCompatibilityWP integration (`composer lint`).
- 🧪 **PHPUnit & Brain Monkey**: Zero-WordPress-install unit testing suite (`composer test`).
- 💻 **WP-CLI Commands**: Built-in `wp <prefix> status` and `wp <prefix> cache clear` handlers.
- ⚛️ **React Asset Build Pipeline**: Built-in `@wordpress/scripts` asset compilation workflow.
- 📦 **Modular Architecture**: Toggleable scaffolding for Admin Settings Page, Shortcodes, REST API, AJAX, CPT + Taxonomies, Cron Jobs, Elementor Widgets, and WooCommerce Hooks.
- 🔌 **Service Composition**: Extensible `{{PREFIX}}_services` filter to inject third-party `Registrable` services.
- 🎨 **Elementor Auto-Discovery**: Automatic discovery of concrete widgets in `src/Widgets/` with convention-based CSS/JS registration (`{{PREFIX}}-widget-slug`).
- 🛠️ **VS Code Tooling**: Code snippets (`wpelwidget`), PHPCS integration (`valeryanm.vscode-phpsab`), EditorConfig support, and WordPress stubs via Intelephense.
- ⚙️ **GitHub Actions CI**: Preconfigured workflow for automated PHPCS linting and PHP version matrix testing.

> **Note:** To scaffold Gutenberg blocks, use `npx @wordpress/create-block`.

## License
GPL-2.0-or-later
