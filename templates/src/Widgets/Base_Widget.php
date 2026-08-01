<?php
/**
 * Elementor Widgets Manager.
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
		add_action( 'elementor/widgets/register', array( $this, 'register_widgets' ) );
	}

	/**
	 * Register widgets with Elementor widgets manager.
	 *
	 * @param object $widgets_manager Elementor widgets manager.
	 * @return void
	 */
	public function register_widgets( $widgets_manager ) {
		if ( ! class_exists( '\Elementor\Widget_Base' ) ) {
			return;
		}

		$widgets_manager->register( new Sample_Widget() );
	}
}
