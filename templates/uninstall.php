<?php
/**
 * Uninstall Handler.
 *
 * Runs when the plugin is deleted via the WordPress Admin dashboard. WordPress
 * invokes this file standalone — the main plugin file is never loaded — so it
 * needs its own autoloader rather than relying on plugin-main.php's constants.
 *
 * @package {{NS}}
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

/**
 * Autoload classes via PSR-4 with graceful fallback (same convention as plugin-main.php).
 */
if ( file_exists( __DIR__ . '/vendor/autoload.php' ) ) {
	require_once __DIR__ . '/vendor/autoload.php';
} else {
	spl_autoload_register(
		function ( $class_name ) {
			$prefix   = '{{NS}}\\';
			$base_dir = __DIR__ . '/src/';
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

/**
 * Perform uninstall cleanup tasks for the current site.
 *
 * @return void
 */
function {{PREFIX}}_uninstall_cleanup(): void {
	( new \{{NS}}\Core\Uninstaller() )->cleanup();
}

if ( is_multisite() ) {
	// 'number' => 0 lifts get_sites()'s default 100-site cap so nothing is
	// left behind on large networks. On a very large network prefer a batched
	// or WP-CLI cleanup — this synchronous loop can time out.
	${{PREFIX}}_sites = get_sites(
		array(
			'fields' => 'ids',
			'number' => 0,
		)
	);
	foreach ( ${{PREFIX}}_sites as ${{PREFIX}}_site_id ) {
		switch_to_blog( ${{PREFIX}}_site_id );
		{{PREFIX}}_uninstall_cleanup();
		restore_current_blog();
	}
} else {
	{{PREFIX}}_uninstall_cleanup();
}
