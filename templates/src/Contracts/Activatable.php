<?php
/**
 * Activatable contract interface.
 *
 * @package {{NS}}\Contracts
 */

declare(strict_types=1);

namespace {{NS}}\Contracts;

use {{NS}}\Core\Container;

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
	 * @param Container $container Application container.
	 * @return void
	 */
	public function activate( Container $container ): void;
}
