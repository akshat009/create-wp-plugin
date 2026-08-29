<?php
/**
 * WooCommerce custom order status registration for {{PLUGIN_NAME}}.
 *
 * @package {{NS}}\Woo\Providers
 */

declare(strict_types=1);

namespace {{NS}}\Woo\Providers;

use {{NS}}\Woo\Orders\Order_Status_Service;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Order_Status_Provider.
 */
class Order_Status_Provider {

	/**
	 * Custom order status service.
	 *
	 * @param Order_Status_Service $service Order status service.
	 */
	public function __construct( private readonly Order_Status_Service $service ) {
	}

	/**
	 * Register hooks.
	 *
	 * @return void
	 */
	public function init_hooks(): void {
		add_action( 'init', $this->service->register_status( ... ) );
		add_filter( 'wc_order_statuses', $this->service->add_to_order_statuses( ... ) );
	}
}
