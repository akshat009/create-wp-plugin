<?php
/**
 * WooCommerce custom product type registration for {{PLUGIN_NAME}}.
 *
 * @package {{NS}}\Woo\Providers
 */

declare(strict_types=1);

namespace {{NS}}\Woo\Providers;

use {{NS}}\Contracts\Conditional;
use {{NS}}\Contracts\Service_Provider;
use {{NS}}\Core\Container;
use {{NS}}\Woo\Products\Custom_Product;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Product_Type_Provider.
 */
class Product_Type_Provider implements Service_Provider, Conditional {

	/**
	 * Only needed when WooCommerce is active.
	 *
	 * @return bool
	 */
	public function is_needed(): bool {
		return class_exists( 'WooCommerce' );
	}

	/**
	 * No bindings needed.
	 *
	 * @param Container $container Application container.
	 * @return void
	 */
	public function register( Container $container ): void { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
	}

	/**
	 * Register hooks.
	 *
	 * @param Container $container Application container.
	 * @return void
	 */
	public function boot( Container $container ): void { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
		add_filter( 'woocommerce_product_class', Custom_Product::filter_product_class( ... ), 10, 2 );
		add_filter( 'product_type_selector', Custom_Product::filter_product_type_selector( ... ) );
		add_action( 'woocommerce_single_product_summary', $this->custom_product_summary_note( ... ), 25 );
	}

	/**
	 * Render a custom note on the single product page.
	 *
	 * @return void
	 */
	public function custom_product_summary_note() {
		echo '<div class="' . esc_attr( '{{SLUG}}-woo-note' ) . '">' . esc_html__( 'Special Product Note', '{{SLUG}}' ) . '</div>';
	}
}
