# Remediation prompt — `create-wp-plugin` (v5)

Paste everything below the line into Claude Code with the repo open.

---

You are working in `create-wp-plugin`, a Node CLI (`index.js`, ESM, `prompts` as the only dependency) that scaffolds WordPress plugins from token-substituted templates in `templates/`. Tokens look like `{{PLUGIN_NAME}}`, `{{SLUG}}`, `{{NS}}`, `{{NS_ESCAPED}}`, `{{PREFIX}}`, `{{PREFIX_UPPER}}`.

A code review found bugs, missing WordPress lifecycle handling, and design gaps. Fix all of them, in the order given — the ordering is deliberate.

## Ground rules

**Architecture — non-negotiable:**

- **The singleton stays.** `Plugin::get_instance()` with a private constructor is the intended composition root. Do not convert it to a container, a static facade, or a plain instantiated class.
- **SOLID must actually hold, not be softened.** Where the current code falls short of the claim (see Group 4), fix the code. Do not edit the README to weaken the claim.
- **No abstract base class for Elementor widgets.** Every widget extends `\Elementor\Widget_Base` directly. This was deliberately removed from the project in a prior commit; do not reintroduce it in any form, under any name.
- **No example plugin name may appear anywhere in the shipped artifacts.** Templates, defaults, README, help text, and error messages must use tokens or generic wording only. The user names their own plugin. Verification fixtures live in gitignored `tmp-verify/` and use deliberately throwaway names — never copy a fixture name into a template, a default value, or documentation.
- **This tool scaffolds plugins, not blocks.** Do not add Gutenberg block scaffolding — `@wordpress/create-block` owns that job. See Group 10.

**Everything else:**

- Do not restructure the templating layer. Token naming, the `{{NS}}` / `{{NS_ESCAPED}}` split, the PSR-4-with-`spl_autoload_register`-fallback, the module toggle architecture, and `phpcs.xml` are correct — keep them.
- **`{{WRAPPER}}` and `{{VALUE}}` are Elementor's own selector placeholders, not generator tokens.** They must survive substitution untouched. Never add them to the replacements map.
- All generated PHP must pass `WordPress-Extra`, `WordPress-Docs`, `WordPress-VIP-Go`, and `PHPCompatibilityWP` as configured in `templates/phpcs.xml`. Tabs for indentation, Yoda conditions, full docblocks on every class, method, and property.
- Generated code must be production-ready as emitted. No placeholder security.
- One commit per numbered group, conventional commit messages.
- Run the **Verification** block after every group. Do not proceed with it failing.
- If you disagree with a fix, say so before implementing rather than silently substituting your own approach.

---

## Group 1 — Non-interactive mode (do this first)

Everything downstream needs a scriptable way to regenerate a plugin. Twelve interactive prompts per verification run is not workable.

Add to `index.js` using `node:util` `parseArgs` — **do not add a dependency**:

- `--help` — usage text, exit 0
- `--version` — read from `package.json`, exit 0
- `--yes` — skip all prompts
- `--name`, `--slug`, `--namespace`, `--prefix`, `--author`, `--email`, `--author-uri`, `--description`, `--min-php`, `--out`
- `--modules=admin_settings,shortcode,rest_api,ajax_handler,cpt_taxonomy,cron,elementor_widget,woocommerce_hooks` (comma-separated; empty string means none)
- `--react` / `--no-react`

Behaviour:

- With `--yes`, omitted optional values fall back to the same derivations the interactive prompts use (`slugify()`, `suggestNamespace()`, `suggestPrefix()`). `--name` and `--out` are required.
- Without `--yes`, flags act as prompt *defaults* rather than replacing the prompt, so partial invocation still works interactively.
- Group 2 validation applies to flags too — fail with a clear message and non-zero exit, never fall through to a broken scaffold.
- Skip the confirmation prompt when `--yes` is set.
- Help text must describe arguments generically (`--name "Your Plugin Name"`). No sample plugin name.

Add `scripts/verify.sh` implementing the Verification block below, writing to gitignored `tmp-verify/`. This is the harness for every later group.

## Group 2 — Input validation

Only `name` currently has a `validate` callback. A hyphenated prefix emits `function my-plug_boot()` and `define( 'MY-PLUG_VERSION', ... )` — a fatal parse error in the generated plugin. Reproduce before fixing.

Extract validators as pure exported functions so Group 12 can unit-test them, and apply to both prompts and flags:

- **slug** — `/^[a-z0-9]+(-[a-z0-9]+)*$/`. Re-run `slugify()` on input and validate the result; reject rather than silently rewriting.
- **prefix** — `/^[a-z][a-z0-9_]*$/`, 2–20 chars. Reject hyphens with a message naming the reason (invalid in PHP function names and constants).
- **namespace** — `/^[A-Za-z_][A-Za-z0-9_]*$/`, ASCII, single segment. Reject nested namespaces containing `\`, because `phpcs.xml` injects `{{NS}}` into the `PrefixAllGlobals` prefixes array where a backslash produces invalid configuration.
- **email** — allow empty; if non-empty must contain `@`.
- **minPhp** — `/^\d+\.\d+$/`.
- **outputDir** — reject absolute paths outside cwd and any path containing `..`.

Also:

- Fix `slugify()`: strip leading and trailing hyphens, and convert `_` to `-` instead of passing it through (`[^\w\-]` currently allows underscores into slugs).
- Fix `suggestNamespace()`: it currently returns an acronym for multi-word names, which is not PSR-4 convention. Return StudlyCase of the full name with filler words dropped. It remains only a *suggestion* — the user always overrides.
- Remove the dead `{{AUTHOR_SLUG}}` replacement (computed, present in zero templates) and collapse the `filenameMappings` lookup, which is used only where the literal string would do.

## Group 3 — `$`-pattern corruption in replacements

`processTemplateContent()` and the `.replace()` calls for `{{MODULE_REGISTRATIONS}}`, `{{ELEMENTOR_WIDGET_METHODS}}`, `{{REACT_ASSETS_REGISTRATION}}`, `{{CI_NODE_JOB}}`, `{{README_REACT_INSTALL}}`, `{{README_REACT_SCRIPTS}}` all pass a **string** replacement, so `$&`, `` $` ``, `$'`, and `$1` in user input are treated as replacement patterns.

Reproduce first: a description of `Save $& earn more` currently re-inserts `{{DESCRIPTION}}` into the output.

Fix every call site by passing a function — `.replaceAll(key, () => val)` / `.replace(token, () => val)`. Regression test in Group 12.

## Group 4 — Make the SOLID claim true (singleton preserved)

The README advertises SOLID and modular architecture. The singleton is the correct composition root and stays exactly as it is. What's missing is everything below it. Fix the code to match the claim.

**Current gaps:**

- `Plugin::boot()` duck-types with `method_exists( $service, 'register' )` — there is no contract.
- `Plugin::__construct()` news up every concrete module directly, so the class depends on concretions rather than abstractions.
- Nothing outside the class can extend the service set, so it is closed for extension.

**Required changes:**

1. Add `templates/src/Contracts/Registrable.php` — an interface with a single `register(): void`. Every module (`Settings_Page`, `Shortcode`, `Rest_Controller`, `Ajax_Handler`, `Post_Types`, `Scheduler`, `Woo_Hooks`, `Assets`, `CLI\Commands`) implements it. One method, one reason to exist — keep it segregated; do not add `boot`/`deactivate`/`uninstall` to the same interface.
2. `Plugin::boot()` iterates and calls `$service->register()` with an `instanceof Registrable` guard instead of `method_exists()`. Depend on the abstraction.
3. Keep `get_instance()` as-is, but give the private constructor an optional injected service array defaulting to the built-in set, so tests can construct with doubles via reflection without touching the public singleton API. The singleton remains the only public entry point.
4. Make the service list open for extension: run it through a `{{PREFIX}}_services` filter before `boot()`, documented in the generated README. Third-party code can add a `Registrable` without modifying `Plugin`.
5. Move service construction out of the constructor into a private `build_services()` returning the array. Constructors should not perform work — this is also what makes the class testable.
6. Liskov: every implementation must honour `register()` returning void with no additional required constructor arguments, so any `Registrable` is substitutable in the boot loop. Enforce with a return type declaration.

Modules added in later groups must implement `Registrable` too.

## Group 5 — WordPress lifecycle hooks

No `register_activation_hook` or `register_deactivation_hook` exists anywhere. Cron events are never unscheduled, CPT rewrite rules never flushed, `uninstall.php` is entirely TODO.

This group touches both `index.js` injection logic and templates — implement it alone and stop for review before continuing.

Add `templates/src/Core/Activator.php` and `templates/src/Core/Deactivator.php` (always emitted, like `Plugin.php`), each with a static `run()`, wired from the main plugin file:

```php
register_activation_hook( __FILE__, array( '\{{NS}}\Core\Activator', 'run' ) );
register_deactivation_hook( __FILE__, array( '\{{NS}}\Core\Deactivator', 'run' ) );
```

These are lifecycle handlers, not services — they must **not** implement `Registrable` and must not be added to the service array. Keeping them separate is the single-responsibility line.

Body content is module-dependent — inject via new tokens the same way `{{MODULE_REGISTRATIONS}}` works:

- **cpt_taxonomy** → Activator registers the post type and taxonomy, then `flush_rewrite_rules()`. Deactivator calls `flush_rewrite_rules()`. Refactor `Post_Types` so registration is a reusable public method rather than duplicating the args array in the Activator.
- **cron** → move `wp_schedule_event()` out of `Scheduler::register()` into the Activator; `register()` only adds the event callback action. Deactivator calls `wp_clear_scheduled_hook( '{{PREFIX}}_cron_event' )`. This also removes a `wp_next_scheduled()` DB check from every page load.
- **elementor_widget** → Activator deletes the widget-discovery transient from Group 7 so updates rescan.
- Activator always stores `{{PREFIX}}_version` in options for future upgrade routines.

Complete `templates/uninstall.php`: delete the `{{PREFIX}}_version` option, delete `{{PREFIX}}_option_name` if admin_settings was selected, clear the cron hook if cron was selected, delete prefixed transients. Handle multisite (`is_multisite()` → loop `get_sites()`). Keep the existing `WP_UNINSTALL_PLUGIN` guard.

## Group 6 — Replace every `// TODO: SECURITY` with working code

There are 16 across the templates. A scaffold's value is that the boring correct thing is already done; shipping stubs reads as "generates insecure boilerplate with a sticky note." Delete every `TODO: SECURITY` comment and implement the real check.

- **`Ajax_Handler`** — worst offender: registers `wp_ajax_nopriv_` with zero protection. Implement `check_ajax_referer( '{{PREFIX}}_nonce', 'nonce', false )` with `wp_send_json_error( ..., 403 )` on failure, a capability check on the logged-in path, and `sanitize_text_field( wp_unslash( $_POST[...] ) )` for a demonstrated parameter. Add the matching nonce handoff via `wp_localize_script` / `wp_add_inline_script` and a working fetch in `assets/js/main.js` so the example round-trips.
- **`Settings_Page`** — real `sanitize_callback` on `register_setting()`, and a `current_user_can( 'manage_options' )` guard at the top of `render_page()` that `wp_die()`s. Add one working field (section + field + escaped input) so the Settings API wiring is demonstrated, not just declared.
- **`Rest_Controller`** — the current `current_user_can( 'read' )` blocks logged-out users on what looks like a public endpoint. Make the choice explicit: `__return_true` with a comment on when to tighten it. Add an `args` array with `sanitize_callback` and `validate_callback` on at least one parameter.
- **`Post_Types`** — either set an explicit `capability_type` / `map_meta_cap` or delete the TODO. Do not leave a hint.
- **`Shortcode`**, **`Woo_Hooks`**, **`Scheduler`**, **`CLI\Commands`** — these already sanitize and escape correctly; remove the now-misleading TODOs. Keep the genuine `TODO: Implement cache clearing logic` in `Commands::cache_clear()`, or implement it against `wp_cache_flush_group()` with a transient fallback.

## Group 7 — Elementor module

**Do not introduce an abstract widget base class.** Every widget extends `\Elementor\Widget_Base` directly and declares its own `get_style_depends()` / `get_script_depends()`. This was a deliberate project decision — do not reverse it.

**Auto-discovery must be preserved.** Adding a widget file plus matching CSS/JS must require no manual registration. Do not replace the glob with an explicit registry array. The problem is not discovery — it's that discovery runs on every frontend request, including pages where no widget renders.

- **Delete `templates/src/Widgets/Base_Widget.php`.** It is written to disk but never instantiated, never added to the service array, and its `register_widgets()` duplicates the method injected into `Plugin` via `{{ELEMENTOR_WIDGET_METHODS}}`. Dead code with a misleading name. Registration lives in exactly one place: the injected `Plugin` methods.
- **`Sample_Widget` stays as it is** — extends `Widget_Base`, keeps its own depend methods. It is the reference a developer copies.
- **Cache the scan.** Store the discovery result in a transient keyed on `{{PREFIX_UPPER}}_VERSION`, busted by the Activator (Group 5), with a live-glob bypass when `SCRIPT_DEBUG` is true so drop-a-file-and-refresh still works in development.
- **Three globs become one.** Discover widget *classes* only. Derive per-widget asset paths from the class filename by convention — `Sample_Widget.php` maps to handle `{{PREFIX}}-sample-widget` and file `assets/css/widgets/sample-widget.css` — and use `file_exists()` (stat-cached) instead of two further directory walks. Underscores in the class name become hyphens in both the handle and the filename; this convention must be documented in the generated README.
- **Guard every `glob()` with `?: array()`.** `glob()` returns `false` on error and `foreach ( false )` is a PHP 8 warning.
- Keep the `$reflection->isAbstract()` check in the discovery loop — it correctly skips any abstract class a developer adds later.
- Add `Requires Plugins: elementor` to the plugin header when this module is selected (WP 6.5+), and bump the `Elementor tested up to` / `Elementor Pro tested up to` values, currently pinned at 3.25.0.

## Group 8 — WooCommerce module

- Declare HPOS compatibility:

  ```php
  add_action( 'before_woocommerce_init', function () {
      if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
          \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', {{PREFIX_UPPER}}_FILE, true );
      }
  } );
  ```

  This must be hooked from the main plugin file, **not** from `Plugin::boot()` on `plugins_loaded` — `before_woocommerce_init` fires too early otherwise. Verify the ordering actually works rather than assuming it.
- Add `Requires Plugins: woocommerce` to the header when the module is selected.
- Guard `Woo_Hooks::register()` with `class_exists( 'WooCommerce' )`.

## Group 9 — Single source of version truth

`0.1.0` is hardcoded in five generated files: the plugin header, the `_VERSION` constant, `package.json`, `tests/bootstrap.php`, and `Example_Test`.

- Introduce a `{{VERSION}}` token, default `0.1.0`, used everywhere.
- Either derive the constant from the header via `get_file_data()`, or keep the constant as the single literal and document that the header is the source. Pick one and state it in the generated README.
- `tests/bootstrap.php` must not hardcode a version — read from the main plugin file, or accept the constant if already defined.

## Group 10 — Scope the React option honestly

The `--react` option currently advertises "React / Gutenberg support," but what it provides is a `@wordpress/scripts` asset build pipeline. There is no `block.json` and no `registerBlockType()`.

**Do not add block scaffolding.** `@wordpress/create-block` is the correct tool and this generator should not duplicate it. Fix the mismatch by correcting the claim and the wiring:

- Rename the feature everywhere — CLI prompt text, `--help`, root `README.md`, generated `README.md`, and the `Assets.php` docblocks — to something accurate such as "React asset build pipeline (`@wordpress/scripts`)". Remove the word Gutenberg from all of them.
- `Assets::enqueue_assets()` currently hooks `enqueue_block_assets`, a block-editor hook that is wrong for a general React mount point. Change to `wp_enqueue_scripts` for frontend, with a commented `admin_enqueue_scripts` alternative. Keep the existing `index.asset.php` dependency/version handling — that part is correct.
- Keep `Assets` implementing `Registrable` per Group 4.
- Add one line to the root `README.md` pointing users who want blocks to `npx @wordpress/create-block`, so the boundary is explicit rather than a gap.

## Group 11 — VS Code tooling

The scaffold ships `.vscode/php.code-snippets` and `.vscode/extensions.json`. Both need work.

**Snippet-generated code must pass `composer lint`.** This is the priority of this group. Currently the `wpelwidget` snippet's render output is:

```php
<h3 class="title" <?php echo $this->get_render_attribute_string( 'title' ); ?>>
```

`Sample_Widget.php` has `// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped` on the equivalent line; the snippet does not. Code produced from the snippet therefore fails lint immediately.

- Add the `phpcs:ignore` comment to every `get_render_attribute_string()` echo in the snippet, matching `Sample_Widget.php` exactly.
- Audit **every** snippet the same way: expand each one into a scratch file inside a generated plugin, run `composer lint`, and fix whatever it flags. Do not assume — actually run it. Report the list of snippets checked.

**Fix the asset handle mismatch in `wpelwidget`.** The snippet derives the style/script handle by downcasing the filename, so `Hero_Slider.php` yields handle `{{PREFIX}}-hero_slider` while the Group 7 convention expects `{{PREFIX}}-hero-slider` and file `hero-slider.css`. The asset will never match. Make the snippet transform underscores to hyphens as well as downcasing, and verify with a `Hero_Slider.php` example.

**The Elementor snippet must only ship when the module is selected.** `index.js` currently writes `.vscode/php.code-snippets` unconditionally, so a zero-module plugin still gets `wpelwidget`. Split into `templates/.vscode/php.code-snippets` (core OOP snippets, always written) and `templates/.vscode/elementor.code-snippets` (the `wpelwidget` snippet, written only when `elementor_widget` is selected).

**Expand `.vscode/extensions.json`.** The scaffold ships `phpcs.xml` and `.editorconfig` but recommends no extension that uses them. Add:

- `valeryanm.vscode-phpsab` — PHPCS/PHPCBF integration
- `editorconfig.editorconfig`

Keep the existing `bmewburn.vscode-intelephense-client` and `neilbrayfield.php-docblocker`.

**Add WordPress stubs.** Autocomplete and type hints for `add_action`, `wp_enqueue_script`, and every other core function currently do not work. Add `php-stubs/wordpress-stubs` to `require-dev` in `templates/composer.json`, and create `templates/.vscode/settings.json` pointing Intelephense at it via `intelephense.environment.includePaths`. Include the phpsab executable paths for `phpcs` and `phpcbf` in `vendor/bin` so linting works in-editor without configuration. If the Elementor module is selected, add `php-stubs/wordpress-stubs`-style Elementor stubs too if a maintained package exists; if not, say so rather than inventing one.

## Group 12 — `readme.txt`, CI, generator tests, repo hygiene

- **Add `templates/readme.txt`.** A WordPress plugin scaffold without one is a conspicuous gap — the wordpress.org format is required for submission. Tokens: `=== {{PLUGIN_NAME}} ===`, `Contributors`, `Tags`, `Requires at least`, `Tested up to`, `Requires PHP: {{MIN_PHP}}`, `Stable tag: {{VERSION}}`, `License: GPLv2 or later`, plus `== Description ==`, `== Installation ==`, `== Frequently Asked Questions ==`, `== Changelog ==`, `== Upgrade Notice ==`. Content from `{{DESCRIPTION}}` and generic scaffolding text only.
- **Generated CI matrix must derive from `minPhp`.** `templates/github/workflows/ci.yml` hardcodes `['8.0', '8.2', '8.3']` — select 8.2 and the 8.0 job fails on `composer install` immediately. Emit only versions `>= minPhp`, always including the minimum and current stable. Add `composer validate --strict`, cache Composer and npm, and pin `shivammathur/setup-php` by major version as the other actions already are.
- **Test suite fixes.** `tests/bootstrap.php` calls `Brain\Monkey\setUp()` with no matching `tearDown()`, and `Example_Test::setUp()` calls it again — remove the bootstrap-level call. `test_plugin_version_constant()` asserts against a constant `bootstrap.php` itself defined; replace with real tests: per selected module, assert hooks are registered (`Monkey\Actions\expectAdded`), plus a shortcode output test, a sanitization test, and a `Plugin` boot test asserting every service is a `Registrable` and receives `register()`.
- Upgrade to PHPUnit 10 or 11 and migrate `phpunit.xml.dist` off the deprecated `convertErrorsToExceptions` / `convertNoticesToExceptions` / `convertWarningsToExceptions` attributes and the old `<coverage>` shape. If you keep PHPUnit 9 for PHP 8.0 matrix reasons, justify it in a comment.
- `phpcs.xml` excludes `/tests/`. Lint the test directory too, with a narrower ruleset if needed.
- **Add tests for `index.js` itself** using `node:test`. Cover `slugify`, `suggestNamespace`, `suggestPrefix`, every validator from Group 2, the `$&` regression from Group 3, and full non-interactive generation into a temp dir asserting the expected file list per module combination — including that `elementor.code-snippets` is absent when the module is not selected.
- Add a GitHub Actions workflow for **this** repo running those tests on Node 20 and 22.
- Add `LICENSE` (GPL-2.0-or-later) at the repo root — `package.json` and every generated plugin header declare it and the file is missing.
- Add `"engines": { "node": ">=18" }` to `package.json`.
- Update the root `README.md`: document the Group 1 flags, the `{{PREFIX}}_services` filter, the widget asset naming convention from Group 7, and the available VS Code snippets. State plainly that `npx create-wp-plugin` does not work because the package is unpublished — only `npx github:akshat009/create-wp-plugin` does. Use generic placeholders in all examples.
- Add `templates/languages/.gitkeep`, a `load_plugin_textdomain()` call (the header already declares `Domain Path: /languages`), and a `composer make-pot` script using `wp i18n make-pot`.

---

## Verification

Run after every group. Three variants — the empty-module and no-React cases are where `{{MODULE_REGISTRATIONS}}` and `{{CI_NODE_JOB}}` substitution most easily leaves stray whitespace or dangling tokens.

Fixture names below are throwaway values for `tmp-verify/` only. They must never appear in a template, a default, help text, or documentation.

```bash
# all modules + react
node index.js --yes --name "Fixture Alpha" --prefix fxa --namespace FixtureAlpha \
  --modules admin_settings,shortcode,rest_api,ajax_handler,cpt_taxonomy,cron,elementor_widget,woocommerce_hooks \
  --react --out ./tmp-verify/full

# zero modules, no react
node index.js --yes --name "Fixture Beta" --prefix fxb --namespace FixtureBeta \
  --modules "" --no-react --out ./tmp-verify/minimal

# elementor only, min-php 8.2 (exercises the CI matrix fix)
node index.js --yes --name "Fixture Gamma" --prefix fxg --namespace FixtureGamma \
  --modules elementor_widget --min-php 8.2 --no-react --out ./tmp-verify/elementor
```

Each variant must satisfy:

- `php -l` clean on every generated `.php` file
- `composer install && composer lint` exit 0
- `composer test` exit 0
- `grep -rn "TODO: SECURITY" .` returns nothing
- no PHP 8 deprecation notices during the test run
- **Unreplaced-token check, with the Elementor placeholders excluded:**

  ```bash
  grep -rn "{{" . | grep -vE '\{\{(WRAPPER|VALUE)\}\}'
  ```

  This must return nothing. `{{WRAPPER}}` and `{{VALUE}}` are Elementor selector placeholders and are expected to survive — a plain `grep -rn "{{"` would be a false positive.

At repo level:

- `node --test` passes
- the elementor variant's generated `ci.yml` contains no `'8.0'` entry
- `tmp-verify/minimal/.vscode/elementor.code-snippets` does **not** exist; `tmp-verify/elementor/.vscode/elementor.code-snippets` does
- `grep -rniE "fixture (alpha|beta|gamma)" templates/ README.md index.js` returns nothing
- `grep -rni "gutenberg" templates/ README.md index.js` returns nothing
- every snippet, expanded into a scratch file, passes `composer lint`

Report anything you could not fix and why, rather than silently skipping it.
