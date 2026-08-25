module.exports = {
	preset: '@wordpress/jest-preset-default',
	setupFilesAfterEnv: [ '@testing-library/jest-dom' ],
	testPathIgnorePatterns: [ '/node_modules/', '/tests/e2e/' ],
};
