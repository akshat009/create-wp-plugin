<?php
/**
 * REST API Controller.
 *
 * @package {{NS}}\Rest
 */

declare(strict_types=1);

namespace {{NS}}\Rest;

use {{NS}}\Contracts\Service_Provider;
use {{NS}}\Core\Container;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Rest_Controller.
 */
class Rest_Controller extends \WP_REST_Controller implements Service_Provider {

	/**
	 * Constructor.
	 *
	 * WP_REST_Controller declares $namespace/$rest_base with no default
	 * values and no constructor of its own — set both here.
	 */
	public function __construct() {
		$this->namespace = '{{PREFIX}}/v1';
		$this->rest_base = 'data';
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
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register API endpoints.
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_items' ),
				'permission_callback' => array( $this, 'get_items_permissions_check' ),
				'args'                => array(
					'param' => array(
						'required'          => false,
						'sanitize_callback' => 'sanitize_text_field',
						'validate_callback' => function ( $param ) {
							return is_string( $param );
						},
					),
				),
			)
		);
	}

	/**
	 * Check permission for endpoint access.
	 *
	 * @param \WP_REST_Request $request REST request object.
	 * @return bool|\WP_Error
	 */
	public function get_items_permissions_check( $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
		// Fails closed by default. For a genuinely public read endpoint,
		// `return true;` — but decide that deliberately rather than inherit it.
		return current_user_can( 'read' );
	}

	/**
	 * Handle GET request for items.
	 *
	 * @param \WP_REST_Request $request REST request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_items( $request ) {
		$param = $request->get_param( 'param' );
		$data  = array(
			'message' => __( 'Hello from {{PLUGIN_NAME_ESC}} REST API', '{{SLUG}}' ),
			'param'   => ! empty( $param ) ? sanitize_text_field( (string) $param ) : null,
		);

		return rest_ensure_response( $data );
	}
}
