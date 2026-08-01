#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseArgs } from 'node:util';
import prompts from 'prompts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function slugify(text) {
	if (!text) return '';
	return text
		.toString()
		.toLowerCase()
		.trim()
		.replace(/_/g, '-')
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9\-]+/g, '')
		.replace(/\-\-+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export function suggestNamespace(name) {
	if (!name || typeof name !== 'string') return 'MyPlugin';
	const fillers = new Set(['for', 'the', 'and', 'of', 'to', 'a', 'in', 'on', 'with', 'by', 'an', 'or', 'at', 'from', 'is']);
	const rawWords = name.trim().split(/[\s-_]+/).filter(Boolean);
	if (rawWords.length === 0) return 'MyPlugin';
	const filtered = rawWords.filter(w => !fillers.has(w.toLowerCase()));
	const words = filtered.length > 0 ? filtered : rawWords;
	const studly = words
		.map(w => w.replace(/[^A-Za-z0-9_]/g, ''))
		.filter(Boolean)
		.map(w => w.charAt(0).toUpperCase() + w.slice(1))
		.join('');
	return studly || 'MyPlugin';
}

export function suggestPrefix(name) {
	if (!name) return 'myplug';
	const fillers = new Set(['for', 'the', 'and', 'of', 'to', 'a', 'in', 'on', 'with', 'by', 'an', 'or', 'at', 'from', 'is']);
	const words = name.trim().split(/[\s-_]+/).filter(Boolean);
	if (words.length === 0) return 'myplug';

	const filtered = words.filter(w => !fillers.has(w.toLowerCase()));
	const targetWords = filtered.length > 0 ? filtered : words;
	if (targetWords.length === 1) return targetWords[0].toLowerCase();

	return targetWords.map(w => w.charAt(0).toLowerCase()).join('');
}

export function validateName(val) {
	if (!val || typeof val !== 'string' || val.trim().length === 0) {
		return 'Plugin name is required.';
	}
	return true;
}

export function validateSlug(val) {
	if (!val || typeof val !== 'string' || val.trim().length === 0) {
		return 'Plugin slug is required.';
	}
	const processed = slugify(val);
	if (processed !== val || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(val)) {
		return 'Plugin slug must be lowercase alphanumeric characters separated by single hyphens (e.g. my-plugin).';
	}
	return true;
}

export function validatePrefix(val) {
	if (!val || typeof val !== 'string' || val.trim().length === 0) {
		return 'Function/constant prefix is required.';
	}
	if (val.includes('-')) {
		return 'Prefix cannot contain hyphens because hyphens are invalid in PHP function names and constants.';
	}
	if (val.length < 2 || val.length > 20) {
		return 'Prefix must be between 2 and 20 characters.';
	}
	if (!/^[a-z][a-z0-9_]*$/.test(val)) {
		return 'Prefix must start with a lowercase letter and contain only lowercase letters, numbers, and underscores.';
	}
	return true;
}

export function validateNamespace(val) {
	if (!val || typeof val !== 'string' || val.trim().length === 0) {
		return 'PHP namespace is required.';
	}
	if (val.includes('\\')) {
		return 'Namespace must be a single segment without backslashes (nested namespaces are not allowed).';
	}
	if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(val)) {
		return 'Namespace must start with a letter or underscore and contain only ASCII letters, numbers, and underscores.';
	}
	return true;
}

export function validateEmail(val) {
	if (val === undefined || val === null || val === '') return true;
	if (typeof val === 'string' && val.trim().length > 0) {
		if (!val.includes('@')) {
			return 'Author email must contain "@".';
		}
	}
	return true;
}

export function validateMinPhp(val) {
	if (!val || typeof val !== 'string' || val.trim().length === 0) {
		return 'Minimum PHP version is required.';
	}
	if (!/^\d+\.\d+$/.test(val.trim())) {
		return 'Minimum PHP version must be in format X.Y (e.g. 8.0).';
	}
	return true;
}

export function validateOutputDir(val) {
	if (!val || typeof val !== 'string' || val.trim().length === 0) {
		return 'Output directory is required.';
	}
	if (val.includes('..')) {
		return 'Output directory cannot contain "..".';
	}
	const cwd = process.cwd();
	const resolved = path.resolve(cwd, val);
	const relative = path.relative(cwd, resolved);
	if (relative.startsWith('..') || path.isAbsolute(relative)) {
		return 'Output directory must be inside the current working directory.';
	}
	return true;
}

export function validateAll(answers) {
	const checks = [
		{ field: 'name', result: validateName(answers.name) },
		{ field: 'slug', result: validateSlug(answers.slug) },
		{ field: 'namespace', result: validateNamespace(answers.namespace) },
		{ field: 'prefix', result: validatePrefix(answers.prefix) },
		{ field: 'email', result: validateEmail(answers.authorEmail) },
		{ field: 'minPhp', result: validateMinPhp(answers.minPhp) },
		{ field: 'outputDir', result: validateOutputDir(answers.outputDir) }
	];

	for (const check of checks) {
		if (check.result !== true) {
			return check.result;
		}
	}
	return true;
}

function parseCLIArgs() {
	const options = {
		help: { type: 'boolean', short: 'h' },
		version: { type: 'boolean', short: 'v' },
		yes: { type: 'boolean', short: 'y' },
		name: { type: 'string' },
		slug: { type: 'string' },
		namespace: { type: 'string' },
		prefix: { type: 'string' },
		author: { type: 'string' },
		email: { type: 'string' },
		'author-uri': { type: 'string' },
		description: { type: 'string' },
		'min-php': { type: 'string' },
		out: { type: 'string' },
		modules: { type: 'string' },
		react: { type: 'boolean' },
		'no-react': { type: 'boolean' }
	};

	try {
		const parsed = parseArgs({ options, allowPositionals: true });
		return parsed.values;
	} catch (err) {
		console.error(`❌ Invalid argument: ${err.message}`);
		process.exit(1);
	}
}

function showHelp() {
	console.log(`
Usage: create-wp-plugin [options]

Options:
  -h, --help               Show help text
  -v, --version            Show version number
  -y, --yes                Skip interactive prompts and generate plugin non-interactively
  --name <string>          Plugin name
  --slug <string>          Plugin slug
  --namespace <string>     PHP namespace
  --prefix <string>        Function/constant prefix
  --author <string>        Author name
  --email <string>         Author email
  --author-uri <string>    Author URI / GitHub URL
  --description <string>   Plugin description
  --min-php <string>       Minimum PHP version
  --out <string>           Output directory
  --modules <string>       Comma-separated list of modules (admin_settings,shortcode,rest_api,ajax_handler,cpt_taxonomy,cron,elementor_widget,woocommerce_hooks)
  --react                  Include React asset build pipeline
  --no-react               Do not include React asset build pipeline
`);
}

function showVersion() {
	const pkgPath = path.join(__dirname, 'package.json');
	const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
	console.log(pkg.version);
}

function parseModules(modulesStr) {
	if (modulesStr === undefined || modulesStr === null) return [];
	if (modulesStr.trim() === '') return [];
	return modulesStr.split(',').map(m => m.trim()).filter(Boolean);
}

async function main() {
	const flags = parseCLIArgs();

	if (flags.help) {
		showHelp();
		process.exit(0);
	}

	if (flags.version) {
		showVersion();
		process.exit(0);
	}

	let answers;

	if (flags.yes) {
		if (!flags.name) {
			console.error('❌ Error: --name is required when --yes is set.');
			process.exit(1);
		}
		if (!flags.out) {
			console.error('❌ Error: --out is required when --yes is set.');
			process.exit(1);
		}

		const name = flags.name;
		const slug = flags.slug || slugify(name);
		const namespace = flags.namespace || suggestNamespace(name);
		const prefix = flags.prefix || suggestPrefix(name);
		const authorName = flags.author || '';
		const authorEmail = flags.email || '';
		const authorUri = flags['author-uri'] || '';
		const description = flags.description || 'A powerful modern WordPress plugin scaffold.';
		const minPhp = flags['min-php'] || '8.0';
		const useReact = flags.react ? true : (flags['no-react'] ? false : false);
		const modules = flags.modules !== undefined ? parseModules(flags.modules) : [];
		const outputDir = flags.out;

		answers = {
			name,
			slug,
			namespace,
			prefix,
			authorName,
			authorEmail,
			authorUri,
			description,
			minPhp,
			useReact,
			modules,
			outputDir
		};

		const valid = validateAll(answers);
		if (valid !== true) {
			console.error(`❌ Validation error: ${valid}`);
			process.exit(1);
		}
	} else {
		console.log('\n🚀 Welcome to create-wp-plugin scaffold generator!\n');

		const initialModules = flags.modules !== undefined ? parseModules(flags.modules) : [];

		const choices = [
			{ title: 'admin settings page', value: 'admin_settings' },
			{ title: 'shortcode', value: 'shortcode' },
			{ title: 'REST API', value: 'rest_api' },
			{ title: 'AJAX handler', value: 'ajax_handler' },
			{ title: 'CPT + taxonomy', value: 'cpt_taxonomy' },
			{ title: 'cron', value: 'cron' },
			{ title: 'Elementor widget base', value: 'elementor_widget' },
			{ title: 'WooCommerce hooks', value: 'woocommerce_hooks' }
		].map(c => ({
			...c,
			selected: initialModules.includes(c.value)
		}));

		const questions = [
			{
				type: 'text',
				name: 'name',
				message: '1. Plugin name:',
				initial: flags.name || '',
				validate: validateName
			},
			{
				type: 'text',
				name: 'slug',
				message: '2. Plugin slug:',
				initial: flags.slug || ((prev, values) => slugify(values.name)),
				validate: validateSlug
			},
			{
				type: 'text',
				name: 'namespace',
				message: '3. PHP namespace:',
				initial: flags.namespace || ((prev, values) => suggestNamespace(values.name)),
				validate: validateNamespace
			},
			{
				type: 'text',
				name: 'prefix',
				message: '4. Function/constant prefix:',
				initial: flags.prefix || ((prev, values) => suggestPrefix(values.name)),
				validate: validatePrefix
			},
			{
				type: 'text',
				name: 'authorName',
				message: '5. Author name:',
				initial: flags.author || ''
			},
			{
				type: 'text',
				name: 'authorEmail',
				message: '6. Author email:',
				initial: flags.email || '',
				validate: validateEmail
			},
			{
				type: 'text',
				name: 'authorUri',
				message: '7. Author URI / GitHub URL:',
				initial: flags['author-uri'] || ''
			},
			{
				type: 'text',
				name: 'description',
				message: '8. Description (one line):',
				initial: flags.description || 'A powerful modern WordPress plugin scaffold.'
			},
			{
				type: 'text',
				name: 'minPhp',
				message: '9. Minimum PHP version:',
				initial: flags['min-php'] || '8.0',
				validate: validateMinPhp
			},
			{
				type: 'confirm',
				name: 'useReact',
				message: '10. Use React / Gutenberg build?',
				initial: flags.react ? true : (flags['no-react'] ? false : false)
			},
			{
				type: 'multiselect',
				name: 'modules',
				message: '11. Modules to include (multi-select, space to toggle):',
				choices,
				hint: '- Space to select. Return to submit'
			},
			{
				type: 'text',
				name: 'outputDir',
				message: '12. Output directory:',
				initial: flags.out || ((prev, values) => `./${values.slug}`),
				validate: validateOutputDir
			}
		];

		answers = await prompts(questions, {
			onCancel: () => {
				console.log('\nOperation cancelled.');
				process.exit(1);
			}
		});

		if (!answers.name) {
			console.log('\nOperation cancelled.');
			process.exit(1);
		}

		console.log('\nSummary:');
		console.log(`  Name:      ${answers.name}`);
		console.log(`  Slug:      ${answers.slug}`);
		console.log(`  Namespace: ${answers.namespace}`);
		console.log(`  Prefix:    ${answers.prefix}`);
		console.log(`  Author:    ${answers.authorName || '(none)'}`);
		console.log('');

		const confirm = await prompts({
			type: 'confirm',
			name: 'value',
			message: 'Proceed with these values?',
			initial: true
		}, {
			onCancel: () => {
				console.log('\nOperation cancelled.');
				process.exit(1);
			}
		});

		if (!confirm.value) {
			console.log('\nOperation cancelled.');
			process.exit(0);
		}
	}

	const targetDir = path.resolve(process.cwd(), answers.outputDir);

	if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
		console.error(`\n❌ Error: Directory "${answers.outputDir}" already exists and is not empty.`);
		process.exit(1);
	}

	fs.mkdirSync(targetDir, { recursive: true });

	const selectedModules = answers.modules || [];

	const requiredPlugins = [];
	if (selectedModules.includes('elementor_widget')) requiredPlugins.push('elementor');
	if (selectedModules.includes('woocommerce_hooks')) requiredPlugins.push('woocommerce');

	let pluginHeaderExtra = '';
	if (requiredPlugins.length > 0) {
		pluginHeaderExtra += ` * Requires Plugins: ${requiredPlugins.join(', ')}\n`;
	}
	if (selectedModules.includes('elementor_widget')) {
		pluginHeaderExtra += ' * Elementor tested up to: 3.27.0\n * Elementor Pro tested up to: 3.27.0\n';
	}

	const woocommerceHpos = selectedModules.includes('woocommerce_hooks')
		? `add_action(
	'before_woocommerce_init',
	function () {
		if ( class_exists( \\Automattic\\WooCommerce\\Utilities\\FeaturesUtil::class ) ) {
			\\Automattic\\WooCommerce\\Utilities\\FeaturesUtil::declare_compatibility( 'custom_order_tables', ${answers.prefix.toUpperCase()}_FILE, true );
		}
	}
);\n\n`
		: '';

	const replacements = {
		'{{PLUGIN_NAME}}': answers.name,
		'{{SLUG}}': answers.slug,
		'{{NS}}': answers.namespace,
		'{{NS_ESCAPED}}': answers.namespace.replace(/\\/g, '\\\\'),
		'{{PREFIX}}': answers.prefix.toLowerCase(),
		'{{PREFIX_UPPER}}': answers.prefix.toUpperCase(),
		'{{AUTHOR}}': answers.authorName,
		'{{AUTHOR_EMAIL}}': answers.authorEmail || 'author@example.com',
		'{{AUTHOR_URI}}': answers.authorUri,
		'{{DESCRIPTION}}': answers.description,
		'{{MIN_PHP}}': answers.minPhp,
		'{{YEAR}}': new Date().getFullYear().toString(),
		'{{PLUGIN_HEADER_EXTRA}}': pluginHeaderExtra,
		'{{WOOCOMMERCE_HPOS}}': woocommerceHpos
	};

	function processTemplateContent(content) {
		let result = content;
		for (const [key, val] of Object.entries(replacements)) {
			result = result.replaceAll(key, () => val);
		}
		return result;
	}

	function writeTemplateFile(srcPath, destRelativePath) {
		const raw = fs.readFileSync(srcPath, 'utf8');
		let processed = processTemplateContent(raw);
		if (destRelativePath === 'phpcs.xml') {
			const prefixLower = answers.prefix.toLowerCase();
			const prefixUpper = answers.prefix.toUpperCase();
			processed = processed.replace(
				`<element value="${prefixLower}"/>`,
				() => `<element value="${prefixLower}"/>\n\t\t\t\t<element value="${prefixLower}_"/>`
			);
			processed = processed.replace(
				`<element value="${prefixUpper}"/>`,
				() => `<element value="${prefixUpper}"/>\n\t\t\t\t<element value="${prefixUpper}_"/>`
			);
			processed = processed.replace(
				'<rule ref="WordPress-VIP-Go"/>',
				() => '<rule ref="WordPress-VIP-Go">\n\t\t<exclude name="WordPressVIPMinimum.Security.Mustache.OutputNotation"/>\n\t</rule>'
			);
		}
		const destPath = path.join(targetDir, destRelativePath);
		fs.mkdirSync(path.dirname(destPath), { recursive: true });
		fs.writeFileSync(destPath, processed, 'utf8');
	}

	const templatesDir = path.join(__dirname, 'templates');

	// Copy standard templates
	writeTemplateFile(path.join(templatesDir, 'src/Contracts/Registrable.php'), 'src/Contracts/Registrable.php');
	writeTemplateFile(path.join(templatesDir, 'plugin-main.php'), `${answers.slug}.php`);
	writeTemplateFile(path.join(templatesDir, 'composer.json'), 'composer.json');
	writeTemplateFile(path.join(templatesDir, 'phpcs.xml'), 'phpcs.xml');
	writeTemplateFile(path.join(templatesDir, 'src/CLI/Commands.php'), 'src/CLI/Commands.php');
	writeTemplateFile(path.join(templatesDir, 'tests/bootstrap.php'), 'tests/bootstrap.php');
	writeTemplateFile(path.join(templatesDir, 'phpunit.xml.dist'), 'phpunit.xml.dist');
	writeTemplateFile(path.join(templatesDir, 'tests/Unit/Example_Test.php'), 'tests/Unit/Example_Test.php');
	writeTemplateFile(path.join(templatesDir, 'gitignore.tpl'), '.gitignore');
	writeTemplateFile(path.join(templatesDir, 'editorconfig.tpl'), '.editorconfig');
	writeTemplateFile(path.join(templatesDir, 'assets/css/main.css'), 'assets/css/main.css');
	writeTemplateFile(path.join(templatesDir, 'assets/js/main.js'), 'assets/js/main.js');
	writeTemplateFile(path.join(templatesDir, '.vscode/php.code-snippets'), '.vscode/php.code-snippets');
	writeTemplateFile(path.join(templatesDir, '.vscode/extensions.json'), '.vscode/extensions.json');

	// Selected modules mapping
	const moduleRegistrations = [];

	if (selectedModules.includes('admin_settings')) {
		writeTemplateFile(path.join(templatesDir, 'src/Admin/Settings_Page.php'), 'src/Admin/Settings_Page.php');
		moduleRegistrations.push('\n\t\t$services[\'admin_settings\'] = new Admin\\Settings_Page();');
	}
	if (selectedModules.includes('shortcode')) {
		writeTemplateFile(path.join(templatesDir, 'src/Frontend/Shortcode.php'), 'src/Frontend/Shortcode.php');
		moduleRegistrations.push('\n\t\t$services[\'shortcode\'] = new Frontend\\Shortcode();');
	}
	if (selectedModules.includes('rest_api')) {
		writeTemplateFile(path.join(templatesDir, 'src/Rest/Rest_Controller.php'), 'src/Rest/Rest_Controller.php');
		moduleRegistrations.push('\n\t\t$services[\'rest\'] = new Rest\\Rest_Controller();');
	}
	if (selectedModules.includes('ajax_handler')) {
		writeTemplateFile(path.join(templatesDir, 'src/Ajax/Ajax_Handler.php'), 'src/Ajax/Ajax_Handler.php');
		moduleRegistrations.push('\n\t\t$services[\'ajax\'] = new Ajax\\Ajax_Handler();');
	}
	if (selectedModules.includes('cpt_taxonomy')) {
		writeTemplateFile(path.join(templatesDir, 'src/PostTypes/Post_Types.php'), 'src/PostTypes/Post_Types.php');
		moduleRegistrations.push('\n\t\t$services[\'post_types\'] = new PostTypes\\Post_Types();');
	}
	if (selectedModules.includes('cron')) {
		writeTemplateFile(path.join(templatesDir, 'src/Cron/Scheduler.php'), 'src/Cron/Scheduler.php');
		moduleRegistrations.push('\n\t\t$services[\'cron\'] = new Cron\\Scheduler();');
	}
	if (selectedModules.includes('elementor_widget')) {
		writeTemplateFile(path.join(templatesDir, 'src/Widgets/Sample_Widget.php'), 'src/Widgets/Sample_Widget.php');
		writeTemplateFile(path.join(templatesDir, 'assets/css/widgets/sample-widget.css'), 'assets/css/widgets/sample-widget.css');
		writeTemplateFile(path.join(templatesDir, 'assets/js/widgets/sample-widget.js'), 'assets/js/widgets/sample-widget.js');
		moduleRegistrations.push('\n\t\tadd_action( \'wp_enqueue_scripts\', array( $this, \'register_widget_assets\' ) );');
		moduleRegistrations.push('\t\tadd_action( \'elementor/editor/after_enqueue_styles\', array( $this, \'register_widget_assets\' ) );');
		moduleRegistrations.push('\t\tadd_action( \'elementor/widgets/register\', array( $this, \'register_widgets\' ) );');
	}
	if (selectedModules.includes('woocommerce_hooks')) {
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Woo_Hooks.php'), 'src/Woo/Woo_Hooks.php');
		moduleRegistrations.push('\n\t\t$services[\'woo\'] = new Woo\\Woo_Hooks();');
	}

	let elementorWidgetMethods = '';
	if (selectedModules.includes('elementor_widget')) {
		elementorWidgetMethods = `\t/**
\t * Get auto-discovered Elementor widget class names (cached via transient unless SCRIPT_DEBUG is active).
\t *
\t * @return array List of widget class names.
\t */
\tprivate function get_widget_classes(): array {
\t\tif ( ! ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ) {
\t\t\t$cached = get_transient( '{{PREFIX}}_elementor_widgets' );
\t\t\tif ( is_array( $cached ) ) {
\t\t\t\treturn $cached;
\t\t\t}
\t\t}

\t\t$widget_classes = array();
\t\t$files          = glob( __DIR__ . '/Widgets/*.php' ) ?: array(); // phpcs:ignore Universal.Operators.DisallowShortTernary.Found

\t\tforeach ( $files as $file ) {
\t\t\t$class_name = __NAMESPACE__ . '\\\\Widgets\\\\' . basename( $file, '.php' );

\t\t\tif ( ! class_exists( $class_name ) ) {
\t\t\t\tcontinue;
\t\t\t}

\t\t\t$reflection = new \\ReflectionClass( $class_name );

\t\t\tif ( $reflection->isAbstract() || ! $reflection->isSubclassOf( '\\\\Elementor\\\\Widget_Base' ) ) {
\t\t\t\tcontinue;
\t\t\t}

\t\t\t$widget_classes[] = $class_name;
\t\t}

\t\tset_transient( '{{PREFIX}}_elementor_widgets', $widget_classes, DAY_IN_SECONDS );
\t\treturn $widget_classes;
\t}

\t/**
\t * Auto-register per-widget stylesheets and scripts derived by convention from widget class names.
\t *
\t * @return void
\t */
\tpublic function register_widget_assets(): void {
\t\t$widget_classes = $this->get_widget_classes();

\t\tforeach ( $widget_classes as $class_name ) {
\t\t\t$short_name = substr( $class_name, strrpos( $class_name, '\\\\' ) + 1 );
\t\t\t$slug       = strtolower( str_replace( '_', '-', $short_name ) );
\t\t\t$handle     = '{{PREFIX}}-' . $slug;
\t\t\t$css_file   = {{PREFIX_UPPER}}_PATH . 'assets/css/widgets/' . $slug . '.css';
\t\t\t$js_file    = {{PREFIX_UPPER}}_PATH . 'assets/js/widgets/' . $slug . '.js';

\t\t\tif ( file_exists( $css_file ) ) {
\t\t\t\twp_register_style(
\t\t\t\t\t$handle,
\t\t\t\t\t{{PREFIX_UPPER}}_URL . 'assets/css/widgets/' . $slug . '.css',
\t\t\t\t\tarray(),
\t\t\t\t\t{{PREFIX_UPPER}}_VERSION
\t\t\t\t);
\t\t\t}

\t\t\tif ( file_exists( $js_file ) ) {
\t\t\t\twp_register_script(
\t\t\t\t\t$handle,
\t\t\t\t\t{{PREFIX_UPPER}}_URL . 'assets/js/widgets/' . $slug . '.js',
\t\t\t\t\tarray( 'jquery' ),
\t\t\t\t\t{{PREFIX_UPPER}}_VERSION,
\t\t\t\t\ttrue
\t\t\t\t);
\t\t\t}
\t\t}
\t}

\t/**
\t * Auto-register discovered concrete Elementor widget classes.
\t *
\t * @param object $widgets_manager Elementor widgets manager.
\t * @return void
\t */
\tpublic function register_widgets( $widgets_manager ): void {
\t\tif ( ! class_exists( '\\\\Elementor\\\\Widget_Base' ) ) {
\t\t\treturn;
\t\t}

\t\t$widget_classes = $this->get_widget_classes();

\t\tforeach ( $widget_classes as $class_name ) {
\t\t\tif ( class_exists( $class_name ) ) {
\t\t\t\t$widgets_manager->register( new $class_name() );
\t\t\t}
\t\t}
\t}\n\n`;
	}

	// React setup
	let reactAssetsRegistration = '';
	let readmeReactInstall = '';
	let readmeReactScripts = '';
	let ciNodeJob = '';

	if (answers.useReact) {
		writeTemplateFile(path.join(templatesDir, 'react/package.json'), 'package.json');
		writeTemplateFile(path.join(templatesDir, 'react/assets/src/index.js'), 'assets/src/index.js');
		writeTemplateFile(path.join(templatesDir, 'src/Frontend/Assets.php'), 'src/Frontend/Assets.php');
		reactAssetsRegistration = '\n\t\t$services[\'assets\'] = new Frontend\\Assets();\n';
		readmeReactInstall = '3. Run `npm install` and `npm run build` to compile React assets.\n   > Note: `assets/build` is gitignored and generated during build.';
		readmeReactScripts = '- `npm run build` — Build React assets for production.\n- `npm run start` — Start React asset dev server in watch mode.';

		ciNodeJob = `
  node-build:
    name: Build React Assets
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Node Dependencies
        run: npm ci

      - name: Build Assets
        run: npm run build`;
	}

	// Process Plugin.php template with dynamic registrations
	let pluginContent = fs.readFileSync(path.join(templatesDir, 'src/Plugin.php'), 'utf8');
	pluginContent = pluginContent.replace('{{REACT_ASSETS_REGISTRATION}}', () => reactAssetsRegistration);
	pluginContent = pluginContent.replace('{{MODULE_REGISTRATIONS}}', () => moduleRegistrations.length > 0 ? moduleRegistrations.join('\n') + '\n' : '');
	pluginContent = pluginContent.replace('{{ELEMENTOR_WIDGET_METHODS}}', () => elementorWidgetMethods);
	pluginContent = processTemplateContent(pluginContent);
	const pluginDestPath = path.join(targetDir, 'src/Plugin.php');
	fs.mkdirSync(path.dirname(pluginDestPath), { recursive: true });
	fs.writeFileSync(pluginDestPath, pluginContent, 'utf8');

	// Process ci.yml with dynamic node job
	let ciContent = fs.readFileSync(path.join(templatesDir, 'github/workflows/ci.yml'), 'utf8');
	ciContent = ciContent.replace('{{CI_NODE_JOB}}', () => ciNodeJob);
	ciContent = processTemplateContent(ciContent);
	const ciDestPath = path.join(targetDir, '.github/workflows/ci.yml');
	fs.mkdirSync(path.dirname(ciDestPath), { recursive: true });
	fs.writeFileSync(ciDestPath, ciContent, 'utf8');

	// Process Activator.php, Deactivator.php, uninstall.php with dynamic bodies
	const activatorLines = [];
	const deactivatorLines = [];
	const uninstallLines = [];

	if (selectedModules.includes('cpt_taxonomy')) {
		activatorLines.push('\t\t$post_types = new PostTypes\\Post_Types();');
		activatorLines.push('\t\t$post_types->register_cpt_and_taxonomy();');
		activatorLines.push('\t\tflush_rewrite_rules(); // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.flush_rewrite_rules_flush_rewrite_rules');
		deactivatorLines.push('\t\tflush_rewrite_rules(); // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.flush_rewrite_rules_flush_rewrite_rules');
	}

	if (selectedModules.includes('cron')) {
		activatorLines.push('\t\tif ( ! wp_next_scheduled( \'{{PREFIX}}_cron_event\' ) ) {');
		activatorLines.push('\t\t\twp_schedule_event( time(), \'hourly\', \'{{PREFIX}}_cron_event\' );');
		activatorLines.push('\t\t}');
		deactivatorLines.push('\t\twp_clear_scheduled_hook( \'{{PREFIX}}_cron_event\' );');
		uninstallLines.push('\twp_clear_scheduled_hook( \'{{PREFIX}}_cron_event\' );');
	}

	if (selectedModules.includes('elementor_widget')) {
		activatorLines.push('\t\tdelete_transient( \'{{PREFIX}}_elementor_widgets\' );');
	}

	if (selectedModules.includes('admin_settings')) {
		uninstallLines.push('\tdelete_option( \'{{PREFIX}}_option_name\' );');
	}

	const activatorBody = activatorLines.length > 0 ? activatorLines.join('\n') + '\n' : '';
	const deactivatorBody = deactivatorLines.length > 0 ? deactivatorLines.join('\n') + '\n' : '';
	const uninstallBody = uninstallLines.length > 0 ? uninstallLines.join('\n') + '\n' : '';

	let activatorContent = fs.readFileSync(path.join(templatesDir, 'src/Core/Activator.php'), 'utf8');
	activatorContent = activatorContent.replace('{{ACTIVATOR_BODY}}', () => activatorBody);
	activatorContent = processTemplateContent(activatorContent);
	const activatorDestPath = path.join(targetDir, 'src/Core/Activator.php');
	fs.mkdirSync(path.dirname(activatorDestPath), { recursive: true });
	fs.writeFileSync(activatorDestPath, activatorContent, 'utf8');

	let deactivatorContent = fs.readFileSync(path.join(templatesDir, 'src/Core/Deactivator.php'), 'utf8');
	deactivatorContent = deactivatorContent.replace('{{DEACTIVATOR_BODY}}', () => deactivatorBody);
	deactivatorContent = processTemplateContent(deactivatorContent);
	const deactivatorDestPath = path.join(targetDir, 'src/Core/Deactivator.php');
	fs.mkdirSync(path.dirname(deactivatorDestPath), { recursive: true });
	fs.writeFileSync(deactivatorDestPath, deactivatorContent, 'utf8');

	let uninstallContent = fs.readFileSync(path.join(templatesDir, 'uninstall.php'), 'utf8');
	uninstallContent = uninstallContent.replace('{{UNINSTALL_BODY}}', () => uninstallBody);
	uninstallContent = processTemplateContent(uninstallContent);
	const uninstallDestPath = path.join(targetDir, 'uninstall.php');
	fs.writeFileSync(uninstallDestPath, uninstallContent, 'utf8');

	// Process README.md with dynamic React sections
	let readmeContent = fs.readFileSync(path.join(templatesDir, 'README.md'), 'utf8');
	readmeContent = readmeContent.replace('{{README_REACT_INSTALL}}', () => readmeReactInstall);
	readmeContent = readmeContent.replace('{{README_REACT_SCRIPTS}}', () => readmeReactScripts);
	readmeContent = processTemplateContent(readmeContent);
	const readmeDestPath = path.join(targetDir, 'README.md');
	fs.writeFileSync(readmeDestPath, readmeContent, 'utf8');

	console.log(`\n✅ Successfully scaffolded plugin "${answers.name}" in ${answers.outputDir}!\n`);
	console.log('Next steps:');
	console.log(`  cd ${answers.outputDir}`);
	console.log('  composer install');
	if (answers.useReact) {
		console.log('  npm install');
		console.log('  npm run build');
	}
	console.log('  composer lint');
	console.log('  composer test');
	console.log('  git init && git add -A && git commit -m "scaffold"\n');
	console.log('Note: composer install may prompt to allow dealerdirect/phpcodesniffer-composer-installer — answer yes.\n');
}

main().catch(err => {
	console.error('An error occurred:', err);
	process.exit(1);
});
