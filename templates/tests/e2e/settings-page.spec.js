const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( '{{PLUGIN_NAME}} settings page', () => {
	test( 'loads for an administrator', async ( { admin, page } ) => {
		await admin.visitAdminPage( 'options-general.php?page={{SLUG}}' );
		await expect( page.locator( 'h1' ) ).toContainText( '{{PLUGIN_NAME}}' );
	} );
} );
