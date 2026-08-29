<?php
/**
 * WP-CLI Commands integration.
 *
 * @package {{NS}}\CLI
 */

declare(strict_types=1);

namespace {{NS}}\CLI;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * WP-CLI Commands for {{PLUGIN_NAME}}.
 */
class Commands {

	/**
	 * Register WP-CLI commands.
	 *
	 * Plugin::boot() only instantiates this class when WP_CLI is defined and
	 * truthy, so there is no constant check here — keeping it out means unit
	 * tests don't have to define( 'WP_CLI' ) (which they can't undo, and which
	 * leaks into every test that runs afterwards).
	 *
	 * @return void
	 */
	public function init_hooks(): void {
		\WP_CLI::add_command( '{{PREFIX}} status', $this->status( ... ) );
		\WP_CLI::add_command( '{{PREFIX}} cache clear', $this->cache_clear( ... ) );
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

		\WP_CLI::success( sprintf( '{{PLUGIN_NAME_ESC}} Version: %s | Cache Backend: %s', $version, $cache_backend ) );
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
		// Flush the plugin's own object-cache group (only does anything on
		// installs with a persistent object cache such as Redis/Memcached).
		if ( function_exists( 'wp_cache_flush_group' ) ) {
			wp_cache_flush_group( '{{PREFIX}}' );
		}

		/**
		 * Transient keys this plugin owns. Any module that caches in a
		 * transient adds its key here (via add_filter in its boot()) so this
		 * command can purge it without the CLI module having to know another
		 * module's internals. Runs unconditionally — database transients on a
		 * plain MySQL install are not covered by wp_cache_flush_group().
		 *
		 * @param string[] $keys Transient key names.
		 */
		$keys = (array) apply_filters( '{{PREFIX}}_cache_keys', array() );

		foreach ( array_unique( array_filter( array_map( 'strval', $keys ) ) ) as $key ) {
			delete_transient( $key );
		}

		\WP_CLI::success( __( 'Plugin cache cleared successfully.', '{{SLUG}}' ) );
	}
}
