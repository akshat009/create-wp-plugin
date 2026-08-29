# {{PLUGIN_NAME}}

{{DESCRIPTION}}

## Requirements
- PHP {{MIN_PHP}}+
- WordPress {{REQUIRES_AT_LEAST}}+

## Installation
1. Clone or download this repository into your `wp-content/plugins/` directory.
2. Run `composer install` to install PHP dependencies and setup autoloader. *(Note: On the first run, seeing "No composer.lock file present" is normal; Composer will generate it automatically).*
{{#if needs_build_pipeline}}
3. Run `npm install` and `npm run build` to compile JS assets.
   > Note: `assets/build` is gitignored and generated during build.
{{/if}}

## Architecture & Services
This plugin uses a modular composition root: `Plugin::create()` builds a `{{NS}}\Core\Container` and a list of providers, then `Plugin::boot()` runs each one.
- Providers implement `{{NS}}\Contracts\Service_Provider` (`register()` for container bindings, `boot()` for WordPress hooks).
- A provider can optionally implement `{{NS}}\Contracts\Conditional` to self-exclude (e.g. only run when a required plugin is active).
- Additional providers can be injected without modifying core files using the `{{PREFIX}}_providers` WordPress filter.

{{#if elementor_widget}}
## Elementor Widgets Convention
Concrete widget classes placed in `src/Widgets/` are automatically discovered:
- **Class Extension**: Custom widgets extend `\Elementor\Widget_Base` directly.
- **Naming & Asset Handles**: Underscores in class names convert to hyphens (e.g. `Sample_Widget` in `src/Widgets/Sample_Widget.php` maps to handle `{{PREFIX}}-sample-widget`).
- **Asset Auto-Discovery**: If `assets/css/widgets/sample-widget.css` or `assets/js/widgets/sample-widget.js` exist, they are auto-registered for elementor on-demand enqueueing.

{{/if}}
{{#if cli}}
## WP-CLI Commands
- `wp {{PREFIX}} status` — Display plugin version and cache backend.
- `wp {{PREFIX}} cache clear` — Clear plugin cache.

{{/if}}
## Development Scripts
- `composer lint` — Run PHPCS checks against WordPress Coding Standards.
- `composer lint:fix` — Automatically fix lint errors with PHPCBF.
- `composer test` — Run the PHPUnit unit test suite (`tests/Unit/` — Brain Monkey, WordPress functions are stubs, no WordPress install needed).
{{#if integration_tests}}
- `composer test:integration` — Run the PHPUnit integration suite (`tests/Integration/` — a real WordPress install via `wp-phpunit/wp-phpunit`, backed by an actual MySQL test database). Set these environment variables first (`WP_TESTS_DB_HOST` defaults to `localhost`):
  - bash / zsh: `export WP_TESTS_DB_NAME=wp_tests WP_TESTS_DB_USER=root WP_TESTS_DB_PASSWORD=root`
  - PowerShell: `$env:WP_TESTS_DB_NAME="wp_tests"; $env:WP_TESTS_DB_USER="root"; $env:WP_TESTS_DB_PASSWORD="root"`
  - cmd.exe: `set WP_TESTS_DB_NAME=wp_tests && set WP_TESTS_DB_USER=root && set WP_TESTS_DB_PASSWORD=root`
{{/if}}
{{#if needs_build_pipeline}}
- `npm run build` — Build JS assets for production.
- `npm run start` — Start JS asset dev server in watch mode.
- `npm run test:e2e` — Run Playwright E2E tests against a running WordPress site (`WP_BASE_URL`, defaults to `http://localhost:8889` — e.g. `wp-env start`).
{{#if use_react}}
- `npm run test:js` — Run Jest unit tests for the JS admin app.
{{/if}}
{{/if}}
- `npm run lint:js` / `npm run lint:style` — Lint JS and stylesheets with `@wordpress/scripts`.

## Releasing

Build a distributable zip with `@wordpress/scripts`. The order matters — the
production autoloader and built assets have to exist *before* the archive is
created:

```sh
{{#if needs_build_pipeline}}
npm install && npm run build
{{/if}}
composer install --no-dev --optimize-autoloader
npm run plugin-zip
```

`plugin-zip` archives exactly the paths in package.json's `files` field
(`vendor/` and `assets/src/` included, per WordPress.org guidelines) into
`{{SLUG}}.zip`. There is no `.distignore` — `files` is the single source of
truth. Re-run `composer install` afterwards to restore your dev dependencies.
