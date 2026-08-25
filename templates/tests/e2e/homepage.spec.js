const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test( 'homepage loads without a fatal error', async ( { page } ) => {
	await page.goto( '/' );
	await expect( page.locator( 'body' ) ).not.toContainText( /fatal error/i );
} );
