/**
 * WooCommerce Blocks (block-based checkout) frontend registration for the
 * {{PLUGIN_NAME}} gateway. Uses window.wc.* / window.wp.* globals instead of
 * ES imports so no extra build tooling is required beyond @wordpress/scripts —
 * the matching script dependency handles are declared in
 * src/Woo/Gateways/Blocks_Payment_Method_Type.php.
 */
( function () {
	const { registerPaymentMethod } = window.wc.wcBlocksRegistry;
	const { getSetting } = window.wc.wcSettings;
	const { createElement } = window.wp.element;
	const { decodeEntities } = window.wp.htmlEntities;

	const settings = getSetting( '{{PREFIX}}_gateway_data', {} );
	const fallbackLabel = '{{PLUGIN_NAME_ESC}}';
	const label = decodeEntities( settings.title || '' ) || fallbackLabel;

	const Content = () =>
		createElement(
			'div',
			null,
			decodeEntities( settings.description || '' )
		);

	registerPaymentMethod( {
		name: '{{PREFIX}}_gateway',
		label,
		content: createElement( Content ),
		edit: createElement( Content ),
		canMakePayment: () => true,
		ariaLabel: label,
		supports: {
			features: settings.supports || [ 'products' ],
		},
	} );
} )();
