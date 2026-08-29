<?php
/**
 * {{PLUGIN_NAME}} Payment Gateway (classic checkout).
 *
 * @package {{NS}}\Woo\Gateways
 */

declare(strict_types=1);

namespace {{NS}}\Woo\Gateways;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Gateway.
 *
 * A real, registerable WC_Payment_Gateway. process_payment() is a stub —
 * replace it with a call to your actual payment processor before going live.
 */
class Gateway extends \WC_Payment_Gateway {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->id                 = '{{PREFIX}}_gateway';
		$this->icon               = '';
		$this->has_fields         = false;
		$this->method_title       = __( '{{PLUGIN_NAME_ESC}}', '{{SLUG}}' );
		$this->method_description = __( 'Custom payment gateway scaffolded by {{PLUGIN_NAME_ESC}}.', '{{SLUG}}' );
		$this->supports           = array( 'products' );

		$this->init_form_fields();
		$this->init_settings();

		$this->title       = $this->get_option( 'title' );
		$this->description = $this->get_option( 'description' );
		$this->enabled      = $this->get_option( 'enabled' );

		add_action( 'woocommerce_update_options_payment_gateways_' . $this->id, $this->process_admin_options( ... ) );
	}

	/**
	 * Define settings fields shown on the classic (non-block) gateway settings screen.
	 *
	 * @return void
	 */
	public function init_form_fields() {
		$this->form_fields = array(
			'enabled'     => array(
				'title'   => __( 'Enable/Disable', '{{SLUG}}' ),
				'type'    => 'checkbox',
				'label'   => __( 'Enable this payment method', '{{SLUG}}' ),
				'default' => 'no',
			),
			'title'       => array(
				'title'       => __( 'Title', '{{SLUG}}' ),
				'type'        => 'text',
				'description' => __( 'Payment method title customers see at checkout.', '{{SLUG}}' ),
				'default'     => __( '{{PLUGIN_NAME_ESC}}', '{{SLUG}}' ),
				'desc_tip'    => true,
			),
			'description' => array(
				'title'       => __( 'Description', '{{SLUG}}' ),
				'type'        => 'textarea',
				'description' => __( 'Payment method description customers see at checkout.', '{{SLUG}}' ),
				'default'     => __( 'Pay securely.', '{{SLUG}}' ),
			),
		);
	}

	/**
	 * Process the payment for an order.
	 *
	 * Stub: fails closed so an unfinished gateway can never mark an order paid
	 * without charging. Implement the real flow, then, on a confirmed charge:
	 *
	 *     $order->payment_complete( $transaction_id );
	 *     WC()->cart->empty_cart();
	 *     return array( 'result' => 'success', 'redirect' => $this->get_return_url( $order ) );
	 *
	 * @param int $order_id Order ID.
	 * @return array
	 */
	public function process_payment( $order_id ) {
		$order = wc_get_order( $order_id );

		if ( ! $order ) {
			return array( 'result' => 'failure' );
		}

		wc_add_notice(
			__( 'This payment gateway is not configured yet.', '{{SLUG}}' ),
			'error'
		);

		return array( 'result' => 'failure' );
	}
}
