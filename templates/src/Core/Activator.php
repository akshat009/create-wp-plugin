<?php
/**
 * Fired during plugin activation.
 *
 * @package {{NS}}\Core
 */

declare(strict_types=1);

namespace {{NS}}\Core;

use {{NS}}\Contracts\Activatable;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Activator.
 *
 * Fired during plugin activation.
 */
class Activator implements Activatable {

	/**
	 * Execute activation tasks.
	 *
	 * @return void
	 */
	public function activate(): void {
		update_option( '{{PREFIX}}_version', {{PREFIX_UPPER}}_VERSION );
{{ACTIVATOR_BODY}}	}
}
