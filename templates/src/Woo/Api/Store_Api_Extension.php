<?php
/**
 * WooCommerce Store API Schema Extension for {{PLUGIN_NAME}}.
 *
 * Extends the Store API (Cart/Checkout endpoints for block checkout)
 * with custom plugin data via Automattic\WooCommerce\StoreApi\Schemas\ExtendSchema.
 *
 * @package {{NS}}\Woo\Api
 */

declare(strict_types=1);

namespace {{NS}}\Woo\Api;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Store_Api_Extension.
 */
class Store_Api_Extension {

	/**
	 * Extension identifier.
	 */
	public const IDENTIFIER = '{{PREFIX}}_extension';

	/**
	 * Register endpoint data callback with WooCommerce Store API.
	 *
	 * @return void
	 */
	public function register_store_api_extension(): void {
		if ( ! function_exists( 'woocommerce_store_api_register_endpoint_data' ) ) {
			return;
		}

		woocommerce_store_api_register_endpoint_data(
			array(
				'endpoint'        => 'cart',
				'namespace'       => self::IDENTIFIER,
				'data_callback'   => array( $this, 'get_cart_data' ),
				'schema_callback' => array( $this, 'get_cart_schema' ),
				'schema_type'     => ARRAY_A,
			)
		);
	}

	/**
	 * Provide custom data for Store API Cart endpoint.
	 *
	 * @return array
	 */
	public function get_cart_data(): array {
		return array(
			'plugin_version' => '1.0.0',
			'custom_message' => __( 'Sample Store API data from {{PLUGIN_NAME}}.', '{{SLUG}}' ),
		);
	}

	/**
	 * Provide schema callback for custom Store API cart data.
	 *
	 * @return array
	 */
	public function get_cart_schema(): array {
		return array(
			'plugin_version' => array(
				'description' => __( 'Plugin version.', '{{SLUG}}' ),
				'type'        => 'string',
				'context'     => array( 'view', 'edit' ),
				'readonly'    => true,
			),
			'custom_message' => array(
				'description' => __( 'Sample custom message.', '{{SLUG}}' ),
				'type'        => 'string',
				'context'     => array( 'view', 'edit' ),
				'readonly'    => true,
			),
		);
	}
}
