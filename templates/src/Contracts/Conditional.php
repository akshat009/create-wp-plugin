<?php
/**
 * Conditional contract interface.
 *
 * @package {{NS}}\Contracts
 */

declare(strict_types=1);

namespace {{NS}}\Contracts;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Interface Conditional
 *
 * Lets a Service_Provider self-exclude from both the register() and boot()
 * passes (e.g. a WooCommerce provider checking class_exists('WooCommerce')),
 * instead of guarding every method body individually.
 */
interface Conditional {

	/**
	 * Whether this provider should be registered and booted at all.
	 *
	 * @return bool
	 */
	public function is_needed(): bool;
}
