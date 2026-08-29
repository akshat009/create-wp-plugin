<?php
/**
 * Store API provider registration for {{PLUGIN_NAME}}.
 *
 * @package {{NS}}\Woo\Providers
 */

declare(strict_types=1);

namespace {{NS}}\Woo\Providers;

use {{NS}}\Woo\Api\Store_Api_Extension;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Store_Api_Provider.
 */
class Store_Api_Provider {

	/**
	 * Store API cart extension.
	 *
	 * @param Store_Api_Extension $service Extension instance.
	 */
	public function __construct( private readonly Store_Api_Extension $service ) {
	}

	/**
	 * Register hooks.
	 *
	 * @return void
	 */
	public function init_hooks(): void {
		add_action( 'woocommerce_blocks_loaded', $this->service->register_store_api_extension( ... ) );
	}
}
