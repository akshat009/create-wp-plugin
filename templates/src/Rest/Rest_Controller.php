<?php
/**
 * REST API Controller.
 *
 * @package {{NS}}\Rest
 */

namespace {{NS}}\Rest;

use {{NS}}\Contracts\Registrable;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Rest_Controller.
 */
class Rest_Controller implements Registrable {

	/**
	 * REST namespace.
	 *
	 * @var string
	 */
	private $namespace = '{{PREFIX}}/v1';

	/**
	 * Register REST routes.
	 *
	 * @return void
	 */
	public function register(): void {
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
			'/data',
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
		// Public endpoint. Replace with current_user_can() check if restricted access is required.
		return true;
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
			'message' => __( 'Hello from {{PLUGIN_NAME}} REST API', '{{SLUG}}' ),
			'param'   => ! empty( $param ) ? sanitize_text_field( (string) $param ) : null,
		);

		return rest_ensure_response( $data );
	}
}
