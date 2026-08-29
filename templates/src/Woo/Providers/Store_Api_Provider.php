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
	 * Extension instance.
	 *
	 * @var Store_Api_Extension|null
	 */
	private ?Store_Api_Extension $service = null;

	/**
	 * Constructor.
	 *
	 * @param Store_Api_Extension|null $service Extension instance.
	 */
	public function __construct( ?Store_Api_Extension $service = null ) {
		$this->service = $service;
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
