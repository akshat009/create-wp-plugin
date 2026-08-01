# {{PLUGIN_NAME}}

{{DESCRIPTION}}

## Requirements
- PHP {{MIN_PHP}}+
- WordPress 6.0+

## Installation
1. Clone or download this repository into your `wp-content/plugins/` directory.
2. Run `composer install` to install PHP dependencies and setup autoloader.
{{README_REACT_INSTALL}}

## Architecture & Services
This plugin uses a modular composition root orchestrated by `Plugin::get_instance()`.
- Services implement `{{NS}}\Contracts\Registrable`.
- Additional services can be injected without modifying core files using the `{{PREFIX}}_services` WordPress filter.

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
- `composer test` — Run PHPUnit unit test suite.
{{README_REACT_SCRIPTS}}
