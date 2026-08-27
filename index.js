#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseArgs } from 'node:util';
import prompts from 'prompts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const MODULE_DEFINITIONS = [
	{ title: 'admin settings page', value: 'admin_settings' },
	{ title: 'shortcode', value: 'shortcode' },
	{ title: 'REST API', value: 'rest_api' },
	{ title: 'AJAX handler', value: 'ajax_handler' },
	{ title: 'CPT + taxonomy', value: 'cpt_taxonomy' },
	{ title: 'cron', value: 'cron' },
	{ title: 'caching layer (object cache + transient fallback)', value: 'caching' },
	{ title: 'custom database table (dbDelta schema + migrations)', value: 'custom_table' },
	{ title: 'Elementor widget base', value: 'elementor_widget' },
	{ title: 'WooCommerce hooks', value: 'woocommerce_hooks' },
	{ title: 'Frontend Interactivity (WordPress Interactivity API)', value: 'interactivity' }
];
export const VALID_MODULES = new Set(MODULE_DEFINITIONS.map(m => m.value));

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
	let ns = studly || 'MyPlugin';
	if (/^[0-9]/.test(ns)) {
		ns = 'Plugin' + ns;
	}
	return ns;
}

export function suggestPrefix(name) {
	if (!name) return 'myplug';
	const fillers = new Set(['for', 'the', 'and', 'of', 'to', 'a', 'in', 'on', 'with', 'by', 'an', 'or', 'at', 'from', 'is']);
	const words = name.trim().split(/[\s-_]+/).filter(Boolean);
	if (words.length === 0) return 'myplug';

	const filtered = words.filter(w => !fillers.has(w.toLowerCase()));
	const targetWords = filtered.length > 0 ? filtered : words;
	let prefix = targetWords.length === 1
		? targetWords[0].toLowerCase()
		: targetWords.map(w => w.charAt(0).toLowerCase()).join('');

	if (prefix.length > 15) {
		prefix = prefix.slice(0, 15);
	}

	// WPCS's PrefixAllGlobals.ShortPrefixPassed sniff flags prefixes under 4
	// characters as a collision risk, so a short suggestion would fail the
	// scaffold's own lint step by default. Pad it out deterministically.
	if (prefix.length < 4) {
		const filler = targetWords[targetWords.length - 1].toLowerCase().replace(/[^a-z0-9]/g, '');
		prefix = (prefix + filler).padEnd(4, 'x').slice(0, Math.max(4, prefix.length));
	}

	return prefix;
}

export function validateName(val) {
	if (!val || typeof val !== 'string' || val.trim().length === 0) {
		return 'Plugin name is required.';
	}
	if (val.trim().length > 100) {
		return 'Plugin name is too long (max 100 characters).';
	}
	return true;
}

export function validateSlug(val) {
	if (!val || typeof val !== 'string' || val.trim().length === 0) {
		return 'Plugin slug is required.';
	}
	const processed = val.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
	if (processed !== val || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(val)) {
		return 'Plugin slug must be lowercase alphanumeric characters separated by single hyphens (e.g. my-plugin).';
	}
	return true;
}

const RESERVED_PREFIXES = new Set(['wp', 'wordpress', 'php', '__']);

export function validatePrefix(val) {
	if (!val || typeof val !== 'string' || val.trim().length === 0) {
		return 'Function/constant prefix is required.';
	}
	if (val.includes('-')) {
		return 'Prefix cannot contain hyphens because hyphens are invalid in PHP function names and constants.';
	}
	if (val.length < 4 || val.length > 15) {
		return 'Prefix must be between 4 and 15 characters (to prevent custom post type key overflow beyond WordPress\'s 20-character limit).';
	}
	if (!/^[a-z][a-z0-9_]*$/.test(val)) {
		return 'Prefix must start with a lowercase letter and contain only lowercase letters, numbers, and underscores.';
	}
	if (RESERVED_PREFIXES.has(val.toLowerCase())) {
		return 'Prefix cannot be a reserved word ("wp", "wordpress", "php") — WordPress.org plugin review and WPCS PrefixAllGlobals will reject it.';
	}
	return true;
}

export function validateNamespace(val) {
	if (!val || typeof val !== 'string' || val.trim().length === 0) {
		return 'PHP namespace is required.';
	}
	if (!/^[A-Za-z_][A-Za-z0-9_]*(\\[A-Za-z_][A-Za-z0-9_]*)*$/.test(val)) {
		return 'Namespace must be one or more \\-separated segments (e.g. MyPlugin or Vendor\\MyPlugin), each starting with a letter or underscore and containing only ASCII letters, numbers, and underscores.';
	}
	return true;
}

export function validateEmail(val) {
	if (val === undefined || val === null || val === '') return true;
	if (typeof val === 'string' && val.trim().length > 0) {
		// Practical email shape check (not full RFC 5322): one local part, one "@",
		// a domain with at least one dot, no whitespace. Good enough to reject
		// obvious garbage like "@@@@" without rejecting real-world addresses.
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) {
			return 'Author email must be a valid address (e.g. name@example.com).';
		}
	}
	return true;
}

export function validateModules(modules) {
	if (!modules || modules.length === 0) return true;
	const unknown = modules.filter(m => !VALID_MODULES.has(m));
	if (unknown.length > 0) {
		const known = [...VALID_MODULES].join(', ');
		return `Unknown module(s): ${unknown.join(', ')}. Valid modules are: ${known}.`;
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
	// Deliberately unrestricted beyond "non-empty": scaffolding into a sibling
	// directory (e.g. --out ../plugins/my-plugin) is the common WP dev workflow.
	// The real safety net is runGenerator()'s non-empty-directory guard below.
	return true;
}

const VALID_LINT_TARGETS = new Set(['wp-org', 'vip', 'both']);

export function validateLintTarget(val) {
	if (val === undefined || val === null || val === '') return true;
	if (!VALID_LINT_TARGETS.has(val)) {
		return `Lint target must be one of: ${[...VALID_LINT_TARGETS].join(', ')}.`;
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
		{ field: 'modules', result: validateModules(answers.modules) },
		{ field: 'minPhp', result: validateMinPhp(answers.minPhp) },
		{ field: 'outputDir', result: validateOutputDir(answers.outputDir) },
		{ field: 'lintTarget', result: validateLintTarget(answers.lintTarget) }
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
		'no-react': { type: 'boolean' },
		'lint-target': { type: 'string' }
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
Usage: create-wp-plugin-cli [options]

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
  --modules <string>       Comma-separated list of modules (admin_settings,shortcode,rest_api,ajax_handler,cpt_taxonomy,cron,caching,elementor_widget,woocommerce_hooks,interactivity)
  --react                  Include React admin app build pipeline (wp-admin only)
  --no-react               Do not include React admin app build pipeline
  --lint-target <string>   Coding standard(s) to lint against: wp-org (default), vip, or both
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
		const useReact = Boolean(flags.react);
		const modules = flags.modules !== undefined ? parseModules(flags.modules) : [];
		const outputDir = flags.out;
		const lintTarget = flags['lint-target'] || 'wp-org';

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
			outputDir,
			lintTarget
		};

		const valid = validateAll(answers);
		if (valid !== true) {
			console.error(`❌ Validation error: ${valid}`);
			process.exit(1);
		}
	} else {
		console.log('\n🚀 Welcome to create-wp-plugin-cli scaffold generator!\n');

		const initialModules = flags.modules !== undefined ? parseModules(flags.modules) : [];

		const choices = MODULE_DEFINITIONS.map(c => ({
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
				type: 'select',
				name: 'lintTarget',
				message: '10. Coding standard target for composer lint:',
				choices: [
					{ title: 'WordPress.org (standard hosting)', value: 'wp-org' },
					{ title: 'WordPress VIP (enterprise hosting)', value: 'vip' },
					{ title: 'Both (strictest — may include overlapping rules)', value: 'both' }
				],
				initial: Math.max(0, ['wp-org', 'vip', 'both'].indexOf(flags['lint-target'] || 'wp-org'))
			},
			{
				type: 'confirm',
				name: 'useReact',
				message: '11. Include React admin app build pipeline (@wordpress/scripts, wp-admin only)?',
				initial: Boolean(flags.react)
			},
			{
				type: 'multiselect',
				name: 'modules',
				message: '12. Modules to include (multi-select, space to toggle):',
				choices,
				hint: '- Space to select. Return to submit'
			},
			{
				type: 'text',
				name: 'outputDir',
				message: '13. Output directory:',
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

	try {
		runGenerator(answers);
	} catch (err) {
		console.error(`\n❌ Error: ${err.message}`);
		process.exit(1);
	}
}

export function runGenerator(answers) {
	answers.outputDir = answers.outputDir || answers.out;
	const outputDir = answers.outputDir;
	const targetDir = path.resolve(process.cwd(), outputDir);

	if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
		throw new Error(`Directory "${outputDir}" already exists and is not empty.`);
	}

	fs.mkdirSync(targetDir, { recursive: true });

	const selectedModules = answers.modules || [];
	const hasInteractivity = selectedModules.includes('interactivity');
	const hasWoo = selectedModules.includes('woocommerce_hooks');

	const requiredPlugins = [];
	if (selectedModules.includes('elementor_widget')) requiredPlugins.push('elementor');
	if (hasWoo) requiredPlugins.push('woocommerce');

	let pluginHeaderExtra = '';
	if (requiredPlugins.length > 0) {
		pluginHeaderExtra += ` * Requires Plugins: ${requiredPlugins.join(', ')}\n`;
	}
	if (selectedModules.includes('elementor_widget')) {
		pluginHeaderExtra += ' * Elementor tested up to: 3.27.0\n * Elementor Pro tested up to: 3.27.0\n';
	}

	// The Interactivity API (wp_interactivity_state, Script Modules) requires WP 6.5+.
	// The Cart Summary block's block.json "render" field requires WP 6.4+.
	const requiredWpVersion = hasInteractivity ? '6.5' : (hasWoo ? '6.4' : '6.0');

	const lintTarget = ['wp-org', 'vip', 'both'].includes(answers.lintTarget) ? answers.lintTarget : 'wp-org';
	const needsVip = lintTarget === 'vip' || lintTarget === 'both';

	// php-stubs/woocommerce-stubs gives PHPCS/Intelephense real class definitions for
	// WC_Payment_Gateway, WC_Shipping_Method, WC_Email, WC_Product, etc. automattic/vipwpcs
	// (the WordPress-VIP-Go phpcs ruleset) only needs pulling in when targeting VIP.
	const composerExtraRequireDevEntries = [];
	if (hasWoo) composerExtraRequireDevEntries.push('"php-stubs/woocommerce-stubs": "^9.0"');
	if (needsVip) composerExtraRequireDevEntries.push('"automattic/vipwpcs": "^3.0"');
	const composerExtraRequireDev = composerExtraRequireDevEntries.length > 0
		? ',\n\t\t' + composerExtraRequireDevEntries.join(',\n\t\t')
		: '';
	const vscodeExtraStubPath = hasWoo ? ',\n\t\t"vendor/php-stubs/woocommerce-stubs/woocommerce-stubs.php"' : '';

	// phpcs.xml ruleset(s): WordPress-Extra/-Docs for wp.org-hosted plugins,
	// WordPress-VIP-Go for VIP hosting (which already carries WordPress-Extra/-Docs
	// -equivalent coverage itself), or both together for teams who want maximum,
	// possibly-overlapping coverage.
	const wpOrgRuleset = '\t<rule ref="WordPress-Extra">\n' +
		'\t\t<exclude name="WordPress.Files.FileName.InvalidClassFileName"/>\n' +
		'\t\t<exclude name="WordPress.Files.FileName.NotHyphenatedLowercase"/>\n' +
		'\t\t<exclude name="Generic.CodeAnalysis.UnusedFunctionParameter"/>\n' +
		'\t\t<exclude name="Generic.Formatting.MultipleStatementAlignment"/>\n' +
		'\t</rule>\n' +
		'\t<rule ref="WordPress-Docs"/>\n';
	const vipRuleset = '\t<rule ref="WordPress-VIP-Go">\n' +
		'\t\t<exclude name="WordPressVIPMinimum.Security.Mustache.OutputNotation"/>\n' +
		'\t</rule>\n';
	const phpcsRulesets = lintTarget === 'vip'
		? vipRuleset
		: lintTarget === 'both'
			? wpOrgRuleset + vipRuleset
			: wpOrgRuleset;

	const woocommerceHpos = hasWoo
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
		'{{COMPOSER_VENDOR}}': slugify(answers.authorName) || 'vendor',
		'{{AUTHOR_URI}}': answers.authorUri,
		'{{DESCRIPTION}}': answers.description,
		'{{MIN_PHP}}': answers.minPhp,
		'{{REQUIRES_AT_LEAST}}': requiredWpVersion,
		'{{VERSION}}': '1.0.0',
		'{{YEAR}}': new Date().getFullYear().toString(),
		'{{PLUGIN_HEADER_EXTRA}}': pluginHeaderExtra,
		'{{WOOCOMMERCE_HPOS}}': woocommerceHpos,
		'{{COMPOSER_EXTRA_REQUIRE_DEV}}': composerExtraRequireDev,
		'{{VSCODE_EXTRA_STUB_PATH}}': vscodeExtraStubPath,
		'{{PHPCS_RULESETS}}': phpcsRulesets
	};

	function processTemplateContent(content, destRelativePath = '') {
		let result = content;
		const isJson = destRelativePath.endsWith('.json');
		const isPhp = destRelativePath.endsWith('.php');

		const textTokens = new Set([
			'{{PLUGIN_NAME}}',
			'{{DESCRIPTION}}',
			'{{AUTHOR}}',
			'{{AUTHOR_EMAIL}}',
			'{{AUTHOR_URI}}',
			'{{SLUG}}'
		]);

		for (const [key, val] of Object.entries(replacements)) {
			let safeVal = val;
			if (typeof val === 'string') {
				if (isJson && textTokens.has(key)) {
					safeVal = JSON.stringify(val).slice(1, -1);
				} else if (isPhp && (key === '{{PLUGIN_NAME}}' || key === '{{DESCRIPTION}}' || key === '{{AUTHOR}}')) {
					safeVal = val.replaceAll("'", "\\'");
				}
			}
			result = result.replaceAll(key, () => safeVal);
		}
		// Fixed-width header labels (e.g. " * Author URI:        {{AUTHOR_URI}}") leave
		// trailing whitespace once an optional field like --author/--author-uri is left
		// blank — trim it here so composer lint doesn't reject the plugin's own header.
		result = result.replace(/[ \t]+$/gm, '');
		return result;
	}

	function writeTemplateFile(srcPath, destRelativePath) {
		const raw = fs.readFileSync(srcPath, 'utf8');
		const processed = processTemplateContent(raw, destRelativePath);
		const destPath = path.join(targetDir, destRelativePath);
		fs.mkdirSync(path.dirname(destPath), { recursive: true });
		fs.writeFileSync(destPath, processed, 'utf8');
	}

	const templatesDir = path.join(__dirname, 'templates');

	// Copy standard templates
	writeTemplateFile(path.join(templatesDir, 'src/Core/Container.php'), 'src/Core/Container.php');
	writeTemplateFile(path.join(templatesDir, 'src/Core/Exceptions/Not_Found_Exception.php'), 'src/Core/Exceptions/Not_Found_Exception.php');
	writeTemplateFile(path.join(templatesDir, 'src/Contracts/Service_Provider.php'), 'src/Contracts/Service_Provider.php');
	writeTemplateFile(path.join(templatesDir, 'src/Contracts/Conditional.php'), 'src/Contracts/Conditional.php');
	writeTemplateFile(path.join(templatesDir, 'src/Contracts/Activatable.php'), 'src/Contracts/Activatable.php');
	writeTemplateFile(path.join(templatesDir, 'src/Contracts/Deactivatable.php'), 'src/Contracts/Deactivatable.php');
	writeTemplateFile(path.join(templatesDir, 'plugin-main.php'), `${answers.slug}.php`);
	writeTemplateFile(path.join(templatesDir, 'composer.json'), 'composer.json');
	writeTemplateFile(path.join(templatesDir, 'phpcs.xml'), 'phpcs.xml');
	writeTemplateFile(path.join(templatesDir, 'src/CLI/Commands.php'), 'src/CLI/Commands.php');
	writeTemplateFile(path.join(templatesDir, 'tests/bootstrap.php'), 'tests/bootstrap.php');
	writeTemplateFile(path.join(templatesDir, 'phpunit.xml.dist'), 'phpunit.xml.dist');
	writeTemplateFile(path.join(templatesDir, 'tests/Unit/Example_Test.php'), 'tests/Unit/Example_Test.php');
	// Real-WordPress integration suite (wp-phpunit/wp-phpunit), separate from the
	// Brain Monkey unit suite above — needs a MySQL test DB, run via `composer test:integration`.
	writeTemplateFile(path.join(templatesDir, 'tests/bootstrap-integration.php'), 'tests/bootstrap-integration.php');
	writeTemplateFile(path.join(templatesDir, 'phpunit-integration.xml.dist'), 'phpunit-integration.xml.dist');
	writeTemplateFile(path.join(templatesDir, 'tests/Integration/Plugin_Boot_Test.php'), 'tests/Integration/Plugin_Boot_Test.php');
	writeTemplateFile(path.join(templatesDir, 'gitignore.tpl'), '.gitignore');
	writeTemplateFile(path.join(templatesDir, 'editorconfig.tpl'), '.editorconfig');
	writeTemplateFile(path.join(templatesDir, 'distignore.tpl'), '.distignore');
	writeTemplateFile(path.join(templatesDir, 'assets/css/main.css'), 'assets/css/main.css');
	writeTemplateFile(path.join(templatesDir, 'assets/js/main.js'), 'assets/js/main.js');
	writeTemplateFile(path.join(templatesDir, 'readme.txt'), 'readme.txt');
	writeTemplateFile(path.join(templatesDir, 'languages/.gitkeep'), 'languages/.gitkeep');
	writeTemplateFile(path.join(templatesDir, '.vscode/php.code-snippets'), '.vscode/php.code-snippets');
	writeTemplateFile(path.join(templatesDir, '.vscode/extensions.json'), '.vscode/extensions.json');
	writeTemplateFile(path.join(templatesDir, '.vscode/settings.json'), '.vscode/settings.json');

	// Selected modules mapping: each module pushes one or more `$providers[] = new X();`
	// lines, injected into Plugin::create() (see {{PROVIDER_REGISTRATIONS}} below).
	const providerRegistrations = [];

	if (selectedModules.includes('admin_settings')) {
		writeTemplateFile(path.join(templatesDir, 'src/Admin/Settings_Repository.php'), 'src/Admin/Settings_Repository.php');
		writeTemplateFile(path.join(templatesDir, 'src/Admin/Settings_Registrar.php'), 'src/Admin/Settings_Registrar.php');
		writeTemplateFile(path.join(templatesDir, 'src/Admin/views/sample-field.php'), 'src/Admin/views/sample-field.php');

		let settingsPageViewContent = fs.readFileSync(path.join(templatesDir, 'src/Admin/views/settings-page.php'), 'utf8');
		const reactAdminRoot = answers.useReact ? '\t<div id="{{PREFIX}}-app-root"></div>\n' : '';
		settingsPageViewContent = settingsPageViewContent.replace('{{REACT_ADMIN_ROOT}}', () => reactAdminRoot);
		settingsPageViewContent = processTemplateContent(settingsPageViewContent, 'src/Admin/views/settings-page.php');
		const settingsPageViewDest = path.join(targetDir, 'src/Admin/views/settings-page.php');
		fs.mkdirSync(path.dirname(settingsPageViewDest), { recursive: true });
		fs.writeFileSync(settingsPageViewDest, settingsPageViewContent, 'utf8');

		providerRegistrations.push('\n\t\t$providers[] = new Admin\\Settings_Registrar();');
	}
	if (selectedModules.includes('shortcode')) {
		writeTemplateFile(path.join(templatesDir, 'src/Frontend/Shortcode.php'), 'src/Frontend/Shortcode.php');
		providerRegistrations.push('\n\t\t$providers[] = new Frontend\\Shortcode();');
	}
	if (selectedModules.includes('rest_api')) {
		writeTemplateFile(path.join(templatesDir, 'src/Rest/Rest_Controller.php'), 'src/Rest/Rest_Controller.php');
		providerRegistrations.push('\n\t\t$providers[] = new Rest\\Rest_Controller();');
	}
	if (selectedModules.includes('ajax_handler')) {
		writeTemplateFile(path.join(templatesDir, 'src/Ajax/Ajax_Handler.php'), 'src/Ajax/Ajax_Handler.php');
		providerRegistrations.push('\n\t\t$providers[] = new Ajax\\Ajax_Handler();');
	}
	if (selectedModules.includes('cpt_taxonomy')) {
		writeTemplateFile(path.join(templatesDir, 'src/PostTypes/Post_Types.php'), 'src/PostTypes/Post_Types.php');
		providerRegistrations.push('\n\t\t$providers[] = new PostTypes\\Post_Types();');
	}
	if (selectedModules.includes('cron')) {
		writeTemplateFile(path.join(templatesDir, 'src/Cron/Scheduler.php'), 'src/Cron/Scheduler.php');
		providerRegistrations.push('\n\t\t$providers[] = new Cron\\Scheduler();');
	}
	if (selectedModules.includes('caching')) {
		writeTemplateFile(path.join(templatesDir, 'src/Cache/Cache_Service.php'), 'src/Cache/Cache_Service.php');
		providerRegistrations.push('\n\t\t$providers[] = new Cache\\Cache_Service();');
	}
	if (selectedModules.includes('custom_table')) {
		writeTemplateFile(path.join(templatesDir, 'src/Database/Schema.php'), 'src/Database/Schema.php');
		writeTemplateFile(path.join(templatesDir, 'src/Database/Item_Repository.php'), 'src/Database/Item_Repository.php');
		providerRegistrations.push('\n\t\t$providers[] = new Database\\Schema();');
	}
	if (selectedModules.includes('elementor_widget')) {
		writeTemplateFile(path.join(templatesDir, '.vscode/php-elementor.code-snippets'), '.vscode/php-elementor.code-snippets');
		writeTemplateFile(path.join(templatesDir, 'src/Elementor/Dependency_Notice.php'), 'src/Elementor/Dependency_Notice.php');
		writeTemplateFile(path.join(templatesDir, 'src/Elementor/Widget_Registrar.php'), 'src/Elementor/Widget_Registrar.php');
		writeTemplateFile(path.join(templatesDir, 'src/Widgets/Sample_Widget.php'), 'src/Widgets/Sample_Widget.php');
		writeTemplateFile(path.join(templatesDir, 'assets/css/widgets/sample-widget.css'), 'assets/css/widgets/sample-widget.css');
		writeTemplateFile(path.join(templatesDir, 'assets/js/widgets/sample-widget.js'), 'assets/js/widgets/sample-widget.js');
		providerRegistrations.push('\n\t\t$providers[] = new Elementor\\Dependency_Notice();');
		providerRegistrations.push('\n\t\t$providers[] = new Elementor\\Widget_Registrar();');
	}
	if (selectedModules.includes('woocommerce_hooks')) {
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Providers/Gateway_Provider.php'), 'src/Woo/Providers/Gateway_Provider.php');
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Providers/Shipping_Provider.php'), 'src/Woo/Providers/Shipping_Provider.php');
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Providers/Email_Provider.php'), 'src/Woo/Providers/Email_Provider.php');
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Providers/Product_Type_Provider.php'), 'src/Woo/Providers/Product_Type_Provider.php');
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Providers/Blocks_Provider.php'), 'src/Woo/Providers/Blocks_Provider.php');
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Gateways/Gateway.php'), 'src/Woo/Gateways/Gateway.php');
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Gateways/Blocks_Payment_Method_Type.php'), 'src/Woo/Gateways/Blocks_Payment_Method_Type.php');
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Shipping/Shipping_Method.php'), 'src/Woo/Shipping/Shipping_Method.php');
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Emails/Custom_Email.php'), 'src/Woo/Emails/Custom_Email.php');
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Products/Custom_Product.php'), 'src/Woo/Products/Custom_Product.php');
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Blocks/Integration.php'), 'src/Woo/Blocks/Integration.php');
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Blocks/Cart_Summary_Block.php'), 'src/Woo/Blocks/Cart_Summary_Block.php');
		writeTemplateFile(path.join(templatesDir, 'woo-email-templates/emails/custom-email.php'), `templates/emails/${answers.prefix.toLowerCase()}-custom-email.php`);
		writeTemplateFile(path.join(templatesDir, 'woo-email-templates/emails/plain/custom-email.php'), `templates/emails/plain/${answers.prefix.toLowerCase()}-custom-email.php`);
		writeTemplateFile(path.join(templatesDir, 'react/assets/src/wc-gateway-block.js'), 'assets/src/wc-gateway-block.js');
		writeTemplateFile(path.join(templatesDir, 'react/assets/src/blocks-integration.js'), 'assets/src/blocks-integration.js');
		writeTemplateFile(path.join(templatesDir, 'react/assets/src/blocks/cart-summary/block.json'), 'assets/src/blocks/cart-summary/block.json');
		writeTemplateFile(path.join(templatesDir, 'react/assets/src/blocks/cart-summary/index.js'), 'assets/src/blocks/cart-summary/index.js');
		writeTemplateFile(path.join(templatesDir, 'react/assets/src/blocks/cart-summary/render.php'), 'assets/src/blocks/cart-summary/render.php');
		providerRegistrations.push('\n\t\t$providers[] = new Woo\\Providers\\Gateway_Provider();');
		providerRegistrations.push('\n\t\t$providers[] = new Woo\\Providers\\Shipping_Provider();');
		providerRegistrations.push('\n\t\t$providers[] = new Woo\\Providers\\Email_Provider();');
		providerRegistrations.push('\n\t\t$providers[] = new Woo\\Providers\\Product_Type_Provider();');
		providerRegistrations.push('\n\t\t$providers[] = new Woo\\Providers\\Blocks_Provider();');
	}
	if (selectedModules.includes('interactivity')) {
		writeTemplateFile(path.join(templatesDir, 'src/Frontend/Interactivity.php'), 'src/Frontend/Interactivity.php');
		writeTemplateFile(path.join(templatesDir, 'react/assets/src/view.js'), 'assets/src/view.js');
		providerRegistrations.push('\n\t\t$providers[] = new Frontend\\Interactivity();');
	}

	// React admin app (wp-admin only) + Interactivity API (frontend) + WooCommerce
	// Blocks gateway build pipeline. These are independent toggles that share one
	// @wordpress/scripts build:
	// useReact          -> assets/src/index.js (wp-admin React app)
	// interactivity mod -> assets/src/view.js (frontend Interactivity API store)
	// woocommerce_hooks -> assets/src/wc-gateway-block.js (block checkout payment method)
	const needsBuildPipeline = answers.useReact || hasInteractivity || hasWoo;

	let reactAssetsRegistration = '';
	let readmeReactInstall = '';
	let readmeReactScripts = '';
	let ciNodeJob = '';

	if (answers.useReact) {
		writeTemplateFile(path.join(templatesDir, 'react/assets/src/index.js'), 'assets/src/index.js');

		let assetsContent = fs.readFileSync(path.join(templatesDir, 'src/Admin/Assets.php'), 'utf8');
		const reactAdminHookGuard = selectedModules.includes('admin_settings')
			? '\t\tif ( \'settings_page_{{SLUG}}\' !== $hook_suffix ) {\n\t\t\treturn;\n\t\t}\n\n'
			: '\t\t// TODO: narrow this to your plugin\'s own admin screen(s), e.g. compare $hook_suffix.\n';
		assetsContent = assetsContent.replace('{{REACT_ADMIN_HOOK_GUARD}}', () => reactAdminHookGuard);
		assetsContent = processTemplateContent(assetsContent, 'src/Admin/Assets.php');
		const assetsDestPath = path.join(targetDir, 'src/Admin/Assets.php');
		fs.mkdirSync(path.dirname(assetsDestPath), { recursive: true });
		fs.writeFileSync(assetsDestPath, assetsContent, 'utf8');

		reactAssetsRegistration = '\n\t\t$providers[] = new Admin\\Assets();\n';
	}

	if (needsBuildPipeline) {
		// Playwright E2E ships whenever there's already a Node/JS pipeline (a pure-PHP
		// scaffold gets no package.json at all, so there'd be nowhere to hang it).
		// Jest unit tests are added only alongside the React admin app: it's the one
		// piece of generated JS that's actually a unit-testable component (view.js /
		// wc-gateway-block.js / blocks-integration.js execute as side effects against
		// window.wc/window.wp globals, not exported functions worth unit-testing).
		const packageExtraScriptsEntries = ['"test:e2e": "playwright test"'];
		const packageExtraDevDependenciesEntries = [
			'"@playwright/test": "^1.47.0"',
			'"@wordpress/e2e-test-utils-playwright": "^1.4.0"'
		];
		if (answers.useReact) {
			packageExtraScriptsEntries.push('"test:js": "wp-scripts test-unit-js"');
			packageExtraDevDependenciesEntries.push('"@testing-library/react": "^16.0.0"');
			packageExtraDevDependenciesEntries.push('"@testing-library/jest-dom": "^6.0.0"');
		}
		const packageExtraScripts = ',\n\t\t' + packageExtraScriptsEntries.join(',\n\t\t');
		const packageExtraDevDependencies = ',\n\t\t' + packageExtraDevDependenciesEntries.join(',\n\t\t');
		replacements['{{PACKAGE_EXTRA_SCRIPTS}}'] = packageExtraScripts;
		replacements['{{PACKAGE_EXTRA_DEV_DEPENDENCIES}}'] = packageExtraDevDependencies;

		writeTemplateFile(path.join(templatesDir, 'react/package.json'), 'package.json');
		writeTemplateFile(path.join(templatesDir, 'playwright.config.js'), 'playwright.config.js');
		writeTemplateFile(path.join(templatesDir, 'tests/e2e/homepage.spec.js'), 'tests/e2e/homepage.spec.js');
		if (selectedModules.includes('admin_settings')) {
			writeTemplateFile(path.join(templatesDir, 'tests/e2e/settings-page.spec.js'), 'tests/e2e/settings-page.spec.js');
		}
		if (answers.useReact) {
			writeTemplateFile(path.join(templatesDir, 'jest.config.js'), 'jest.config.js');
			writeTemplateFile(path.join(templatesDir, 'tests/js/App.test.js'), 'tests/js/App.test.js');
		}

		// wp-scripts only auto-detects a single "src/index.js" entry (or, if any
		// block.json exists under the src dir, ONLY the entries it derives from
		// block.json files — "src/index.js" is silently dropped in that case).
		// Once we ship more than one of: the admin app, the Interactivity API view
		// script, the WooCommerce Blocks gateway/integration scripts, or a native
		// block (block.json), we must override entry resolution via webpack.config.js
		// — wp-scripts picks this file up automatically if present at the project root.
		//
		// IMPORTANT: @wordpress/scripts assigns `entry` as a *function* (webpack's
		// lazy-entry form) so it can glob for block.json files at build time, not a
		// plain object — `{ ...defaultConfig.entry }` silently spreads to `{}` and
		// drops every auto-discovered block entry. It must be invoked, not spread.
		if (hasInteractivity || hasWoo) {
			const entries = [];
			if (answers.useReact) entries.push('\t\tindex: \'./assets/src/index.js\',');
			if (hasInteractivity) entries.push('\t\tview: \'./assets/src/view.js\',');
			if (hasWoo) {
				entries.push('\t\t\'wc-gateway-block\': \'./assets/src/wc-gateway-block.js\',');
				entries.push('\t\t\'blocks-integration\': \'./assets/src/blocks-integration.js\',');
			}

			const webpackConfig = `const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

/**
 * Merges our explicit entries with wp-scripts' own lazily-computed entry
 * function so native blocks (block.json under assets/src/blocks/**) keep
 * building automatically alongside them. wp-scripts loads this file
 * automatically when present at the project root.
 */
module.exports = {
	...defaultConfig,
	entry: () => ( {
		...( typeof defaultConfig.entry === 'function' ? defaultConfig.entry() : defaultConfig.entry ),
${entries.join('\n')}
	} ),
};
`;
			fs.writeFileSync(path.join(targetDir, 'webpack.config.js'), webpackConfig, 'utf8');
		}

		readmeReactInstall = '3. Run `npm install` and `npm run build` to compile JS assets.\n   > Note: `assets/build` is gitignored and generated during build.';
		readmeReactScripts = '- `npm run build` — Build JS assets for production.\n- `npm run start` — Start JS asset dev server in watch mode.\n- `npm run test:e2e` — Run Playwright E2E tests against a running WordPress site (`WP_BASE_URL`, defaults to `http://localhost:8889` — e.g. `wp-env start`).' + (answers.useReact ? '\n- `npm run test:js` — Run Jest unit tests for the JS admin app.' : '');

		ciNodeJob = `
  node-build:
    name: Build JS Assets
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Node Dependencies
        run: npm install

      - name: Build Assets
        run: npm run build`;
	}

	// Process Plugin.php template with dynamic registrations
	let pluginContent = fs.readFileSync(path.join(templatesDir, 'src/Plugin.php'), 'utf8');
	pluginContent = pluginContent.replace('{{REACT_ASSETS_REGISTRATION}}', () => reactAssetsRegistration);
	pluginContent = pluginContent.replace('{{PROVIDER_REGISTRATIONS}}', () => providerRegistrations.length > 0 ? providerRegistrations.join('\n') + '\n' : '');
	pluginContent = processTemplateContent(pluginContent, 'src/Plugin.php');
	const pluginDestPath = path.join(targetDir, 'src/Plugin.php');
	fs.mkdirSync(path.dirname(pluginDestPath), { recursive: true });
	fs.writeFileSync(pluginDestPath, pluginContent, 'utf8');

	const allPhpVersions = ['8.0', '8.1', '8.2', '8.3'];
	const minPhpNum = parseFloat(answers.minPhp || '8.0');
	let validMatrixVersions = allPhpVersions.filter(v => parseFloat(v) >= minPhpNum);
	if (!validMatrixVersions.includes(answers.minPhp)) {
		validMatrixVersions.push(answers.minPhp);
	}
	validMatrixVersions.sort((a, b) => parseFloat(a) - parseFloat(b));
	const ciPhpMatrix = JSON.stringify(validMatrixVersions).replace(/"/g, "'");

	// Process ci.yml with dynamic node job
	let ciContent = fs.readFileSync(path.join(templatesDir, 'github/workflows/ci.yml'), 'utf8');
	ciContent = ciContent.replace('{{CI_PHP_MATRIX}}', () => ciPhpMatrix);
	ciContent = ciContent.replace('{{CI_NODE_JOB}}', () => ciNodeJob);
	ciContent = processTemplateContent(ciContent, '.github/workflows/ci.yml');
	const ciDestPath = path.join(targetDir, '.github/workflows/ci.yml');
	fs.mkdirSync(path.dirname(ciDestPath), { recursive: true });
	fs.writeFileSync(ciDestPath, ciContent, 'utf8');

	// Process Activator.php, Deactivator.php, uninstall.php with dynamic bodies
	const activatorLines = [];
	const deactivatorLines = [];
	const uninstallLines = [];

	if (selectedModules.includes('cpt_taxonomy')) {
		// Fully-qualified on purpose: Activator.php lives in the {{NS}}\Core namespace,
		// so an unqualified "PostTypes\Post_Types" reference here would resolve to the
		// (nonexistent) {{NS}}\Core\PostTypes\Post_Types and fatal at runtime.
		activatorLines.push('\t\t$post_types = $container->get( \\{{NS}}\\PostTypes\\Post_Types::class );');
		activatorLines.push('\t\t$post_types->register_cpt_and_taxonomy();');
		activatorLines.push('\t\tflush_rewrite_rules(); // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.flush_rewrite_rules_flush_rewrite_rules');
		deactivatorLines.push('\t\tflush_rewrite_rules(); // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.flush_rewrite_rules_flush_rewrite_rules');
	}

	if (selectedModules.includes('cron')) {
		activatorLines.push('\t\tif ( ! wp_next_scheduled( \'{{PREFIX}}_cron_event\' ) ) {');
		activatorLines.push('\t\t\twp_schedule_event( time(), \'hourly\', \'{{PREFIX}}_cron_event\' );');
		activatorLines.push('\t\t}');
		deactivatorLines.push('\t\twp_clear_scheduled_hook( \'{{PREFIX}}_cron_event\' );');
		// Two-tab depth: this body is injected into Uninstaller::cleanup(), a class method (not a top-level function).
		uninstallLines.push('\t\twp_clear_scheduled_hook( \'{{PREFIX}}_cron_event\' );');
	}

	if (selectedModules.includes('elementor_widget')) {
		activatorLines.push('\t\tdelete_transient( \'{{PREFIX}}_elementor_widgets\' );');
	}

	if (selectedModules.includes('admin_settings')) {
		uninstallLines.push('\t\tdelete_option( \'{{PREFIX}}_option_name\' );');
	}

	if (selectedModules.includes('custom_table')) {
		// dbDelta() must run synchronously on activation so the table exists
		// immediately — Schema::boot()'s plugins_loaded hook only catches
		// updates, which don't fire register_activation_hook().
		activatorLines.push('\t\t$container->get( \\{{NS}}\\Database\\Schema::class )->create_table();');
		uninstallLines.push('\t\t\\{{NS}}\\Database\\Schema::drop_table();');
	}

	const activatorBody = activatorLines.length > 0 ? activatorLines.join('\n') + '\n' : '';
	const deactivatorBody = deactivatorLines.length > 0 ? deactivatorLines.join('\n') + '\n' : '';
	const uninstallBody = uninstallLines.length > 0 ? uninstallLines.join('\n') + '\n' : '';

	let activatorContent = fs.readFileSync(path.join(templatesDir, 'src/Core/Activator.php'), 'utf8');
	activatorContent = activatorContent.replace('{{ACTIVATOR_BODY}}', () => activatorBody);
	activatorContent = processTemplateContent(activatorContent, 'src/Core/Activator.php');
	const activatorDestPath = path.join(targetDir, 'src/Core/Activator.php');
	fs.mkdirSync(path.dirname(activatorDestPath), { recursive: true });
	fs.writeFileSync(activatorDestPath, activatorContent, 'utf8');

	let deactivatorContent = fs.readFileSync(path.join(templatesDir, 'src/Core/Deactivator.php'), 'utf8');
	deactivatorContent = deactivatorContent.replace('{{DEACTIVATOR_BODY}}', () => deactivatorBody);
	deactivatorContent = processTemplateContent(deactivatorContent, 'src/Core/Deactivator.php');
	const deactivatorDestPath = path.join(targetDir, 'src/Core/Deactivator.php');
	fs.mkdirSync(path.dirname(deactivatorDestPath), { recursive: true });
	fs.writeFileSync(deactivatorDestPath, deactivatorContent, 'utf8');

	// uninstall.php itself is now a thin procedural shell with no {{UNINSTALL_BODY}}
	// of its own — it just delegates to Core\Uninstaller::cleanup(), which is where
	// the per-module cleanup lines below actually get injected.
	let uninstallContent = fs.readFileSync(path.join(templatesDir, 'uninstall.php'), 'utf8');
	uninstallContent = processTemplateContent(uninstallContent, 'uninstall.php');
	const uninstallDestPath = path.join(targetDir, 'uninstall.php');
	fs.writeFileSync(uninstallDestPath, uninstallContent, 'utf8');

	let uninstallerContent = fs.readFileSync(path.join(templatesDir, 'src/Core/Uninstaller.php'), 'utf8');
	uninstallerContent = uninstallerContent.replace('{{UNINSTALL_BODY}}', () => uninstallBody);
	uninstallerContent = processTemplateContent(uninstallerContent, 'src/Core/Uninstaller.php');
	const uninstallerDestPath = path.join(targetDir, 'src/Core/Uninstaller.php');
	fs.mkdirSync(path.dirname(uninstallerDestPath), { recursive: true });
	fs.writeFileSync(uninstallerDestPath, uninstallerContent, 'utf8');

	// Process README.md with dynamic React sections
	let readmeContent = fs.readFileSync(path.join(templatesDir, 'README.md'), 'utf8');
	readmeContent = readmeContent.replace('{{README_REACT_INSTALL}}', () => readmeReactInstall);
	readmeContent = readmeContent.replace('{{README_REACT_SCRIPTS}}', () => readmeReactScripts);
	readmeContent = processTemplateContent(readmeContent, 'README.md');
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
	console.log('Note: composer install may prompt to allow dealerdirect/phpcodesniffer-composer-installer — answer yes.');
	console.log('      First run note: "No composer.lock file present" is normal; Composer will generate it automatically.\n');
}

function isRunAsScript() {
	if (!process.argv[1]) return false;
	// npm/npx install the CLI behind a symlink on macOS/Linux (bin/create-wp-plugin-cli
	// -> ../lib/node_modules/create-wp-plugin-cli/index.js). process.argv[1] is the
	// symlink path while __filename is already resolved to the real file, so compare
	// realpaths rather than raw paths or this guard silently never runs main().
	let invokedPath = process.argv[1];
	try {
		invokedPath = fs.realpathSync(invokedPath);
	} catch {
		// Path doesn't exist as given (e.g. invoked via a loader that fabricates
		// argv[1]) — fall back to the raw value so the comparison below still applies.
	}
	return path.resolve(__filename) === path.resolve(invokedPath);
}

if (isRunAsScript()) {
	main().catch(err => {
		console.error('An error occurred:', err);
		process.exit(1);
	});
}
