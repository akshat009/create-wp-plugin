<?php
/**
 * Registrable contract interface.
 *
 * @package {{NS}}\Contracts
 */

namespace {{NS}}\Contracts;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Interface Registrable
 *
 * Contract for services that register WordPress hooks or functionality.
 */
interface Registrable {

	/**
	 * Register service hooks and functionality.
	 *
	 * @return void
	 */
	public function register(): void;
}
