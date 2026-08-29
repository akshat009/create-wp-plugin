import test from 'node:test';
import assert from 'node:assert/strict';

import { applyConditionals } from '../index.js';

// --- {{#if}} -----------------------------------------------------------------

test('{{#if}} keeps the body when the flag is truthy', () => {
	assert.equal(
		applyConditionals('a{{#if go}}B{{/if}}c', { go: true }),
		'aBc'
	);
});

test('{{#if}} drops the body when the flag is falsy', () => {
	assert.equal(
		applyConditionals('a{{#if go}}B{{/if}}c', { go: false }),
		'ac'
	);
});

test('unknown flags are treated as falsy', () => {
	assert.equal(
		applyConditionals('a{{#if missing}}B{{/if}}c', {}),
		'ac'
	);
});

// --- {{#unless}} ------------------------------------------------------------

test('{{#unless}} is the inverse of {{#if}}', () => {
	assert.equal(applyConditionals('[{{#unless x}}Y{{/if}}]', { x: false }), '[Y]');
	assert.equal(applyConditionals('[{{#unless x}}Y{{/if}}]', { x: true }), '[]');
});

// --- {{else}} -------------------------------------------------------------------

test('{{else}} selects the alternate branch', () => {
	const tpl = '{{#if on}}YES{{else}}NO{{/if}}';
	assert.equal(applyConditionals(tpl, { on: true }), 'YES');
	assert.equal(applyConditionals(tpl, { on: false }), 'NO');
});

// --- nesting -----------------------------------------------------------------

test('blocks nest and resolve innermost-first', () => {
	const tpl = '{{#if a}}A{{#if b}}B{{/if}}A{{else}}Z{{/if}}';
	assert.equal(applyConditionals(tpl, { a: true, b: true }), 'ABA');
	assert.equal(applyConditionals(tpl, { a: true, b: false }), 'AA');
	assert.equal(applyConditionals(tpl, { a: false, b: true }), 'Z');
});

test('sibling blocks are independent', () => {
	const tpl = '{{#if a}}1{{/if}}-{{#if b}}2{{/if}}';
	assert.equal(applyConditionals(tpl, { a: true, b: false }), '1-');
	assert.equal(applyConditionals(tpl, { a: false, b: true }), '-2');
});

// --- standalone-line handling ----------------------------------------------

test('a control tag alone on its line leaves no blank line behind', () => {
	const tpl = [
		'top',
		'{{#if show}}',
		'middle',
		'{{/if}}',
		'bottom',
		''
	].join('\n');

	assert.equal(applyConditionals(tpl, { show: true }), 'top\nmiddle\nbottom\n');
	assert.equal(applyConditionals(tpl, { show: false }), 'top\nbottom\n');
});

test('indented standalone tags are still treated as standalone', () => {
	const tpl = 'x\n\t\t{{#if y}}\n\t\tkept\n\t\t{{/if}}\nz\n';
	assert.equal(applyConditionals(tpl, { y: true }), 'x\n\t\tkept\nz\n');
	assert.equal(applyConditionals(tpl, { y: false }), 'x\nz\n');
});

test('a tag sharing its line with content is not standalone', () => {
	// mirrors settings-page.php: {{#if use_react}}<div>...</div>\n{{/if}}<form>
	const tpl = '{{#if use_react}}\t<div id="root"></div>\n{{/if}}\t<form>';
	assert.equal(
		applyConditionals(tpl, { use_react: true }),
		'\t<div id="root"></div>\n\t<form>'
	);
	assert.equal(applyConditionals(tpl, { use_react: false }), '\t<form>');
});

// --- interaction with value tokens ---------------------------------------------

test('applyConditionals does not touch {{VALUE}} tokens (that is a later pass)', () => {
	assert.equal(
		applyConditionals('{{#if a}}Hello {{NAME}}{{/if}}', { a: true }),
		'Hello {{NAME}}'
	);
});

// --- safety ------------------------------------------------------------------

test('an unbalanced template throws rather than hanging', () => {
	assert.throws(
		() => applyConditionals('{{#if a}}no close here', { a: true }),
		/unbalanced/
	);
});

test('content with no conditionals is returned untouched', () => {
	const tpl = 'plain {{TOKEN}} text\nsecond line\n';
	assert.equal(applyConditionals(tpl, {}), tpl);
});
