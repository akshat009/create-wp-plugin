#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseArgs } from 'node:util';
import prompts from 'prompts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Whether it's safe to print emoji: not when NO_COLOR is set, not into a
 * non-TTY (pipes, CI log capture, redirected files), and on Windows only
 * from a modern terminal (Windows Terminal / VS Code / ConEmu / a real
 * $TERM) — the legacy conhost mangles them.
 *
 * @return {boolean}
 */
function supportsUnicode() {
	if (process.env.NO_COLOR !== undefined) return false;
	if (!process.stdout.isTTY) return false;
	if (process.platform !== 'win32') return true;
	return Boolean(
		process.env.WT_SESSION ||
		process.env.TERM_PROGRAM ||
		process.env.ConEmuTask ||
		process.env.TERM
	);
}

const UNICODE_OK = supportsUnicode();

/**
 * Return `glyph` when the terminal can render it, otherwise a plain-ASCII
 * stand-in so nothing shows up as mojibake in a minimal console.
 *
 * @param {string} glyph Preferred emoji/symbol.
 * @param {string} ascii ASCII fallback.
 * @return {string}
 */
function icon(glyph, ascii) {
	return UNICODE_OK ? glyph : ascii;
}

export const WOO_SUB_MODULES = [
	{ title: 'Payment Gateway (Classic + Block Checkout)', value: 'woo:gateway', needsJs: true },
	{ title: 'Custom Shipping Method', value: 'woo:shipping', needsJs: false },
	{ title: 'Custom Transactional Email (HTML & Plain templates)', value: 'woo:email', needsJs: false },
	{ title: 'Custom Order Status (HPOS compliant)', value: 'woo:order-status', needsJs: false },
	{ title: 'Custom Product Type & Data Tabs', value: 'woo:product-type', needsJs: false },
	{ title: 'Cart & Checkout Block Extensions', value: 'woo:blocks', needsJs: true },
	{ title: 'Action Scheduler (Background Task Runner)', value: 'woo:action-scheduler', needsJs: false },
	{ title: 'Store API Extension (ExtendSchema for Blocks)', value: 'woo:store-api', needsJs: false },
	{ title: 'My Account Custom Endpoint', value: 'woo:my-account', needsJs: false }
];

export const ALL_WOO_MODULE_VALUES = WOO_SUB_MODULES.map(m => m.value);

export const BLOCK_SUB_MODULES = [
	{ title: 'Dynamic block (server-rendered via render.php)', value: 'block:dynamic' },
	{ title: 'Static block (markup serialized by save())', value: 'block:static' }
];

export const ALL_BLOCK_MODULE_VALUES = BLOCK_SUB_MODULES.map(m => m.value);

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
	{ title: 'native Gutenberg block (choose static / dynamic next)', value: 'block' },
	{ title: 'WooCommerce integration', value: 'woocommerce_hooks' },
	{ title: 'Frontend Interactivity (WordPress Interactivity API)', value: 'interactivity' },
	{ title: 'WP-CLI commands (wp <prefix> status / cache clear)', value: 'cli' },
	{ title: 'editor config (.vscode snippets, settings, extensions)', value: 'editor_config' },
	{ title: 'WordPress integration test suite (wp-phpunit + wp-env)', value: 'integration_tests' },
	...BLOCK_SUB_MODULES.map(m => ({ title: `Block: ${m.title}`, value: m.value })),
	...WOO_SUB_MODULES.map(m => ({ title: `WooCommerce: ${m.title}`, value: m.value }))
];
export const VALID_MODULES = new Set([
	...MODULE_DEFINITIONS.map(m => m.value),
	'block:all',
	'woo:all',
	'woocommerce'
]);

export function normalizeModules(modules = []) {
	const set = new Set();
	for (const mod of modules) {
		if (mod === 'woocommerce_hooks' || mod === 'woocommerce' || mod === 'woo:all') {
			for (const wooMod of ALL_WOO_MODULE_VALUES) {
				set.add(wooMod);
			}
		} else if (mod === 'block' || mod === 'block:all') {
			for (const blockMod of ALL_BLOCK_MODULE_VALUES) {
				set.add(blockMod);
			}
		} else {
			set.add(mod);
		}
	}
	return Array.from(set);
}

/**
 * Minimal conditional-block support for the template engine.
 *
 * Deliberately tiny — just enough that a template can carry its own
 * optional sections instead of the generator pre-building every variation
 * as a string and injecting it through a bespoke placeholder token.
 * Supported syntax (blocks may nest):
 *
 *   {{#if flag}}...{{/if}}
 *   {{#if flag}}...{{else}}...{{/if}}
 *   {{#unless flag}}...{{/if}}
 *
 * `flag` is a bare identifier looked up in `flags`; any truthy value keeps
 * the block. Unknown flags are falsy. A control tag alone on its own line
 * (leading indentation aside) is treated as "standalone" — the whole line
 * including its newline is removed, so block tags don't leave blank lines
 * behind in whitespace-sensitive output (YAML, PHP, JSON).
 *
 * Value substitution ({{TOKEN}}) is a separate later pass, so tokens
 * inside a kept block are still replaced normally afterwards.
 *
 * @param {string} content Raw template text.
 * @param {Object<string, unknown>} [flags] Flag lookup table.
 * @return {string} Text with every conditional block resolved.
 */
export function applyConditionals(content, flags = {}) {
	// Collapse "standalone" control tags (alone on their line) down to just
	// the tag itself, dropping the line's indentation and trailing newline.
	let out = content.replace(
		/^[ \t]*(\{\{#(?:if|unless)\s+[A-Za-z_][A-Za-z0-9_]*\}\}|\{\{else\}\}|\{\{\/(?:if|unless)\}\})[ \t]*\r?\n/gm,
		'$1'
	);

	// Resolve the innermost block (one whose body holds no further opening
	// tag) repeatedly until none remain. Every pass removes at least one
	// block, so this terminates; the guard just turns an unbalanced
	// template into a loud error instead of a hang.
	const innermost = /\{\{#(if|unless)\s+([A-Za-z_][A-Za-z0-9_]*)\}\}((?:(?!\{\{#(?:if|unless)\s)[\s\S])*?)\{\{\/(?:if|unless)\}\}/;

	let guard = 0;
	while (innermost.test(out)) {
		out = out.replace(innermost, (match, kind, flag, body) => {
			let keep = Boolean(flags[flag]);
			if (kind === 'unless') {
				keep = ! keep;
			}

			const elseIdx = body.indexOf('{{else}}');
			if (elseIdx === -1) {
				return keep ? body : '';
			}
			return keep
				? body.slice(0, elseIdx)
				: body.slice(elseIdx + '{{else}}'.length);
		});

		if (++guard > 1000) {
			throw new Error('applyConditionals: runaway expansion — unbalanced {{#if}}/{{/if}} in a template?');
		}
	}

	// A leftover control tag means the template was malformed (an unbalanced
	// {{#if}} with no {{/if}}, or a stray {{else}}/{{/if}}). Fail loudly
	// rather than ship a literal tag into generated output.
	if (/\{\{#(?:if|unless)\s|\{\{\/(?:if|unless)\}\}|\{\{else\}\}/.test(out)) {
		throw new Error('applyConditionals: unbalanced or stray conditional tag in a template');
	}

	return out;
}

export function slugify(text) {
	if (!text) return '';
	return text
		.toString()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
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

// The generated code targets a single modern PHP baseline — constructor
// property promotion, readonly properties, first-class callable syntax (all
// PHP 8.1) — pinned, not configurable. 8.2 is the floor: it's the oldest line
// still getting security fixes, and matches the widest install base.
export const MIN_PHP = '8.2';

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
		out: { type: 'string' },
		modules: { type: 'string' },
		react: { type: 'boolean' },
		'no-react': { type: 'boolean' },
		'lint-target': { type: 'string' }
	};

	try {
		const parsed = parseArgs({ options, allowPositionals: true });
		const values = parsed.values;
		if (parsed.positionals && parsed.positionals.length > 0 && !values.name) {
			values.name = parsed.positionals[0];
		}
		return values;
	} catch (err) {
		console.error(`${icon('❌', '[x]')} Invalid argument: ${err.message}`);
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
  --out <string>           Output directory
  --modules <string>       Comma-separated list of modules (admin_settings,shortcode,rest_api,ajax_handler,cpt_taxonomy,cron,caching,custom_table,elementor_widget,block,block:dynamic,block:static,interactivity,cli,editor_config,integration_tests,woo:all,woo:gateway,woo:shipping,woo:email,woo:order-status,woo:product-type,woo:blocks,woo:action-scheduler,woo:store-api,woo:my-account)
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
	const list = modulesStr.split(',').map(m => m.trim()).filter(Boolean);
	return [...new Set(list)];
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
			console.error(`${icon('❌', '[x]')} Error: --name is required when --yes is set.`);
			process.exit(1);
		}
		if (!flags.out) {
			console.error(`${icon('❌', '[x]')} Error: --out is required when --yes is set.`);
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
		const useReact = flags['no-react'] ? false : Boolean(flags.react);
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
			useReact,
			modules,
			outputDir,
			lintTarget
		};

		const validationError = validateAll(answers);
		if (validationError !== true) {
			console.error(`${icon('❌', '[x]')} Validation failed: ${validationError}`);
			process.exit(1);
		}
	} else {
		// Interactive prompts read stdin — in a pipe/CI without a TTY they'd
		// block forever waiting for input that never comes. Fail fast instead.
		if (!process.stdin.isTTY) {
			console.error(`${icon('❌', '[x]')} No interactive terminal detected (stdin is not a TTY).`);
			console.error('   Re-run non-interactively with --yes plus at least --name and --out, e.g.:');
			console.error('   npx create-wp-plugin-cli --yes --name "My Plugin" --out ./my-plugin');
			console.error('   See --help for all flags.');
			process.exit(1);
		}

		console.log(`\n${icon('🚀', '>>')} Welcome to create-wp-plugin-cli scaffold generator!\n`);

		const initialModules = flags.modules !== undefined ? parseModules(flags.modules) : [];

		// The woo: sub-modules are chosen in the secondary prompt below, not here.
		const choices = MODULE_DEFINITIONS.filter(m => !m.value.startsWith('woo:') && !m.value.startsWith('block:')).map(m => ({
			title: m.title,
			value: m.value,
			selected: initialModules.includes(m.value)
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
				initial: (prev, values) => flags.slug || slugify(values.name),
				validate: validateSlug
			},
			{
				type: 'text',
				name: 'namespace',
				message: '3. PHP namespace (e.g. MyPlugin or Vendor\\MyPlugin):',
				initial: (prev, values) => flags.namespace || suggestNamespace(values.name),
				validate: validateNamespace
			},
			{
				type: 'text',
				name: 'prefix',
				message: '4. Function/constant prefix (at least 4 chars for WPCS, lowercase):',
				initial: (prev, values) => flags.prefix || suggestPrefix(values.name),
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
				type: 'select',
				name: 'lintTarget',
				message: '9. Coding standard target for composer lint:',
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
				message: '10. Include React admin app build pipeline (@wordpress/scripts, wp-admin only)?',
				initial: flags['no-react'] ? false : Boolean(flags.react)
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
				initial: (prev, values) => flags.out || `./${slugify(values.name || 'plugin')}`,
				validate: validateOutputDir
			}
		];

		answers = await prompts(questions, {
			onCancel: () => {
				console.log('\nOperation cancelled.');
				process.exit(1);
			}
		});

		if (answers.modules && answers.modules.includes('woocommerce_hooks')) {
			const wooAnswers = await prompts({
				type: 'multiselect',
				name: 'wooModules',
				message: '11a. Select WooCommerce components to include:',
				choices: WOO_SUB_MODULES.map(m => ({
					title: m.title,
					value: m.value,
					selected: m.value === 'woo:gateway' || m.value === 'woo:order-status'
				})),
				hint: '- Space to select. Return to submit'
			}, {
				onCancel: () => {
					console.log('\nOperation cancelled.');
					process.exit(1);
				}
			});

			const otherModules = answers.modules.filter(m => m !== 'woocommerce_hooks');
			answers.modules = [...otherModules, ...(wooAnswers.wooModules || [])];
		}

		if (answers.modules && answers.modules.includes('block')) {
			const blockAnswers = await prompts({
				type: 'multiselect',
				name: 'blockModules',
				message: '11b. Select block type(s) to scaffold:',
				choices: BLOCK_SUB_MODULES.map(m => ({
					title: m.title,
					value: m.value,
					selected: m.value === 'block:dynamic'
				})),
				hint: '- Space to select. Return to submit'
			}, {
				onCancel: () => {
					console.log('\nOperation cancelled.');
					process.exit(1);
				}
			});

			const otherModules = answers.modules.filter(m => m !== 'block');
			answers.modules = [...otherModules, ...(blockAnswers.blockModules || [])];
		}

		if (!answers.name) {
			console.log('\nOperation cancelled.');
			process.exit(1);
		}

		// Per-field prompt validators can't see the whole picture (and the
		// WooCommerce sub-module merge above happens after they've run), so
		// re-check the assembled answers the same way --yes mode does.
		const validationError = validateAll(answers);
		if (validationError !== true) {
			console.error(`${icon('❌', '[x]')} ${validationError}`);
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
		console.error(`\n${icon('❌', '[x]')} Error: ${err.message}`);
		process.exit(1);
	}
}

export function runGenerator(answers) {
	answers.outputDir = answers.outputDir || answers.out;
	const targetDir = path.resolve(process.cwd(), answers.outputDir);

	if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
		throw new Error(`Directory "${answers.outputDir}" already exists and is not empty.`);
	}

	// If anything below throws, tear down what we started writing — but never
	// delete a directory that already existed before this run (the user may
	// have pointed us at an intentionally-empty one).
	const targetDirPreExisted = fs.existsSync(targetDir);
	fs.mkdirSync(targetDir, { recursive: true });

	try {
		scaffoldInto(answers, targetDir);
	} catch (err) {
		if (!targetDirPreExisted) {
			try {
				fs.rmSync(targetDir, { recursive: true, force: true });
			} catch {
				// Best-effort rollback; the original error is what matters.
			}
		}
		throw err;
	}
}

function scaffoldInto(answers, targetDir) {
	const rawModules = answers.modules || [];
	const selectedModules = normalizeModules(rawModules);
	const hasInteractivity = selectedModules.includes('interactivity');
	const hasBlockDynamic = selectedModules.includes('block:dynamic');
	const hasBlockStatic = selectedModules.includes('block:static');
	const hasBlock = hasBlockDynamic || hasBlockStatic;

	const hasWooGateway = selectedModules.includes('woo:gateway');
	const hasWooShipping = selectedModules.includes('woo:shipping');
	const hasWooEmail = selectedModules.includes('woo:email');
	const hasWooProductType = selectedModules.includes('woo:product-type');
	const hasWooBlocks = selectedModules.includes('woo:blocks');
	const hasWooOrderStatus = selectedModules.includes('woo:order-status');
	const hasWooActionScheduler = selectedModules.includes('woo:action-scheduler');
	const hasWooStoreApi = selectedModules.includes('woo:store-api');
	const hasWooMyAccount = selectedModules.includes('woo:my-account');

	const hasAnyWoo = hasWooGateway || hasWooShipping || hasWooEmail || hasWooProductType ||
		hasWooBlocks || hasWooOrderStatus || hasWooActionScheduler || hasWooStoreApi || hasWooMyAccount;
	const hasWooJs = hasWooGateway || hasWooBlocks;

	const requiredPlugins = [];
	if (selectedModules.includes('elementor_widget')) requiredPlugins.push('elementor');
	if (hasAnyWoo) requiredPlugins.push('woocommerce');

	let pluginHeaderExtra = '';
	if (requiredPlugins.length > 0) {
		pluginHeaderExtra += ` * Requires Plugins: ${requiredPlugins.join(', ')}\n`;
	}
	if (selectedModules.includes('elementor_widget')) {
		pluginHeaderExtra += ' * Elementor tested up to: 3.27.0\n * Elementor Pro tested up to: 3.27.0\n';
	}

	// The Interactivity API (wp_interactivity_state, Script Modules) requires WP 6.5+.
	// The Cart Summary block's block.json "render" field requires WP 6.4+.
	// Interactivity API + Script Modules need 6.5; WooCommerce Cart/Checkout
	// block registration needs 6.4; block.json apiVersion 3 needs 6.3.
	const requiredWpVersion = hasInteractivity ? '6.5' : hasWooBlocks ? '6.4' : hasBlock ? '6.3' : '6.0';

	const lintTarget = ['wp-org', 'vip', 'both'].includes(answers.lintTarget) ? answers.lintTarget : 'wp-org';
	const needsVip = lintTarget === 'vip' || lintTarget === 'both';

	// php-stubs/woocommerce-stubs gives PHPCS/Intelephense real class definitions for
	// WC_Payment_Gateway, WC_Shipping_Method, WC_Email, WC_Product, etc. automattic/vipwpcs
	// (the WordPress-VIP-Go phpcs ruleset) only needs pulling in when targeting VIP.
	const composerExtraRequireDevEntries = [];
	if (hasAnyWoo) composerExtraRequireDevEntries.push('"php-stubs/woocommerce-stubs": "^9.0"');
	if (needsVip) composerExtraRequireDevEntries.push('"automattic/vipwpcs": "^3.0"');
	const composerExtraRequireDev = composerExtraRequireDevEntries.length > 0
		? ',\n\t\t' + composerExtraRequireDevEntries.join(',\n\t\t')
		: '';

	let woocommerceHpos = '';
	if (hasAnyWoo) {
		const compatDeclarations = [
			`\\Automattic\\WooCommerce\\Utilities\\FeaturesUtil::declare_compatibility( 'custom_order_tables', ${answers.prefix.toUpperCase()}_FILE, true );`
		];
		if (hasWooBlocks || hasWooGateway) {
			compatDeclarations.push(
				`\\Automattic\\WooCommerce\\Utilities\\FeaturesUtil::declare_compatibility( 'cart_checkout_blocks', ${answers.prefix.toUpperCase()}_FILE, true );`
			);
		}
		if (hasWooProductType) {
			compatDeclarations.push(
				`\\Automattic\\WooCommerce\\Utilities\\FeaturesUtil::declare_compatibility( 'product_block_editor', ${answers.prefix.toUpperCase()}_FILE, true );`
			);
		}

		woocommerceHpos = `add_action(
	'before_woocommerce_init',
	function () {
		if ( class_exists( \\Automattic\\WooCommerce\\Utilities\\FeaturesUtil::class ) ) {
			${compatDeclarations.join('\n\t\t\t')}
		}
	}
);\n\n`;
	}

	// Flag table for the template engine's {{#if flag}} / {{#unless flag}}
	// conditionals. This is where a template's optional sections are driven
	// from — adding an optional block to a template means adding a
	// {{#if my_flag}} to it and (if new) one entry here, never a new
	// pre-built string token + placeholder.
	const templateFlags = {
		use_react: Boolean(answers.useReact),
		interactivity: hasInteractivity,
		block: hasBlock,
		has_webpack_build: Boolean(answers.useReact) || hasWooJs || hasBlock,
		needs_build_pipeline: Boolean(answers.useReact) || hasInteractivity || hasWooJs || hasBlock,
		admin_settings: selectedModules.includes('admin_settings'),
		elementor_widget: selectedModules.includes('elementor_widget'),
		cli: selectedModules.includes('cli'),
		integration_tests: selectedModules.includes('integration_tests'),
		// Keep in sync with the uninstallLines.push() branches below: uninstall.php
		// + Core\Uninstaller only ship when one of these modules persists state.
		has_uninstall: ['admin_settings', 'cron', 'custom_table', 'elementor_widget'].some(m => selectedModules.includes(m)),
		has_woo: hasAnyWoo,
		lint_wp_org: lintTarget === 'wp-org' || lintTarget === 'both',
		lint_vip: needsVip
	};

	// readme.txt "Contributors" are WordPress.org user logins — lowercase
	// alphanumeric, no spaces — not a display name (a name with spaces/caps is
	// an automatic review rejection). Best-effort from the author name.
	const contributorSlug = (answers.authorName || '')
		.toLowerCase()
		.replace(/[^a-z0-9]/g, '')
		.slice(0, 60) || 'yourusername';

	// readme.txt "Tags": WordPress.org review rejects generic terms
	// ("wordpress", "plugin") and only counts the first 5. Derive something
	// specific from the selected modules; fall back to distinctive words from
	// the plugin name.
	const readmeTagList = [];
	if (hasAnyWoo) readmeTagList.push('woocommerce');
	if (selectedModules.includes('elementor_widget')) readmeTagList.push('elementor');
	if (hasInteractivity) readmeTagList.push('interactivity api');
	if (hasBlock) readmeTagList.push('block');
	if (selectedModules.includes('cpt_taxonomy')) readmeTagList.push('custom post type');
	if (selectedModules.includes('rest_api')) readmeTagList.push('rest api');
	if (selectedModules.includes('custom_table')) readmeTagList.push('database');
	if (selectedModules.includes('cron')) readmeTagList.push('cron');
	if (selectedModules.includes('admin_settings')) readmeTagList.push('settings');
	if (readmeTagList.length === 0) {
		const stop = new Set(['the', 'a', 'an', 'for', 'and', 'of', 'to', 'plugin', 'wordpress', 'wp']);
		for (const word of answers.name.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)) {
			if (!stop.has(word) && !readmeTagList.includes(word)) readmeTagList.push(word);
		}
	}
	const readmeTags = readmeTagList.slice(0, 5).join(', ') || 'utility';

	const replacements = {
		'{{PLUGIN_NAME}}': answers.name,
		// Same value; processTemplateContent escapes this one for a PHP
		// single-quoted string context (inside __(), sprintf(), …) while
		// {{PLUGIN_NAME}} is sanitised for comment/header context instead.
		'{{PLUGIN_NAME_ESC}}': answers.name,
		'{{SLUG}}': answers.slug,
		'{{NS}}': answers.namespace,
		'{{NS_ROOT}}': answers.namespace.split('\\')[0],
		'{{NS_ESCAPED}}': answers.namespace.replace(/\\/g, '\\\\'),
		'{{PREFIX}}': answers.prefix.toLowerCase(),
		'{{PREFIX_UPPER}}': answers.prefix.toUpperCase(),
		'{{AUTHOR}}': answers.authorName,
		'{{AUTHOR_EMAIL}}': answers.authorEmail || 'author@example.com',
		'{{CONTRIBUTOR}}': contributorSlug,
		'{{TAGS}}': readmeTags,
		'{{COMPOSER_VENDOR}}': slugify(answers.authorName) || 'vendor',
		'{{AUTHOR_URI}}': answers.authorUri,
		'{{DESCRIPTION}}': answers.description,
		'{{MIN_PHP}}': MIN_PHP,
		'{{REQUIRES_AT_LEAST}}': requiredWpVersion,
		// readme.txt "Tested up to". A generated scaffold can't know the WP
		// release it'll be tested against, so seed a recent stable floor the
		// developer bumps per release — never below what the plugin requires.
		'{{TESTED_UP_TO}}': parseFloat(requiredWpVersion) > 6.9 ? requiredWpVersion : '6.9',
		'{{VERSION}}': '1.0.0',
		'{{YEAR}}': new Date().getFullYear().toString(),
		'{{PLUGIN_HEADER_EXTRA}}': pluginHeaderExtra,
		'{{WOOCOMMERCE_HPOS}}': woocommerceHpos,
		'{{COMPOSER_EXTRA_REQUIRE_DEV}}': composerExtraRequireDev,
		// Overridden below when a JS build pipeline is present; empty otherwise
		// so the always-scaffolded package.json (packaging + JS/CSS lint) is
		// still valid JSON for a pure-PHP plugin.
		'{{PACKAGE_EXTRA_SCRIPTS}}': '',
		'{{PACKAGE_EXTRA_DEV_DEPENDENCIES}}': ''
	};

	function processTemplateContent(content, destRelativePath = '') {
		// Conditionals first, so {{TOKEN}}s inside a kept block still get
		// substituted by the loop below and dropped blocks cost nothing.
		let result = applyConditionals(content, templateFlags);
		const isJson = destRelativePath.endsWith('.json');

		const textTokens = new Set([
			'{{PLUGIN_NAME}}',
			'{{DESCRIPTION}}',
			'{{AUTHOR}}',
			'{{AUTHOR_EMAIL}}',
			'{{AUTHOR_URI}}',
			'{{SLUG}}'
		]);
		// Free-text tokens that land in a plugin header / docblock / readme,
		// where a literal `*/` closes the comment early and a newline injects
		// a bogus header line.
		const commentTokens = new Set([ '{{PLUGIN_NAME}}', '{{DESCRIPTION}}', '{{AUTHOR}}' ]);
		const commentSafe = (v) => v.replace( /\*\//g, '* /' ).replace( /[\r\n]+/g, ' ' );
		// Same tokens when they land inside a PHP single-quoted string
		// (backslash first, then the quote).
		const phpStringSafe = (v) => v.replace( /\\/g, '\\\\' ).replace( /'/g, "\\'" ).replace( /[\r\n]+/g, ' ' );

		for (const [key, val] of Object.entries(replacements)) {
			let safeVal = val;
			if (typeof val === 'string') {
				if (isJson && textTokens.has(key)) {
					safeVal = JSON.stringify(val).slice(1, -1);
				} else if (key === '{{PLUGIN_NAME_ESC}}') {
					safeVal = phpStringSafe(val);
				} else if (! isJson && commentTokens.has(key)) {
					safeVal = commentSafe(val);
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

	// Copy standard templates. (src/Services.php and src/Plugin.php are written
	// further down, after their dynamic bodies are assembled.)
	writeTemplateFile(path.join(templatesDir, 'src/Contracts/Activatable.php'), 'src/Contracts/Activatable.php');
	writeTemplateFile(path.join(templatesDir, 'src/Contracts/Deactivatable.php'), 'src/Contracts/Deactivatable.php');
	writeTemplateFile(path.join(templatesDir, 'plugin-main.php'), `${answers.slug}.php`);
	writeTemplateFile(path.join(templatesDir, 'composer.json'), 'composer.json');
	writeTemplateFile(path.join(templatesDir, 'phpcs.xml'), 'phpcs.xml');
	writeTemplateFile(path.join(templatesDir, 'tests/bootstrap.php'), 'tests/bootstrap.php');
	writeTemplateFile(path.join(templatesDir, 'phpunit.xml.dist'), 'phpunit.xml.dist');
	writeTemplateFile(path.join(templatesDir, 'tests/Unit/Example_Test.php'), 'tests/Unit/Example_Test.php');
	writeTemplateFile(path.join(templatesDir, 'tests/Unit/Services_Test.php'), 'tests/Unit/Services_Test.php');
	writeTemplateFile(path.join(templatesDir, 'gitignore.tpl'), '.gitignore');
	writeTemplateFile(path.join(templatesDir, 'editorconfig.tpl'), '.editorconfig');
	writeTemplateFile(path.join(templatesDir, 'LICENSE'), 'LICENSE');
	writeTemplateFile(path.join(templatesDir, 'readme.txt'), 'readme.txt');
	writeTemplateFile(path.join(templatesDir, 'languages/.gitkeep'), 'languages/.gitkeep');

	// .wp-env.json backs both `wp-env start` for the integration suite and the
	// running site Playwright drives, so it ships when either is present.
	if (templateFlags.integration_tests || templateFlags.needs_build_pipeline) {
		writeTemplateFile(path.join(templatesDir, '.wp-env.json'), '.wp-env.json');
	}

	if (selectedModules.includes('integration_tests')) {
		// Real-WordPress integration suite (wp-phpunit/wp-phpunit), separate from the
		// Brain Monkey unit suite — needs a MySQL test DB, run via `composer test:integration`.
		writeTemplateFile(path.join(templatesDir, 'tests/bootstrap-integration.php'), 'tests/bootstrap-integration.php');
		writeTemplateFile(path.join(templatesDir, 'phpunit-integration.xml.dist'), 'phpunit-integration.xml.dist');
		writeTemplateFile(path.join(templatesDir, 'tests/Integration/Plugin_Boot_Test.php'), 'tests/Integration/Plugin_Boot_Test.php');
	}

	if (selectedModules.includes('editor_config')) {
		writeTemplateFile(path.join(templatesDir, '.vscode/php.code-snippets'), '.vscode/php.code-snippets');
		writeTemplateFile(path.join(templatesDir, '.vscode/extensions.json'), '.vscode/extensions.json');
		writeTemplateFile(path.join(templatesDir, '.vscode/settings.json'), '.vscode/settings.json');
	}

	// Each module contributes a `( new X() )->init_hooks();` line to Plugin::boot()
	// ({{BOOTLOADER_LINES}}); WooCommerce modules go in wooBootLines and get wrapped
	// in one class_exists( 'WooCommerce' ) guard. servicesAccessors holds the PHP for
	// each shared-service getter on the Services locator ({{SERVICES_ACCESSORS}}).
	const bootLines = [];
	const wooBootLines = [];
	const servicesAccessors = [];

	// One memoised getter on Services: name() -> new <Type>(). $short is the
	// class name relative to the plugin root namespace (Services lives there).
	function servicesAccessor(name, short) {
		const type = short.split('\\').pop();
		return [
			'\t/**',
			`\t * Shared ${type} instance.`,
			'\t *',
			`\t * @return ${short}`,
			'\t */',
			`\tpublic static function ${name}(): ${short} {`,
			`\t\treturn self::$instances['${name}'] ??= new ${short}();`,
			'\t}',
			'',
		].join('\n');
	}

	if (selectedModules.includes('cli')) {
		writeTemplateFile(path.join(templatesDir, 'src/CLI/Commands.php'), 'src/CLI/Commands.php');
		writeTemplateFile(path.join(templatesDir, 'tests/Unit/Commands_Test.php'), 'tests/Unit/Commands_Test.php');
		bootLines.push("\t\tif ( defined( 'WP_CLI' ) && WP_CLI ) {\n\t\t\t( new CLI\\Commands() )->init_hooks();\n\t\t}");
	}
	if (selectedModules.includes('admin_settings')) {
		writeTemplateFile(path.join(templatesDir, 'src/Admin/Settings_Repository.php'), 'src/Admin/Settings_Repository.php');
		writeTemplateFile(path.join(templatesDir, 'src/Admin/Settings_Registrar.php'), 'src/Admin/Settings_Registrar.php');
		writeTemplateFile(path.join(templatesDir, 'src/Admin/views/sample-field.php'), 'src/Admin/views/sample-field.php');
		writeTemplateFile(path.join(templatesDir, 'tests/Unit/Settings_Repository_Test.php'), 'tests/Unit/Settings_Repository_Test.php');
		// The React mount point is a {{#if use_react}} block inside the view now.
		writeTemplateFile(path.join(templatesDir, 'src/Admin/views/settings-page.php'), 'src/Admin/views/settings-page.php');

		bootLines.push('\t\t( new Admin\\Settings_Registrar( Services::settings_repository() ) )->init_hooks();');
		servicesAccessors.push(servicesAccessor('settings_repository', 'Admin\\Settings_Repository'));
	}
	if (selectedModules.includes('shortcode')) {
		writeTemplateFile(path.join(templatesDir, 'src/Frontend/Shortcode.php'), 'src/Frontend/Shortcode.php');
		writeTemplateFile(path.join(templatesDir, 'tests/Unit/Shortcode_Test.php'), 'tests/Unit/Shortcode_Test.php');
		bootLines.push('\t\t( new Frontend\\Shortcode() )->init_hooks();');
	}
	if (selectedModules.includes('rest_api')) {
		writeTemplateFile(path.join(templatesDir, 'src/Rest/Rest_Controller.php'), 'src/Rest/Rest_Controller.php');
		writeTemplateFile(path.join(templatesDir, 'tests/Unit/Rest_Controller_Test.php'), 'tests/Unit/Rest_Controller_Test.php');
		bootLines.push('\t\t( new Rest\\Rest_Controller() )->init_hooks();');
	}
	if (selectedModules.includes('ajax_handler')) {
		writeTemplateFile(path.join(templatesDir, 'src/Ajax/Ajax_Handler.php'), 'src/Ajax/Ajax_Handler.php');
		writeTemplateFile(path.join(templatesDir, 'tests/Unit/Ajax_Handler_Test.php'), 'tests/Unit/Ajax_Handler_Test.php');
		// The only thing that enqueues assets/js/main.js is this handler's
		// front-end script (a nonce-guarded fetch wired to a click), so the
		// file rides along with the module instead of the baseline.
		writeTemplateFile(path.join(templatesDir, 'assets/js/main.js'), 'assets/js/main.js');
		bootLines.push('\t\t( new Ajax\\Ajax_Handler() )->init_hooks();');
	}
	if (selectedModules.includes('cpt_taxonomy')) {
		writeTemplateFile(path.join(templatesDir, 'src/PostTypes/Post_Types.php'), 'src/PostTypes/Post_Types.php');
		writeTemplateFile(path.join(templatesDir, 'tests/Unit/Post_Types_Test.php'), 'tests/Unit/Post_Types_Test.php');
		bootLines.push('\t\t( new PostTypes\\Post_Types() )->init_hooks();');
	}
	if (selectedModules.includes('cron')) {
		writeTemplateFile(path.join(templatesDir, 'src/Cron/Scheduler.php'), 'src/Cron/Scheduler.php');
		writeTemplateFile(path.join(templatesDir, 'tests/Unit/Scheduler_Test.php'), 'tests/Unit/Scheduler_Test.php');
		bootLines.push('\t\t( new Cron\\Scheduler() )->init_hooks();');
	}
	if (selectedModules.includes('caching')) {
		writeTemplateFile(path.join(templatesDir, 'src/Cache/Cache_Service.php'), 'src/Cache/Cache_Service.php');
		writeTemplateFile(path.join(templatesDir, 'tests/Unit/Cache_Service_Test.php'), 'tests/Unit/Cache_Service_Test.php');
		servicesAccessors.push(servicesAccessor('cache', 'Cache\\Cache_Service'));
	}
	if (selectedModules.includes('custom_table')) {
		writeTemplateFile(path.join(templatesDir, 'src/Database/Schema.php'), 'src/Database/Schema.php');
		writeTemplateFile(path.join(templatesDir, 'src/Database/Item_Repository.php'), 'src/Database/Item_Repository.php');
		writeTemplateFile(path.join(templatesDir, 'tests/Unit/Schema_Test.php'), 'tests/Unit/Schema_Test.php');
		writeTemplateFile(path.join(templatesDir, 'tests/Unit/Item_Repository_Test.php'), 'tests/Unit/Item_Repository_Test.php');
		bootLines.push('\t\t( new Database\\Schema() )->init_hooks();');
		servicesAccessors.push(servicesAccessor('item_repository', 'Database\\Item_Repository'));
	}
	if (selectedModules.includes('elementor_widget')) {
		if (selectedModules.includes('editor_config')) {
			writeTemplateFile(path.join(templatesDir, '.vscode/php-elementor.code-snippets'), '.vscode/php-elementor.code-snippets');
		}
		writeTemplateFile(path.join(templatesDir, 'src/Elementor/Dependency_Notice.php'), 'src/Elementor/Dependency_Notice.php');
		writeTemplateFile(path.join(templatesDir, 'src/Elementor/Widget_Registrar.php'), 'src/Elementor/Widget_Registrar.php');
		writeTemplateFile(path.join(templatesDir, 'src/Widgets/Sample_Widget.php'), 'src/Widgets/Sample_Widget.php');
		writeTemplateFile(path.join(templatesDir, 'assets/css/widgets/sample-widget.css'), 'assets/css/widgets/sample-widget.css');
		writeTemplateFile(path.join(templatesDir, 'assets/js/widgets/sample-widget.js'), 'assets/js/widgets/sample-widget.js');
		writeTemplateFile(path.join(templatesDir, 'tests/Unit/Widget_Registrar_Test.php'), 'tests/Unit/Widget_Registrar_Test.php');
		bootLines.push('\t\t( new Elementor\\Dependency_Notice() )->init_hooks();');
		bootLines.push('\t\t( new Elementor\\Widget_Registrar() )->init_hooks();');
	}
	if (hasWooGateway) {
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Providers/Gateway_Provider.php'), 'src/Woo/Providers/Gateway_Provider.php');
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Gateways/Gateway.php'), 'src/Woo/Gateways/Gateway.php');
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Gateways/Blocks_Payment_Method_Type.php'), 'src/Woo/Gateways/Blocks_Payment_Method_Type.php');
		writeTemplateFile(path.join(templatesDir, 'react/assets/src/wc-gateway-block.js'), 'assets/src/wc-gateway-block.js');
		writeTemplateFile(path.join(templatesDir, 'tests/Unit/Gateway_Test.php'), 'tests/Unit/Gateway_Test.php');
		wooBootLines.push('\t\t\t( new Woo\\Providers\\Gateway_Provider() )->init_hooks();');
	}
	if (hasWooShipping) {
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Providers/Shipping_Provider.php'), 'src/Woo/Providers/Shipping_Provider.php');
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Shipping/Shipping_Method.php'), 'src/Woo/Shipping/Shipping_Method.php');
		writeTemplateFile(path.join(templatesDir, 'tests/Unit/Shipping_Method_Test.php'), 'tests/Unit/Shipping_Method_Test.php');
		wooBootLines.push('\t\t\t( new Woo\\Providers\\Shipping_Provider() )->init_hooks();');
	}
	if (hasWooEmail) {
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Providers/Email_Provider.php'), 'src/Woo/Providers/Email_Provider.php');
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Emails/Custom_Email.php'), 'src/Woo/Emails/Custom_Email.php');
		writeTemplateFile(path.join(templatesDir, 'woo-email-templates/emails/custom-email.php'), `templates/emails/${answers.prefix.toLowerCase()}-custom-email.php`);
		writeTemplateFile(path.join(templatesDir, 'woo-email-templates/emails/plain/custom-email.php'), `templates/emails/plain/${answers.prefix.toLowerCase()}-custom-email.php`);
		writeTemplateFile(path.join(templatesDir, 'tests/Unit/Custom_Email_Test.php'), 'tests/Unit/Custom_Email_Test.php');
		wooBootLines.push('\t\t\t( new Woo\\Providers\\Email_Provider() )->init_hooks();');
	}
	if (hasWooProductType) {
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Providers/Product_Type_Provider.php'), 'src/Woo/Providers/Product_Type_Provider.php');
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Products/Custom_Product.php'), 'src/Woo/Products/Custom_Product.php');
		writeTemplateFile(path.join(templatesDir, 'tests/Unit/Custom_Product_Test.php'), 'tests/Unit/Custom_Product_Test.php');
		wooBootLines.push('\t\t\t( new Woo\\Providers\\Product_Type_Provider() )->init_hooks();');
	}
	if (hasWooBlocks) {
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Providers/Blocks_Provider.php'), 'src/Woo/Providers/Blocks_Provider.php');
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Blocks/Integration.php'), 'src/Woo/Blocks/Integration.php');
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Blocks/Cart_Summary_Block.php'), 'src/Woo/Blocks/Cart_Summary_Block.php');
		writeTemplateFile(path.join(templatesDir, 'react/assets/src/blocks-integration.js'), 'assets/src/blocks-integration.js');
		writeTemplateFile(path.join(templatesDir, 'react/assets/src/blocks/cart-summary/block.json'), 'assets/src/blocks/cart-summary/block.json');
		writeTemplateFile(path.join(templatesDir, 'react/assets/src/blocks/cart-summary/index.js'), 'assets/src/blocks/cart-summary/index.js');
		writeTemplateFile(path.join(templatesDir, 'react/assets/src/blocks/cart-summary/render.php'), 'assets/src/blocks/cart-summary/render.php');
		writeTemplateFile(path.join(templatesDir, 'tests/Unit/Cart_Summary_Block_Test.php'), 'tests/Unit/Cart_Summary_Block_Test.php');
		wooBootLines.push('\t\t\t( new Woo\\Providers\\Blocks_Provider() )->init_hooks();');
	}
	if (hasWooOrderStatus) {
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Providers/Order_Status_Provider.php'), 'src/Woo/Providers/Order_Status_Provider.php');
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Orders/Order_Status_Service.php'), 'src/Woo/Orders/Order_Status_Service.php');
		writeTemplateFile(path.join(templatesDir, 'tests/Unit/Order_Status_Service_Test.php'), 'tests/Unit/Order_Status_Service_Test.php');
		wooBootLines.push('\t\t\t( new Woo\\Providers\\Order_Status_Provider( Services::order_status_service() ) )->init_hooks();');
		servicesAccessors.push(servicesAccessor('order_status_service', 'Woo\\Orders\\Order_Status_Service'));
	}
	if (hasWooActionScheduler) {
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Providers/Action_Scheduler_Provider.php'), 'src/Woo/Providers/Action_Scheduler_Provider.php');
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Tasks/Action_Scheduler_Service.php'), 'src/Woo/Tasks/Action_Scheduler_Service.php');
		writeTemplateFile(path.join(templatesDir, 'tests/Unit/Action_Scheduler_Service_Test.php'), 'tests/Unit/Action_Scheduler_Service_Test.php');
		wooBootLines.push('\t\t\t( new Woo\\Providers\\Action_Scheduler_Provider( Services::action_scheduler_service() ) )->init_hooks();');
		servicesAccessors.push(servicesAccessor('action_scheduler_service', 'Woo\\Tasks\\Action_Scheduler_Service'));
	}
	if (hasWooStoreApi) {
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Providers/Store_Api_Provider.php'), 'src/Woo/Providers/Store_Api_Provider.php');
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Api/Store_Api_Extension.php'), 'src/Woo/Api/Store_Api_Extension.php');
		writeTemplateFile(path.join(templatesDir, 'tests/Unit/Store_Api_Extension_Test.php'), 'tests/Unit/Store_Api_Extension_Test.php');
		wooBootLines.push('\t\t\t( new Woo\\Providers\\Store_Api_Provider( Services::store_api_extension() ) )->init_hooks();');
		servicesAccessors.push(servicesAccessor('store_api_extension', 'Woo\\Api\\Store_Api_Extension'));
	}
	if (hasWooMyAccount) {
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Providers/Account_Endpoint_Provider.php'), 'src/Woo/Providers/Account_Endpoint_Provider.php');
		writeTemplateFile(path.join(templatesDir, 'src/Woo/Account/Account_Endpoint_Service.php'), 'src/Woo/Account/Account_Endpoint_Service.php');
		writeTemplateFile(path.join(templatesDir, 'woo-account-templates/my-account/custom-endpoint.php'), `templates/my-account/${answers.prefix.toLowerCase()}-custom.php`);
		writeTemplateFile(path.join(templatesDir, 'tests/Unit/Account_Endpoint_Service_Test.php'), 'tests/Unit/Account_Endpoint_Service_Test.php');
		wooBootLines.push('\t\t\t( new Woo\\Providers\\Account_Endpoint_Provider( Services::account_endpoint_service() ) )->init_hooks();');
		servicesAccessors.push(servicesAccessor('account_endpoint_service', 'Woo\\Account\\Account_Endpoint_Service'));
	}
	if (selectedModules.includes('interactivity')) {
		writeTemplateFile(path.join(templatesDir, 'src/Frontend/Interactivity.php'), 'src/Frontend/Interactivity.php');
		// Hand-written ESM served directly as a script module — no build step.
		writeTemplateFile(path.join(templatesDir, 'interactivity/view.js'), 'assets/js/view.js');
		bootLines.push('\t\t( new Frontend\\Interactivity() )->init_hooks();');
	}
	if (hasBlock) {
		// Block_Registrar globs assets/build/blocks/*, so it's variant-agnostic;
		// only the source folders + JS tests below depend on which type(s) were
		// selected.
		writeTemplateFile(path.join(templatesDir, 'src/Blocks/Block_Registrar.php'), 'src/Blocks/Block_Registrar.php');
		writeTemplateFile(path.join(templatesDir, 'tests/Unit/Block_Registrar_Test.php'), 'tests/Unit/Block_Registrar_Test.php');
		if (hasBlockDynamic) {
			writeTemplateFile(path.join(templatesDir, 'blocks/example/block.json'), 'assets/src/blocks/example/block.json');
			writeTemplateFile(path.join(templatesDir, 'blocks/example/index.js'), 'assets/src/blocks/example/index.js');
			writeTemplateFile(path.join(templatesDir, 'blocks/example/edit.js'), 'assets/src/blocks/example/edit.js');
			writeTemplateFile(path.join(templatesDir, 'blocks/example/render.php'), 'assets/src/blocks/example/render.php');
		}
		if (hasBlockStatic) {
			writeTemplateFile(path.join(templatesDir, 'blocks/example-static/block.json'), 'assets/src/blocks/example-static/block.json');
			writeTemplateFile(path.join(templatesDir, 'blocks/example-static/index.js'), 'assets/src/blocks/example-static/index.js');
			writeTemplateFile(path.join(templatesDir, 'blocks/example-static/edit.js'), 'assets/src/blocks/example-static/edit.js');
			writeTemplateFile(path.join(templatesDir, 'blocks/example-static/save.js'), 'assets/src/blocks/example-static/save.js');
		}
		bootLines.push('\t\t( new Blocks\\Block_Registrar() )->init_hooks();');
	}

	// React admin app (wp-admin only) + WooCommerce Blocks/Gateway + native
	// blocks all compile through one @wordpress/scripts build:
	// useReact       -> assets/src/index.js (wp-admin React app)
	// block          -> assets/src/blocks/example (native block.json, auto-built)
	// woo:gateway    -> assets/src/wc-gateway-block.js (block checkout payment method)
	// woo:blocks     -> assets/src/blocks-integration.js + assets/src/blocks/cart-summary
	// The Interactivity view is hand-written ESM (assets/js/view.js) served as
	// a script module — WordPress's import map resolves `@wordpress/interactivity`,
	// so it needs no build step.
	const hasWebpackBuild = answers.useReact || hasWooJs || hasBlock;
	const needsBuildPipeline = hasWebpackBuild || hasInteractivity;

	// The Jest unit-test setup (jest.config.js + preset + testing-library) ships
	// with anything that has authored JS worth unit-testing.
	const wantsJest = answers.useReact || hasInteractivity || hasBlock;

	let ciNodeJob = '';

	if (answers.useReact) {
		writeTemplateFile(path.join(templatesDir, 'react/assets/src/index.js'), 'assets/src/index.js');
		// Assets.php scopes its enqueue via a {{#if admin_settings}}/{{else}} block.
		writeTemplateFile(path.join(templatesDir, 'src/Admin/Assets.php'), 'src/Admin/Assets.php');
		bootLines.push('\t\t( new Admin\\Assets() )->init_hooks();');
	}

	if (needsBuildPipeline) {
		// Playwright E2E + the build/start scripts layer on top of the base
		// package.json (which every scaffold now gets for packaging + lint).
		const packageExtraScriptsEntries = ['"test:e2e": "playwright test"'];
		const packageExtraDevDependenciesEntries = [
			'"@playwright/test": "^1.47.0"',
			'"@wordpress/e2e-test-utils-playwright": "^1.54.0"'
		];
		if (wantsJest) {
			packageExtraScriptsEntries.push('"test:js": "wp-scripts test-unit-js"');
			packageExtraScriptsEntries.push('"test": "npm run test:js"');
			packageExtraDevDependenciesEntries.push('"@wordpress/jest-preset-default": "^14.0.0"');
			packageExtraDevDependenciesEntries.push('"@testing-library/react": "^16.0.0"');
			packageExtraDevDependenciesEntries.push('"@testing-library/jest-dom": "^6.0.0"');
		}
		// @wordpress/* runtime packages the authored JS imports. wp-scripts'
		// dependency-extraction plugin still externalises these at build time
		// (they don't bloat the bundle), but listing them keeps `npm run
		// lint:js` import-resolution happy and gives editors real types.
		if (hasBlock) {
			packageExtraDevDependenciesEntries.push('"@wordpress/blocks": "^15.0.0"');
			packageExtraDevDependenciesEntries.push('"@wordpress/block-editor": "^17.0.0"');
		}
		if (hasBlock || answers.useReact) {
			packageExtraDevDependenciesEntries.push('"@wordpress/i18n": "^6.0.0"');
		}
		if (answers.useReact) {
			packageExtraDevDependenciesEntries.push('"@wordpress/element": "^8.0.0"');
		}
		if (hasInteractivity) {
			packageExtraDevDependenciesEntries.push('"@wordpress/interactivity": "^6.0.0"');
		}
		const packageExtraScripts = ',\n\t\t' + packageExtraScriptsEntries.join(',\n\t\t');
		const packageExtraDevDependencies = ',\n\t\t' + packageExtraDevDependenciesEntries.join(',\n\t\t');
		replacements['{{PACKAGE_EXTRA_SCRIPTS}}'] = packageExtraScripts;
		replacements['{{PACKAGE_EXTRA_DEV_DEPENDENCIES}}'] = packageExtraDevDependencies;

		writeTemplateFile(path.join(templatesDir, 'playwright.config.js'), 'playwright.config.js');
		writeTemplateFile(path.join(templatesDir, 'tests/e2e/homepage.spec.js'), 'tests/e2e/homepage.spec.js');
		if (selectedModules.includes('admin_settings')) {
			writeTemplateFile(path.join(templatesDir, 'tests/e2e/settings-page.spec.js'), 'tests/e2e/settings-page.spec.js');
		}
		if (wantsJest) {
			writeTemplateFile(path.join(templatesDir, 'jest.config.js'), 'jest.config.js');
		}
		if (answers.useReact) {
			writeTemplateFile(path.join(templatesDir, 'tests/js/App.test.js'), 'tests/js/App.test.js');
		}
		if (hasInteractivity) {
			writeTemplateFile(path.join(templatesDir, 'tests/js/view.test.js'), 'tests/js/view.test.js');
		}
		if (hasBlockDynamic) {
			writeTemplateFile(path.join(templatesDir, 'tests/js/block.test.js'), 'tests/js/block.test.js');
		}
		if (hasBlockStatic) {
			writeTemplateFile(path.join(templatesDir, 'tests/js/block-static.test.js'), 'tests/js/block-static.test.js');
		}

		// wp-scripts auto-detects a single "src/index.js" entry (or, if any
		// block.json exists under the src dir, ONLY the entries it derives from
		// block.json files — "src/index.js" is silently dropped in that case).
		// We override entry resolution via webpack.config.js when we ship the
		// WooCommerce Blocks gateway/integration scripts, or the admin app
		// *alongside* a native block.json (block-only mode would drop it).
		//
		// IMPORTANT: @wordpress/scripts assigns `entry` as a *function* (webpack's
		// lazy-entry form) so it can glob for block.json files at build time, not a
		// plain object — `{ ...defaultConfig.entry }` silently spreads to `{}` and
		// drops every auto-discovered block entry. It must be invoked, not spread.
		if (hasWooJs || (hasBlock && answers.useReact)) {
			const entries = [];
			if (answers.useReact) entries.push('\t\tindex: \'./assets/src/index.js\',');
			if (hasWooGateway) {
				entries.push('\t\t\'wc-gateway-block\': \'./assets/src/wc-gateway-block.js\',');
			}
			if (hasWooBlocks) {
				entries.push('\t\t\'blocks-integration\': \'./assets/src/blocks-integration.js\',');
			}

			const webpackConfig = `const path = require( 'path' );
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

/**
 * Merges our explicit entries with wp-scripts' own lazily-computed entry
 * function so native blocks (block.json under assets/src/blocks/**) keep
 * building automatically alongside them. wp-scripts loads this file
 * automatically when present at the project root.
 */
module.exports = {
	...defaultConfig,
	output: {
		...defaultConfig.output,
		path: path.resolve( process.cwd(), 'assets/build' ),
	},
	entry: () => ( {
		...( typeof defaultConfig.entry === 'function'
			? defaultConfig.entry()
			: defaultConfig.entry ),
${entries.join('\n')}
	} ),
};
`;
			fs.writeFileSync(path.join(targetDir, 'webpack.config.js'), webpackConfig, 'utf8');
		}

		const hasJsTests = wantsJest;
		ciNodeJob = `
  node-build:
    name: Build & Test JS Assets
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          # No cache: 'npm' — there's no committed package-lock.json yet, and
          # setup-node fails the step when the lockfile is missing.

      - name: Install Node Dependencies
        run: npm install

      - name: Lint JS & Styles
        run: |
          npm run lint:js
          npm run lint:style

      - name: Build Assets
        run: npm run build` + (hasJsTests ? `

      - name: Run JS Unit Tests
        run: npm run test:js` : '') + `

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Start WordPress Environment
        run: npx @wordpress/env start

      - name: Run E2E Tests
        run: npm run test:e2e`;
	}

	// Every scaffold gets a package.json: it's the distribution pipeline
	// (`npm run plugin-zip`, backed by the `files` whitelist) and the JS/CSS
	// linters (`lint:js` / `lint:style`), independent of whether there's a
	// build pipeline. `.distignore` is deliberately not generated — the
	// `files` field is the single source of truth for what ships.
	writeTemplateFile(path.join(templatesDir, 'package.json'), 'package.json');


	// Assemble Plugin::boot()'s body: non-woo module lines, then every woo
	// line inside one class_exists( 'WooCommerce' ) guard.
	const allBootLines = [...bootLines];
	if (wooBootLines.length > 0) {
		allBootLines.push("\t\tif ( class_exists( 'WooCommerce' ) ) {\n" + wooBootLines.join('\n') + '\n\t\t}');
	}
	const bootloaderBody = allBootLines.length > 0 ? allBootLines.join('\n') + '\n' : '';

	let pluginContent = fs.readFileSync(path.join(templatesDir, 'src/Plugin.php'), 'utf8');
	pluginContent = pluginContent.replace('{{BOOTLOADER_LINES}}', () => bootloaderBody);
	pluginContent = processTemplateContent(pluginContent, 'src/Plugin.php');
	const pluginDestPath = path.join(targetDir, 'src/Plugin.php');
	fs.mkdirSync(path.dirname(pluginDestPath), { recursive: true });
	fs.writeFileSync(pluginDestPath, pluginContent, 'utf8');

	// Services.php: the memoised accessors for this module set (or none).
	let servicesContent = fs.readFileSync(path.join(templatesDir, 'src/Services.php'), 'utf8');
	servicesContent = servicesContent.replace('{{SERVICES_ACCESSORS}}', () => servicesAccessors.join('\n'));
	servicesContent = processTemplateContent(servicesContent, 'src/Services.php');
	const servicesDestPath = path.join(targetDir, 'src/Services.php');
	fs.mkdirSync(path.dirname(servicesDestPath), { recursive: true });
	fs.writeFileSync(servicesDestPath, servicesContent, 'utf8');

	// Single supported PHP line — see MIN_PHP. The matrix also runs the next
	// minor so a scaffold surfaces forward-compat breakage early.
	const ciPhpMatrix = "['8.2', '8.3', '8.4']";

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
		activatorLines.push('\t\t( new \\{{NS}}\\PostTypes\\Post_Types() )->register_cpt_and_taxonomy();');
		if (needsVip) {
			// WordPress VIP forbids flush_rewrite_rules() (rewrite rules there are
			// regenerated from deploys / a permalink re-save), so rather than
			// suppress the sniff we simply don't call it under a VIP lint target.
			activatorLines.push('\t\t// Not flushing rewrite rules here: WordPress VIP disallows flush_rewrite_rules().');
			activatorLines.push('\t\t// Re-save Settings > Permalinks once after activating, or rely on your deploy.');
		} else {
			// Soft flush (no .htaccess write); the WordPress-Extra ruleset does not
			// restrict this, so no phpcs:ignore is needed.
			activatorLines.push('\t\tflush_rewrite_rules( false );');
			deactivatorLines.push('\t\tflush_rewrite_rules( false );');
		}
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
		// uninstall.php runs without the plugin booted, so the {{PREFIX}}_cache_keys
		// filter has no listeners there — the widget-discovery transient has to be
		// named explicitly, but only in a build that actually has the module.
		uninstallLines.push('\t\tdelete_transient( \'{{PREFIX}}_elementor_widgets\' );');
	}

	if (selectedModules.includes('admin_settings')) {
		uninstallLines.push('\t\tdelete_option( \'{{PREFIX}}_option_name\' );');
	}

	if (selectedModules.includes('custom_table')) {
		// dbDelta() must run synchronously on activation so the table exists
		// immediately — Schema::boot()'s plugins_loaded hook only catches
		// updates, which don't fire register_activation_hook().
		activatorLines.push('\t\t( new \\{{NS}}\\Database\\Schema() )->create_table();');
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

	// uninstall.php + Core\Uninstaller are derived, not a module toggle: a
	// scaffold only needs delete-on-uninstall cleanup when a selected module
	// actually persists something worth clearing (an option, a table, a
	// scheduled event, a transient). A zero-module / presentational scaffold
	// persists nothing but the {{PREFIX}}_version marker and ships neither file.
	// uninstall.php is a thin shell that just delegates to Uninstaller::cleanup().
	if (uninstallLines.length > 0) {
		let uninstallContent = fs.readFileSync(path.join(templatesDir, 'uninstall.php'), 'utf8');
		uninstallContent = processTemplateContent(uninstallContent, 'uninstall.php');
		fs.writeFileSync(path.join(targetDir, 'uninstall.php'), uninstallContent, 'utf8');

		let uninstallerContent = fs.readFileSync(path.join(templatesDir, 'src/Core/Uninstaller.php'), 'utf8');
		uninstallerContent = uninstallerContent.replace('{{UNINSTALL_BODY}}', () => uninstallBody);
		uninstallerContent = processTemplateContent(uninstallerContent, 'src/Core/Uninstaller.php');
		const uninstallerDestPath = path.join(targetDir, 'src/Core/Uninstaller.php');
		fs.mkdirSync(path.dirname(uninstallerDestPath), { recursive: true });
		fs.writeFileSync(uninstallerDestPath, uninstallerContent, 'utf8');
	}

	// README.md carries its own optional sections as {{#if ...}} blocks
	// (React install step, build/test scripts, Elementor conventions).
	writeTemplateFile(path.join(templatesDir, 'README.md'), 'README.md');

	console.log(`\n${icon('✅', '[ok]')} Successfully scaffolded plugin "${answers.name}" in ${answers.outputDir}!\n`);
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
	const a = path.resolve(__filename);
	const b = path.resolve(invokedPath);
	if (process.platform === 'win32') {
		return a.toLowerCase() === b.toLowerCase();
	}
	return a === b;
}

if (isRunAsScript()) {
	main().catch(err => {
		console.error('An error occurred:', err);
		process.exit(1);
	});
}
