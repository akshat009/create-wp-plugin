<?php
/**
 * WooCommerce Blocks (Cart & Checkout) content integration for {{PLUGIN_NAME}}.
 *
 * Injects custom content into the Cart and Checkout blocks' order-summary
 * sidebar via the ExperimentalOrderMeta slot — a stable extension point
 * shared by both blocks. Registered against both
 * woocommerce_blocks_cart_block_registration and
 * woocommerce_blocks_checkout_block_registration in Woo_Hooks.
 *
 * @package {{NS}}\Woo\Blocks
 */

declare(strict_types=1);

namespace {{NS}}\Woo\Blocks;

use Automattic\WooCommerce\Blocks\Integrations\IntegrationInterface;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Integration.
 */
class Integration implements IntegrationInterface {

	/**
	 * Unique integration name.
	 *
	 * @return string
	 */
	public function get_name() {
		return '{{PREFIX}}-blocks-integration';
	}

	/**
	 * Register the frontend/editor script.
	 *
	 * @return void
	 */
	public function initialize() {
		$asset_file = {{PREFIX_UPPER}}_PATH . 'assets/build/blocks-integration.asset.php';
		$asset      = file_exists( $asset_file )
			? require $asset_file
			: array(
				'dependencies' => array(),
				'version'      => {{PREFIX_UPPER}}_VERSION,
			);

		// Uses window.wc.* / window.wp.* globals rather than ES imports (see
		// assets/src/blocks-integration.js), so declare dependencies by hand.
		$dependencies = array_unique(
			array_merge(
				$asset['dependencies'],
				array( 'wc-blocks-checkout', 'wc-settings', 'wp-plugins', 'wp-element', 'wp-i18n' )
			)
		);

		wp_register_script(
			$this->get_name(),
			{{PREFIX_UPPER}}_URL . 'assets/build/blocks-integration.js',
			$dependencies,
			$asset['version'],
			true
		);
	}

	/**
	 * Script handles required on the frontend (Cart/Checkout page).
	 *
	 * @return array
	 */
	public function get_script_handles() {
		return array( $this->get_name() );
	}

	/**
	 * Script handles required in the block editor.
	 *
	 * @return array
	 */
	public function get_editor_script_handles() {
		return array( $this->get_name() );
	}

	/**
	 * Data passed from PHP into the script (window.wc.wcSettings.getSetting()).
	 *
	 * @return array
	 */
	public function get_script_data() {
		return array(
			'message' => __( 'Custom content injected by {{PLUGIN_NAME}} — replace this with your own.', '{{SLUG}}' ),
		);
	}
}
