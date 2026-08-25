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
	 * @param Container $container Application container (already registered — register_all() has run).
	 * @return void
	 */
	public function deactivate( Container $container ): void { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found -- required by the Deactivatable contract; not every generated deactivator body uses it.
{{DEACTIVATOR_BODY}}	}
}
