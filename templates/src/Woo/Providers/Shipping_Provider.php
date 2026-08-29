<?php
/**
 * WooCommerce shipping method registration for {{PLUGIN_NAME}}.
 *
 * @package {{NS}}\Woo\Providers
 */

declare(strict_types=1);

namespace {{NS}}\Woo\Providers;

use {{NS}}\Woo\Shipping\Shipping_Method;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Shipping_Provider.
 */
class Shipping_Provider {

	/**
	 * Register hooks.
	 *
	 * @return void
	 */
	public function init_hooks(): void {
		add_filter( 'woocommerce_shipping_methods', $this->register_shipping_method( ... ) );
	}

	/**
	 * Register the custom shipping method with WooCommerce.
	 *
	 * @param array $methods Existing shipping methods.
	 * @return array
	 */
	public function register_shipping_method( $methods ) {
		$methods['{{PREFIX}}_shipping'] = Shipping_Method::class;
		return $methods;
	}
}
