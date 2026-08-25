# create-wp-plugin

Interactive scaffold generator for modern, production-ready WordPress plugins — a SOLID/DI architecture (Container + Service Providers), PSR-4 autoloading, selectable WPCS/VIP coding standards, PHPUnit unit **and** integration tests, Jest, Playwright E2E, WP-CLI command integration, and an optional React/Interactivity build pipeline (`@wordpress/scripts`).

## Usage

### Quick Start via NPX
Run directly without installing:
```bash
npx create-wp-plugin-cli
```

> Published on npm as [`create-wp-plugin-cli`](https://www.npmjs.com/package/create-wp-plugin-cli) (the `create-wp-plugin` name was already taken). You can still run the latest `main` branch directly from GitHub with `npx github:akshat009/create-wp-plugin-cli`.

### Local Usage
```bash
node index.js
```

### CLI Flags (Non-Interactive Mode)
```bash
node index.js --yes --name "My Plugin" --prefix myp --namespace MyPlugin --out ./my-plugin
```

Available flags: `--help`, `--version`, `--yes`, `--name`, `--slug`, `--namespace`, `--prefix`, `--author`, `--email`, `--author-uri`, `--description`, `--min-php`, `--out`, `--modules`, `--react`, `--no-react`, `--lint-target`.

`--modules` accepts a comma-separated list of: `admin_settings`, `shortcode`, `rest_api`, `ajax_handler`, `cpt_taxonomy`, `cron`, `caching`, `custom_table`, `elementor_widget`, `woocommerce_hooks`, `interactivity`.

`--lint-target` selects which WPCS ruleset(s) `composer lint` enforces: `wp-org` (default — `WordPress-Extra` + `WordPress-Docs`), `vip` (`WordPress-VIP-Go` only — WordPress VIP hosting), or `both`.

## After Generating

```bash
cd <slug>
composer install            # installs PHPCS/WPCS/VIP rulesets, PHPUnit, wp-phpunit
                            # (required before composer lint / composer test will work)
composer lint
composer test                # unit suite (Brain Monkey — no WordPress install needed)
composer test:integration    # integration suite (real WordPress via wp-phpunit — needs a MySQL test DB; see the generated README.md)
git init && git add -A && git commit -m "scaffold"
```

If you included React, Interactivity, or WooCommerce (anything with a JS build pipeline):
```bash
npm install
npm run build
npm run test:e2e   # Playwright — needs a running WordPress site (WP_BASE_URL env var, defaults to wp-env's localhost:8889)
```
`npm run test:js` (Jest, the React admin app's counter component) is also available if you included React.

> **Note:** `composer install` may prompt to allow the `dealerdirect/phpcodesniffer-composer-installer` plugin — answer **yes**. You may also see *"No composer.lock file present"* on the first run; that's normal.

## Architecture

Every generated plugin is a composition root, not a service-locator singleton:
- `Plugin::create()` builds a `Core\Container` and a list of providers; `Plugin::boot()` runs each one.
- Providers implement `Contracts\Service_Provider` — `register()` is for container bindings only (no side effects), `boot()` is where WordPress hooks get registered.
- A provider can implement `Contracts\Conditional` to self-exclude (e.g. only run when a required plugin is active) — this is how every WooCommerce provider skips itself when WooCommerce isn't installed.
- `Core\Activator`/`Deactivator` implement `Contracts\Activatable`/`Deactivatable` and resolve their dependencies from the container, rather than the static-method-that-bypasses-everything pattern common in older plugin boilerplates.
- Extend without touching core files via the `{{PREFIX}}_providers` WordPress filter.

## Features
- ⚡ **PSR-4 Autoloading**: Clean `src/` directory layout with automatic fallback.
- 🏗️ **SOLID / DI Architecture**: `Container` + `Service_Provider` composition root — no singletons, no god classes; every WooCommerce feature and admin concern is its own focused, independently-testable class.
- 🎨 **Selectable Coding Standards**: WordPress.org, WordPress VIP, or both (`--lint-target`) — plus Docs and PHPCompatibilityWP.
- 🧪 **Two-tier PHPUnit**: Brain Monkey unit tests (`composer test`, no WordPress install needed) *and* a real-WordPress integration suite via `wp-phpunit/wp-phpunit` (`composer test:integration`).
- 🃏 **Jest** unit tests for the React admin app, 🎭 **Playwright** E2E tests against a live site — both scaffolded automatically alongside any JS build pipeline.
- 💻 **WP-CLI Commands**: Built-in `wp <prefix> status` and `wp <prefix> cache clear` handlers.
- ⚛️ **React Admin App Build Pipeline**: `@wordpress/scripts` workflow mounting a real interactive React app into your plugin's own wp-admin screen (never shipped to frontend visitors).
- ⚡ **Frontend Interactivity Module**: WordPress's native Interactivity API (directive-based, WP 6.5+) instead of shipping a React runtime to visitors.
- 🗄️ **Custom Database Table Module**: `dbDelta()`-based schema with automatic migrations (schema version checked on every request) plus a repository class.
- 🧰 **Caching Module**: object-cache + transient-fallback wrapper service.
- 📦 **Modular**: toggle Admin Settings, Shortcodes, REST API, AJAX, CPT + Taxonomies, Cron, Caching, Custom DB Table, Elementor Widgets, WooCommerce, and Frontend Interactivity independently.
- 🛒 **Full WooCommerce Integration**: payment gateway (classic **and** Blocks checkout), shipping method, custom order email, custom product type, HPOS compatibility, cart-summary block — each its own `Service_Provider`, all real and PHPCS-clean.
- 🎨 **Elementor Auto-Discovery**: widgets in `src/Widgets/` auto-registered with convention-based CSS/JS.
- 🛠️ **VS Code Tooling**: code snippets, PHPCS integration, EditorConfig, WordPress stubs via Intelephense.
- ⚙️ **GitHub Actions CI**: PHPCS linting + PHP version matrix, with retry-hardened `composer install`.

> **Note:** To scaffold Gutenberg blocks, use `npx @wordpress/create-block`.

## License
GPL-2.0-or-later
