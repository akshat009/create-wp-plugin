<?php
/**
 * WP-CLI Commands integration.
 *
 * @package {{NS}}\CLI
 */

namespace {{NS}}\CLI;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	return;
}

/**
 * WP-CLI Commands for {{PLUGIN_NAME}}.
 */
class Commands {

	/**
	 * Register WP-CLI commands.
	 *
	 * @return void
	 */
	public function register() {
		\WP_CLI::add_command( '{{PREFIX}} status', array( $this, 'status' ) );
		\WP_CLI::add_command( '{{PREFIX}} cache clear', array( $this, 'cache_clear' ) );
	}

	/**
	 * Prints plugin version and cache status.
	 *
	 * ## EXAMPLES
	 *
	 *     wp {{PREFIX}} status
	 *
	 * @param array $args       Command positional arguments.
	 * @param array $assoc_args Command associative arguments.
	 * @return void
	 */
	public function status( $args = array(), $assoc_args = array() ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
		$version       = {{PREFIX_UPPER}}_VERSION;
		$cache_backend = wp_using_ext_object_cache() ? 'External Object Cache' : 'Transient / Database Cache';

		\WP_CLI::success( sprintf( '{{PLUGIN_NAME}} Version: %s | Cache Backend: %s', $version, $cache_backend ) );
	}

	/**
	 * Clears plugin cache.
	 *
	 * ## EXAMPLES
	 *
	 *     wp {{PREFIX}} cache clear
	 *
	 * @param array $args       Command positional arguments.
	 * @param array $assoc_args Command associative arguments.
	 * @return void
	 */
	public function cache_clear( $args = array(), $assoc_args = array() ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
		// TODO: Implement cache clearing logic for {{PLUGIN_NAME}}.
		\WP_CLI::log( 'Cache clear stubbed.' );
	}
}
