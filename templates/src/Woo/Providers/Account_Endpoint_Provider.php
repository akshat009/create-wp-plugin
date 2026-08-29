<?php
/**
 * My Account endpoint provider registration for {{PLUGIN_NAME}}.
 *
 * @package {{NS}}\Woo\Providers
 */

declare(strict_types=1);

namespace {{NS}}\Woo\Providers;

use {{NS}}\Woo\Account\Account_Endpoint_Service;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Account_Endpoint_Provider.
 */
class Account_Endpoint_Provider {

	/**
	 * My Account endpoint service.
	 *
	 * @param Account_Endpoint_Service $service Endpoint service.
	 */
	public function __construct( private readonly Account_Endpoint_Service $service ) {
	}

	/**
	 * Register hooks.
	 *
	 * @return void
	 */
	public function init_hooks(): void {
		add_action( 'init', $this->service->register_endpoint( ... ) );
		add_filter( 'woocommerce_account_menu_items', $this->service->add_menu_item( ... ) );
		add_action( 'woocommerce_account_' . Account_Endpoint_Service::ENDPOINT . '_endpoint', $this->service->render_endpoint( ... ) );
	}
}
