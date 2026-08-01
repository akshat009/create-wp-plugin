<?php
/**
 * Fired during plugin activation.
 *
 * @package {{NS}}\Core
 */

namespace {{NS}}\Core;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Activator.
 *
 * Fired during plugin activation.
 */
class Activator {

	/**
	 * Execute activation tasks.
	 *
	 * @return void
	 */
	public static function run(): void {
		update_option( '{{PREFIX}}_version', {{PREFIX_UPPER}}_VERSION );
{{ACTIVATOR_BODY}}	}
}
