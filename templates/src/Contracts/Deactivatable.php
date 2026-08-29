<?php
/**
 * Deactivatable contract interface.
 *
 * @package {{NS}}\Contracts
 */

declare(strict_types=1);

namespace {{NS}}\Contracts;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Interface Deactivatable
 *
 * Contract for the class run on plugin deactivation.
 */
interface Deactivatable {

	/**
	 * Run deactivation tasks.
	 *
	 * @return void
	 */
	public function deactivate(): void;
}
