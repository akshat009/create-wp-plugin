import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	slugify,
	suggestNamespace,
	suggestPrefix,
	validateName,
	validateSlug,
	validatePrefix,
	validateNamespace,
	validateEmail,
	validateMinPhp,
	validateOutputDir,
	validateModules,
	validateAll,
	runGenerator
} from '../index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('slugify transforms name correctly', () => {
	assert.equal(slugify('My Awesome Plugin!'), 'my-awesome-plugin');
	assert.equal(slugify('  Test_Plugin_Name  '), 'test-plugin-name');
	assert.equal(slugify('---hello---world---'), 'hello-world');
});

test('suggestNamespace generates StudlyCase dropping filler words', () => {
	assert.equal(suggestNamespace('My Awesome Plugin'), 'MyAwesomePlugin');
	assert.equal(suggestNamespace('A Plugin for WordPress'), 'PluginWordPress');
	assert.equal(suggestNamespace('   '), 'MyPlugin');
});

test('suggestPrefix generates lowercase prefix, at least 4 chars (WPCS ShortPrefixPassed floor)', () => {
	// Initials alone ("map") are only 3 chars — WPCS's PrefixAllGlobals.ShortPrefixPassed
	// sniff flags anything under 4, so the suggestion pads out deterministically.
	assert.equal(suggestPrefix('My Awesome Plugin'), 'mapp');
	assert.equal(suggestPrefix('Plugin'), 'plugin');
	assert.ok(suggestPrefix('Go').length >= 4);
	assert.ok(suggestPrefix('My Plugin').length >= 4);
	assert.equal(suggestPrefix('WooCommerceIntegration'), 'woocommerceinte');
});

test('suggestNamespace handles numeric leading characters', () => {
	assert.equal(suggestNamespace('24Seven Commerce'), 'Plugin24SevenCommerce');
	assert.equal(validateNamespace(suggestNamespace('24Seven Commerce')), true);
});

test('Group 2 Validators', () => {
	assert.equal(validateName('My Plugin'), true);
	assert.equal(typeof validateName(''), 'string');

	assert.equal(validateSlug('my-plugin'), true);
	assert.equal(typeof validateSlug('My Plugin'), 'string');

	assert.equal(validatePrefix('myplug'), true);
	assert.equal(typeof validatePrefix('myp'), 'string'); // 3 chars: below WPCS's 4-char ShortPrefixPassed floor
	assert.equal(typeof validatePrefix('sixteencharspref'), 'string'); // 16 chars: exceeds 15-char max to avoid CPT 20-char overflow
	assert.equal(typeof validatePrefix('123'), 'string');

	assert.equal(validateNamespace('MyPlugin'), true);
	assert.equal(validateNamespace('Vendor\\MyPlugin'), true);
	assert.equal(typeof validateNamespace('\\MyPlugin'), 'string');
	assert.equal(typeof validateNamespace('MyPlugin\\\\Core'), 'string');
	assert.equal(typeof validateNamespace('MyPlugin\\'), 'string');

	assert.equal(validateEmail('test@example.com'), true);
	assert.equal(typeof validateEmail('invalid-email'), 'string');

	assert.equal(validateMinPhp('8.0'), true);
	assert.equal(typeof validateMinPhp('invalid'), 'string');

	assert.equal(validateOutputDir('./some-dir'), true);
	assert.equal(typeof validateOutputDir(''), 'string');

	assert.equal(validateAll({
		name: 'Test Plugin',
		slug: 'test-plugin',
		prefix: 'tplg',
		namespace: 'TestPlugin',
		authorEmail: 'author@example.com',
		minPhp: '8.0',
		outputDir: './tmp-test'
	}), true);
});

test('Group 3 $& pattern replacement bug fix regression test', () => {
	const mockAnswers = {
		name: 'Price $10 & Specials $& $1 $\'',
		slug: 'price-test',
		prefix: 'pt',
		namespace: 'PriceTest',
		authorName: 'Author $&',
		authorEmail: 'test@example.com',
		authorUri: 'https://example.com',
		description: 'Description with $& and $1',
		minPhp: '8.0',
		modules: [],
		useReact: false,
		out: path.join(__dirname, '../tmp-test-dollar')
	};

	runGenerator(mockAnswers);

	const mainPhpFile = path.join(mockAnswers.out, 'price-test.php');
	assert.ok(fs.existsSync(mainPhpFile));

	const content = fs.readFileSync(mainPhpFile, 'utf8');
	assert.ok(content.includes('Price $10 & Specials $& $1 $\''));
	assert.ok(content.includes('Author $&'));

	fs.rmSync(mockAnswers.out, { recursive: true, force: true });
});

test('Non-interactive scaffolding for zero-module minimal variant', () => {
	const outDir = path.join(__dirname, '../tmp-test-minimal');
	const mockAnswers = {
		name: 'Minimal Plugin',
		slug: 'minimal-plugin',
		prefix: 'mp',
		namespace: 'MinimalPlugin',
		authorName: 'Author',
		authorEmail: 'test@example.com',
		authorUri: 'https://example.com',
		description: 'Minimal',
		minPhp: '8.0',
		modules: [],
		useReact: false,
		out: outDir
	};

	runGenerator(mockAnswers);

	assert.ok(fs.existsSync(path.join(outDir, 'minimal-plugin.php')));
	assert.ok(fs.existsSync(path.join(outDir, 'readme.txt')));
	assert.ok(fs.existsSync(path.join(outDir, 'languages/.gitkeep')));
	assert.ok(fs.existsSync(path.join(outDir, '.vscode/php.code-snippets')));
	assert.ok(!fs.existsSync(path.join(outDir, '.vscode/php-elementor.code-snippets')));
	assert.ok(!fs.existsSync(path.join(outDir, 'src/Elementor/Dependency_Notice.php')));
	assert.ok(!fs.existsSync(path.join(outDir, 'src/Elementor/Widget_Registrar.php')));

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('Non-interactive scaffolding for Elementor variant includes php-elementor.code-snippets and Dependency_Notice.php', () => {
	const outDir = path.join(__dirname, '../tmp-test-elementor');
	const mockAnswers = {
		name: 'Elementor Plugin',
		slug: 'elementor-plugin',
		prefix: 'ep',
		namespace: 'ElementorPlugin',
		authorName: 'Author',
		authorEmail: 'test@example.com',
		authorUri: 'https://example.com',
		description: 'Elementor',
		minPhp: '8.2',
		modules: ['elementor_widget'],
		useReact: false,
		out: outDir
	};

	runGenerator(mockAnswers);

	assert.ok(fs.existsSync(path.join(outDir, 'elementor-plugin.php')));
	assert.ok(fs.existsSync(path.join(outDir, '.vscode/php.code-snippets')));
	const snippetFile = path.join(outDir, '.vscode/php-elementor.code-snippets');
	assert.ok(fs.existsSync(snippetFile));
	const snippetContent = fs.readFileSync(snippetFile, 'utf8');
	const parsedSnippets = JSON.parse(snippetContent);
	assert.ok(parsedSnippets['Elementor Widget Class']);
	assert.equal(parsedSnippets['Elementor Widget Class'].prefix, 'wpelwidget');
	// Ensure no invalid nested tabstop transform syntax like ${3:${TM_...}} remains
	assert.ok(!snippetContent.includes('${3:${TM_'));
	assert.ok(fs.existsSync(path.join(outDir, 'src/Elementor/Dependency_Notice.php')));
	assert.ok(fs.existsSync(path.join(outDir, 'src/Elementor/Widget_Registrar.php')));

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('validatePrefix rejects reserved words', () => {
	// "wp" and "php" are also caught by the 4-char length floor first, but they
	// must still come back rejected either way — that's what matters here.
	assert.equal(typeof validatePrefix('wp'), 'string');
	assert.equal(typeof validatePrefix('php'), 'string');
	assert.equal(typeof validatePrefix('wordpress'), 'string');
	assert.equal(validatePrefix('myplug'), true);
});

test('validateOutputDir allows paths outside the current working directory', () => {
	assert.equal(validateOutputDir('../sibling-plugin'), true);
	assert.equal(validateOutputDir('/absolute/plugin-dir'), true);
	assert.equal(typeof validateOutputDir(''), 'string');
});

test('validateModules rejects unknown module names but allows empty/known lists', () => {
	assert.equal(validateModules([]), true);
	assert.equal(validateModules(undefined), true);
	assert.equal(validateModules(['admin_settings', 'rest_api']), true);
	assert.equal(typeof validateModules(['admin_settings', 'not_a_real_module']), 'string');
});

test('validateEmail rejects garbage that merely contains "@"', () => {
	assert.equal(validateEmail('name@example.com'), true);
	assert.equal(validateEmail(''), true); // optional field
	assert.equal(typeof validateEmail('@@@@'), 'string');
	assert.equal(typeof validateEmail('no-at-sign'), 'string');
});

test('runGenerator throws (does not process.exit) when the output directory is non-empty', () => {
	const outDir = path.join(__dirname, '../tmp-test-nonempty');
	fs.mkdirSync(outDir, { recursive: true });
	fs.writeFileSync(path.join(outDir, 'existing-file.txt'), 'occupied');

	assert.throws(() => {
		runGenerator({
			name: 'Conflict Plugin',
			slug: 'conflict-plugin',
			prefix: 'cp',
			namespace: 'ConflictPlugin',
			minPhp: '8.0',
			modules: [],
			useReact: false,
			out: outDir
		});
	}, /already exists and is not empty/);

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('React pipeline: package.json build/start scripts point wp-scripts at assets/src', () => {
	const outDir = path.join(__dirname, '../tmp-test-react');
	runGenerator({
		name: 'React Plugin',
		slug: 'react-plugin',
		prefix: 'rp',
		namespace: 'ReactPlugin',
		minPhp: '8.0',
		modules: [],
		useReact: true,
		out: outDir
	});

	const pkg = JSON.parse(fs.readFileSync(path.join(outDir, 'package.json'), 'utf8'));
	assert.match(pkg.scripts.build, /--webpack-src-dir=assets\/src/);
	assert.match(pkg.scripts.start, /--webpack-src-dir=assets\/src/);
	assert.ok(fs.existsSync(path.join(outDir, 'assets/src/index.js')));

	const ci = fs.readFileSync(path.join(outDir, '.github/workflows/ci.yml'), 'utf8');
	assert.ok(!ci.includes('npm ci'), 'CI must not run "npm ci" since no package-lock.json is scaffolded');
	assert.match(ci, /npm install/);

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('composer.json omits the "version" field (composer validate --strict discourages it)', () => {
	const outDir = path.join(__dirname, '../tmp-test-composer-version');
	runGenerator({
		name: 'Version Plugin',
		slug: 'version-plugin',
		prefix: 'vp',
		namespace: 'VersionPlugin',
		minPhp: '8.0',
		modules: [],
		useReact: false,
		out: outDir
	});

	const composer = JSON.parse(fs.readFileSync(path.join(outDir, 'composer.json'), 'utf8'));
	assert.equal(composer.version, undefined);

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('phpcs.xml has no unreplaced {{TOKENS}} and includes trailing-underscore prefix variants (default lint target: wp-org)', () => {
	const outDir = path.join(__dirname, '../tmp-test-phpcs');
	runGenerator({
		name: 'Phpcs Plugin',
		slug: 'phpcs-plugin',
		prefix: 'pcp',
		namespace: 'PhpcsPlugin',
		minPhp: '8.0',
		modules: [],
		useReact: false,
		out: outDir
	});

	const phpcs = fs.readFileSync(path.join(outDir, 'phpcs.xml'), 'utf8');
	assert.ok(!/\{\{[A-Z_]+\}\}/.test(phpcs), 'no unreplaced template tokens should remain');
	assert.ok(phpcs.includes('<element value="pcp_"/>'));
	assert.ok(phpcs.includes('<element value="PCP_"/>'));
	assert.ok(phpcs.includes('WordPress-Extra'));
	assert.ok(!phpcs.includes('WordPress-VIP-Go'), 'default lint target is wp-org, VIP ruleset should not be included');

	const composer = JSON.parse(fs.readFileSync(path.join(outDir, 'composer.json'), 'utf8'));
	assert.ok(!composer['require-dev']['automattic/vipwpcs'], 'default lint target is wp-org, vipwpcs should not be a dependency');

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('lintTarget "vip" generates only the WordPress-VIP-Go ruleset and adds automattic/vipwpcs', () => {
	const outDir = path.join(__dirname, '../tmp-test-phpcs-vip');
	runGenerator({
		name: 'Vip Plugin',
		slug: 'vip-plugin',
		prefix: 'vpg',
		namespace: 'VipPlugin',
		minPhp: '8.0',
		modules: [],
		useReact: false,
		lintTarget: 'vip',
		out: outDir
	});

	const phpcs = fs.readFileSync(path.join(outDir, 'phpcs.xml'), 'utf8');
	assert.ok(!/\{\{[A-Z_]+\}\}/.test(phpcs), 'no unreplaced template tokens should remain');
	assert.ok(phpcs.includes('WordPress-VIP-Go'));
	assert.ok(phpcs.includes('WordPressVIPMinimum.Security.Mustache.OutputNotation'));
	assert.ok(!phpcs.includes('WordPress-Extra'), 'vip-only target should not also load WordPress-Extra');

	const composer = JSON.parse(fs.readFileSync(path.join(outDir, 'composer.json'), 'utf8'));
	assert.ok(composer['require-dev']['automattic/vipwpcs'], 'vip lint target should add automattic/vipwpcs');

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('lintTarget "both" generates both wp.org and VIP-Go rulesets', () => {
	const outDir = path.join(__dirname, '../tmp-test-phpcs-both');
	runGenerator({
		name: 'Both Standards Plugin',
		slug: 'both-standards-plugin',
		prefix: 'bsp',
		namespace: 'BothStandardsPlugin',
		minPhp: '8.0',
		modules: [],
		useReact: false,
		lintTarget: 'both',
		out: outDir
	});

	const phpcs = fs.readFileSync(path.join(outDir, 'phpcs.xml'), 'utf8');
	assert.ok(!/\{\{[A-Z_]+\}\}/.test(phpcs), 'no unreplaced template tokens should remain');
	assert.ok(phpcs.includes('WordPress-Extra'));
	assert.ok(phpcs.includes('WordPress-VIP-Go'));

	const composer = JSON.parse(fs.readFileSync(path.join(outDir, 'composer.json'), 'utf8'));
	assert.ok(composer['require-dev']['automattic/vipwpcs']);

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('generated plugin version defaults to 1.0.0', () => {
	const outDir = path.join(__dirname, '../tmp-test-version-default');
	runGenerator({
		name: 'Version Default Plugin',
		slug: 'version-default-plugin',
		prefix: 'vdp',
		namespace: 'VersionDefaultPlugin',
		minPhp: '8.0',
		modules: [],
		useReact: false,
		out: outDir
	});

	const mainPhp = fs.readFileSync(path.join(outDir, 'version-default-plugin.php'), 'utf8');
	assert.ok(mainPhp.includes('Version:           1.0.0'));

	const readmeTxt = fs.readFileSync(path.join(outDir, 'readme.txt'), 'utf8');
	assert.ok(readmeTxt.includes('Stable tag: 1.0.0'));

	const composer = JSON.parse(fs.readFileSync(path.join(outDir, 'composer.json'), 'utf8'));
	assert.equal(composer.version, undefined, 'composer.json intentionally omits "version" (see the dedicated test above)');

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('foundational contracts and container are always scaffolded with no leftover tokens', () => {
	const outDir = path.join(__dirname, '../tmp-test-foundation');
	runGenerator({
		name: 'Foundation Plugin',
		slug: 'foundation-plugin',
		prefix: 'fdp',
		namespace: 'FoundationPlugin',
		minPhp: '8.0',
		modules: [],
		useReact: false,
		out: outDir
	});

	const files = [
		'src/Core/Container.php',
		'src/Core/Exceptions/Not_Found_Exception.php',
		'src/Core/Uninstaller.php',
		'src/Contracts/Service_Provider.php',
		'src/Contracts/Conditional.php',
		'src/Contracts/Activatable.php',
		'src/Contracts/Deactivatable.php'
	];
	for (const f of files) {
		assert.ok(fs.existsSync(path.join(outDir, f)), `expected ${f} to exist`);
		const content = fs.readFileSync(path.join(outDir, f), 'utf8');
		assert.ok(!/\{\{[A-Z_]+\}\}/.test(content), `no unreplaced template tokens should remain in ${f}`);
	}
	assert.ok(!fs.existsSync(path.join(outDir, 'src/Contracts/Registrable.php')), 'Registrable was replaced by Service_Provider');

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('Plugin.php is a pure composition root (no hooks registered directly), and Widget_Registrar owns Elementor\'s hooks in its own boot()', () => {
	const outDir = path.join(__dirname, '../tmp-test-elementor-boot');
	runGenerator({
		name: 'Elementor Boot Plugin',
		slug: 'elementor-boot-plugin',
		prefix: 'ebp',
		namespace: 'ElementorBootPlugin',
		minPhp: '8.0',
		modules: ['elementor_widget'],
		useReact: false,
		out: outDir
	});

	const pluginPhp = fs.readFileSync(path.join(outDir, 'src/Plugin.php'), 'utf8');
	assert.ok(!pluginPhp.includes('add_action'), 'Plugin.php itself should never register WordPress hooks directly');
	assert.ok(pluginPhp.includes('public function __construct( Container $container, array $providers )'));
	assert.ok(pluginPhp.includes('public static function create(): self'));
	assert.ok(pluginPhp.includes('new Elementor\\Widget_Registrar();'));
	assert.ok(pluginPhp.includes('new Elementor\\Dependency_Notice();'));

	const widgetRegistrar = fs.readFileSync(path.join(outDir, 'src/Elementor/Widget_Registrar.php'), 'utf8');
	assert.ok(!/\{\{[A-Z_]+\}\}/.test(widgetRegistrar), 'no unreplaced template tokens should remain');
	const registrarBootBody = widgetRegistrar.slice(widgetRegistrar.indexOf('public function boot('));
	assert.ok(registrarBootBody.includes("add_action( 'elementor/widgets/register'"));
	assert.ok(registrarBootBody.includes("add_action( 'wp_enqueue_scripts'"));

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('React admin app + admin_settings: root div mounted, Assets.php scoped to the settings page, WP core requirement stays 6.0', () => {
	const outDir = path.join(__dirname, '../tmp-test-react-admin');
	runGenerator({
		name: 'React Admin Plugin',
		slug: 'react-admin-plugin',
		prefix: 'rap',
		namespace: 'ReactAdminPlugin',
		minPhp: '8.0',
		modules: ['admin_settings'],
		useReact: true,
		out: outDir
	});

	const settingsPageView = fs.readFileSync(path.join(outDir, 'src/Admin/views/settings-page.php'), 'utf8');
	assert.ok(settingsPageView.includes('<div id="rap-app-root"></div>'));
	assert.ok(!/\{\{[A-Z_]+\}\}/.test(settingsPageView), 'no unreplaced template tokens should remain');

	const settingsRegistrar = fs.readFileSync(path.join(outDir, 'src/Admin/Settings_Registrar.php'), 'utf8');
	assert.ok(!/\{\{[A-Z_]+\}\}/.test(settingsRegistrar), 'no unreplaced template tokens should remain');
	assert.ok(fs.existsSync(path.join(outDir, 'src/Admin/Settings_Repository.php')));
	assert.ok(fs.existsSync(path.join(outDir, 'src/Admin/views/sample-field.php')));

	const assetsPhp = fs.readFileSync(path.join(outDir, 'src/Admin/Assets.php'), 'utf8');
	assert.ok(assetsPhp.includes("namespace ReactAdminPlugin\\Admin;"));
	assert.ok(assetsPhp.includes("'settings_page_react-admin-plugin' !== $hook_suffix"));
	assert.ok(!/\{\{[A-Z_]+\}\}/.test(assetsPhp), 'no unreplaced template tokens should remain');

	const pluginPhp = fs.readFileSync(path.join(outDir, 'src/Plugin.php'), 'utf8');
	assert.ok(pluginPhp.includes("new Admin\\Assets()"));
	assert.ok(pluginPhp.includes("new Admin\\Settings_Registrar()"));

	const mainPhp = fs.readFileSync(path.join(outDir, 'react-admin-plugin.php'), 'utf8');
	assert.ok(mainPhp.includes('Requires at least: 6.0'), 'React alone must not bump the minimum WP version');

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('React admin app without admin_settings: Assets.php falls back to a TODO scoping comment', () => {
	const outDir = path.join(__dirname, '../tmp-test-react-noadmin');
	runGenerator({
		name: 'React Bare Plugin',
		slug: 'react-bare-plugin',
		prefix: 'rbp',
		namespace: 'ReactBarePlugin',
		minPhp: '8.0',
		modules: [],
		useReact: true,
		out: outDir
	});

	const assetsPhp = fs.readFileSync(path.join(outDir, 'src/Admin/Assets.php'), 'utf8');
	assert.ok(assetsPhp.includes('TODO: narrow this'));
	assert.ok(!assetsPhp.includes('settings_page_'));
	assert.ok(!fs.existsSync(path.join(outDir, 'webpack.config.js')), 'single default entry needs no webpack.config.js override');

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('Frontend Interactivity module: Interactivity.php + view.js scaffolded, WP requirement bumped to 6.5, webpack.config.js overrides entry', () => {
	const outDir = path.join(__dirname, '../tmp-test-interactivity');
	runGenerator({
		name: 'Interactivity Plugin',
		slug: 'interactivity-plugin',
		prefix: 'ip',
		namespace: 'InteractivityPlugin',
		minPhp: '8.0',
		modules: ['interactivity'],
		useReact: false,
		out: outDir
	});

	const interactivityPhp = fs.readFileSync(path.join(outDir, 'src/Frontend/Interactivity.php'), 'utf8');
	assert.ok(interactivityPhp.includes('wp_register_script_module'));
	assert.ok(interactivityPhp.includes('wp_enqueue_script_module'));
	assert.ok(interactivityPhp.includes("wp_interactivity_data_wp_context( array( 'count' => 0 ), self::NAMESPACE_KEY )"));
	assert.ok(!/\{\{[A-Z_]+\}\}/.test(interactivityPhp), 'no unreplaced template tokens should remain');

	assert.ok(fs.existsSync(path.join(outDir, 'assets/src/view.js')));
	assert.ok(!fs.existsSync(path.join(outDir, 'assets/src/index.js')), 'no React admin app entry without useReact');

	const pluginPhp = fs.readFileSync(path.join(outDir, 'src/Plugin.php'), 'utf8');
	assert.ok(pluginPhp.includes("new Frontend\\Interactivity()"));

	const mainPhp = fs.readFileSync(path.join(outDir, 'interactivity-plugin.php'), 'utf8');
	assert.ok(mainPhp.includes('Requires at least: 6.5'));
	const readmeTxt = fs.readFileSync(path.join(outDir, 'readme.txt'), 'utf8');
	assert.ok(readmeTxt.includes('Requires at least: 6.5'));

	const webpackConfig = fs.readFileSync(path.join(outDir, 'webpack.config.js'), 'utf8');
	assert.ok(webpackConfig.includes("view: './assets/src/view.js'"));
	assert.ok(!webpackConfig.includes("index:"), 'no index entry when useReact is off');

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('React admin app + Frontend Interactivity together: webpack.config.js declares both entries', () => {
	const outDir = path.join(__dirname, '../tmp-test-react-interactivity');
	runGenerator({
		name: 'Both Plugin',
		slug: 'both-plugin',
		prefix: 'bp',
		namespace: 'BothPlugin',
		minPhp: '8.0',
		modules: ['interactivity'],
		useReact: true,
		out: outDir
	});

	assert.ok(fs.existsSync(path.join(outDir, 'assets/src/index.js')));
	assert.ok(fs.existsSync(path.join(outDir, 'assets/src/view.js')));

	const webpackConfig = fs.readFileSync(path.join(outDir, 'webpack.config.js'), 'utf8');
	assert.ok(webpackConfig.includes("index: './assets/src/index.js'"));
	assert.ok(webpackConfig.includes("view: './assets/src/view.js'"));

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('WooCommerce module: gateway, shipping, email, product type, blocks payment method, and email templates all scaffold with no leftover tokens', () => {
	const outDir = path.join(__dirname, '../tmp-test-woo');
	runGenerator({
		name: 'Woo Full Plugin',
		slug: 'woo-full-plugin',
		prefix: 'wfp',
		namespace: 'WooFullPlugin',
		minPhp: '8.0',
		modules: ['woocommerce_hooks'],
		useReact: false,
		out: outDir
	});

	const files = [
		'src/Woo/Providers/Gateway_Provider.php',
		'src/Woo/Providers/Shipping_Provider.php',
		'src/Woo/Providers/Email_Provider.php',
		'src/Woo/Providers/Product_Type_Provider.php',
		'src/Woo/Providers/Blocks_Provider.php',
		'src/Woo/Gateways/Gateway.php',
		'src/Woo/Gateways/Blocks_Payment_Method_Type.php',
		'src/Woo/Shipping/Shipping_Method.php',
		'src/Woo/Emails/Custom_Email.php',
		'src/Woo/Products/Custom_Product.php',
		'templates/emails/wfp-custom-email.php',
		'templates/emails/plain/wfp-custom-email.php',
		'assets/src/wc-gateway-block.js'
	];
	for (const f of files) {
		assert.ok(fs.existsSync(path.join(outDir, f)), `expected ${f} to exist`);
	}

	for (const f of files.filter((f) => f.endsWith('.php'))) {
		const content = fs.readFileSync(path.join(outDir, f), 'utf8');
		assert.ok(!/\{\{[A-Z_]+\}\}/.test(content), `no unreplaced template tokens should remain in ${f}`);
	}

	const gatewayProvider = fs.readFileSync(path.join(outDir, 'src/Woo/Providers/Gateway_Provider.php'), 'utf8');
	assert.ok(gatewayProvider.includes("add_filter( 'woocommerce_payment_gateways'"));
	assert.ok(gatewayProvider.includes('woocommerce_blocks_payment_method_type_registration'));
	assert.ok(gatewayProvider.includes('function is_needed(): bool'));

	const shippingProvider = fs.readFileSync(path.join(outDir, 'src/Woo/Providers/Shipping_Provider.php'), 'utf8');
	assert.ok(shippingProvider.includes("add_filter( 'woocommerce_shipping_methods'"));

	const emailProvider = fs.readFileSync(path.join(outDir, 'src/Woo/Providers/Email_Provider.php'), 'utf8');
	assert.ok(emailProvider.includes("add_filter( 'woocommerce_email_classes'"));

	const productTypeProvider = fs.readFileSync(path.join(outDir, 'src/Woo/Providers/Product_Type_Provider.php'), 'utf8');
	assert.ok(productTypeProvider.includes("add_filter( 'woocommerce_product_class'"));
	assert.ok(productTypeProvider.includes("add_filter( 'product_type_selector'"));

	const pluginPhpWoo = fs.readFileSync(path.join(outDir, 'src/Plugin.php'), 'utf8');
	assert.ok(pluginPhpWoo.includes('new Woo\\Providers\\Gateway_Provider();'));
	assert.ok(pluginPhpWoo.includes('new Woo\\Providers\\Shipping_Provider();'));
	assert.ok(pluginPhpWoo.includes('new Woo\\Providers\\Email_Provider();'));
	assert.ok(pluginPhpWoo.includes('new Woo\\Providers\\Product_Type_Provider();'));
	assert.ok(pluginPhpWoo.includes('new Woo\\Providers\\Blocks_Provider();'));

	const blocksType = fs.readFileSync(path.join(outDir, 'src/Woo/Gateways/Blocks_Payment_Method_Type.php'), 'utf8');
	assert.ok(blocksType.includes("protected $name = 'wfp_gateway';"));
	assert.ok(blocksType.includes('wc-blocks-registry'));

	const gatewayBlockJs = fs.readFileSync(path.join(outDir, 'assets/src/wc-gateway-block.js'), 'utf8');
	assert.ok(gatewayBlockJs.includes("getSetting( 'wfp_gateway_data', {} )"));

	const composer = JSON.parse(fs.readFileSync(path.join(outDir, 'composer.json'), 'utf8'));
	assert.ok(composer['require-dev']['php-stubs/woocommerce-stubs'], 'woocommerce-stubs should be added as a dev dependency');

	const vscodeSettings = JSON.parse(fs.readFileSync(path.join(outDir, '.vscode/settings.json'), 'utf8'));
	assert.ok(
		vscodeSettings['intelephense.environment.includePaths'].some((p) => p.includes('woocommerce-stubs')),
		'intelephense should get the woocommerce-stubs include path'
	);

	const mainPhp = fs.readFileSync(path.join(outDir, 'woo-full-plugin.php'), 'utf8');
	assert.ok(mainPhp.includes('Requires Plugins: woocommerce'));
	assert.ok(mainPhp.includes('FeaturesUtil::declare_compatibility'), 'HPOS compatibility must still be declared');

	const webpackConfig = fs.readFileSync(path.join(outDir, 'webpack.config.js'), 'utf8');
	assert.ok(webpackConfig.includes("'wc-gateway-block': './assets/src/wc-gateway-block.js'"));
	assert.ok(!webpackConfig.includes('index:'), 'no admin app entry without useReact');

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('WooCommerce Cart block: native cart-summary block + Blocks Integration scaffold, webpack.config.js merges the lazy entry function correctly, WP requirement is 6.4', () => {
	const outDir = path.join(__dirname, '../tmp-test-woo-cart-block');
	runGenerator({
		name: 'Cart Block Plugin',
		slug: 'cart-block-plugin',
		prefix: 'cbp',
		namespace: 'CartBlockPlugin',
		minPhp: '8.0',
		modules: ['woocommerce_hooks'],
		useReact: false,
		out: outDir
	});

	const blockJson = JSON.parse(fs.readFileSync(path.join(outDir, 'assets/src/blocks/cart-summary/block.json'), 'utf8'));
	assert.equal(blockJson.name, 'cbp/cart-summary');
	assert.equal(blockJson.render, 'file:./render.php');

	const renderPhp = fs.readFileSync(path.join(outDir, 'assets/src/blocks/cart-summary/render.php'), 'utf8');
	assert.ok(renderPhp.includes('WC()->cart'));
	assert.ok(!/\{\{[A-Z_]+\}\}/.test(renderPhp));

	const cartSummaryRegistrar = fs.readFileSync(path.join(outDir, 'src/Woo/Blocks/Cart_Summary_Block.php'), 'utf8');
	assert.ok(cartSummaryRegistrar.includes('register_block_type( $block_dir )'));

	const integration = fs.readFileSync(path.join(outDir, 'src/Woo/Blocks/Integration.php'), 'utf8');
	assert.ok(integration.includes('IntegrationInterface'));
	assert.ok(!/\{\{[A-Z_]+\}\}/.test(integration));

	const blocksProvider = fs.readFileSync(path.join(outDir, 'src/Woo/Providers/Blocks_Provider.php'), 'utf8');
	assert.ok(blocksProvider.includes('Cart_Summary_Block::class'));
	assert.ok(blocksProvider.includes('woocommerce_blocks_cart_block_registration'));
	assert.ok(blocksProvider.includes('woocommerce_blocks_checkout_block_registration'));

	// The critical regression: entry must be a function that invokes defaultConfig.entry()
	// (not `...defaultConfig.entry`, which silently spreads to {} and drops the block).
	const webpackConfig = fs.readFileSync(path.join(outDir, 'webpack.config.js'), 'utf8');
	assert.ok(webpackConfig.includes('entry: () => ('));
	assert.ok(webpackConfig.includes('defaultConfig.entry()'));
	assert.ok(webpackConfig.includes("'wc-gateway-block': './assets/src/wc-gateway-block.js'"));
	assert.ok(webpackConfig.includes("'blocks-integration': './assets/src/blocks-integration.js'"));

	const mainPhp = fs.readFileSync(path.join(outDir, 'cart-block-plugin.php'), 'utf8');
	assert.ok(mainPhp.includes('Requires at least: 6.4'), 'block.json "render" field needs WP 6.4+');

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('composer.json package name derives from the author, not a literal "vendor/" placeholder', () => {
	const outDir = path.join(__dirname, '../tmp-test-composer-vendor');
	runGenerator({
		name: 'Vendor Test Plugin',
		slug: 'vendor-test-plugin',
		prefix: 'vtpl',
		namespace: 'VendorTestPlugin',
		authorName: 'Jane Doe',
		minPhp: '8.0',
		modules: [],
		useReact: false,
		out: outDir
	});

	const composerJson = JSON.parse(fs.readFileSync(path.join(outDir, 'composer.json'), 'utf8'));
	assert.equal(composerJson.name, 'jane-doe/vendor-test-plugin');

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('cpt_taxonomy Activator resolves Post_Types through the container with a fully-qualified class reference', () => {
	const outDir = path.join(__dirname, '../tmp-test-cpt-activator');
	runGenerator({
		name: 'Cpt Activator Plugin',
		slug: 'cpt-activator-plugin',
		prefix: 'cap',
		namespace: 'CptActivatorPlugin',
		minPhp: '8.0',
		modules: ['cpt_taxonomy'],
		useReact: false,
		out: outDir
	});

	const activatorPhp = fs.readFileSync(path.join(outDir, 'src/Core/Activator.php'), 'utf8');
	assert.ok(!/\{\{[A-Z_]+\}\}/.test(activatorPhp), 'no unreplaced template tokens should remain');
	assert.ok(activatorPhp.includes('implements Activatable'));
	assert.ok(activatorPhp.includes('public function activate( Container $container )'));
	// Must be fully-qualified (leading backslash): Activator.php lives in the
	// {{NS}}\Core namespace, so an unqualified "PostTypes\Post_Types" reference
	// would resolve to the nonexistent {{NS}}\Core\PostTypes\Post_Types and
	// fatal at runtime the moment the plugin is activated.
	assert.ok(activatorPhp.includes('$container->get( \\CptActivatorPlugin\\PostTypes\\Post_Types::class )'));

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('WP integration test suite (wp-phpunit) is always scaffolded, independent of module selection', () => {
	const outDir = path.join(__dirname, '../tmp-test-integration');
	runGenerator({
		name: 'Integration Plugin',
		slug: 'integration-plugin',
		prefix: 'intp',
		namespace: 'IntegrationPlugin',
		minPhp: '8.0',
		modules: [],
		useReact: false,
		out: outDir
	});

	const files = [
		'tests/bootstrap-integration.php',
		'phpunit-integration.xml.dist',
		'tests/Integration/Plugin_Boot_Test.php'
	];
	for (const f of files) {
		assert.ok(fs.existsSync(path.join(outDir, f)), `expected ${f} to exist`);
		const content = fs.readFileSync(path.join(outDir, f), 'utf8');
		assert.ok(!/\{\{[A-Z_]+\}\}/.test(content), `no unreplaced template tokens should remain in ${f}`);
	}

	const composer = JSON.parse(fs.readFileSync(path.join(outDir, 'composer.json'), 'utf8'));
	assert.ok(composer['require-dev']['wp-phpunit/wp-phpunit']);
	assert.ok(composer['require-dev']['yoast/phpunit-polyfills']);
	assert.equal(composer.scripts['test:integration'], 'phpunit -c phpunit-integration.xml.dist');

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('pure-PHP scaffold (no React/Interactivity/WooCommerce) gets no package.json, Jest, or Playwright', () => {
	const outDir = path.join(__dirname, '../tmp-test-no-js-pipeline');
	runGenerator({
		name: 'No Js Pipeline Plugin',
		slug: 'no-js-pipeline-plugin',
		prefix: 'njpp',
		namespace: 'NoJsPipelinePlugin',
		minPhp: '8.0',
		modules: ['admin_settings', 'cpt_taxonomy'],
		useReact: false,
		out: outDir
	});

	assert.ok(!fs.existsSync(path.join(outDir, 'package.json')));
	assert.ok(!fs.existsSync(path.join(outDir, 'playwright.config.js')));
	assert.ok(!fs.existsSync(path.join(outDir, 'jest.config.js')));
	assert.ok(!fs.existsSync(path.join(outDir, 'tests/e2e')));
	assert.ok(!fs.existsSync(path.join(outDir, 'tests/js')));

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('Playwright E2E ships alongside any JS pipeline (here: Interactivity only, no React)', () => {
	const outDir = path.join(__dirname, '../tmp-test-e2e-interactivity');
	runGenerator({
		name: 'E2e Interactivity Plugin',
		slug: 'e2e-interactivity-plugin',
		prefix: 'eip',
		namespace: 'E2eInteractivityPlugin',
		minPhp: '8.0',
		modules: ['interactivity'],
		useReact: false,
		out: outDir
	});

	assert.ok(fs.existsSync(path.join(outDir, 'playwright.config.js')));
	assert.ok(fs.existsSync(path.join(outDir, 'tests/e2e/homepage.spec.js')));
	assert.ok(!fs.existsSync(path.join(outDir, 'tests/e2e/settings-page.spec.js')), 'no admin_settings module selected');
	assert.ok(!fs.existsSync(path.join(outDir, 'jest.config.js')), 'Jest only ships alongside the React admin app');
	assert.ok(!fs.existsSync(path.join(outDir, 'tests/js')));

	const pkg = JSON.parse(fs.readFileSync(path.join(outDir, 'package.json'), 'utf8'));
	assert.equal(pkg.scripts['test:e2e'], 'playwright test');
	assert.ok(pkg.devDependencies['@playwright/test']);
	assert.ok(pkg.devDependencies['@wordpress/e2e-test-utils-playwright']);
	assert.ok(!pkg.scripts['test:js']);

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('Jest unit tests + admin_settings-aware E2E spec ship with React admin app', () => {
	const outDir = path.join(__dirname, '../tmp-test-jest-react');
	runGenerator({
		name: 'Jest React Plugin',
		slug: 'jest-react-plugin',
		prefix: 'jrp',
		namespace: 'JestReactPlugin',
		minPhp: '8.0',
		modules: ['admin_settings'],
		useReact: true,
		out: outDir
	});

	assert.ok(fs.existsSync(path.join(outDir, 'jest.config.js')));
	assert.ok(fs.existsSync(path.join(outDir, 'tests/js/App.test.js')));
	assert.ok(fs.existsSync(path.join(outDir, 'tests/e2e/settings-page.spec.js')));

	const appEntry = fs.readFileSync(path.join(outDir, 'assets/src/index.js'), 'utf8');
	assert.ok(appEntry.includes('export function App()'), 'App must be exported for tests/js/App.test.js to import it');

	const pkg = JSON.parse(fs.readFileSync(path.join(outDir, 'package.json'), 'utf8'));
	assert.equal(pkg.scripts['test:js'], 'wp-scripts test-unit-js');
	assert.ok(pkg.devDependencies['@testing-library/react']);
	assert.ok(pkg.devDependencies['@testing-library/jest-dom']);

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('caching module scaffolds Cache_Service as a container-resolvable provider', () => {
	const outDir = path.join(__dirname, '../tmp-test-caching');
	runGenerator({
		name: 'Caching Plugin',
		slug: 'caching-plugin',
		prefix: 'cchp',
		namespace: 'CachingPlugin',
		minPhp: '8.0',
		modules: ['caching'],
		useReact: false,
		out: outDir
	});

	const cacheService = fs.readFileSync(path.join(outDir, 'src/Cache/Cache_Service.php'), 'utf8');
	assert.ok(!/\{\{[A-Z_]+\}\}/.test(cacheService), 'no unreplaced template tokens should remain');
	assert.ok(cacheService.includes('implements Service_Provider'));
	assert.ok(cacheService.includes("wp_cache_get"));
	assert.ok(cacheService.includes('get_transient'));

	const pluginPhp = fs.readFileSync(path.join(outDir, 'src/Plugin.php'), 'utf8');
	assert.ok(pluginPhp.includes('new Cache\\Cache_Service();'));

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('custom_table module scaffolds a dbDelta Schema + Item_Repository, wired into Activator/uninstall', () => {
	const outDir = path.join(__dirname, '../tmp-test-custom-table');
	runGenerator({
		name: 'Custom Table Plugin',
		slug: 'custom-table-plugin',
		prefix: 'ctbp',
		namespace: 'CustomTablePlugin',
		minPhp: '8.0',
		modules: ['custom_table'],
		useReact: false,
		out: outDir
	});

	const schema = fs.readFileSync(path.join(outDir, 'src/Database/Schema.php'), 'utf8');
	assert.ok(!/\{\{[A-Z_]+\}\}/.test(schema), 'no unreplaced template tokens should remain');
	assert.ok(schema.includes('implements Service_Provider'));
	assert.ok(schema.includes('dbDelta('));
	assert.ok(schema.includes("PRIMARY KEY"));
	assert.ok(schema.includes('KEY status'));

	const repository = fs.readFileSync(path.join(outDir, 'src/Database/Item_Repository.php'), 'utf8');
	assert.ok(!/\{\{[A-Z_]+\}\}/.test(repository));

	const pluginPhp = fs.readFileSync(path.join(outDir, 'src/Plugin.php'), 'utf8');
	assert.ok(pluginPhp.includes('new Database\\Schema();'));

	const activatorPhp = fs.readFileSync(path.join(outDir, 'src/Core/Activator.php'), 'utf8');
	assert.ok(!/\{\{[A-Z_]+\}\}/.test(activatorPhp));
	assert.ok(activatorPhp.includes('$container->get( \\CustomTablePlugin\\Database\\Schema::class )->create_table();'));

	const uninstallerPhp = fs.readFileSync(path.join(outDir, 'src/Core/Uninstaller.php'), 'utf8');
	assert.ok(!/\{\{[A-Z_]+\}\}/.test(uninstallerPhp));
	assert.ok(uninstallerPhp.includes('\\CustomTablePlugin\\Database\\Schema::drop_table();'));

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('composer.json package name falls back to "vendor/" when no author name is given', () => {
	const outDir = path.join(__dirname, '../tmp-test-composer-vendor-fallback');
	runGenerator({
		name: 'No Author Plugin',
		slug: 'no-author-plugin',
		prefix: 'napl',
		namespace: 'NoAuthorPlugin',
		authorName: '',
		minPhp: '8.0',
		modules: [],
		useReact: false,
		out: outDir
	});

	const composerJson = JSON.parse(fs.readFileSync(path.join(outDir, 'composer.json'), 'utf8'));
	assert.equal(composerJson.name, 'vendor/no-author-plugin');

	fs.rmSync(outDir, { recursive: true, force: true });
});

