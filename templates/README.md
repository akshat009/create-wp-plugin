# {{PLUGIN_NAME}}

{{DESCRIPTION}}

## Requirements
- PHP {{MIN_PHP}}+
- WordPress {{REQUIRES_AT_LEAST}}+

## Installation
1. Clone or download this repository into your `wp-content/plugins/` directory.
2. Run `composer install` to install PHP dependencies and setup autoloader. *(Note: On the first run, seeing "No composer.lock file present" is normal; Composer will generate it automatically).*
{{README_REACT_INSTALL}}

## Architecture & Services
This plugin uses a modular composition root: `Plugin::create()` builds a `{{NS}}\Core\Container` and a list of providers, then `Plugin::boot()` runs each one.
- Providers implement `{{NS}}\Contracts\Service_Provider` (`register()` for container bindings, `boot()` for WordPress hooks).
- A provider can optionally implement `{{NS}}\Contracts\Conditional` to self-exclude (e.g. only run when a required plugin is active).
- Additional providers can be injected without modifying core files using the `{{PREFIX}}_providers` WordPress filter.

## Elementor Widgets Convention
Concrete widget classes placed in `src/Widgets/` are automatically discovered:
- **Class Extension**: Custom widgets extend `\Elementor\Widget_Base` directly.
- **Naming & Asset Handles**: Underscores in class names convert to hyphens (e.g. `Sample_Widget` in `src/Widgets/Sample_Widget.php` maps to handle `{{PREFIX}}-sample-widget`).
- **Asset Auto-Discovery**: If `assets/css/widgets/sample-widget.css` or `assets/js/widgets/sample-widget.js` exist, they are auto-registered for elementor on-demand enqueueing.

## WP-CLI Commands
- `wp {{PREFIX}} status` — Display plugin version and cache backend.
- `wp {{PREFIX}} cache clear` — Clear plugin cache.

## Development Scripts
- `composer lint` — Run PHPCS checks against WordPress Coding Standards.
- `composer lint:fix` — Automatically fix lint errors with PHPCBF.
- `composer test` — Run the PHPUnit unit test suite (`tests/Unit/` — Brain Monkey, WordPress functions are stubs, no WordPress install needed).
- `composer test:integration` — Run the PHPUnit integration suite (`tests/Integration/` — a real WordPress install via `wp-phpunit/wp-phpunit`, backed by an actual MySQL test database). Set these environment variables first (`WP_TESTS_DB_HOST` defaults to `localhost`):
  - bash / zsh: `export WP_TESTS_DB_NAME=wp_tests WP_TESTS_DB_USER=root WP_TESTS_DB_PASSWORD=root`
  - PowerShell: `$env:WP_TESTS_DB_NAME="wp_tests"; $env:WP_TESTS_DB_USER="root"; $env:WP_TESTS_DB_PASSWORD="root"`
  - cmd.exe: `set WP_TESTS_DB_NAME=wp_tests && set WP_TESTS_DB_USER=root && set WP_TESTS_DB_PASSWORD=root`
{{README_REACT_SCRIPTS}}
