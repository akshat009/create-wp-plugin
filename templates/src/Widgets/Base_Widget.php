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
	 * Auto-discover and register every concrete widget class in the
	 * Widgets directory.
	 *
	 * @param object $widgets_manager Elementor widgets manager.
	 * @return void
	 */
	public function register_widgets( $widgets_manager ) {
		if ( ! class_exists( '\Elementor\Widget_Base' ) ) {
			return;
		}

		foreach ( glob( __DIR__ . '/*.php' ) as $file ) {
			$class_name = __NAMESPACE__ . '\\' . basename( $file, '.php' );

			if ( ! class_exists( $class_name ) ) {
				continue;
			}

			$reflection = new \ReflectionClass( $class_name );

			if ( $reflection->isAbstract() || ! $reflection->isSubclassOf( '\Elementor\Widget_Base' ) ) {
				continue;
			}

			$widgets_manager->register( new $class_name() );
		}
	}
}
