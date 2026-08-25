<?php
/**
 * WooCommerce Blocks payment method registration for the {{PLUGIN_NAME}} gateway.
 *
 * Without this, Gateway would be invisible in WooCommerce's block-based
 * checkout — WooCommerce Blocks only shows gateways registered through this
 * API, separately from the classic `woocommerce_payment_gateways` filter.
 *
 * @package {{NS}}\Woo\Gateways
 */

declare(strict_types=1);

namespace {{NS}}\Woo\Gateways;

use Automattic\WooCommerce\Blocks\Payments\Integrations\AbstractPaymentMethodType;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Blocks_Payment_Method_Type.
 */
class Blocks_Payment_Method_Type extends AbstractPaymentMethodType {

	/**
	 * Payment method name — must match Gateway::$id.
	 *
	 * @var string
	 */
	protected $name = '{{PREFIX}}_gateway';

	/**
	 * Gateway settings, loaded from the classic gateway's stored option.
	 *
	 * @var array
	 */
	private $gateway_settings = array();

	/**
	 * Load settings and register the block frontend script.
	 *
	 * @return void
	 */
	public function initialize() {
		$this->gateway_settings = get_option( 'woocommerce_' . $this->name . '_settings', array() );

		$asset_file = {{PREFIX_UPPER}}_PATH . 'assets/build/wc-gateway-block.asset.php';
		$asset      = file_exists( $asset_file )
			? require $asset_file
			: array(
				'dependencies' => array(),
				'version'      => {{PREFIX_UPPER}}_VERSION,
			);

		// The block script reads window.wc.* / window.wp.* globals directly rather
		// than using ES imports, so DependencyExtractionWebpackPlugin can't detect
		// these — declare them by hand to guarantee correct script load order.
		$dependencies = array_unique(
			array_merge(
				$asset['dependencies'],
				array( 'wc-blocks-registry', 'wc-settings', 'wp-element', 'wp-i18n', 'wp-html-entities' )
			)
		);

		wp_register_script(
			'{{PREFIX}}-gateway-block',
			{{PREFIX_UPPER}}_URL . 'assets/build/wc-gateway-block.js',
			$dependencies,
			$asset['version'],
			true
		);
	}

	/**
	 * Whether the payment method is active/available at checkout.
	 *
	 * @return bool
	 */
	public function is_active() {
		return ! empty( $this->gateway_settings['enabled'] ) && 'yes' === $this->gateway_settings['enabled'];
	}

	/**
	 * Script handles required by the block frontend.
	 *
	 * @return array
	 */
	public function get_payment_method_script_handles() {
		return array( '{{PREFIX}}-gateway-block' );
	}

	/**
	 * Data passed from PHP into the block frontend script (window.wc.wcSettings paymentMethodData).
	 *
	 * @return array
	 */
	public function get_payment_method_data() {
		return array(
			'title'       => $this->gateway_settings['title'] ?? __( '{{PLUGIN_NAME}}', '{{SLUG}}' ),
			'description' => $this->gateway_settings['description'] ?? '',
			'supports'    => array( 'products' ),
		);
	}
}
