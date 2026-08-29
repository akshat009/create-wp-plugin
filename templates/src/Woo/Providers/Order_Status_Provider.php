<?php
/**
 * WooCommerce custom order status registration for {{PLUGIN_NAME}}.
 *
 * @package {{NS}}\Woo\Providers
 */

declare(strict_types=1);

namespace {{NS}}\Woo\Providers;

use {{NS}}\Contracts\Conditional;
use {{NS}}\Contracts\Service_Provider;
use {{NS}}\Core\Container;
use {{NS}}\Woo\Orders\Order_Status_Service;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Order_Status_Provider.
 */
class Order_Status_Provider implements Service_Provider, Conditional {

	/**
	 * Accept an optional service override; the container builds a default
	 * lazily when one isn't injected.
	 *
	 * @param Order_Status_Service|null $service Order status service.
	 */
	public function __construct( private readonly ?Order_Status_Service $service = null ) {
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
	 * Bind service to container.
	 *
	 * @param Container $container Application container.
	 * @return void
	 */
	public function register( Container $container ): void {
		$container->singleton(
			Order_Status_Service::class,
			function () {
				return $this->service ?? new Order_Status_Service();
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
		$service = $container->get( Order_Status_Service::class );

		add_action( 'init', array( $service, 'register_status' ) );
		add_filter( 'wc_order_statuses', array( $service, 'add_to_order_statuses' ) );
	}
}
