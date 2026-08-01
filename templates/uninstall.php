<?php
/**
 * Uninstall Handler.
 *
 * Runs when the plugin is deleted via the WordPress Admin dashboard.
 *
 * @package {{NS}}
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

/**
 * Perform uninstall cleanup tasks.
 *
 * @return void
 */
function {{PREFIX}}_uninstall_cleanup(): void {
	delete_option( '{{PREFIX}}_version' );
{{UNINSTALL_BODY}}	delete_transient( '{{PREFIX}}_elementor_widgets' );
}

if ( is_multisite() ) {
	${{PREFIX}}_sites = get_sites( array( 'fields' => 'ids' ) );
	foreach ( ${{PREFIX}}_sites as ${{PREFIX}}_site_id ) {
		switch_to_blog( ${{PREFIX}}_site_id );
		{{PREFIX}}_uninstall_cleanup();
		restore_current_blog();
	}
} else {
	{{PREFIX}}_uninstall_cleanup();
}
