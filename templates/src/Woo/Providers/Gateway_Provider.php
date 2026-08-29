<?php
/**
 * WooCommerce payment gateway registration for {{PLUGIN_NAME}}.
 *
 * Registers the classic-checkout payment gateway (via the
 * woocommerce_payment_gateways filter) and, separately, its WooCommerce
 * Blocks (block-based checkout) payment method — Blocks has its own payment
 * method registry, independent of the classic filter.
 *
 * @package {{NS}}\Woo\Providers
 */

declare(strict_types=1);

namespace {{NS}}\Woo\Providers;

use {{NS}}\Contracts\Conditional;
use {{NS}}\Contracts\Service_Provider;
use {{NS}}\Core\Container;
use {{NS}}\Woo\Gateways\Blocks_Payment_Method_Type;
use {{NS}}\Woo\Gateways\Gateway;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Gateway_Provider.
 */
class Gateway_Provider implements Service_Provider, Conditional {

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
		add_filter( 'woocommerce_payment_gateways', $this->register_gateway( ... ) );
		add_action( 'woocommerce_blocks_loaded', $this->register_blocks_payment_method( ... ) );
	}

	/**
	 * Register the custom payment gateway with WooCommerce (classic checkout).
	 *
	 * @param array $gateways Existing gateways.
	 * @return array
	 */
	public function register_gateway( $gateways ) {
		$gateways[] = Gateway::class;
		return $gateways;
	}

	/**
	 * Register this gateway's block-checkout payment method type once
	 * WooCommerce Blocks' own registry is available.
	 *
	 * @return void
	 */
	public function register_blocks_payment_method(): void {
		add_action( 'woocommerce_blocks_payment_method_type_registration', $this->add_payment_method_type( ... ) );
	}

	/**
	 * Add the block-checkout payment method type to the registry.
	 *
	 * @param object $registry WooCommerce Blocks payment method registry.
	 * @return void
	 */
	public function add_payment_method_type( $registry ): void {
		$registry->register( new Blocks_Payment_Method_Type() );
	}
}
