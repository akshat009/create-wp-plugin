<?php
/**
 * WooCommerce Blocks (Cart & Checkout) integration registration for {{PLUGIN_NAME}}.
 *
 * @package {{NS}}\Woo\Providers
 */

declare(strict_types=1);

namespace {{NS}}\Woo\Providers;

use {{NS}}\Woo\Blocks\Cart_Summary_Block;
use {{NS}}\Woo\Blocks\Integration;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Blocks_Provider.
 */
class Blocks_Provider {

	/**
	 * Register hooks.
	 *
	 * @return void
	 */
	public function init_hooks(): void {
		add_action( 'init', Cart_Summary_Block::register( ... ) );
		add_action( 'woocommerce_blocks_loaded', $this->register_blocks_integration( ... ) );
	}

	/**
	 * Register the Cart/Checkout content Integration with WooCommerce Blocks'
	 * own registry (separate from anything hooked into the classic templates).
	 *
	 * @return void
	 */
	public function register_blocks_integration(): void {
		$register_integration = $this->register_integration( ... );
		add_action( 'woocommerce_blocks_cart_block_registration', $register_integration );
		add_action( 'woocommerce_blocks_checkout_block_registration', $register_integration );
	}

	/**
	 * Register the Integration with a WooCommerce Blocks registry.
	 *
	 * @param object $registry WooCommerce Blocks integration registry.
	 * @return void
	 */
	public function register_integration( $registry ): void {
		$registry->register( new Integration() );
	}
}
