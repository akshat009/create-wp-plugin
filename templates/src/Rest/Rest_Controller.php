<?php
/**
 * REST API Controller.
 *
 * @package {{NS}}\Rest
 */

namespace {{NS}}\Rest;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Rest_Controller.
 */
class Rest_Controller {

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
	public function register() {
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
		// TODO: SECURITY - Perform capability check or return true if public.
		return current_user_can( 'read' );
	}

	/**
	 * Handle GET request for items.
	 *
	 * @param \WP_REST_Request $request REST request object.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_items( $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
		// TODO: SECURITY - Sanitize parameters and escape response payload.
		$data = array(
			'message' => 'Hello from {{PLUGIN_NAME}} REST API',
		);

		return rest_ensure_response( $data );
	}
}
