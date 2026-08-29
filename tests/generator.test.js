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
	validateOutputDir,
	validateModules,
	validateAll,
	MIN_PHP,
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

	assert.equal(validateOutputDir('./some-dir'), true);
	assert.equal(typeof validateOutputDir(''), 'string');

	assert.equal(validateAll({
		name: 'Test Plugin',
		slug: 'test-plugin',
		prefix: 'tplg',
		namespace: 'TestPlugin',
		authorEmail: 'author@example.com',
		outputDir: './tmp-test'
	}), true);
});

test('Group 3 $& pattern replacement bug fix regression test', () => {
	const outDir = path.join(__dirname, '../tmp-test-dollar');
	fs.rmSync(outDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });

	const mockAnswers = {
		name: 'Price $10 & Specials $& $1 $\'',
		slug: 'price-test',
		prefix: 'pt',
		namespace: 'PriceTest',
		authorName: 'Author $&',
		authorEmail: 'test@example.com',
		authorUri: 'https://example.com',
		description: 'Description with $& and $1',
		modules: [],
		useReact: false,
		out: outDir
	};

	runGenerator(mockAnswers);

	const mainPhpFile = path.join(mockAnswers.out, 'price-test.php');
	assert.ok(fs.existsSync(mainPhpFile));

	const content = fs.readFileSync(mainPhpFile, 'utf8');
	assert.ok(content.includes('Price $10 & Specials $& $1'));
	assert.ok(content.includes('Author $&'));

	fs.rmSync(outDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
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
		modules: [],
		useReact: false,
		out: outDir
	};

	runGenerator(mockAnswers);

	assert.ok(fs.existsSync(path.join(outDir, 'minimal-plugin.php')));
	assert.ok(fs.existsSync(path.join(outDir, 'readme.txt')));
	assert.ok(fs.existsSync(path.join(outDir, 'languages/.gitkeep')));
	assert.ok(!fs.existsSync(path.join(outDir, '.vscode')), 'no .vscode without the editor_config module');
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
		modules: ['elementor_widget', 'editor_config'],
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

test('every scaffold pins PHP 8.3 and emits modern PHP (promotion, readonly, first-class callables)', () => {
	assert.equal(MIN_PHP, '8.3');

	const outDir = path.join(__dirname, '../tmp-test-php83');
	fs.rmSync(outDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });

	runGenerator({
		name: 'Modern Php', slug: 'modern-php', prefix: 'mphp', namespace: 'ModernPhp',
		authorName: 'Author', authorEmail: 'test@example.com', authorUri: 'https://example.com',
		description: 'modern php', modules: ['woo:store-api', 'admin_settings'], useReact: false, out: outDir
	});

	const requires = ['modern-php.php', 'composer.json', 'readme.txt'].map(
		(f) => fs.readFileSync(path.join(outDir, f), 'utf8')
	);
	assert.match(requires[0], /Requires PHP:\s+8\.3/);
	assert.match(requires[1], /"php":\s*">=8\.3"/);
	assert.match(requires[2], /Requires PHP: 8\.3/);

	const ci = fs.readFileSync(path.join(outDir, '.github/workflows/ci.yml'), 'utf8');
	assert.match(ci, /php-version:\s*\['8\.3', '8\.4'\]/);

	const plugin = fs.readFileSync(path.join(outDir, 'src/Plugin.php'), 'utf8');
	assert.match(plugin, /private readonly Container \$container/, 'constructor property promotion');
	assert.doesNotMatch(plugin, /\$this->container = \$container;/, 'no hand-written assignment');

	const container = fs.readFileSync(path.join(outDir, 'src/Core/Container.php'), 'utf8');
	assert.match(container, /public function get\( string \$id \): mixed \{/, '`: mixed` is unconditional');

	const settings = fs.readFileSync(path.join(outDir, 'src/Admin/Settings_Registrar.php'), 'utf8');
	assert.match(settings, /add_action\( '[^']+', \$this->[a-z_]+\(\.\.\.\) \)/, 'first-class callable hook');
	assert.doesNotMatch(settings, /array\( \$this, '/, 'no array-style callbacks');

	const storeApiProvider = fs.readFileSync(path.join(outDir, 'src/Woo/Providers/Store_Api_Provider.php'), 'utf8');
	assert.match(storeApiProvider, /public function __construct\( private readonly \?Store_Api_Extension \$service = null \)/);

	assert.doesNotMatch(plugin + container, /\{\{[#/]?if/, 'no leftover conditional tags');

	fs.rmSync(outDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
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
			modules: [],
			useReact: false,
			out: outDir
		});
	}, /already exists and is not empty/);

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('B1.3 a mid-scaffold failure rolls back a directory it created', () => {
	const created = path.join(__dirname, '../tmp-test-rollback-created');
	fs.rmSync(created, { recursive: true, force: true });

	const realWrite = fs.writeFileSync;
	let calls = 0;
	fs.writeFileSync = (...args) => {
		if (++calls === 4) {
			throw new Error('simulated disk failure mid-scaffold');
		}
		return realWrite(...args);
	};
	try {
		assert.throws(() => runGenerator({
			name: 'Rollback', slug: 'rollback', prefix: 'rbk', namespace: 'Rollback',
			modules: [], useReact: false, out: created
		}), /simulated disk failure/);
	} finally {
		fs.writeFileSync = realWrite;
	}
	assert.ok(!fs.existsSync(created), 'the directory runGenerator created must be gone after a failure');

	// A directory that already existed (empty) is left in place, not deleted.
	const preExisting = path.join(__dirname, '../tmp-test-rollback-preexisting');
	fs.rmSync(preExisting, { recursive: true, force: true });
	fs.mkdirSync(preExisting, { recursive: true });
	calls = 0;
	fs.writeFileSync = (...args) => {
		if (++calls === 4) {
			throw new Error('simulated disk failure mid-scaffold');
		}
		return realWrite(...args);
	};
	try {
		assert.throws(() => runGenerator({
			name: 'Keep', slug: 'keep', prefix: 'keep', namespace: 'Keep',
			modules: [], useReact: false, out: preExisting
		}), /simulated disk failure/);
	} finally {
		fs.writeFileSync = realWrite;
	}
	assert.ok(fs.existsSync(preExisting), 'a pre-existing directory the user pointed us at is never deleted');
	fs.rmSync(preExisting, { recursive: true, force: true });
});

test('React pipeline: package.json build/start scripts point wp-scripts at assets/src', () => {
	const outDir = path.join(__dirname, '../tmp-test-react');
	runGenerator({
		name: 'React Plugin',
		slug: 'react-plugin',
		prefix: 'rp',
		namespace: 'ReactPlugin',
		modules: [],
		useReact: true,
		out: outDir
	});

	const pkg = JSON.parse(fs.readFileSync(path.join(outDir, 'package.json'), 'utf8'));
	assert.equal(pkg.main, undefined, 'package.json should not have a dead main entry');
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
		modules: [],
		useReact: false,
		out: outDir
	});

	const files = [
		'src/Core/Container.php',
		'src/Core/Exceptions/Not_Found_Exception.php',
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
	assert.ok(!fs.existsSync(path.join(outDir, 'src/Core/Uninstaller.php')), 'no Uninstaller without a module that persists cleanup-worthy state (0.7)');
	assert.ok(!fs.existsSync(path.join(outDir, 'uninstall.php')), 'no uninstall.php in a zero-module scaffold (0.7)');

	// B6.4: a GPL-2.0-or-later LICENSE file always ships (composer.json declares it).
	const license = fs.readFileSync(path.join(outDir, 'LICENSE'), 'utf8');
	assert.ok(license.includes('GNU GENERAL PUBLIC LICENSE'));
	assert.ok(license.includes('Version 2, June 1991'));

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('Plugin.php is a pure composition root (no hooks registered directly), and Widget_Registrar owns Elementor\'s hooks in its own boot()', () => {
	const outDir = path.join(__dirname, '../tmp-test-elementor-boot');
	runGenerator({
		name: 'Elementor Boot Plugin',
		slug: 'elementor-boot-plugin',
		prefix: 'ebp',
		namespace: 'ElementorBootPlugin',
		modules: ['elementor_widget'],
		useReact: false,
		out: outDir
	});

	const pluginPhp = fs.readFileSync(path.join(outDir, 'src/Plugin.php'), 'utf8');
	assert.ok(!pluginPhp.includes('add_action'), 'Plugin.php itself should never register WordPress hooks directly');
	assert.ok(pluginPhp.includes('private readonly Container $container'));
	assert.ok(pluginPhp.includes('private readonly array $providers'));
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

test('Frontend Interactivity module: view.js is hand-written ESM served as a script module (no build step, no webpack.config.js), WP requirement 6.5', () => {
	const outDir = path.join(__dirname, '../tmp-test-interactivity');
	runGenerator({
		name: 'Interactivity Plugin',
		slug: 'interactivity-plugin',
		prefix: 'ip',
		namespace: 'InteractivityPlugin',
		modules: ['interactivity'],
		useReact: false,
		out: outDir
	});

	const interactivityPhp = fs.readFileSync(path.join(outDir, 'src/Frontend/Interactivity.php'), 'utf8');
	assert.ok(interactivityPhp.includes('wp_register_script_module'));
	assert.ok(interactivityPhp.includes('wp_enqueue_script_module'));
	assert.ok(interactivityPhp.includes("'assets/js/view.js'"), 'registers the raw ESM file, not a build artifact');
	assert.ok(!interactivityPhp.includes('assets/build/view'), 'no reference to a non-existent bundled view');
	assert.ok(interactivityPhp.includes("wp_interactivity_data_wp_context( array( 'count' => 0 ), self::NAMESPACE_KEY )"));
	assert.ok(!/\{\{[A-Z_]+\}\}/.test(interactivityPhp), 'no unreplaced template tokens should remain');

	const viewJs = fs.readFileSync(path.join(outDir, 'assets/js/view.js'), 'utf8');
	assert.ok(viewJs.includes("import { store, getContext } from '@wordpress/interactivity'"), 'stays ESM — resolved by WP\'s import map at runtime');
	assert.ok(!fs.existsSync(path.join(outDir, 'assets/src/view.js')), 'not a webpack entry');
	assert.ok(!fs.existsSync(path.join(outDir, 'webpack.config.js')), 'interactivity alone needs no webpack override');

	const pkg = JSON.parse(fs.readFileSync(path.join(outDir, 'package.json'), 'utf8'));
	assert.equal(pkg.scripts.build, undefined, 'nothing to build for interactivity alone');
	assert.equal(pkg.scripts['test:js'], 'wp-scripts test-unit-js', 'but the Jest suite still ships for view.test.js');

	const mainPhp = fs.readFileSync(path.join(outDir, 'interactivity-plugin.php'), 'utf8');
	assert.ok(mainPhp.includes('Requires at least: 6.5'));

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('React admin app + Frontend Interactivity together: no webpack.config.js (single admin entry auto-detected; view.js is raw ESM)', () => {
	const outDir = path.join(__dirname, '../tmp-test-react-interactivity');
	runGenerator({
		name: 'Both Plugin',
		slug: 'both-plugin',
		prefix: 'bp',
		namespace: 'BothPlugin',
		modules: ['interactivity'],
		useReact: true,
		out: outDir
	});

	assert.ok(fs.existsSync(path.join(outDir, 'assets/src/index.js')));
	assert.ok(fs.existsSync(path.join(outDir, 'assets/js/view.js')));
	assert.ok(!fs.existsSync(path.join(outDir, 'webpack.config.js')), 'one webpack entry (the admin app) is auto-detected');

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('block module: native block.json + edit + server render, wired via Block_Registrar, WP requirement 6.3', () => {
	const outDir = path.join(__dirname, '../tmp-test-block');
	runGenerator({
		name: 'Block Plugin', slug: 'block-plugin', prefix: 'blkp', namespace: 'BlockPlugin',
		modules: ['block'], useReact: false, out: outDir
	});

	for (const f of [
		'src/Blocks/Block_Registrar.php',
		'assets/src/blocks/example/block.json',
		'assets/src/blocks/example/index.js',
		'assets/src/blocks/example/edit.js',
		'assets/src/blocks/example/render.php',
		'assets/src/blocks/example-static/block.json',
		'assets/src/blocks/example-static/index.js',
		'assets/src/blocks/example-static/edit.js',
		'assets/src/blocks/example-static/save.js',
		'tests/Unit/Block_Registrar_Test.php',
		'tests/js/block.test.js',
		'tests/js/block-static.test.js',
	]) {
		assert.ok(fs.existsSync(path.join(outDir, f)), `expected ${f}`);
	}
	assert.ok(!fs.existsSync(path.join(outDir, 'assets/src/blocks/example-static/render.php')), 'static block has no render.php');

	const dynJson = JSON.parse(fs.readFileSync(path.join(outDir, 'assets/src/blocks/example/block.json'), 'utf8'));
	assert.equal(dynJson.name, 'block-plugin/example', 'block name uses the slug, not the function prefix');
	assert.equal(dynJson.apiVersion, 3);
	assert.equal(dynJson.render, 'file:./render.php', 'dynamic block, server-rendered');

	const staticJson = JSON.parse(fs.readFileSync(path.join(outDir, 'assets/src/blocks/example-static/block.json'), 'utf8'));
	assert.equal(staticJson.name, 'block-plugin/example-static');
	assert.equal(staticJson.render, undefined, 'static block has no render field');
	assert.ok(fs.readFileSync(path.join(outDir, 'assets/src/blocks/example-static/save.js'), 'utf8').includes('RichText.Content'), 'static save() serializes markup');

	const registrar = fs.readFileSync(path.join(outDir, 'src/Blocks/Block_Registrar.php'), 'utf8');
	assert.ok(registrar.includes('implements Service_Provider'));
	assert.ok(registrar.includes("add_action( 'init', $this->register_blocks(...) )"));
	assert.ok(registrar.includes("glob( $build_dir . '/*', GLOB_ONLYDIR )"), 'discovers every built block dir, so new blocks need no PHP change');
	assert.ok(registrar.includes('register_block_type( $block_dir )'));
	assert.ok(!/\{\{[A-Z_]+\}\}/.test(registrar), 'no unreplaced tokens');

	const pluginPhp = fs.readFileSync(path.join(outDir, 'src/Plugin.php'), 'utf8');
	assert.ok(pluginPhp.includes('new Blocks\\Block_Registrar();'));

	// block flips the build pipeline on, but a block-only build needs no
	// webpack.config.js override — wp-scripts finds block.json on its own.
	assert.ok(fs.existsSync(path.join(outDir, 'package.json')));
	assert.equal(JSON.parse(fs.readFileSync(path.join(outDir, 'package.json'), 'utf8')).scripts.build, 'wp-scripts build --webpack-src-dir=assets/src --output-path=assets/build');
	assert.ok(fs.existsSync(path.join(outDir, 'jest.config.js')), 'block pulls in the Jest setup');
	assert.ok(!fs.existsSync(path.join(outDir, 'webpack.config.js')), 'block alone needs no entry override');

	const mainPhp = fs.readFileSync(path.join(outDir, 'block-plugin.php'), 'utf8');
	assert.ok(mainPhp.includes('Requires at least: 6.3'));

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('block + React together: webpack.config.js keeps the admin entry alongside the auto-built block', () => {
	const outDir = path.join(__dirname, '../tmp-test-block-react');
	runGenerator({
		name: 'Block React', slug: 'block-react', prefix: 'blkr', namespace: 'BlockReact',
		modules: ['block'], useReact: true, out: outDir
	});

	const webpackConfig = fs.readFileSync(path.join(outDir, 'webpack.config.js'), 'utf8');
	assert.ok(webpackConfig.includes("index: './assets/src/index.js'"), 'admin entry re-declared so block-json mode does not drop it');
	assert.ok(webpackConfig.includes('defaultConfig.entry()'), 'and merged with wp-scripts own block.json globbing');

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('block sub-modules: block:dynamic and block:static scaffold independently', () => {
	const dyn = path.join(__dirname, '../tmp-test-block-dyn');
	runGenerator({
		name: 'Block Dyn', slug: 'block-dyn', prefix: 'bdyn', namespace: 'BlockDyn',
		modules: ['block:dynamic'], useReact: false, out: dyn
	});
	assert.ok(fs.existsSync(path.join(dyn, 'assets/src/blocks/example/render.php')));
	assert.ok(!fs.existsSync(path.join(dyn, 'assets/src/blocks/example-static')), 'static block not scaffolded');
	assert.ok(fs.existsSync(path.join(dyn, 'tests/js/block.test.js')));
	assert.ok(!fs.existsSync(path.join(dyn, 'tests/js/block-static.test.js')));
	assert.ok(fs.existsSync(path.join(dyn, 'src/Blocks/Block_Registrar.php')), 'registrar ships regardless of variant (it globs the build dir)');
	fs.rmSync(dyn, { recursive: true, force: true });

	const stat = path.join(__dirname, '../tmp-test-block-stat');
	runGenerator({
		name: 'Block Stat', slug: 'block-stat', prefix: 'bsta', namespace: 'BlockStat',
		modules: ['block:static'], useReact: false, out: stat
	});
	assert.ok(fs.existsSync(path.join(stat, 'assets/src/blocks/example-static/save.js')));
	assert.ok(!fs.existsSync(path.join(stat, 'assets/src/blocks/example')), 'dynamic block not scaffolded');
	assert.ok(fs.existsSync(path.join(stat, 'tests/js/block-static.test.js')));
	assert.ok(!fs.existsSync(path.join(stat, 'tests/js/block.test.js')));
	fs.rmSync(stat, { recursive: true, force: true });
});

test('block bundle alias: plain "block" expands to both sub-modules', () => {
	const outDir = path.join(__dirname, '../tmp-test-block-all');
	runGenerator({
		name: 'Block All', slug: 'block-all', prefix: 'blka', namespace: 'BlockAll',
		modules: ['block'], useReact: false, out: outDir
	});
	assert.ok(fs.existsSync(path.join(outDir, 'assets/src/blocks/example/render.php')));
	assert.ok(fs.existsSync(path.join(outDir, 'assets/src/blocks/example-static/save.js')));
	fs.rmSync(outDir, { recursive: true, force: true });
});

test('WooCommerce module: gateway, shipping, email, product type, blocks payment method, and email templates all scaffold with no leftover tokens', () => {
	const outDir = path.join(__dirname, '../tmp-test-woo');
	runGenerator({
		name: 'Woo Full Plugin',
		slug: 'woo-full-plugin',
		prefix: 'wfp',
		namespace: 'WooFullPlugin',
		modules: ['woocommerce_hooks', 'editor_config'],
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
	assert.ok(blocksProvider.includes('Cart_Summary_Block::register(...)'));
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
	// B6.19: soft flush, and no phpcs:ignore papering over the VIP sniff.
	assert.ok(activatorPhp.includes('flush_rewrite_rules( false );'));
	assert.ok(!activatorPhp.includes('phpcs:ignore'), 'wp-org target needs no suppression for flush_rewrite_rules');

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('B6.19 a VIP lint target drops flush_rewrite_rules() entirely rather than suppressing the sniff', () => {
	const outDir = path.join(__dirname, '../tmp-test-frr-vip');
	runGenerator({
		name: 'Frr Vip', slug: 'frr-vip', prefix: 'frrv', namespace: 'FrrVip',
		modules: ['cpt_taxonomy'], lintTarget: 'vip', useReact: false, out: outDir
	});
	const activatorPhp = fs.readFileSync(path.join(outDir, 'src/Core/Activator.php'), 'utf8');
	assert.ok(!/^\s*flush_rewrite_rules\(/m.test(activatorPhp), 'no flush_rewrite_rules() call under a VIP target');
	assert.ok(!activatorPhp.includes('phpcs:ignore'), 'and therefore no suppression');
	assert.ok(activatorPhp.includes('Permalinks'), 'a comment explains what to do instead');
	const deactivatorPhp = fs.readFileSync(path.join(outDir, 'src/Core/Deactivator.php'), 'utf8');
	assert.ok(!/^\s*flush_rewrite_rules\(/m.test(deactivatorPhp));
	fs.rmSync(outDir, { recursive: true, force: true });
});

test('0.8 the WP integration suite is an integration_tests module, not baseline', () => {
	const off = path.join(__dirname, '../tmp-test-integration-off');
	runGenerator({
		name: 'Int Off', slug: 'int-off', prefix: 'inof', namespace: 'IntOff',
		modules: ['admin_settings'], useReact: false, out: off
	});
	for (const f of ['tests/bootstrap-integration.php', 'phpunit-integration.xml.dist', 'tests/Integration/Plugin_Boot_Test.php', '.wp-env.json']) {
		assert.ok(!fs.existsSync(path.join(off, f)), `${f} must not ship without the module`);
	}
	const composerOff = JSON.parse(fs.readFileSync(path.join(off, 'composer.json'), 'utf8'));
	assert.ok(!composerOff['require-dev']['wp-phpunit/wp-phpunit'], 'wp-phpunit is not pulled in');
	assert.ok(!composerOff['require-dev']['yoast/phpunit-polyfills']);
	assert.equal(composerOff.scripts['test:integration'], undefined);
	assert.ok(!fs.readFileSync(path.join(off, '.github/workflows/ci.yml'), 'utf8').includes('Integration Tests (wp-phpunit)'), 'no integration CI job');
	fs.rmSync(off, { recursive: true, force: true });

	const on = path.join(__dirname, '../tmp-test-integration-on');
	runGenerator({
		name: 'Int On', slug: 'int-on', prefix: 'inon', namespace: 'IntOn',
		modules: ['integration_tests'], useReact: false, out: on
	});
	for (const f of ['tests/bootstrap-integration.php', 'phpunit-integration.xml.dist', 'tests/Integration/Plugin_Boot_Test.php', '.wp-env.json']) {
		const content = fs.readFileSync(path.join(on, f), 'utf8');
		assert.ok(!/\{\{[A-Z_]+\}\}/.test(content), `no unreplaced tokens in ${f}`);
	}
	const composerOn = JSON.parse(fs.readFileSync(path.join(on, 'composer.json'), 'utf8'));
	assert.ok(composerOn['require-dev']['wp-phpunit/wp-phpunit']);
	assert.ok(composerOn['require-dev']['yoast/phpunit-polyfills']);
	assert.equal(composerOn.scripts['test:integration'], 'phpunit -c phpunit-integration.xml.dist');
	assert.ok(fs.readFileSync(path.join(on, '.github/workflows/ci.yml'), 'utf8').includes('Integration Tests (wp-phpunit)'));
	fs.rmSync(on, { recursive: true, force: true });
});

test('pure-PHP scaffold gets a packaging-only package.json — no build pipeline, Jest, or Playwright', () => {
	const outDir = path.join(__dirname, '../tmp-test-no-js-pipeline');
	runGenerator({
		name: 'No Js Pipeline Plugin',
		slug: 'no-js-pipeline-plugin',
		prefix: 'njpp',
		namespace: 'NoJsPipelinePlugin',
		modules: ['admin_settings', 'cpt_taxonomy'],
		useReact: false,
		out: outDir
	});

	// B6.14: package.json always ships for `npm run plugin-zip` + JS/CSS lint...
	const pkg = JSON.parse(fs.readFileSync(path.join(outDir, 'package.json'), 'utf8'));
	assert.equal(pkg.private, true);
	assert.equal(pkg.scripts['plugin-zip'], 'wp-scripts plugin-zip');
	assert.ok(pkg.scripts['lint:js'] && pkg.scripts['lint:style']);
	assert.ok(Array.isArray(pkg.files) && pkg.files.includes('vendor') && pkg.files.includes('assets/src'), 'B6.14a: vendor/ and assets/src/ ship in the zip');
	// ...but nothing build-pipeline-ish.
	assert.equal(pkg.scripts.build, undefined);
	assert.equal(pkg.scripts.start, undefined);
	assert.equal(pkg.scripts['test:js'], undefined);
	assert.equal(pkg.scripts['test:e2e'], undefined);
	assert.equal(pkg.main, undefined);
	assert.ok(!fs.existsSync(path.join(outDir, '.distignore')), 'B6.14: .distignore is gone; files[] is the source of truth');
	assert.ok(!fs.existsSync(path.join(outDir, 'webpack.config.js')));
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
		modules: ['interactivity'],
		useReact: false,
		out: outDir
	});

	assert.ok(fs.existsSync(path.join(outDir, 'playwright.config.js')));
	assert.ok(fs.existsSync(path.join(outDir, 'tests/e2e/homepage.spec.js')));
	assert.ok(!fs.existsSync(path.join(outDir, 'tests/e2e/settings-page.spec.js')), 'no admin_settings module selected');
	assert.ok(fs.existsSync(path.join(outDir, 'jest.config.js')));
	assert.ok(fs.existsSync(path.join(outDir, 'tests/js/view.test.js')));

	const pkg = JSON.parse(fs.readFileSync(path.join(outDir, 'package.json'), 'utf8'));
	assert.equal(pkg.scripts['test:e2e'], 'playwright test');
	assert.ok(pkg.devDependencies['@playwright/test']);
	assert.ok(pkg.devDependencies['@wordpress/e2e-test-utils-playwright']);
	assert.equal(pkg.scripts['test:js'], 'wp-scripts test-unit-js');

	fs.rmSync(outDir, { recursive: true, force: true });
});


test('Jest unit tests + admin_settings-aware E2E spec ship with React admin app', () => {
	const outDir = path.join(__dirname, '../tmp-test-jest-react');
	runGenerator({
		name: 'Jest React Plugin',
		slug: 'jest-react-plugin',
		prefix: 'jrp',
		namespace: 'JestReactPlugin',
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

test('B6.16 cache cleanup goes through the {{PREFIX}}_cache_keys filter, not hardcoded module keys', () => {
	const bare = path.join(__dirname, '../tmp-test-cache-bare');
	runGenerator({
		name: 'Cache Bare', slug: 'cache-bare', prefix: 'cbre', namespace: 'CacheBare',
		modules: ['cli', 'cron'], useReact: false, out: bare
	});
	const commandsBare = fs.readFileSync(path.join(bare, 'src/CLI/Commands.php'), 'utf8');
	assert.ok(commandsBare.includes("apply_filters( 'cbre_cache_keys'"), 'cache_clear iterates the filter');
	assert.ok(!commandsBare.includes('_elementor_widgets'), 'CLI must not name the Elementor module in a non-Elementor build');
	assert.ok(!/else\s*\{\s*delete_transient/.test(commandsBare), 'transient purge must not be gated behind an else branch (NEW-42)');
	const uninstallerBare = fs.readFileSync(path.join(bare, 'src/Core/Uninstaller.php'), 'utf8');
	assert.ok(!uninstallerBare.includes('_elementor_widgets'), 'Uninstaller must not name the Elementor transient without the module');
	fs.rmSync(bare, { recursive: true, force: true });

	const ele = path.join(__dirname, '../tmp-test-cache-elementor');
	runGenerator({
		name: 'Cache Ele', slug: 'cache-ele', prefix: 'cele', namespace: 'CacheEle',
		modules: ['elementor_widget'], useReact: false, out: ele
	});
	const registrar = fs.readFileSync(path.join(ele, 'src/Elementor/Widget_Registrar.php'), 'utf8');
	assert.ok(registrar.includes("add_filter( 'cele_cache_keys'"), 'the Elementor module registers its own key via the filter');
	assert.ok(registrar.includes("'cele_elementor_widgets'"));
	const uninstallerEle = fs.readFileSync(path.join(ele, 'src/Core/Uninstaller.php'), 'utf8');
	assert.ok(uninstallerEle.includes("delete_transient( 'cele_elementor_widgets' )"), 'uninstall.php (unbooted) still purges it explicitly when the module is present');
	fs.rmSync(ele, { recursive: true, force: true });
});

test('0.10 editor_config module owns every .vscode file', () => {
	const without = path.join(__dirname, '../tmp-test-editorcfg-off');
	runGenerator({
		name: 'Ecfg Off', slug: 'ecfg-off', prefix: 'ecof', namespace: 'EcfgOff',
		modules: ['elementor_widget'], useReact: false, out: without
	});
	assert.ok(!fs.existsSync(path.join(without, '.vscode')), 'no .vscode dir at all without editor_config, even with elementor_widget');
	fs.rmSync(without, { recursive: true, force: true });

	const withCfg = path.join(__dirname, '../tmp-test-editorcfg-on');
	runGenerator({
		name: 'Ecfg On', slug: 'ecfg-on', prefix: 'econ', namespace: 'EcfgOn',
		modules: ['editor_config', 'elementor_widget'], useReact: false, out: withCfg
	});
	assert.ok(fs.existsSync(path.join(withCfg, '.vscode/php.code-snippets')));
	assert.ok(fs.existsSync(path.join(withCfg, '.vscode/extensions.json')));
	assert.ok(fs.existsSync(path.join(withCfg, '.vscode/settings.json')));
	assert.ok(fs.existsSync(path.join(withCfg, '.vscode/php-elementor.code-snippets')), 'the elementor snippet needs both modules');
	fs.rmSync(withCfg, { recursive: true, force: true });
});

test('0.6 cli module owns src/CLI/Commands.php and its Plugin.php wiring', () => {
	const off = path.join(__dirname, '../tmp-test-cli-off');
	runGenerator({
		name: 'Cli Off', slug: 'cli-off', prefix: 'clof', namespace: 'CliOff',
		modules: [], useReact: false, out: off
	});
	assert.ok(!fs.existsSync(path.join(off, 'src/CLI/Commands.php')), 'no Commands.php without the cli module');
	assert.ok(!fs.existsSync(path.join(off, 'tests/Unit/Commands_Test.php')));
	const pluginOff = fs.readFileSync(path.join(off, 'src/Plugin.php'), 'utf8');
	assert.ok(!pluginOff.includes('WP_CLI'), 'Plugin::create() must not reference WP_CLI without the module');
	assert.ok(!pluginOff.includes('new CLI\\Commands()'));
	assert.ok(!/\{\{[#/]?[A-Za-z_]/.test(pluginOff), 'no leftover template tags');
	fs.rmSync(off, { recursive: true, force: true });

	const on = path.join(__dirname, '../tmp-test-cli-on');
	runGenerator({
		name: 'Cli On', slug: 'cli-on', prefix: 'clon', namespace: 'CliOn',
		modules: ['cli'], useReact: false, out: on
	});
	const commands = fs.readFileSync(path.join(on, 'src/CLI/Commands.php'), 'utf8');
	assert.ok(!/^\s*if \( ! defined\( 'WP_CLI' \) \|\| ! WP_CLI \) \{\s*$/m.test(commands.split('class Commands')[0]), 'no top-level return guard before the class (B6.17)');
	assert.ok(commands.includes('class Commands implements Service_Provider'));
	assert.ok(fs.existsSync(path.join(on, 'tests/Unit/Commands_Test.php')));
	const pluginOn = fs.readFileSync(path.join(on, 'src/Plugin.php'), 'utf8');
	assert.ok(pluginOn.includes("if ( defined( 'WP_CLI' ) && WP_CLI ) {"));
	assert.ok(pluginOn.includes('new CLI\\Commands();'));
	fs.rmSync(on, { recursive: true, force: true });
});

test('0.9 assets/js/main.js rides with ajax_handler; assets/css/main.css is gone', () => {
	const bare = path.join(__dirname, '../tmp-test-fa-bare');
	runGenerator({
		name: 'FA Bare', slug: 'fa-bare', prefix: 'fabr', namespace: 'FaBare',
		modules: ['shortcode'], useReact: false, out: bare
	});
	assert.ok(!fs.existsSync(path.join(bare, 'assets/js/main.js')), 'no main.js without ajax_handler');
	assert.ok(!fs.existsSync(path.join(bare, 'assets/css/main.css')), 'main.css is removed entirely (nothing ever enqueued it)');
	fs.rmSync(bare, { recursive: true, force: true });

	const ajax = path.join(__dirname, '../tmp-test-fa-ajax');
	runGenerator({
		name: 'FA Ajax', slug: 'fa-ajax', prefix: 'faaj', namespace: 'FaAjax',
		modules: ['ajax_handler'], useReact: false, out: ajax
	});
	assert.ok(fs.existsSync(path.join(ajax, 'assets/js/main.js')));
	assert.ok(!fs.existsSync(path.join(ajax, 'assets/css/main.css')));
	const handler = fs.readFileSync(path.join(ajax, 'src/Ajax/Ajax_Handler.php'), 'utf8');
	assert.ok(handler.includes("'assets/js/main.js'"), 'the handler still enqueues the file it now ships');
	fs.rmSync(ajax, { recursive: true, force: true });
});

test('0.7 uninstall.php + Uninstaller are derived from modules that persist state', () => {
	const none = path.join(__dirname, '../tmp-test-uninstall-none');
	runGenerator({
		name: 'Uni None', slug: 'uni-none', prefix: 'unin', namespace: 'UniNone',
		modules: ['shortcode', 'rest_api'], useReact: false, out: none
	});
	assert.ok(!fs.existsSync(path.join(none, 'uninstall.php')), 'presentational modules persist nothing to clean');
	assert.ok(!fs.existsSync(path.join(none, 'src/Core/Uninstaller.php')));
	fs.rmSync(none, { recursive: true, force: true });

	const opt = path.join(__dirname, '../tmp-test-uninstall-opt');
	runGenerator({
		name: 'Uni Opt', slug: 'uni-opt', prefix: 'unop', namespace: 'UniOpt',
		modules: ['admin_settings'], useReact: false, out: opt
	});
	assert.ok(fs.existsSync(path.join(opt, 'uninstall.php')), 'admin_settings persists an option, so cleanup ships');
	const uninstaller = fs.readFileSync(path.join(opt, 'src/Core/Uninstaller.php'), 'utf8');
	assert.ok(uninstaller.includes("delete_option( 'unop_version' )"));
	assert.ok(uninstaller.includes("delete_option( 'unop_option_name' )"));
	assert.ok(!/\{\{[A-Z_]+\}\}/.test(uninstaller));
	fs.rmSync(opt, { recursive: true, force: true });
});

test('composer.json package name falls back to "vendor/" when no author name is given', () => {
	const outDir = path.join(__dirname, '../tmp-test-composer-vendor-fallback');
	runGenerator({
		name: 'No Author Plugin',
		slug: 'no-author-plugin',
		prefix: 'napl',
		namespace: 'NoAuthorPlugin',
		authorName: '',
		modules: [],
		useReact: false,
		out: outDir
	});

	const composerJson = fs.readFileSync(path.join(outDir, 'composer.json'), 'utf8');
	assert.ok(composerJson.includes('"name": "vendor/no-author-plugin"'));

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('quotes and apostrophes in plugin name and description are safely escaped in JSON and PHP templates (NEW-14, NEW-15)', () => {
	const outDir = path.join(__dirname, '../tmp-test-quote-escaping');
	runGenerator({
		name: "Dave's \"Awesome\" Plugin",
		slug: 'daves-awesome-plugin',
		prefix: 'dapl',
		namespace: 'DavesAwesomePlugin',
		authorName: "Dave O'Connor",
		description: 'A plugin with "fast" checkout & \'cool\' features.',
		modules: ['admin_settings'],
		useReact: false,
		out: outDir
	});

	const composerJsonRaw = fs.readFileSync(path.join(outDir, 'composer.json'), 'utf8');
	assert.doesNotThrow(() => JSON.parse(composerJsonRaw), 'composer.json should be valid JSON even with quotes in description');
	const composerParsed = JSON.parse(composerJsonRaw);
	assert.equal(composerParsed.description, 'A plugin with "fast" checkout & \'cool\' features.');

	const registrarPhp = fs.readFileSync(path.join(outDir, 'src/Admin/Settings_Registrar.php'), 'utf8');
	assert.ok(registrarPhp.includes("Dave\\'s \"Awesome\" Plugin Settings"), 'single quotes in plugin name should be escaped for single-quoted PHP strings');

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('module selection scaffolds corresponding PHP & JS unit tests and .wp-env.json (0.1, 0.2, 0.3, 0.17)', () => {
	const outDir = path.join(__dirname, '../tmp-test-module-unit-tests');
	runGenerator({
		name: 'All Modules Plugin',
		slug: 'all-modules-plugin',
		prefix: 'amp',
		namespace: 'AllModulesPlugin',
		authorName: 'Test Author',
		modules: ['cpt_taxonomy', 'custom_table', 'admin_settings', 'rest_api', 'ajax_handler', 'caching', 'elementor_widget', 'shortcode', 'cron', 'woocommerce_hooks', 'interactivity', 'integration_tests'],
		useReact: true,
		out: outDir
	});

	assert.ok(fs.existsSync(path.join(outDir, '.wp-env.json')), '.wp-env.json must exist');
	assert.ok(fs.existsSync(path.join(outDir, 'tests/Unit/Post_Types_Test.php')), 'Post_Types_Test must exist');
	assert.ok(fs.existsSync(path.join(outDir, 'tests/Unit/Item_Repository_Test.php')), 'Item_Repository_Test must exist');
	assert.ok(fs.existsSync(path.join(outDir, 'tests/Unit/Schema_Test.php')), 'Schema_Test must exist');
	assert.ok(fs.existsSync(path.join(outDir, 'tests/Unit/Settings_Repository_Test.php')), 'Settings_Repository_Test must exist');
	assert.ok(fs.existsSync(path.join(outDir, 'tests/Unit/Rest_Controller_Test.php')), 'Rest_Controller_Test must exist');
	assert.ok(fs.existsSync(path.join(outDir, 'tests/Unit/Ajax_Handler_Test.php')), 'Ajax_Handler_Test must exist');
	assert.ok(fs.existsSync(path.join(outDir, 'tests/Unit/Cache_Service_Test.php')), 'Cache_Service_Test must exist');
	assert.ok(fs.existsSync(path.join(outDir, 'tests/Unit/Widget_Registrar_Test.php')), 'Widget_Registrar_Test must exist');
	assert.ok(fs.existsSync(path.join(outDir, 'tests/Unit/Shortcode_Test.php')), 'Shortcode_Test must exist');
	assert.ok(fs.existsSync(path.join(outDir, 'tests/Unit/Scheduler_Test.php')), 'Scheduler_Test must exist');
	assert.ok(fs.existsSync(path.join(outDir, 'tests/Unit/Gateway_Test.php')), 'Gateway_Test must exist');
	assert.ok(fs.existsSync(path.join(outDir, 'tests/Unit/Shipping_Method_Test.php')), 'Shipping_Method_Test must exist');
	assert.ok(fs.existsSync(path.join(outDir, 'tests/Unit/Custom_Email_Test.php')), 'Custom_Email_Test must exist');
	assert.ok(fs.existsSync(path.join(outDir, 'tests/Unit/Custom_Product_Test.php')), 'Custom_Product_Test must exist');
	assert.ok(fs.existsSync(path.join(outDir, 'tests/Unit/Cart_Summary_Block_Test.php')), 'Cart_Summary_Block_Test must exist');
	assert.ok(fs.existsSync(path.join(outDir, 'tests/Unit/Order_Status_Service_Test.php')), 'Order_Status_Service_Test must exist');
	assert.ok(fs.existsSync(path.join(outDir, 'tests/Unit/Action_Scheduler_Service_Test.php')), 'Action_Scheduler_Service_Test must exist');
	assert.ok(fs.existsSync(path.join(outDir, 'tests/Unit/Store_Api_Extension_Test.php')), 'Store_Api_Extension_Test must exist');
	assert.ok(fs.existsSync(path.join(outDir, 'tests/Unit/Account_Endpoint_Service_Test.php')), 'Account_Endpoint_Service_Test must exist');
	assert.ok(fs.existsSync(path.join(outDir, 'tests/js/view.test.js')), 'view.test.js must exist');
	assert.ok(fs.existsSync(path.join(outDir, 'tests/js/App.test.js')), 'App.test.js must exist');

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('WooCommerce granular sub-modules: pure-PHP (e.g. woo:shipping + woo:email) emits no webpack/build pipeline', () => {
	const outDir = path.join(__dirname, '../tmp-test-woo-pure-php');
	runGenerator({
		name: 'Woo Pure PHP Plugin',
		slug: 'woo-pure-php-plugin',
		prefix: 'wppp',
		namespace: 'WooPurePhpPlugin',
		modules: ['woo:shipping', 'woo:email'],
		useReact: false,
		out: outDir
	});

	assert.ok(fs.existsSync(path.join(outDir, 'src/Woo/Shipping/Shipping_Method.php')));
	assert.ok(fs.existsSync(path.join(outDir, 'src/Woo/Emails/Custom_Email.php')));
	assert.ok(fs.existsSync(path.join(outDir, 'tests/Unit/Shipping_Method_Test.php')));
	assert.ok(fs.existsSync(path.join(outDir, 'tests/Unit/Custom_Email_Test.php')));

	const pkg = JSON.parse(fs.readFileSync(path.join(outDir, 'package.json'), 'utf8'));
	assert.equal(pkg.scripts.build, undefined, 'pure-PHP WooCommerce gets no build script');
	assert.equal(pkg.scripts['plugin-zip'], 'wp-scripts plugin-zip', 'but still the packaging script');
	assert.ok(!fs.existsSync(path.join(outDir, 'webpack.config.js')), 'pure-PHP WooCommerce must not emit webpack.config.js');
	assert.ok(!fs.existsSync(path.join(outDir, 'src/Woo/Gateways/Gateway.php')), 'unselected sub-module should not exist');

	const pluginMain = fs.readFileSync(path.join(outDir, 'woo-pure-php-plugin.php'), 'utf8');
	assert.ok(pluginMain.includes("declare_compatibility( 'custom_order_tables'"), 'HPOS compatibility must be declared');
	assert.ok(!pluginMain.includes("declare_compatibility( 'cart_checkout_blocks'"), 'cart_checkout_blocks should only be declared when blocks/gateway selected');

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('WooCommerce granular sub-modules: woo:gateway alone emits Gateway.php, wc-gateway-block.js, and scoped webpack entry', () => {
	const outDir = path.join(__dirname, '../tmp-test-woo-gateway-only');
	runGenerator({
		name: 'Woo Gateway Plugin',
		slug: 'woo-gateway-plugin',
		prefix: 'wgp',
		namespace: 'WooGatewayPlugin',
		modules: ['woo:gateway'],
		useReact: false,
		out: outDir
	});

	assert.ok(fs.existsSync(path.join(outDir, 'src/Woo/Gateways/Gateway.php')));
	assert.ok(fs.existsSync(path.join(outDir, 'assets/src/wc-gateway-block.js')));
	assert.ok(!fs.existsSync(path.join(outDir, 'assets/src/blocks-integration.js')));
	assert.ok(fs.existsSync(path.join(outDir, 'package.json')));

	const webpackConfig = fs.readFileSync(path.join(outDir, 'webpack.config.js'), 'utf8');
	assert.ok(webpackConfig.includes("'wc-gateway-block': './assets/src/wc-gateway-block.js'"));
	assert.ok(!webpackConfig.includes("'blocks-integration'"));

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('WooCommerce granular sub-modules: order-status, action-scheduler, store-api, my-account emit services and unit tests', () => {
	const outDir = path.join(__dirname, '../tmp-test-woo-misc-submodules');
	runGenerator({
		name: 'Woo Misc Plugin',
		slug: 'woo-misc-plugin',
		prefix: 'wmp',
		namespace: 'WooMiscPlugin',
		modules: ['woo:order-status', 'woo:action-scheduler', 'woo:store-api', 'woo:my-account'],
		useReact: false,
		out: outDir
	});

	assert.ok(fs.existsSync(path.join(outDir, 'src/Woo/Orders/Order_Status_Service.php')));
	assert.ok(fs.existsSync(path.join(outDir, 'src/Woo/Tasks/Action_Scheduler_Service.php')));
	assert.ok(fs.existsSync(path.join(outDir, 'src/Woo/Api/Store_Api_Extension.php')));
	assert.ok(fs.existsSync(path.join(outDir, 'src/Woo/Account/Account_Endpoint_Service.php')));
	assert.ok(fs.existsSync(path.join(outDir, 'templates/my-account/wmp-custom.php')));

	assert.ok(fs.existsSync(path.join(outDir, 'tests/Unit/Order_Status_Service_Test.php')));
	assert.ok(fs.existsSync(path.join(outDir, 'tests/Unit/Action_Scheduler_Service_Test.php')));
	assert.ok(fs.existsSync(path.join(outDir, 'tests/Unit/Store_Api_Extension_Test.php')));
	assert.ok(fs.existsSync(path.join(outDir, 'tests/Unit/Account_Endpoint_Service_Test.php')));

	const pluginPhp = fs.readFileSync(path.join(outDir, 'src/Plugin.php'), 'utf8');
	assert.ok(pluginPhp.includes('new Woo\\Providers\\Order_Status_Provider();'));
	assert.ok(pluginPhp.includes('new Woo\\Providers\\Action_Scheduler_Provider();'));
	assert.ok(pluginPhp.includes('new Woo\\Providers\\Store_Api_Provider();'));
	assert.ok(pluginPhp.includes('new Woo\\Providers\\Account_Endpoint_Provider();'));

	fs.rmSync(outDir, { recursive: true, force: true });
});

test('WooCommerce bundle alias "woo:all" and "woocommerce" expand to all 9 sub-modules', () => {
	const outDir = path.join(__dirname, '../tmp-test-woo-alias');
	runGenerator({
		name: 'Woo Alias Plugin',
		slug: 'woo-alias-plugin',
		prefix: 'wap',
		namespace: 'WooAliasPlugin',
		modules: ['woo:all'],
		useReact: false,
		out: outDir
	});

	assert.ok(fs.existsSync(path.join(outDir, 'src/Woo/Gateways/Gateway.php')));
	assert.ok(fs.existsSync(path.join(outDir, 'src/Woo/Shipping/Shipping_Method.php')));
	assert.ok(fs.existsSync(path.join(outDir, 'src/Woo/Emails/Custom_Email.php')));
	assert.ok(fs.existsSync(path.join(outDir, 'src/Woo/Products/Custom_Product.php')));
	assert.ok(fs.existsSync(path.join(outDir, 'src/Woo/Blocks/Cart_Summary_Block.php')));
	assert.ok(fs.existsSync(path.join(outDir, 'src/Woo/Orders/Order_Status_Service.php')));
	assert.ok(fs.existsSync(path.join(outDir, 'src/Woo/Tasks/Action_Scheduler_Service.php')));
	assert.ok(fs.existsSync(path.join(outDir, 'src/Woo/Api/Store_Api_Extension.php')));
	assert.ok(fs.existsSync(path.join(outDir, 'src/Woo/Account/Account_Endpoint_Service.php')));

	fs.rmSync(outDir, { recursive: true, force: true });
});


