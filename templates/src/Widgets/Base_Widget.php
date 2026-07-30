<?php
/**
 * Elementor Widget Base.
 *
 * @package {{NS}}\Widgets
 */

namespace {{NS}}\Widgets;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Base_Widget.
 */
class Base_Widget {

	/**
	 * Register Elementor widget integration.
	 *
	 * @return void
	 */
	public function register() {
		add_action( 'elementor/widgets/register', array( $this, 'register_widget' ) );
	}

	/**
	 * Register widget with Elementor widgets manager.
	 *
	 * @param object $widgets_manager Elementor widgets manager.
	 * @return void
	 */
	public function register_widget( $widgets_manager ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
		// TODO: SECURITY - Ensure Elementor is active before instantiating widgets.
	}
}
