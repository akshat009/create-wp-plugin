<?php
/**
 * PHPUnit Integration Bootstrap.
 *
 * Boots a real WordPress test environment (via wp-phpunit/wp-phpunit) rather
 * than mocking WordPress functions like tests/bootstrap.php (Brain Monkey)
 * does — register_post_type(), get_option(), add_filter(), etc. are the
 * genuine WordPress Core implementations here.
 *
 * Requires a MySQL test database. Set these before running
 * `composer test:integration` (WP_TESTS_DB_HOST defaults to "localhost"):
 *   bash / zsh:      export WP_TESTS_DB_NAME=wp_tests WP_TESTS_DB_USER=root WP_TESTS_DB_PASSWORD=root
 *   PowerShell:      $env:WP_TESTS_DB_NAME="wp_tests"; $env:WP_TESTS_DB_USER="root"; $env:WP_TESTS_DB_PASSWORD="root"
 *   cmd.exe:         set WP_TESTS_DB_NAME=wp_tests && set WP_TESTS_DB_USER=root && set WP_TESTS_DB_PASSWORD=root
 * See README.md.
 *
 * @package {{NS}}\Tests
 */

require_once dirname( __DIR__ ) . '/vendor/autoload.php';

$_tests_dir = getenv( 'WP_TESTS_DIR' );
if ( ! $_tests_dir ) {
	// Set automatically when wp-phpunit/wp-phpunit is installed via Composer.
	$_tests_dir = getenv( 'WP_PHPUNIT__DIR' );
}
if ( ! $_tests_dir ) {
	$_tests_dir = dirname( __DIR__ ) . '/vendor/wp-phpunit/wp-phpunit';
}

require_once $_tests_dir . '/includes/functions.php';

/**
 * Manually load the plugin under test.
 *
 * @return void
 */
function {{PREFIX}}_manually_load_plugin() {
	require dirname( __DIR__ ) . '/{{SLUG}}.php';
}
tests_add_filter( 'muplugins_loaded', '{{PREFIX}}_manually_load_plugin' );

require $_tests_dir . '/includes/bootstrap.php';
