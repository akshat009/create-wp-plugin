# {{PLUGIN_NAME}}

{{DESCRIPTION}}

## Requirements
- PHP {{MIN_PHP}}+
- WordPress 6.0+

## Installation
1. Clone or download this repository into your `wp-content/plugins/` directory.
2. Run `composer install` to install PHP dependencies and setup autoloader.
{{README_REACT_INSTALL}}

## WP-CLI Commands
- `wp {{PREFIX}} status` — Display plugin version and cache backend.
- `wp {{PREFIX}} cache clear` — Clear plugin cache.

## Development Scripts
- `composer lint` — Run PHPCS checks against WordPress Coding Standards.
- `composer lint:fix` — Automatically fix lint errors with PHPCBF.
- `composer test` — Run PHPUnit unit test suite.
{{README_REACT_SCRIPTS}}
