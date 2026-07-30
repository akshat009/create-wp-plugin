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

// TODO: Delete options created by {{PLUGIN_NAME}}.
// TODO: Delete transients created by {{PLUGIN_NAME}}.
