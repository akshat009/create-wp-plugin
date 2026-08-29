#!/usr/bin/env node
/**
 * End-to-end scaffold verification, cross-platform (POSIX + native Windows).
 *
 * Generates a spread of fixtures with the real CLI, then for each one runs
 * `php -l`, `composer install` + `composer lint`, `composer test`, and checks
 * for unreplaced template tokens / leftover security TODOs. Exits non-zero if
 * any fixture fails.
 *
 * A single flaky fixture (e.g. an antivirus lock during `composer install` on
 * Windows) does not hide the others — failures are collected and reported at
 * the end. Run with `npm run verify`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const cliPath = path.join(repoRoot, 'index.js');
const workDir = path.join(repoRoot, 'tmp-verify');

// composer is composer.bat on Windows, so those calls need a shell.
const shell = process.platform === 'win32';

/** Run a command, streaming its output; return true on exit code 0. */
function run(cmd, args, opts = {}) {
	return spawnSync(cmd, args, { stdio: 'inherit', shell, ...opts }).status === 0;
}

/** `composer install` retried a few times — transient packagist / file-lock hiccups. */
function composerInstall(cwd) {
	const maxAttempts = 8;
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		if (run('composer', ['install', '--no-interaction', '--prefer-dist', '--no-progress'], { cwd })) {
			return true;
		}
		if (attempt === maxAttempts) {
			console.error(`ERROR: composer install failed after ${maxAttempts} attempts.`);
			return false;
		}
		console.log(`composer install failed (attempt ${attempt}/${maxAttempts}) — cleaning vendor/ and retrying...`);
		fs.rmSync(path.join(cwd, 'vendor'), { recursive: true, force: true });
		fs.rmSync(path.join(cwd, 'composer.lock'), { force: true });
	}
	return false;
}

/** Every file under dir, skipping vendor/, node_modules/, .git/. */
function walk(dir) {
	const out = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (entry.name === 'vendor' || entry.name === 'node_modules' || entry.name === '.git') continue;
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) out.push(...walk(full));
		else out.push(full);
	}
	return out;
}

const fixtures = [
	{
		name: 'minimal',
		args: ['--name', 'Fixture Beta', '--prefix', 'fxbb', '--namespace', 'FixtureBeta', '--modules', '', '--no-react'],
	},
	{
		name: 'elementor',
		args: ['--name', 'Fixture Gamma', '--prefix', 'fxgg', '--namespace', 'FixtureGamma', '--modules', 'elementor_widget,editor_config', '--min-php', '8.2', '--no-react'],
	},
	{
		name: 'woo',
		args: ['--name', 'Fixture Delta', '--prefix', 'fxdd', '--namespace', 'FixtureDelta', '--modules', 'woocommerce_hooks', '--no-react'],
	},
	{
		name: 'vip',
		args: ['--name', 'Fixture Epsilon', '--prefix', 'fxee', '--namespace', 'FixtureEpsilon', '--modules', 'admin_settings,cpt_taxonomy', '--lint-target', 'vip', '--no-react'],
	},
	{
		name: 'full',
		args: ['--name', 'Fixture Alpha', '--prefix', 'fxaa', '--namespace', 'FixtureAlpha', '--modules', 'admin_settings,shortcode,rest_api,ajax_handler,cpt_taxonomy,cron,caching,custom_table,elementor_widget,block,woocommerce_hooks,interactivity,cli,editor_config,integration_tests', '--react'],
	},
];

fs.rmSync(workDir, { recursive: true, force: true });
fs.mkdirSync(workDir, { recursive: true });

for (const fixture of fixtures) {
	console.log(`\n==> Scaffolding fixture "${fixture.name}"...`);
	const ok = run(process.execPath, [cliPath, '--yes', ...fixture.args, '--out', path.join(workDir, fixture.name)], { cwd: repoRoot });
	if (!ok) {
		console.error(`ERROR: scaffolding "${fixture.name}" failed.`);
		process.exitCode = 1;
	}
}

const failed = [];

for (const fixture of fixtures) {
	const dir = path.join(workDir, fixture.name);
	console.log('\n==========================================');
	console.log(`Verifying fixture: ${fixture.name}`);
	console.log('==========================================');

	if (!fs.existsSync(dir)) {
		failed.push(fixture.name);
		continue;
	}

	let ok = true;
	const files = walk(dir);

	console.log('-> php -l on every generated PHP file...');
	for (const file of files.filter((f) => f.endsWith('.php'))) {
		if (!run('php', ['-l', file])) ok = false;
	}

	console.log('-> composer install + composer lint...');
	if (!composerInstall(dir) || !run('composer', ['lint'], { cwd: dir })) ok = false;

	console.log('-> composer test...');
	if (!run('composer', ['test'], { cwd: dir })) ok = false;

	console.log('-> scanning generated files for leftovers...');
	const problems = [];
	for (const file of files) {
		let text;
		try {
			text = fs.readFileSync(file, 'utf8');
		} catch {
			continue; // binary / unreadable — nothing to scan
		}
		if (text.includes('TODO: SECURITY')) {
			console.warn(`WARNING: "TODO: SECURITY" in ${path.relative(dir, file)}`);
		}
		for (const token of text.match(/\{\{[A-Z_]+\}\}/g) || []) {
			if (token !== '{{WRAPPER}}' && token !== '{{VALUE}}') {
				problems.push(`${path.relative(dir, file)}: ${token}`);
			}
		}
	}
	if (problems.length) {
		console.error(`ERROR: unreplaced tokens:\n${problems.join('\n')}`);
		ok = false;
	}

	console.log(ok ? `Fixture ${fixture.name} passed.` : `Fixture ${fixture.name} FAILED.`);
	if (!ok) failed.push(fixture.name);
}

console.log('\n==========================================');
if (failed.length === 0) {
	console.log('All verification fixtures passed.');
} else {
	console.log(`FAILED fixtures: ${failed.join(', ')}`);
	process.exitCode = 1;
}
