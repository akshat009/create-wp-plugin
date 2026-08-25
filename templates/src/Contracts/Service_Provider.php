<?php
/**
 * Service_Provider contract interface.
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
 * Interface Service_Provider
 *
 * Contract for anything the Plugin composition root runs. register() is for
 * container bindings ONLY — no WordPress hooks may be registered there, so
 * that construction never has side effects. boot() is where add_action(),
 * add_filter(), and add_shortcode() calls belong.
 */
interface Service_Provider {

	/**
	 * Bind services into the container. Must not register WordPress hooks.
	 *
	 * @param Container $container Application container.
	 * @return void
	 */
	public function register( Container $container ): void;

	/**
	 * Register WordPress hooks and functionality.
	 *
	 * @param Container $container Application container.
	 * @return void
	 */
	public function boot( Container $container ): void;
}
