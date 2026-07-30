<?php
/**
 * WooCommerce Hooks Integration.
 *
 * @package {{NS}}\Woo
 */

namespace {{NS}}\Woo;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Woo_Hooks.
 */
class Woo_Hooks {

	/**
	 * Register WooCommerce hooks.
	 *
	 * @return void
	 */
	public function register() {
		add_action( 'woocommerce_single_product_summary', array( $this, 'custom_product_summary_note' ), 25 );
	}

	/**
	 * Render custom product note.
	 *
	 * @return void
	 */
	public function custom_product_summary_note() {
		// TODO: SECURITY - Sanitize product meta & escape HTML prior to rendering.
		echo '<div class="' . esc_attr( '{{SLUG}}-woo-note' ) . '">' . esc_html__( 'Special Product Note', '{{SLUG}}' ) . '</div>';
	}
}
