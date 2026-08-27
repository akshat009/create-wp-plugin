# create-wp-plugin-cli — Master Audit, Backlog & Architectural Roadmap

> **Status:** Consolidated Master Checklist (Post v1.0.5 Full Codebase Review — Iteration 14 Complete)  
> **Legend:** `P0` = Blocking / Critical Bug / Violation · `P1` = High Priority · `P2` = Should Have · `P3` = Nice to Have / Polish

---

## 🎯 High-Level Action Plan & Execution Roadmap

```
Phase 1: Critical Bug Fixes (P0) & WordPress.org Compliance
Phase 2: WooCommerce Granularity Overhaul (Sub-modules & Smart Asset Build)
Phase 3: PHP Architecture & SOLID Modernization (Container, Service Providers, strict_types)
Phase 4: CLI Refactoring (God-function split, Self-describing Modules, Rollback)
Phase 5: Quality, Testing, Windows CI & Static Analysis (PHPStan, Pest/PHPUnit, Windows Matrix)
Phase 6: Developer Experience, Documentation & Polish (Presets, Dry-run, Architecture Guide)
```

---

## 🛍️ Special Feature: Granular WooCommerce Architecture Design

### The Problem
Selecting `woocommerce_hooks` previously dumped **15 separate files** into every project (Payment Gateway, Shipping Method, Custom Email + 2 templates, Custom Product Type, Gutenberg Blocks, Block Integration JS, and a full webpack build pipeline). Developers who only wanted an email or shipping method were forced into building React blocks.

### The Solution: Modular Sub-Modules

| Sub-Module ID | Feature Name | Generated Files | Needs JS Build? | Status |
| :--- | :--- | :--- | :---: | :---: |
| `woo:gateway` | **Payment Gateway** (Classic + Block Checkout) | `src/Woo/Gateways/Gateway.php`, `src/Woo/Gateways/Blocks_Payment_Method_Type.php`, `assets/src/wc-gateway-block.js` | **Yes** | [ ] |
| `woo:shipping` | **Shipping Method** (Zone-based calculation) | `src/Woo/Shipping/Shipping_Method.php`, `src/Woo/Shipping/Shipping_Service.php` | **No** | [ ] |
| `woo:email` | **Transactional Email** (HTML & Plain templates) | `src/Woo/Emails/Custom_Email.php`, `templates/emails/*` | **No** | [ ] |
| `woo:product-type` | **Custom Product Type** (Pricing & Tabs) | `src/Woo/Products/Custom_Product.php`, `src/Woo/Products/Product_Data_Tab.php` | **No** | [ ] |
| `woo:blocks` | **Cart & Checkout Block Slots** | `src/Woo/Blocks/Integration.php`, `src/Woo/Blocks/Cart_Summary_Block.php`, `assets/src/blocks-integration.js` | **Yes** | [ ] |
| `woo:order-status` | **Custom Order Status** (HPOS-ready) | `src/Woo/Orders/Order_Status_Service.php` | **No** | [ ] |
| `woo:action-scheduler`| **Action Scheduler** (Background queues) | `src/Woo/Tasks/Action_Scheduler_Service.php` | **No** | [ ] |
| `woo:store-api` | **Store API Endpoint Extension** | `src/Woo/Api/Store_Api_Extension.php` | **No** | [ ] |
| `woo:my-account` | **My Account Custom Endpoint** | `src/Woo/Account/Account_Endpoint_Service.php`, `templates/my-account/*` | **No** | [ ] |

### Interactive Flow
When `WooCommerce Integration` is selected in Question 11, the CLI opens a secondary multi-select prompt:
```text
? 11a. Select WooCommerce components to include:
  [x] Payment Gateway (Classic + Block Checkout)
  [ ] Custom Shipping Method
  [ ] Custom Transactional Email (HTML & Plain templates)
  [x] Custom Order Status (HPOS compliant)
  [ ] Custom Product Type & Data Tabs
  [ ] Cart & Checkout Block Extensions
  [x] Action Scheduler (Background Task Runner)
  [ ] Store API Extension (ExtendSchema for Blocks)
  [ ] My Account Custom Endpoint
```

### CLI Flags & Presets
- Granular: `--modules "admin_settings,woo:gateway,woo:order-status"`
- Bundle shortcut: `--modules "woo:all"` or `--modules "woocommerce"` (scaffolds gateway + order status + HPOS by default)
- **Smart Build Pipeline:** If only PHP-based WooCommerce features are selected, **no `package.json` or webpack config is created**, keeping the plugin 100% pure PHP.

---

## 🐛 Section 0: Critical Codebase Findings & Edge Cases (Forensic Audit)

### Iteration 1 Findings
- [ ] **NEW-1 [P0] WordPress 20-character CPT slug overflow**  
  *Location:* `templates/src/PostTypes/Post_Types.php:51` & `index.js:103`  
  `validatePrefix()` allows 20 characters. `'{{PREFIX}}_item'` produces 25 characters if prefix is 20 chars long. WordPress `register_post_type` has a hard 20-character limit and silently fails or truncates. *Fix:* Cap prefix validation to 15 chars or truncate CPT key.
- [x] ~~**NEW-2 [P0] Interactivity API demo code printed in `wp_footer` on every live page**~~ (Fixed in 0.12)  
  *Location:* `templates/src/Frontend/Interactivity.php:40`  
  Hooks `render_demo` into `wp_footer` unconditionally on every frontend pageview. This prints an unstyled demo button `<div class="{{SLUG}}-interactivity-demo">` on all live website pages. *Fix:* Restrict to shortcode or demo admin screen.
- [ ] **NEW-3 [P1] Incomplete HPOS & Modern Block feature flags**  
  *Location:* `index.js:486-495`  
  Only declares `custom_order_tables`. Modern WooCommerce requires `cart_checkout_blocks` and `product_block_editor` compatibility flags to prevent admin warnings in WooCommerce settings.
- [ ] **NEW-4 [P1] Elementor transient caching locks out developers in local dev**  
  *Location:* `index.js:640-666`  
  `get_widget_classes()` caches widget class discovery in transients for 24h and only checks `SCRIPT_DEBUG`. Adding a new widget file in `src/Widgets/` is invisible unless `WP_DEBUG` or `wp_get_environment_type() === 'development'` is also checked.
- [ ] **NEW-5 [P1] Unconditional Ghost Documentation in generated `README.md`**  
  *Location:* `templates/README.md:19-27`  
  `README.md` contains the `## Elementor Widgets Convention` and `## WP-CLI Commands` sections unconditionally, even when `elementor_widget` was never selected.
- [ ] **NEW-6 [P1] Fatal error vulnerability in Custom Email Template on null `$order`**  
  *Location:* `templates/woo-email-templates/emails/custom-email.php:26`  
  Directly calls `$order->get_billing_first_name()`. When rendered in customizer previewers or test harnesses with null orders, PHP throws a fatal `Call to a member function on null`.
- [ ] **NEW-7 [P1] Deprecated `ExperimentalOrderMeta` in `blocks-integration.js`**  
  *Location:* `templates/react/assets/src/blocks-integration.js:11`  
  Uses experimental slot-fill API deprecated in WooCommerce 8.9+ in favor of the official `woocommerce_register_additional_checkout_field` API.
- [ ] **NEW-8 [P1] Missing `--no-interaction` in generated CI workflow**  
  *Location:* `templates/github/workflows/ci.yml:40, 75`  
  `composer install` is run without `--no-interaction`. If any dependency or composer plugin prompts for confirmation, CI hangs until timeout.
- [ ] **NEW-9 [P2] PHPUnit Singleton test state pollution / memory leak**  
  *Location:* `templates/src/Plugin.php` & `templates/tests/Unit/Example_Test.php:71`  
  `Plugin::get_instance()` binds the singleton to the PHPUnit test runner with no reset mechanism. Tests in the same suite cannot test clean bootstrap states.
- [ ] **NEW-10 [P2] WordPress.org `Contributors:` username formatting violation**  
  *Location:* `templates/readme.txt:2`  
  Places full author name `{{AUTHOR}}` in `Contributors:`. WordPress.org requires valid lowercase alphanumeric WordPress.org user slugs (e.g. `akshat009`).
- [ ] **NEW-11 [P2] SPDX License Identifier mismatch across files**  
  *Location:* `readme.txt` uses `GPLv2 or later`, whereas `plugin-main.php` and `composer.json` use `GPL-2.0-or-later`.
- [ ] **NEW-12 [P2] Static lifecycle anti-pattern in `Activator` and `Deactivator`**  
  *Location:* `templates/src/Core/Activator.php`, `Deactivator.php`  
  Static `run()` methods prevent dependency injection, mocking, and container integration.
- [ ] **NEW-13 [P2] Fragile namespace stripping in fallback autoloader**  
  *Location:* `templates/plugin-main.php:34-51`  
  Stripping `{{NS}}\` and mapping directly to `src/` can cause fatal errors on Linux for sub-namespaces if folder casing doesn't strictly match before `composer install` is run.

### Iteration 2 Findings
- [ ] **NEW-14 [P0] PHP Fatal Syntax Error on Apostrophes / Single Quotes in Plugin Name**  
  *Location:* `templates/src/Admin/Settings_Page.php:38`, `Rest/Rest_Controller.php:83`, `Woo/Gateways/Gateway.php:29`, `Woo/Shipping/Shipping_Method.php:30`, `Woo/Products/Custom_Product.php:53`  
  Templates embed `'{{PLUGIN_NAME}}'` directly inside PHP single quotes `__( '{{PLUGIN_NAME}} Settings', '...' )`. If a user names their plugin `"Dave's Plugin"`, the output becomes `__( 'Dave's Plugin Settings', '...' )` which generates a fatal PHP syntax error (`T_STRING`). *Fix:* Use `addcslashes($name, "'\\")` for PHP single-quote substitutions.
- [ ] **NEW-15 [P0] Corrupt JSON Generation on Double Quotes in Description or Plugin Name**  
  *Location:* `templates/composer.json:3`, `templates/react/package.json:4`, `templates/react/assets/src/blocks/cart-summary/block.json:5`  
  Templates embed `"description": "{{DESCRIPTION}}"` directly. If a description contains double quotes (e.g. `A plugin with "fast" checkout`), `composer.json`, `package.json`, and `block.json` become invalid JSON, causing `composer validate` and `npm install` to crash immediately. *Fix:* JSON-encode strings injected into JSON files.
- [ ] **NEW-16 [P1] Unprefixed CSS Classes in `sample-widget.css` Violate WPCS**  
  *Location:* `templates/assets/css/widgets/sample-widget.css:4-28`  
  Uses generic class names `.sample-widget-wrapper`, `.sample-widget-title`, `.sample-widget-description` without the `{{PREFIX}}` namespace, causing global style collision with other Elementor widgets and themes.
- [ ] **NEW-17 [P1] `workflow_dispatch` broken in `.github/workflows/publish.yml`**  
  *Location:* `.github/workflows/publish.yml:41-45`  
  Line 41 assumes `$GITHUB_REF` is `refs/tags/v*`. On manual `workflow_dispatch`, `$GITHUB_REF` is `refs/heads/main`, causing the tag comparison to always fail and aborting manual publish runs.
- [ ] **NEW-18 [P2] Code Snippets ship deprecated Singleton pattern and lack `strict_types=1`**  
  *Location:* `templates/.vscode/php.code-snippets:165-214`  
  The snippet extension ships `"WordPress OOP Singleton"`, generating the exact anti-pattern that violates DIP/SOLID, and misses `declare(strict_types=1)` across all snippet stubs.
- [ ] **NEW-19 [P2] Block Editor render crashes on uninitialized `WC()->cart`**  
  *Location:* `templates/react/assets/src/blocks/cart-summary/render.php:14-16`  
  In the Gutenberg block editor or REST renderer context, `WC()->cart` is null, causing the block to render completely blank in the editor without a placeholder preview.
- [ ] **NEW-20 [P2] Block namespace in `block.json` uses function prefix instead of slug**  
  *Location:* `templates/react/assets/src/blocks/cart-summary/block.json:4`  
  `"name": "{{PREFIX}}/cart-summary"` should use `"name": "{{SLUG}}/cart-summary"` according to WordPress block registration best practices.
- [ ] **NEW-21 [P2] Windows executable path for PHPCS in `.vscode/settings.json`**  
  *Location:* `templates/.vscode/settings.json:5-6`  
  `"phpsab.executablePathCS": "vendor/bin/phpcs"` fails on Windows machines unless `.bat` is supported or dynamic OS resolution is applied.

### Iteration 3 Findings
- [ ] **NEW-22 [P0] `suggestPrefix()` generates prefixes that fail its own validator on long single-word names**  
  *Location:* `index.js:53-74`  
  If the user inputs a single word like `"WooCommerceIntegration"` (22 chars), `suggestPrefix()` returns `"woocommerceintegration"`, which immediately fails `validatePrefix()` (`prefix.length > 20`). *Fix:* Truncate single-word suggestions to 12 characters.
- [ ] **NEW-23 [P0] `suggestNamespace()` produces illegal PHP namespaces on numeric starts**  
  *Location:* `index.js:38-51`  
  For names starting with numbers (e.g. `"24Seven Commerce"`), `suggestNamespace()` returns `"24SevenCommerce"`, which is an illegal PHP namespace and fails `validateNamespace()`. *Fix:* Prefix with `Plugin` or sanitize leading digits.
- [ ] **NEW-24 [P1] Module Duplication Bug (`--modules "admin_settings,admin_settings"`)**  
  *Location:* `index.js:247-251`  
  `parseModules()` does not deduplicate. Passing repeated modules duplicates service registrations in `Plugin.php` and duplicate lines in `Activator.php`. *Fix:* Wrap in `[...new Set(modules)]`.
- [x] ~~**NEW-25 [P1] Logged-out Anonymous Users Bypass Security Check in `Ajax_Handler.php`**~~ (Fixed in 0.14)  
  *Location:* `templates/src/Ajax/Ajax_Handler.php:66`  
  `if ( is_user_logged_in() && ! current_user_can( 'read' ) )` only checks capability if logged in. Since `wp_ajax_nopriv_` is hooked, anonymous visitors bypass capability checking completely. *Fix:* Enforce capability or remove `nopriv` by default.
- [ ] **NEW-26 [P1] Hard Flush on Activation/Deactivation (`flush_rewrite_rules()`)**  
  *Location:* `index.js:863-864`  
  Calls `flush_rewrite_rules()` without arguments, triggering an expensive disk rewrite of `.htaccess` / `web.config`. WordPress standard for activation is soft-flush: `flush_rewrite_rules( false )`.
- [ ] **NEW-27 [P1] Dead `"main"` Entry in Scaffolded `package.json` Without React**  
  *Location:* `templates/react/package.json:5` & `index.js:761`  
  When only Interactivity or WooCommerce is chosen without React, `package.json` specifies `"main": "assets/build/index.js"`, but `assets/src/index.js` is never compiled, leaving a broken dead entry.
- [ ] **NEW-28 [P2] Non-ASCII / Unicode Diacritic Stripping Bug in `slugify()`**  
  *Location:* `index.js:25-36`  
  `slugify("Über Plugin")` strips `Ü` entirely and becomes `"ber-plugin"`. *Fix:* Add `.normalize('NFD').replace(/[\u0300-\u036f]/g, '')` before regex stripping.
- [ ] **NEW-29 [P2] Elementor Widget CamelCase to Kebab Handle Conversion Flaw**  
  *Location:* `index.js:683-688`  
  Widget asset slug only replaces underscores (`str_replace('_', '-')`), failing on CamelCase widget classes (e.g. `HeroBanner` becomes `herobanner.css` instead of `hero-banner.css`).
- [ ] **NEW-30 [P2] Theme Email Template Override Directory Incompatibility**  
  *Location:* `templates/src/Woo/Emails/Custom_Email.php:30-32`  
  Sets template path to `emails/...` instead of `woocommerce/emails/...`, breaking standard `{theme}/woocommerce/emails/` overrides in custom WordPress themes.

### Iteration 4 Findings
- [ ] **NEW-31 [P1] Missing JavaScript Translation Registration (`wp_set_script_translations`)**  
  *Location:* `templates/src/Admin/Assets.php:51`, `Woo/Gateways/Blocks_Payment_Method_Type.php:65`, `Woo/Blocks/Integration.php:59`  
  Enqueued JavaScript bundles call `wp.i18n` translation methods (`__()`, `_n()`), but PHP never calls `wp_set_script_translations()`. As a result, JavaScript strings remain in English on non-English WordPress installations.
- [ ] **NEW-32 [P1] Cart is not emptied on successful checkout in `Gateway.php`**  
  *Location:* `templates/src/Woo/Gateways/Gateway.php:81-95`  
  `process_payment()` completes payment with `$order->payment_complete()`, but omits `WC()->cart->empty_cart()`, leaving active cart items in user sessions on certain WooCommerce configurations.
- [ ] **NEW-33 [P1] Missing Global Form Fields in `Shipping_Method.php`**  
  *Location:* `templates/src/Woo/Shipping/Shipping_Method.php:58-73`  
  Only defines `$this->instance_form_fields` and never sets `$this->form_fields`. Navigating to the global shipping method settings page in WooCommerce Admin renders an empty form.
- [ ] **NEW-34 [P1] Potential PHP Notices on Non-Scalar `get_option` & REST parameters**  
  *Location:* `templates/src/Admin/Settings_Page.php:84`, `Rest/Rest_Controller.php:84`  
  Direct type casting `(string) $value` without `is_scalar()` guards triggers `Array to string conversion` notices when array or object values are retrieved.
- [ ] **NEW-35 [P2] Missing Custom Category Registration for Elementor Widgets**  
  *Location:* `templates/src/Widgets/Sample_Widget.php:73-75`  
  Assigns widget to Elementor's default `'general'` category instead of registering a branded plugin category via `elementor/elements/categories_registered`.
- [ ] **NEW-36 [P2] `Cart_Summary_Block.php` does not implement `Registrable`**  
  *Location:* `templates/src/Woo/Blocks/Cart_Summary_Block.php:22-38`  
  Uses an isolated static `register()` method rather than integrating into the plugin's OOP contract system.
- [ ] **NEW-37 [P2] `Shortcode.php` ignores enclosing shortcode content**  
  *Location:* `templates/src/Frontend/Shortcode.php:37-55`  
  Signature declares `$content = null` for enclosing shortcodes, but the template never handles `$content` or calls `do_shortcode()`.
- [ ] **NEW-38 [P2] Unsafe Current Directory Fallback in Interactive `outputDir` Prompt**  
  *Location:* `index.js:399`  
  `initial: flags.out || ((prev, values) => './' + values.slug)` can evaluate to `'./'` if slug is undefined, creating a risk of scaffolding directly into the root folder. *Fix:* Default to `'./' + (values.slug || 'my-plugin')`.

### Iteration 5 Findings
- [ ] **NEW-39 [P1] Custom WooCommerce Product Type Missing Add to Cart Hook**  
  *Location:* `templates/src/Woo/Products/Custom_Product.php:23-56`  
  WooCommerce requires `add_action( 'woocommerce_{{PREFIX}}_custom_add_to_cart', 'woocommerce_simple_add_to_cart' )` to render the add-to-cart form on single product pages. Without this hook, no add to cart button is displayed on the frontend.
- [ ] **NEW-40 [P1] Conflicting Dual UI Rendered in React Admin Mode**  
  *Location:* `templates/src/Admin/Settings_Page.php:98-107`  
  When `useReact` is enabled, both the `<div id="{{PREFIX}}-app-root"></div>` mount point and the classic `<form method="post" action="options.php">` are rendered on the same page simultaneously, creating a confusing stacked dual-interface.
- [ ] **NEW-41 [P1] Inaccessible Settings API Field Lacking `label_for` & Input `id`**  
  *Location:* `templates/src/Admin/Settings_Page.php:69-86`  
  `add_settings_field()` omits `'label_for' => '{{PREFIX}}_option_name'` and the `<input>` lacks `id="{{PREFIX}}_option_name"`, violating accessibility standards (WCAG a11y label associations).
- [ ] **NEW-42 [P1] `wp {{PREFIX}} cache clear` Leaves Database Transients on WP 6.1+ Without External Object Cache**  
  *Location:* `templates/src/CLI/Commands.php:65-69`  
  If `wp_cache_flush_group()` exists, `delete_transient()` is skipped in an `else` branch. On default MySQL installs without Redis/Memcached, persistent database transients remain uncleared.
- [ ] **NEW-43 [P2] Code Snippet Widget Name Regex Mismatches Sample Widget Convention**  
  *Location:* `templates/.vscode/php-elementor.code-snippets:33`  
  Transform produces `{{PREFIX}}_sample-widget` (hyphenated), while `Sample_Widget.php` uses `{{PREFIX}}_sample_widget` (underscores).
- [ ] **NEW-44 [P2] CPT Taxonomy REST Attachment & Missing `rest_base`**  
  *Location:* `templates/src/PostTypes/Post_Types.php:41-65`  
  Registers taxonomy after post type without `'taxonomies' => ['{{PREFIX}}_category']` in `$cpt_args` and without explicit `'rest_base'`, creating potential REST API schema omission.
- [ ] **NEW-45 [P2] Ephemeral Elementor Dependency Notice (Dismiss Button Does Not Persist)**  
  *Location:* `templates/src/Elementor/Dependency_Notice.php:46`  
  Notice has `.is-dismissible` but lacks an AJAX handler to store dismissed state, causing it to reappear on every page load.
- [ ] **NEW-46 [P2] Missing Script Module Standard Namespace Identifier**  
  *Location:* `templates/src/Frontend/Interactivity.php:50`  
  Script module ID is registered as `'{{PREFIX}}-interactivity-view'` instead of the official WordPress Core convention format `'{{SLUG}}/view'`.

### Iteration 6 Findings
- [ ] **NEW-47 [P1] Missing Core Constants in `tests/bootstrap.php` (`{{PREFIX}}_PATH`, `{{PREFIX}}_URL`)**  
  *Location:* `templates/tests/bootstrap.php:14-19`  
  `bootstrap.php` only defines `{{PREFIX_UPPER}}_VERSION` and `{{PREFIX_UPPER}}_FILE`. Any unit test instantiating `Admin\Assets`, `Interactivity`, `Blocks_Payment_Method_Type`, `Integration`, or `Custom_Email` crashes with `Error: Undefined constant "{{PREFIX}}_PATH"`.
- [ ] **NEW-48 [P1] Outdated WordPress Stubs Version for Interactivity API in `composer.json`**  
  *Location:* `templates/composer.json:23`  
  Locks `php-stubs/wordpress-stubs` to `^6.0`. When `interactivity` module is selected (requiring WP 6.5+), Intelephense and static analyzers report false undefined function errors for `wp_register_script_module()` and `wp_interactivity_state()`.
- [ ] **NEW-49 [P2] Unconditional Elementor Transient Deletion & Orphan CPT Data in `uninstall.php`**  
  *Location:* `templates/uninstall.php:21`  
  `delete_transient('{{PREFIX}}_elementor_widgets')` is executed unconditionally even when Elementor is not selected, while orphaned CPT posts/terms are left uncleaned.
- [ ] **NEW-50 [P2] Test Suite Temp Directory Leakage on Assertion Failures (`generator.test.js`)**  
  *Location:* `tests/generator.test.js`  
  `fs.rmSync(outDir)` is placed after assertions without `try...finally` or `t.after()`. Any failed test leaves `tmp-test-*` directories on disk, corrupting subsequent runs with "directory already exists" errors.

### Iteration 7 Findings
- [ ] **NEW-51 [P0] Windows Drive-Letter Casing Crash in `isRunAsScript()`**  
  *Location:* `index.js:930-944`  
  On Windows, `path.resolve(__filename) === path.resolve(invokedPath)` evaluates to `false` if drive letter casings differ (`d:\` vs `D:\`), causing `main()` to silently never execute. *Fix:* Use case-insensitive path comparison on Windows.
- [ ] **NEW-52 [P1] Sample "Special Product Note" Injected on Every Single Product Page**  
  *Location:* `templates/src/Woo/Woo_Hooks.php:37, 76-78`  
  Hooks `custom_product_summary_note()` on `woocommerce_single_product_summary`, printing unrequested demo markup between the price and add-to-cart button on all products across the live shop.
- [ ] **NEW-53 [P1] Unhandled Non-Array Return from `apply_filters('{{PREFIX}}_services')`**  
  *Location:* `templates/src/Plugin.php:90-92`  
  If a filter callback returns non-array (e.g. `null` or `false`), `foreach` throws a fatal `TypeError: foreach() argument must be of type array|object, null given`.
- [ ] **NEW-54 [P1] Missing Tax Calculation in `Shipping_Method::calculate_shipping()`**  
  *Location:* `templates/src/Woo/Shipping/Shipping_Method.php:81-89`  
  `$this->add_rate()` omits `'package' => $package`, leading to incorrect tax calculations for taxable shipping zones in WooCommerce stores.
- [ ] **NEW-55 [P2] Missing `tmp-test*` in Root `.gitignore`**  
  *Location:* `.gitignore`  
  Test temp folders created by `generator.test.js` are not ignored, cluttering git working tree when tests fail.
- [ ] **NEW-56 [P2] Missing `create-wp-plugin` Alias in `package.json` `"bin"` Field**  
  *Location:* `package.json:6-8`  
  Only defines `"create-wp-plugin-cli"`. Adding `"create-wp-plugin": "index.js"` ensures standard npm `npm create wp-plugin` alias execution works without error.

### Iteration 8 Findings
- [ ] **NEW-57 [P1] `phpcs.xml` Skips Sniffing `./templates/` Directory**  
  *Location:* `templates/phpcs.xml:5-8`  
  Only includes `./src`, `./tests`, `./{{SLUG}}.php`, `./uninstall.php`. Any template files in `./templates/emails/` are completely skipped by PHPCS linting during `composer lint`.
- [ ] **NEW-58 [P1] Missing `init_form_fields()` in `Custom_Email.php`**  
  *Location:* `templates/src/Woo/Emails/Custom_Email.php:20-41`  
  `Custom_Email` does not implement `init_form_fields()`, preventing store managers from configuring the email Subject, Heading, or recipient in WooCommerce Settings > Emails.
- [ ] **NEW-59 [P2] Elementor Widget Basic HTML Stripped by `esc_html()` in `Sample_Widget.php`**  
  *Location:* `templates/src/Widgets/Sample_Widget.php:178`  
  Uses `'basic'` inline editing for description, but `render()` uses `esc_html()` instead of `wp_kses_post()`, stripping formatting (bold/italic/links) added in the Elementor visual editor.
- [ ] **NEW-60 [P2] Missing Dashicon Icon on CPT Registration in `Post_Types.php`**  
  *Location:* `templates/src/PostTypes/Post_Types.php:41-50`  
  `Post_Types.php` omits `'menu_icon'`, defaulting to the generic post pin icon in the WordPress admin sidebar.

### Iteration 9 Findings
- [ ] **NEW-61 [P0] Missing `webpack.config.js` Generation When Only React Is Selected**  
  *Location:* `index.js:775`  
  Condition `if (hasInteractivity || hasWoo)` skips creating `webpack.config.js` when only React is chosen. `@wordpress/scripts` defaults to `./src/index.js` while our scaffold lives in `./assets/src/index.js`, causing `npm run build` to fail immediately with module resolution error.
- [ ] **NEW-62 [P1] Missing `wp-components` CSS Dependency in `Admin\Assets.php`**  
  *Location:* `templates/src/Admin/Assets.php:63`  
  Passes `array()` instead of `array( 'wp-components' )` when enqueuing `assets/build/index.css`, causing core WordPress React components to render without Gutenberg stylesheet styles.
- [ ] **NEW-63 [P2] Uncaught Fatal Error in `tests/bootstrap.php` on Missing Autoloader**  
  *Location:* `templates/tests/bootstrap.php:8`  
  `require_once dirname(__DIR__) . '/vendor/autoload.php'` fails with fatal error if `phpunit` is executed before `composer install` rather than displaying a clear instruction.
- [ ] **NEW-64 [P2] Hardcoded Version in `Interactivity.php` Bypasses Webpack Asset Hash**  
  *Location:* `templates/src/Frontend/Interactivity.php:53`  
  Passes `{{PREFIX_UPPER}}_VERSION` instead of reading generated `assets/build/view.asset.php` hash, preventing automated browser cache-busting during frontend script changes.

### Iteration 10 Findings
- [ ] **NEW-65 [P1] Missing `DOMContentLoaded` Guard in React Admin App Entrypoint (`index.js`)**  
  *Location:* `templates/react/assets/src/index.js:18-22`  
  Queries `document.getElementById('{{PREFIX}}-app-root')` synchronously upon script execution. If executed in `<head>` or via asynchronous module loader, root element evaluates to `null` and the React app fails to mount.
- [ ] **NEW-66 [P1] Missing Undefined Global Guard in `wc-gateway-block.js`**  
  *Location:* `templates/react/assets/src/wc-gateway-block.js:9-13`  
  Immediately destructures `window.wc.wcBlocksRegistry`. When loaded on non-block checkout pages, browser logs an unhandled `TypeError: Cannot read properties of undefined`.
- [ ] **NEW-67 [P1] Missing Undefined Global Guard in `blocks-integration.js`**  
  *Location:* `templates/react/assets/src/blocks-integration.js:8-11`  
  Destructures `window.wc.blocksCheckout` without verification, crashing with TypeError outside block checkout scope.
- [ ] **NEW-68 [P2] Unsafe Null Context Mutation in Interactivity API `view.js`**  
  *Location:* `templates/react/assets/src/view.js:6-8`  
  Calls `getContext().count++` without null checks on `getContext()`, risking runtime exceptions on frontend pages where `data-wp-context` is absent.

### Iteration 11 Findings
- [ ] **NEW-69 [P1] Multisite Uninstall Cleanup Truncates at 100 Sites (`uninstall.php`)**  
  *Location:* `templates/uninstall.php:25`  
  `get_sites( array( 'fields' => 'ids' ) )` defaults to 100 sites, leaving all sub-sites beyond site #100 unclean on multisite networks. *Fix:* Pass `'number' => 0`.
- [ ] **NEW-70 [P2] Missing Webpack `output.path` in `webpack.config.js`**  
  *Location:* `index.js:793-798`  
  Omits explicit `output: { ...defaultConfig.output, path: path.resolve(process.cwd(), 'assets/build') }`, causing path collisions if `wp-scripts` is invoked directly without CLI arguments.

### Iteration 12 Findings
- [ ] **NEW-71 [P1] Missing CI NPM Dependency Caching in Scaffolded Workflow (`node-build`)**  
  *Location:* `index.js:806-824`  
  `ciNodeJob` runs raw `npm install` without `cache: 'npm'` in `actions/setup-node@v4`, resulting in un-cached node module downloads on every CI run.
- [ ] **NEW-72 [P2] Missing Elementor `get_custom_help_url()` Stub in `Sample_Widget.php`**  
  *Location:* `templates/src/Widgets/Sample_Widget.php:38-45`  
  Omits `get_custom_help_url()` method used by Elementor widgets to link to developer docs in the Elementor visual panel.

### Iteration 13 Findings
- [ ] **NEW-73 [P1] Missing Core Function Stubs in `Example_Test.php` Causes Brain Monkey Crashes**  
  *Location:* `templates/tests/Unit/Example_Test.php:48-69`  
  `Example_Test.php` fails to stub `register_rest_route`, `wp_register_script_module`, `wp_interactivity_state`, and `wp_localize_script`. When REST or Interactivity modules are scaffolded, running PHPUnit tests crashes with `Function called without expectations` exceptions.
- [ ] **NEW-74 [P2] Hardcoded `Tested up to: 6.7` in `readme.txt` Lacks Dynamic Generator Token**  
  *Location:* `templates/readme.txt:5`  
  Hardcodes static `6.7` instead of a template-driven `{{TESTED_UP_TO}}` token, making version maintenance across new WordPress releases error-prone.

### Iteration 14 Findings (CPT Labels & Type Hints)
- [ ] **NEW-75 [P2] Incomplete CPT & Taxonomy Label Sets in `Post_Types.php`**  
  *Location:* `templates/src/PostTypes/Post_Types.php:36-39`  
  Only defines `'name'` and `'singular_name'`. Standard admin actions (Add New, Edit, View, Search, Not Found) default to generic post labels ("Add New Post") instead of custom entity names ("Add New Item").
- [ ] **NEW-76 [P2] Missing Strict Type Hints in `Woo_Hooks.php` Method Signatures**  
  *Location:* `templates/src/Woo/Woo_Hooks.php:86-110`  
  Hooks handlers (`register_gateway`, `register_shipping_method`, `register_email`) omit parameter and return type declarations (`array $gateways): array`).

---

## 🏛️ Section A: Architecture & SOLID (Generated Plugin)

- [ ] **A1 [P0] `Plugin` is a singleton (`private __construct` + `static $instance`)**  
  DIP violation, unmockable. `get_instance(?array $services)` is a test escape hatch. Move singleton logic to the composition root in the main plugin file.
- [ ] **A2 [P0] `build_services()` hardcodes concrete class instantiations (`new Rest\Rest_Controller()`)**  
  Adding a service requires modifying `Plugin.php` (OCP violation). Implement a PSR-11 `Container` + `Service_Provider` interface.
- [ ] **A3 [P1] All services instantiate eagerly on every request**  
  `Admin\Settings_Page` and `Admin\Assets` are constructed even on frontend requests. Needs lazy closure-factory bindings in the container.
- [ ] **A4 [P0] Elementor methods injected into `Plugin.php` via ~90 lines of JS template literal**  
  Extract to `Elementor\Widget_Registrar implements Registrable`. Eliminates the `bootHooks` string injection mechanism.
- [ ] **A5 [P0] Missing core contracts & interfaces**  
  Currently only `Registrable` exists. Add: `Conditional::is_needed()`, `Activatable`, `Deactivatable`, `Uninstallable`, `Has_Requirements`, `Renderable`.
- [ ] **A6 [P1] `Woo_Hooks` is a 113-line god class**  
  Bundles payment gateway, shipping, email, product type, blocks, and cart summary into one class. Split into discrete domain registrars.
- [ ] **A7 [P1] `Woo_Hooks` uses nested anonymous closures**  
  Nested closures inside `add_action( 'woocommerce_blocks_loaded', ... )` are untestable and unremovable. Use named class methods.
- [ ] **A8 [P1] `Settings_Page` mixes 3 distinct responsibilities**  
  Handles hook registration, `get_option()` data access, and inline HTML output. Split into `Settings_Registrar`, `Settings_Repository`, and a template view.
- [ ] **A9 [P1] `Rest_Controller` does not extend `WP_REST_Controller`**  
  Missing `get_item_schema()`, `_fields` filtering support, and schema-driven parameter validation.
- [ ] **A10 [P0] Modern PHP standard modernization (PHP 8.0+)**  
  Add `declare(strict_types=1)` to all templates, typed properties, constructor property promotion, and `readonly` where appropriate.
- [ ] **A11 [P2] `boot()` silently skips non-`Registrable` services**  
  Should trigger `_doing_it_wrong()` or throw an exception under `WP_DEBUG`.
- [ ] **A12 [P2] `Activator` directly calls `new PostTypes\Post_Types()`**  
  Bypasses the service container, creating two sources of truth.
- [ ] **A13 [P2] Fragile Elementor widget reflection & globbing**  
  Replace `glob()` + `ReflectionClass` with an explicit registry or composer classmap.
- [ ] **A14 [P2] `uninstall.php` is procedural**  
  Refactor into an OOP `Core\Uninstaller` service while preserving multisite cleanup.
- [ ] **A15 [P3] Missing custom exception hierarchy**  
  Add `Exceptions\Plugin_Exception`, `Exceptions\Invalid_Service_Exception`.

---

## 💻 Section B: The CLI Tool (`index.js`, Packaging & DX)

### B1. Correctness Bugs
- [ ] **B1.1 [P0] `--no-react` is a dead flag**  
  Defined in `parseCLIArgs()` and `showHelp()`, but `main()` only reads `Boolean(flags.react)`.
- [ ] **B1.2 [P1] Namespace backslash leaks into `phpcs.xml`**  
  `--namespace "Akshat\Stock"` creates `<element value="Akshat\Stock"/>` under `PrefixAllGlobals` (invalid prefix format in XML).
- [ ] **B1.3 [P1] No cleanup / rollback on partial write failure**  
  A failure mid-scaffold leaves orphaned partial directories. Add rollback cleanup on catch.
- [ ] **B1.4 [P1] `validateAll()` is only called in `--yes` mode**  
  Interactive mode skips module validation and cross-field checks.
- [ ] **B1.5 [P2] `runGenerator()` mutates its input argument**  
  `answers.outputDir = answers.outputDir || answers.out` mutates the caller's object.
- [ ] **B1.6 [P2] Positionals accepted but ignored**  
  `create-wp-plugin-cli my-plugin` silently ignores `my-plugin`. Treat positional as `--name` / `--slug` or error out.
- [ ] **B1.7 [P2] Missing non-TTY detection**  
  Running in a pipe/CI without `--yes` hangs on interactive prompts. Check `!process.stdin.isTTY`.
- [ ] **B1.8 [P2] Emoji output lacks `NO_COLOR` / ASCII fallback**  
  Renders broken characters on older Windows terminals and minimal CI logs.
- [ ] **B1.9 [P3] `process.exit()` scattered throughout codebase**  
  Set `process.exitCode` instead to allow programmatic and unit testing.
- [ ] **B1.10 [P3] Synchronous unchecked `package.json` read in `showVersion()`**  
  Add safe try/catch wrapper.

### B2. CLI Architecture & Modularization
- [ ] **B2.1 [P0] `runGenerator()` is a 450-line god function**  
  Split into `TemplateEngine`, `FileWriter`, `ModuleRegistry`, and `Generator`.
- [ ] **B2.2 [P0] Adding a module violates Open-Closed Principle (OCP)**  
  Module logic is scattered across 4+ files. Convert modules into self-describing objects: `{ id, prompt, files[], services[], requiresBuild }`.
- [ ] **B2.3 [P0] Move Elementor PHP string generation to real `.php` template files**  
  Eliminate escaped template literals in `index.js`.
- [ ] **B2.4 [P1] Enhance template engine beyond naive `replaceAll`**  
  Support conditional blocks (`{{#if USE_REACT}}`) to avoid template string concatenation hacks.
- [ ] **B2.5 [P1] Split 950-line `index.js` into ES modules**  
  `src/validators.js`, `src/modules/`, `src/templating.js`, `bin/cli.js`.
- [ ] **B2.6 [P2] Add JSDoc types & `jsconfig.json` (`checkJs: true`)**

### B3. Testing & CI Pipeline
- [ ] **B3.2 [P1] `scripts/verify.sh` not wired into CI**  
  Port `verify.sh` to a cross-platform Node script (`scripts/verify.js`) and run in CI.
- [ ] **B3.3 [P0] Missing Windows runner in CI matrix**  
  Add `windows-latest` to `.github/workflows/ci.yml` `self-consumption` job.
- [ ] **B3.4 [P1] `verify.sh` is bash-only (unrunnable on native Windows)**  
- [ ] **B3.5 [P1] Untested Node 18 in `engines`**  
  Either add Node 18 to CI matrix or bump `engines` to `>=20`.
- [ ] **B3.6 [P1] Interactive prompt flow has zero unit test coverage**  
- [ ] **B3.7 [P2] Add tests for `--help`, `--version`, and invalid CLI arguments**  
- [ ] **B3.8 [P2] Add code coverage reporting (`c8` or Node native coverage)**  
- [ ] **B3.9 [P2] Add snapshot testing for generated file scaffolds**  
- [ ] **B3.10 [P2] Add ESLint & Prettier for the CLI codebase**  
- [ ] **B3.11 [P2] Add `npm audit` check and Dependabot configuration**

### B4–B5. DX & Missing Features
- [ ] **B4.2 [P2] Add `update-notifier` for CLI update alerts**  
- [ ] **B4.5 [P2] Add `CHANGELOG.md`**  
- [ ] **B5.1 [P1] Add `--force` (overwrite) and `--dry-run` flags**  
- [ ] **B5.2 [P1] Add configuration presets (`.wp-plugin-clirc`, `--preset woo`)**  
- [ ] **B5.3 [P1] Add `--template <dir>` for custom team templates**  
- [ ] **B5.4 [P2] Add `--git` (auto-init) and `--install` (auto npm/composer install)**  
- [ ] **B5.5 [P2] Add `--plugin-version` flag (instead of hardcoded `0.1.0`)**  
- [ ] **B5.6 [P3] Add `--textdomain` separate from `--slug`**  
- [ ] **B5.7 [P3] Add `--modules all` shortcut**  
- [ ] **B5.9 [P3] Add `--quiet`, `--verbose`, and `--json` output modes**

### B6. Generated Scaffold Quality & Demo Code Fixes
- [ ] **B6.1 [P1] Orphan `assets/css/main.css` is never enqueued**  
  Add a dedicated `Frontend\Assets` service to manage front-end styling.
- [ ] **B6.2 [P2] Stale versions in `readme.txt`** (`Tested up to: 6.7`, Elementor `3.27.0`).
- [ ] **B6.3 [P2] Generic tags in `readme.txt`** (`wordpress, plugin, scaffolding` rejected by wp.org review).
- [ ] **B6.4 [P2] Missing root `LICENSE` file in scaffolded output**  
- [x] ~~**B6.6 [P0] `main.js` fires an `admin-ajax.php` POST on every pageview**~~ (Fixed in 0.11)
- [x] ~~**B6.7 [P1] Remove `console.log()` calls in shipped production JS**~~ (Fixed in 0.13)  
- [x] ~~**B6.8 [P1] Unauthenticated `wp_ajax_nopriv_` registered by default**~~ (Opt-in only; fixed in 0.14).
- [ ] **B6.9 [P1] Upgrade stale `@wordpress/scripts` dependency (^27.0.0 → ^30.0+)**  
- [ ] **B6.10 [P1] Unify asset build pipelines (`main.js` raw ES6 vs wp-scripts)**  
- [ ] **B6.11 [P2] Add `"private": true`, `license`, `author`, `engines` to scaffolded `package.json`**  
- [ ] **B6.12 [P2] Fix deprecated PHPUnit 9.6 attributes in `phpunit.xml.dist`**  
- [ ] **B6.13 [P2] Remove WooCommerce stubs from `.vscode/settings.json` when Woo is not selected**  
- [ ] **B6.14 [P0] `.distignore` excludes `assets/src` (WordPress.org Guideline #2 violation)**  
  Include source files or add required `== Source Code ==` link in `readme.txt`.
- [ ] **B6.16 [P1] `CLI\Commands::cache_clear()` hardcodes Elementor transient key**  
- [ ] **B6.17 [P2] `Commands.php` top-level `return` breaks PSR-4 autoloading**  
- [ ] **B6.18 [P3] `Cron\Scheduler::execute_cron_job()` is empty**  
- [ ] **B6.19 [P1] Fix `flush_rewrite_rules()` VIP violation suppression**

### B7. Documentation
- [ ] **B7.1 [P1] Add Architecture Section to README.md** (Service Container, Contracts, Design).
- [ ] **B7.2 [P1] Add Module Matrix Table to README.md** (Module → Generated Files → Dependencies).
- [ ] **B7.3 [P1] Add Comparison Section** ("Why not `wp scaffold plugin` or `@wordpress/create-block`?").
- [ ] **B7.4 [P2] Add CI, npm version, license, and provenance badges**.
- [ ] **B7.5 [P2] Add asciinema / GIF terminal recording demo**.

---

## 🧪 Section C: Testing, Quality & Tooling

- [ ] **C1 [P0] Add PHPStan / Psalm static analysis** (`szepeviktor/phpstan-wordpress` Level 5 + baseline).
- [ ] **C2 [P1] Add WordPress Integration Tests** (`wp-phpunit/wp-phpunit` + `yoast/phpunit-polyfills`).
- [ ] **C3 [P1] Add `.wp-env.json` / `@wordpress/env` local Docker development environment**.
- [ ] **C4 [P1] Add JS Jest testing (`@wordpress/jest-preset-default`)**.
- [ ] **C5 [P3] Add Playwright E2E testing setup (`@wordpress/e2e-test-utils-playwright`)**.
- [ ] **C6 [P2] Enable code coverage in CI**.
- [ ] **C7 [P2] Declare WooCommerce custom capabilities in `phpcs.xml` when WooCommerce is enabled**  
  *Location:* `templates/phpcs.xml` & `index.js`  
  WooCommerce registers its own capabilities (`manage_woocommerce`, `view_woocommerce_reports`, `edit_shop_orders`, `read_shop_order`); WPCS only knows core's capabilities, causing false positives. Add the following rule under `<config name="installed_paths" ...>` line in `phpcs.xml` when the WooCommerce module is selected:
  ```xml
	<!--
	WooCommerce registers its own capabilities; WPCS only knows core's,
	so they're declared here to avoid false positives.
	-->
	<rule ref="WordPress.WP.Capabilities">
		<properties>
			<property name="custom_capabilities" type="array">
				<element value="manage_woocommerce"/>
				<element value="view_woocommerce_reports"/>
				<element value="edit_shop_orders"/>
				<element value="read_shop_order"/>
			</property>
		</properties>
	</rule>
  ```
- [ ] **C8 [P3] Add PHP 8.4 to CI matrix**.

---

## 📦 Section D: WordPress.org & Deployment Pipeline

- [ ] **D1 [P1] Add GitHub Action for Plugin Check (`wordpress/plugin-check-action`)**.
- [ ] **D2 [P2] Add SVN release deployment workflow (`10up/action-wordpress-plugin-deploy`)**.
- [ ] **D3 [P2] Scaffold `.wordpress-org/` assets directory** (banner-772x250, icon-256x256).
- [ ] **D4 [P2] Wire `make-pot` translation generation into CI**.
- [ ] **D5 [P3] Add open-source repository templates** (`CONTRIBUTING.md`, `SECURITY.md`, PR templates).

---

## ⚙️ Section E: Runtime Features & Enhancements

- [ ] **E1 [P1] Add Runtime Requirements Checker** (PHP/WP version mismatch guard with admin notice).
- [ ] **E2 [P1] Add Database / Version Migration Routine (`Core\Migrator`)**.
- [ ] **E3 [P0] Add Custom Database Table + `dbDelta()` Module**.
- [ ] **E4 [P2] Add Roles & Capabilities Manager Module**.
- [ ] **E5 [P2] Add PSR-3 / `wc_get_logger()` Logger Abstraction**.
- [ ] **E6 [P2] Add Options & Transients Wrapper Service**.
- [ ] **E7 [P1] Add standalone native Gutenberg block module (`--modules block`)**.
- [ ] **E8 [P3] Add Admin Notices Manager & Site Health Info Tab**.
