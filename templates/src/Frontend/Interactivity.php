<?php
/**
 * Frontend Interactivity (WordPress Interactivity API) demo module.
 *
 * Uses WordPress's native directive-based Interactivity API (Script Modules +
 * data-wp-* attributes) rather than shipping a React runtime to visitors —
 * this is the supported way to add lightweight frontend interactivity.
 * Requires WordPress 6.5+.
 *
 * @package {{NS}}\Frontend
 */

declare(strict_types=1);

namespace {{NS}}\Frontend;

use {{NS}}\Contracts\Service_Provider;
use {{NS}}\Core\Container;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Interactivity.
 */
class Interactivity implements Service_Provider {

	/**
	 * Interactivity API namespace, shared between data-wp-interactive and the JS store().
	 *
	 * @var string
	 */
	const NAMESPACE_KEY = '{{SLUG}}';

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
		add_action( 'init', array( $this, 'register_script_module' ) );
		add_action( 'wp_footer', array( $this, 'render_demo' ) );
	}

	/**
	 * Register the view Script Module (bundled from assets/src/view.js).
	 *
	 * @return void
	 */
	public function register_script_module(): void {
		wp_register_script_module(
			'{{PREFIX}}-interactivity-view',
			{{PREFIX_UPPER}}_URL . 'assets/build/view.js',
			array( '@wordpress/interactivity' ),
			{{PREFIX_UPPER}}_VERSION
		);
	}

	/**
	 * Print a demo directive-driven counter and enqueue its Script Module.
	 *
	 * @return void
	 */
	public function render_demo(): void {
		wp_enqueue_script_module( '{{PREFIX}}-interactivity-view' );

		wp_interactivity_state(
			self::NAMESPACE_KEY,
			array(
				'label' => __( 'Clicked', '{{SLUG}}' ),
			)
		);
		?>
		<div
			class="{{SLUG}}-interactivity-demo"
			data-wp-interactive="{{SLUG}}"
			<?php echo wp_interactivity_data_wp_context( array( 'count' => 0 ), self::NAMESPACE_KEY ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- core helper escapes internally. ?>
		>
			<button type="button" data-wp-on--click="actions.increment">
				<span data-wp-text="state.label"></span> <span data-wp-text="context.count"></span>
			</button>
		</div>
		<?php
	}
}
