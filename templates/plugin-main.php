<?php
/**
 * Plugin Name:       {{PLUGIN_NAME}}
 * Plugin URI:        {{AUTHOR_URI}}
 * Description:       {{DESCRIPTION}}
 * Version:           {{VERSION}}
 * Requires at least: {{REQUIRES_AT_LEAST}}
 * Requires PHP:      {{MIN_PHP}}
 * Author:            {{AUTHOR}}
 * Author URI:        {{AUTHOR_URI}}
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       {{SLUG}}
 * Domain Path:       /languages
{{PLUGIN_HEADER_EXTRA}} *
 * @package {{NS}}
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( '{{PREFIX_UPPER}}_VERSION', '{{VERSION}}' );
define( '{{PREFIX_UPPER}}_FILE', __FILE__ );
define( '{{PREFIX_UPPER}}_PATH', plugin_dir_path( __FILE__ ) );
define( '{{PREFIX_UPPER}}_URL', plugin_dir_url( __FILE__ ) );

/**
 * Autoload classes via PSR-4 with graceful fallback.
 */
if ( file_exists( {{PREFIX_UPPER}}_PATH . 'vendor/autoload.php' ) ) {
	require_once {{PREFIX_UPPER}}_PATH . 'vendor/autoload.php';
} else {
	spl_autoload_register(
		function ( $class_name ) {
			$prefix   = '{{NS}}\\';
			$base_dir = {{PREFIX_UPPER}}_PATH . 'src/';
			$len      = strlen( $prefix );

			if ( 0 !== strncmp( $prefix, $class_name, $len ) ) {
				return;
			}

			$relative_class = substr( $class_name, $len );
			$file           = $base_dir . str_replace( '\\', '/', $relative_class ) . '.php';

			if ( file_exists( $file ) ) {
				require_once $file;
			}
		}
	);
}

register_activation_hook(
	__FILE__,
	static function () {
		$plugin = \{{NS}}\Plugin::create();
		$plugin->register_all();
		( new \{{NS}}\Core\Activator() )->activate( $plugin->get_container() );
	}
);
register_deactivation_hook(
	__FILE__,
	static function () {
		$plugin = \{{NS}}\Plugin::create();
		$plugin->register_all();
		( new \{{NS}}\Core\Deactivator() )->deactivate( $plugin->get_container() );
	}
);
{{WOOCOMMERCE_HPOS}}
/**
 * Bootstrap the plugin orchestrator.
 *
 * @return void
 */
function {{PREFIX}}_boot() {
	load_plugin_textdomain( '{{SLUG}}', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
	\{{NS}}\Plugin::create()->boot();
}

add_action( 'plugins_loaded', '{{PREFIX}}_boot' );
