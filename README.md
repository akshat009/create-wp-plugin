# create-wp-plugin

Interactive scaffold generator for modern, production-ready WordPress plugins — a
modular bootloader architecture (one `Plugin` composition root wiring plain
`init_hooks()` modules), PSR-4 autoloading, selectable WPCS/VIP coding standards,
a Brain Monkey unit suite, a `wp-scripts plugin-zip` distribution pipeline, and a
set of opt-in modules
(REST, CPT, Cron, Caching, custom DB table, native Gutenberg blocks, Elementor,
WooCommerce, the Interactivity API, WP-CLI commands, a real-WordPress integration
suite, …) that stay freely combinable.

## Usage

Run it without installing — pick whichever you prefer:

```bash
npm create wp-plugin-cli                      # npm's create-* shorthand
npx create-wp-plugin-cli                      # same thing via npx
npx github:akshat009/create-wp-plugin-cli     # latest main, straight from GitHub
```

> Published on npm as [`create-wp-plugin-cli`](https://www.npmjs.com/package/create-wp-plugin-cli)
> — the shorter `create-wp-plugin` name was already taken.

### From a clone

```bash
node index.js
```

### Non-interactive

```bash
npx create-wp-plugin-cli --yes --name "My Plugin" --prefix myp --namespace MyPlugin \
  --modules "admin_settings,rest_api,block:dynamic" --out ./my-plugin
```

Piping in without `--yes` (no TTY) exits with an error instead of hanging on a
prompt. Emoji output falls back to ASCII when `NO_COLOR` is set or the terminal
can't render it. A failure partway through generation rolls back the directory it
created.

### Flags

`--help`, `--version`, `--yes`, `--name`, `--slug`, `--namespace`, `--prefix`,
`--author`, `--email`, `--author-uri`, `--description`, `--out`,
`--modules`, `--react`, `--no-react`, `--lint-target`.

Generated plugins target **PHP 8.2** — this is fixed, not configurable. The
output uses constructor property promotion, `readonly` properties, and
first-class callable syntax throughout.

`--lint-target` picks the WPCS ruleset(s) `composer lint` enforces:
`wp-org` (default — `WordPress-Extra` + `WordPress-Docs`), `vip`
(`WordPress-VIP-Go` only), or `both`.

## Modules

Pass any combination to `--modules` (comma-separated), or pick them in the
interactive multiselect. Nothing here depends on anything else.

| Module | What you get |
| --- | --- |
| `admin_settings` | Settings API page split into `Settings_Registrar` / `Settings_Repository` / a view |
| `shortcode` | A `Frontend\Shortcode` class registering one shortcode |
| `rest_api` | A `WP_REST_Controller` subclass with a permission callback |
| `ajax_handler` | Nonce + capability-guarded `admin-ajax` handler, plus the `assets/js/main.js` it enqueues |
| `cpt_taxonomy` | `Post_Types` (CPT + taxonomy), wired into activation |
| `cron` | `Cron\Scheduler` with a scheduled event and a worked example body |
| `caching` | `Cache_Service` — a persistent object cache **or** transient, chosen at call time (never both) |
| `custom_table` | `dbDelta()` schema + `Item_Repository`, version-checked migrations |
| `elementor_widget` | `Widget_Registrar` auto-discovery of `src/Widgets/*`, convention-based CSS/JS |
| `block` | Native Gutenberg block(s). Opens a sub-choice — `block:dynamic` (server-rendered via `render.php`) and/or `block:static` (`save()`-serialized). `block` / `block:all` = both. `Block_Registrar` globs `assets/build/blocks/*`, so adding more blocks later needs no PHP change |
| `interactivity` | WordPress Interactivity API store (`view.js` + Script Module, WP 6.5+) |
| `woocommerce_hooks` | Opens a sub-choice of `woo:` components: `woo:gateway`, `woo:shipping`, `woo:email`, `woo:order-status`, `woo:product-type`, `woo:blocks`, `woo:action-scheduler`, `woo:store-api`, `woo:my-account`. `woocommerce` / `woo:all` = all. Each is a `Woo\Providers\*` class wired inside a single `class_exists( 'WooCommerce' )` guard in `boot()` |
| `cli` | `wp <prefix> status` / `wp <prefix> cache clear` (the latter iterates a `<prefix>_cache_keys` filter — no module names another's cache keys) |
| `editor_config` | `.vscode/` snippets, settings, recommended extensions |
| `integration_tests` | `wp-phpunit` suite (`composer test:integration`), `phpunit-integration.xml.dist`, a boot test, the `.wp-env.json`, and the CI integration job |

`uninstall.php` + `Core\Uninstaller` are **derived**, not a toggle — they ship
only when a selected module persists something worth cleaning (an option, a
table, a scheduled event, a transient).

A JS build pipeline (`package.json` `build`/`start`, `webpack.config.js` when
needed, Playwright, Jest) is added automatically when you pick `--react`,
`interactivity`, `block`, or a WooCommerce component with a JS side
(`woo:gateway` / `woo:blocks`).

## After generating

```bash
cd <slug>
composer install         # PHPCS/WPCS(/VIP) rulesets, PHPUnit, Brain Monkey
composer lint
composer test             # unit suite (Brain Monkey — no WordPress install needed)
git init && git add -A && git commit -m "scaffold"
```

With a JS pipeline (`--react` / `interactivity` / `block` / `woo:gateway` / `woo:blocks`):

```bash
npm install
npm run build
npm run lint:js && npm run lint:style
npm run test:e2e          # Playwright — needs a running WP site (WP_BASE_URL, default http://localhost:8889)
npm run test:js           # Jest — present with --react / interactivity / block
```

With the `integration_tests` module:

```bash
npx @wordpress/env start
composer test:integration
```

### Releasing

Every scaffold gets a `package.json` whose `files` field is the single source of
truth for what ships (there is no `.distignore`). `npm run plugin-zip` runs
`composer prepare-dist` (`composer install --no-dev --optimize-autoloader`)
itself, so the production autoloader always exists before the archive is built:

```bash
npm install && npm run build   # only if there's a JS pipeline — must run first
npm run plugin-zip             # -> <slug>.zip, via @wordpress/scripts
```

Unbuilt sources under `assets/src/` are not shipped; the generated `readme.txt`
points to the repository for them.

### Adding another block

`Block_Registrar` registers every `assets/build/blocks/*` directory that has a
`block.json`, so no PHP changes are needed:

```bash
npx @wordpress/create-block my-block --no-plugin --target-dir assets/src/blocks/my-block
# --variant dynamic for a render.php block
npm run build
```

> `composer install` may ask to allow `dealerdirect/phpcodesniffer-composer-installer` —
> answer **yes**. *"No composer.lock file present"* on the first run is normal.

## Architecture (generated plugin)

- `Plugin` is a singleton bootloader. `Plugin::instance()->boot()` (fired on
  `plugins_loaded`) runs once — a re-entry guard makes any later call a no-op.
- `boot()` is a flat list of `( new Some\Module() )->init_hooks();` lines, one per
  selected module. A module is a plain class with an `init_hooks()` method that
  registers its hooks — no base class, no interface, no auto-discovery. A class
  runs only because `boot()` names it.
- WooCommerce modules live under `src/Woo/` and are wired inside a single
  `class_exists( 'WooCommerce' )` guard in `boot()`, so the plugin is inert
  without WooCommerce. Each `Woo\Providers\*` class is one such module.
- `Services` (generated only when a module needs a shared collaborator) is a
  static locator of memoised singletons — `Services::set()` / `reset()` are test
  seams. A module receives a service by constructor injection from `boot()`.
- `Core\Activator` / `Deactivator` implement `Contracts\Activatable` /
  `Deactivatable` and run from the activation / deactivation hooks in the main file.
- Cross-cutting cleanup goes through filters, not hard references: `cli` and the
  uninstaller iterate `<prefix>_cache_keys`; modules that cache register their
  own keys.

## Coding standards & CI

- `composer lint` runs `WordPress-Extra` + `WordPress-Docs` (`wp-org`),
  `WordPress-VIP-Go` (`vip`), or both, plus `PHPCompatibilityWP` against
  `testVersion 8.2-`. Generated code passes with no blanket `phpcs:ignore`s.
- The generated `.github/workflows/ci.yml`: PHPCS, a PHPUnit matrix (8.2, 8.3, 8.4), a
  `node-build` job (build + Jest + Playwright) when there's a pipeline, JS/CSS
  lint, and an `integration` job with the `integration_tests` module.

## Developing this CLI

```bash
npm test        # the generator's own test suite (node:test)
npm run verify  # scaffold fixtures, then php -l + composer lint + composer test each (cross-platform)
```

Requires Node >= 20.

## License

GPL-2.0-or-later (a `LICENSE` file is included in every generated plugin).
