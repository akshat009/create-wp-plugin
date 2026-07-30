<?php
/**
 * AJAX Requests Handler.
 *
 * @package {{NS}}\Ajax
 */

namespace {{NS}}\Ajax;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Ajax_Handler.
 */
class Ajax_Handler {

	/**
	 * Register AJAX actions.
	 *
	 * @return void
	 */
	public function register() {
		add_action( 'wp_ajax_{{PREFIX}}_action', array( $this, 'handle_ajax' ) );
		add_action( 'wp_ajax_nopriv_{{PREFIX}}_action', array( $this, 'handle_ajax' ) );
	}

	/**
	 * Process AJAX request.
	 *
	 * @return void
	 */
	public function handle_ajax() {
		// TODO: SECURITY - Verify request nonce using check_ajax_referer.
		// TODO: SECURITY - Verify current user permissions.
		// TODO: SECURITY - Sanitize request parameters.

		wp_send_json_success( array( 'message' => 'AJAX request processed successfully.' ) );
	}
}
