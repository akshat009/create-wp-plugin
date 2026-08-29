<?php
/**
 * Activatable contract interface.
 *
 * @package {{NS}}\Contracts
 */

declare(strict_types=1);

namespace {{NS}}\Contracts;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Interface Activatable
 *
 * Contract for the class run on plugin activation.
 */
interface Activatable {

	/**
	 * Run activation tasks.
	 *
	 * @return void
	 */
	public function activate(): void;
}
