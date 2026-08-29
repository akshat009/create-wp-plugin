/**
 * Extends @wordpress/scripts' own unit-test config (Babel/JSX transform,
 * jsdom, module mappers) rather than replacing it via `preset:` — setting
 * the preset drops the transform and every test fails to parse JSX.
 */
const defaultConfig = require( '@wordpress/scripts/config/jest-unit.config.js' );

module.exports = {
	...defaultConfig,
	setupFilesAfterEnv: [
		...( defaultConfig.setupFilesAfterEnv || [] ),
		'@testing-library/jest-dom',
	],
	testPathIgnorePatterns: [ '/node_modules/', '/tests/e2e/' ],
};
