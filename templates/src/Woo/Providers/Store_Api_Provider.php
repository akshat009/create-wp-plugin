<?php
/**
 * Store API provider registration for {{PLUGIN_NAME}}.
 *
 * @package {{NS}}\Woo\Providers
 */

declare(strict_types=1);

namespace {{NS}}\Woo\Providers;

use {{NS}}\Contracts\Conditional;
use {{NS}}\Contracts\Service_Provider;
use {{NS}}\Core\Container;
use {{NS}}\Woo\Api\Store_Api_Extension;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Store_Api_Provider.
 */
class Store_Api_Provider implements Service_Provider, Conditional {

	/**
	 * Accept an optional service override; the container builds a default
	 * lazily when one isn't injected.
	 *
	 * @param Store_Api_Extension|null $service Extension instance.
	 */
	public function __construct( private readonly ?Store_Api_Extension $service = null ) {
	}

	/**
	 * Only needed when WooCommerce is active.
	 *
	 * @return bool
	 */
	public function is_needed(): bool {
		return class_exists( 'WooCommerce' );
	}

	/**
	 * Register service in container.
	 *
	 * @param Container $container Application container.
	 * @return void
	 */
	public function register( Container $container ): void {
		$container->singleton(
			Store_Api_Extension::class,
			function () {
				return $this->service ?? new Store_Api_Extension();
			}
		);
	}

	/**
	 * Register hooks.
	 *
	 * @param Container $container Application container.
	 * @return void
	 */
	public function boot( Container $container ): void {
		$service = $container->get( Store_Api_Extension::class );

		add_action( 'woocommerce_blocks_loaded', array( $service, 'register_store_api_extension' ) );
	}
}
