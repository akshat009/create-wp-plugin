<?php
/**
 * Deactivatable contract interface.
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
 * Interface Deactivatable
 *
 * Contract for the class run on plugin deactivation.
 */
interface Deactivatable {

	/**
	 * Run deactivation tasks.
	 *
	 * @param Container $container Application container.
	 * @return void
	 */
	public function deactivate( Container $container ): void;
}
