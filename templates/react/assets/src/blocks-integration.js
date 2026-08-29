/**
 * Injects custom content into the WooCommerce Cart & Checkout blocks' order
 * summary sidebar via the shared ExperimentalOrderMeta slot. Uses window.wc.*
 * / window.wp.* globals rather than ES imports — matching dependency handles
 * are declared in src/Woo/Blocks/Integration.php.
 */
( function () {
	const { registerPlugin } = window.wp.plugins;
	const { getSetting } = window.wc.wcSettings;
	const { createElement } = window.wp.element;
	const { ExperimentalOrderMeta } = window.wc.blocksCheckout;

	const data = getSetting( '{{PREFIX}}-blocks-integration_data', {} );
	const cls = '{{SLUG}}-order-meta';

	const CustomOrderMetaContent = () =>
		createElement(
			ExperimentalOrderMeta,
			null,
			createElement( 'div', { className: cls }, data.message || '' )
		);

	registerPlugin( '{{PREFIX}}-blocks-integration', {
		render: CustomOrderMetaContent,
		scope: 'woocommerce-checkout',
	} );
} )();
