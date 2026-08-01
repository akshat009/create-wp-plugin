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

test('suggestPrefix generates lowercase 3-4 char prefix', () => {
	assert.equal(suggestPrefix('My Awesome Plugin'), 'map');
	assert.equal(suggestPrefix('Plugin'), 'plugin');
});

test('Group 2 Validators', () => {
	assert.equal(validateName('My Plugin'), true);
	assert.equal(typeof validateName(''), 'string');

	assert.equal(validateSlug('my-plugin'), true);
	assert.equal(typeof validateSlug('My Plugin'), 'string');

	assert.equal(validatePrefix('myp'), true);
	assert.equal(typeof validatePrefix('123'), 'string');

	assert.equal(validateNamespace('MyPlugin'), true);
	assert.equal(typeof validateNamespace('MyPlugin\\Core'), 'string');

	assert.equal(validateEmail('test@example.com'), true);
	assert.equal(typeof validateEmail('invalid-email'), 'string');

	assert.equal(validateMinPhp('8.0'), true);
	assert.equal(typeof validateMinPhp('invalid'), 'string');

	assert.equal(validateOutputDir('./some-dir'), true);
	assert.equal(typeof validateOutputDir(''), 'string');

	assert.equal(validateAll({
		name: 'Test Plugin',
		slug: 'test-plugin',
		prefix: 'tp',
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

	fs.rmSync(outDir, { recursive: true, force: true });
});

