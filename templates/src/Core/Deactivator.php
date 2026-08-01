<?php
/**
 * Fired during plugin deactivation.
 *
 * @package {{NS}}\Core
 */

namespace {{NS}}\Core;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Deactivator.
 *
 * Fired during plugin deactivation.
 */
class Deactivator {

	/**
	 * Execute deactivation tasks.
	 *
	 * @return void
	 */
	public static function run(): void {
{{DEACTIVATOR_BODY}}	}
}
