<?php
/**
 * REST API Controller.
 *
 * @package {{NS}}\Rest
 */

declare(strict_types=1);

namespace {{NS}}\Rest;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Rest_Controller.
 */
class Rest_Controller extends \WP_REST_Controller {

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
	 * Register hooks.
	 *
	 * @return void
	 */
	public function init_hooks(): void {
		add_action( 'rest_api_init', $this->register_routes( ... ) );
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
				'callback'            => $this->get_items( ... ),
				'permission_callback' => $this->get_items_permissions_check( ... ),
				'args'                => array(
					'param' => array(
						'required'          => false,
						'sanitize_callback' => 'sanitize_text_field',
						'validate_callback' => function ( $param ) {
							return is_string( $param );
						},
					),
				),
				'schema'              => $this->get_public_item_schema( ... ),
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

	/**
	 * Item schema, describing the shape of get_items()'s response. Backs the
	 * endpoint's OPTIONS response and any schema-driven API tooling (the
	 * block editor's data layer included) -- without it the endpoint isn't
	 * self-describing.
	 *
	 * @return array
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$this->schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => '{{PREFIX}}_item',
			'type'       => 'object',
			'properties' => array(
				'message' => array(
					'description' => __( 'Response message.', '{{SLUG}}' ),
					'type'        => 'string',
					'context'     => array( 'view' ),
					'readonly'    => true,
				),
				'param'   => array(
					'description' => __( 'Echoed request parameter.', '{{SLUG}}' ),
					'type'        => array( 'string', 'null' ),
					'context'     => array( 'view' ),
					'readonly'    => true,
				),
			),
		);

		return $this->add_additional_fields_schema( $this->schema );
	}
}
