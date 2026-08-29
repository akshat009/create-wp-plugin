<?php
/**
 * Elementor widget auto-discovery and registration.
 *
 * @package {{NS}}\Elementor
 */

declare(strict_types=1);

namespace {{NS}}\Elementor;

use {{NS}}\Contracts\Service_Provider;
use {{NS}}\Core\Container;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Widget_Registrar.
 *
 * Auto-discovers concrete Elementor widget classes under src/Widgets/ via
 * glob() + reflection, and registers each one's on-demand assets plus the
 * widget itself.
 */
class Widget_Registrar implements Service_Provider {

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
		add_filter( '{{PREFIX}}_cache_keys', $this->register_cache_keys( ... ) );
		add_action( 'wp_enqueue_scripts', $this->register_widget_assets( ... ) );
		add_action( 'elementor/editor/after_enqueue_styles', $this->register_widget_assets( ... ) );
		add_action( 'elementor/widgets/register', $this->register_widgets( ... ) );
	}

	/**
	 * Declare the transient this registrar caches discovered widget classes in,
	 * so `wp {{PREFIX}} cache clear` (and uninstall) can purge it without any
	 * other module naming this one's internals.
	 *
	 * @param string[] $keys Cache keys collected so far.
	 * @return string[]
	 */
	public function register_cache_keys( $keys ): array {
		$keys   = is_array( $keys ) ? $keys : array();
		$keys[] = '{{PREFIX}}_elementor_widgets';

		return $keys;
	}

	/**
	 * Get auto-discovered Elementor widget class names (cached via transient unless SCRIPT_DEBUG is active).
	 *
	 * @return array List of widget class names.
	 */
	private function get_widget_classes(): array {
		if ( ! did_action( 'elementor/loaded' ) ) {
			return array();
		}

		$is_dev = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG )
			|| ( defined( 'WP_DEBUG' ) && WP_DEBUG )
			|| ( function_exists( 'wp_get_environment_type' ) && 'development' === wp_get_environment_type() );

		if ( ! $is_dev ) {
			$cached = get_transient( '{{PREFIX}}_elementor_widgets' );
			if ( is_array( $cached ) ) {
				return $cached;
			}
		}

		$widget_classes = array();
		$files          = glob( {{PREFIX_UPPER}}_PATH . 'src/Widgets/*.php' ) ?: array(); // phpcs:ignore Universal.Operators.DisallowShortTernary.Found

		foreach ( $files as $file ) {
			$class_name = '{{NS}}\\Widgets\\' . basename( $file, '.php' );

			if ( ! class_exists( $class_name ) ) {
				continue;
			}

			$reflection = new \ReflectionClass( $class_name );

			if ( $reflection->isAbstract() || ! $reflection->isSubclassOf( '\Elementor\Widget_Base' ) ) {
				continue;
			}

			$widget_classes[] = $class_name;
		}

		set_transient( '{{PREFIX}}_elementor_widgets', $widget_classes, DAY_IN_SECONDS );
		return $widget_classes;
	}

	/**
	 * Auto-register per-widget stylesheets and scripts derived by convention from widget class names.
	 *
	 * @return void
	 */
	public function register_widget_assets(): void {
		if ( ! did_action( 'elementor/loaded' ) ) {
			return;
		}

		$widget_classes = $this->get_widget_classes();

		foreach ( $widget_classes as $class_name ) {
			$short_name = substr( $class_name, strrpos( $class_name, '\\' ) + 1 );
			$slug       = strtolower( str_replace( '_', '-', $short_name ) );
			$handle     = '{{PREFIX}}-' . $slug;
			$css_file   = {{PREFIX_UPPER}}_PATH . 'assets/css/widgets/' . $slug . '.css';
			$js_file    = {{PREFIX_UPPER}}_PATH . 'assets/js/widgets/' . $slug . '.js';

			if ( file_exists( $css_file ) ) {
				wp_register_style(
					$handle,
					{{PREFIX_UPPER}}_URL . 'assets/css/widgets/' . $slug . '.css',
					array(),
					{{PREFIX_UPPER}}_VERSION
				);
			}

			if ( file_exists( $js_file ) ) {
				wp_register_script(
					$handle,
					{{PREFIX_UPPER}}_URL . 'assets/js/widgets/' . $slug . '.js',
					array( 'jquery' ),
					{{PREFIX_UPPER}}_VERSION,
					true
				);
			}
		}
	}

	/**
	 * Auto-register discovered concrete Elementor widget classes.
	 *
	 * @param object $widgets_manager Elementor widgets manager.
	 * @return void
	 */
	public function register_widgets( $widgets_manager ): void {
		if ( ! did_action( 'elementor/loaded' ) ) {
			return;
		}

		$widget_classes = $this->get_widget_classes();

		foreach ( $widget_classes as $class_name ) {
			if ( class_exists( $class_name ) ) {
				$widgets_manager->register( new $class_name() );
			}
		}
	}
}
