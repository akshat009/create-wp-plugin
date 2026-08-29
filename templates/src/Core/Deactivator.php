<?php
/**
 * Fired during plugin deactivation.
 *
 * @package {{NS}}\Core
 */

declare(strict_types=1);

namespace {{NS}}\Core;

use {{NS}}\Contracts\Deactivatable;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Deactivator.
 *
 * Fired during plugin deactivation.
 */
class Deactivator implements Deactivatable {

	/**
	 * Execute deactivation tasks.
	 *
	 * @return void
	 */
	public function deactivate(): void {
{{DEACTIVATOR_BODY}}	}
}
