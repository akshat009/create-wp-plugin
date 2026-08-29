<?php
/**
 * My Account endpoint provider registration for {{PLUGIN_NAME}}.
 *
 * @package {{NS}}\Woo\Providers
 */

declare(strict_types=1);

namespace {{NS}}\Woo\Providers;

use {{NS}}\Contracts\Conditional;
use {{NS}}\Contracts\Service_Provider;
use {{NS}}\Core\Container;
use {{NS}}\Woo\Account\Account_Endpoint_Service;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Account_Endpoint_Provider.
 */
class Account_Endpoint_Provider implements Service_Provider, Conditional {

	/**
	 * Service instance.
	 *
	 * @var Account_Endpoint_Service|null
	 */
	private ?Account_Endpoint_Service $service = null;

	/**
	 * Constructor.
	 *
	 * @param Account_Endpoint_Service|null $service Service instance.
	 */
	public function __construct( ?Account_Endpoint_Service $service = null ) {
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
			Account_Endpoint_Service::class,
			function () {
				return $this->service ?? new Account_Endpoint_Service();
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
		$service = $container->get( Account_Endpoint_Service::class );

		add_action( 'init', array( $service, 'register_endpoint' ) );
		add_filter( 'woocommerce_account_menu_items', array( $service, 'add_menu_item' ) );
		add_action( 'woocommerce_account_' . Account_Endpoint_Service::ENDPOINT . '_endpoint', array( $service, 'render_endpoint' ) );
	}
}
