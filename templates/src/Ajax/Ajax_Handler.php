<?php
/**
 * AJAX Requests Handler.
 *
 * @package {{NS}}\Ajax
 */

declare(strict_types=1);

namespace {{NS}}\Ajax;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Ajax_Handler.
 */
class Ajax_Handler {

	/**
	 * Whether to register unauthenticated (nopriv) AJAX action for logged-out visitors.
	 *
	 * Set to true if this endpoint should be publicly accessible to unauthenticated visitors.
	 *
	 * @var bool
	 */
	protected bool $allow_nopriv = false;

	/**
	 * Register AJAX actions and asset enqueueing.
	 *
	 * @return void
	 */
	public function init_hooks(): void {
		add_action( 'wp_ajax_{{PREFIX}}_action', $this->handle_ajax( ... ) );
		if ( $this->allow_nopriv ) {
			add_action( 'wp_ajax_nopriv_{{PREFIX}}_action', $this->handle_ajax( ... ) );
		}
		add_action( 'wp_enqueue_scripts', $this->enqueue_scripts( ... ) );
	}

	/**
	 * Enqueue main JS script and pass nonce object.
	 *
	 * @return void
	 */
	public function enqueue_scripts(): void {
		wp_enqueue_script(
			'{{PREFIX}}-main',
			{{PREFIX_UPPER}}_URL . 'assets/js/main.js',
			array(),
			{{PREFIX_UPPER}}_VERSION,
			true
		);

		wp_localize_script(
			'{{PREFIX}}-main',
			'{{PREFIX}}Ajax',
			array(
				'ajax_url' => admin_url( 'admin-ajax.php' ),
				'nonce'    => wp_create_nonce( '{{PREFIX}}_nonce' ),
			)
		);
	}

	/**
	 * Process AJAX request.
	 *
	 * @return void
	 */
	public function handle_ajax(): void {
		if ( ! check_ajax_referer( '{{PREFIX}}_nonce', 'nonce', false ) ) {
			wp_send_json_error( array( 'message' => __( 'Invalid security token.', '{{SLUG}}' ) ), 403 );
			return;
		}

		if ( ! $this->allow_nopriv && ! current_user_can( 'read' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', '{{SLUG}}' ) ), 403 );
			return;
		}

		$input_text = isset( $_POST['input_text'] ) ? sanitize_text_field( wp_unslash( $_POST['input_text'] ) ) : '';

		wp_send_json_success(
			array(
				'message' => __( 'AJAX request processed successfully.', '{{SLUG}}' ),
				'data'    => $input_text,
			)
		);
	}
}
