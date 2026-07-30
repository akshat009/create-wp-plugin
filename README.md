# create-wp-plugin

Interactive scaffold generator for modern, production-ready WordPress plugins — built with PSR-4 autoloading, WPCS/VIP coding standards, PHPUnit unit tests, WP-CLI command integration, and optional React/Gutenberg build workflows.

## Usage

### Quick Start via NPX
Run directly without installing:
```bash
npx github:akshat009/create-wp-plugin
```

### Local Usage
```bash
node index.js
```

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
- ⚛️ **Optional React / Gutenberg Support**: Built-in `@wordpress/scripts` asset compilation workflow.
- 📦 **Modular Architecture**: Toggleable scaffolding for Admin Settings Page, Shortcodes, REST API, AJAX, CPT + Taxonomies, Cron Jobs, Elementor Widgets, and WooCommerce Hooks.
- ⚙️ **GitHub Actions CI**: Preconfigured workflow for automated PHPCS linting and PHP 8.0 / 8.2 / 8.3 test matrix.
