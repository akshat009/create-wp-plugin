const { defineConfig } = require( '@playwright/test' );

/**
 * Points at a running WordPress site — e.g. `wp-env start` (defaults to
 * http://localhost:8889), Local, or any other dev/staging install with this
 * plugin active. Override with the WP_BASE_URL environment variable.
 */
module.exports = defineConfig( {
	testDir: './tests/e2e',
	fullyParallel: true,
	use: {
		baseURL: process.env.WP_BASE_URL || 'http://localhost:8889',
	},
} );
