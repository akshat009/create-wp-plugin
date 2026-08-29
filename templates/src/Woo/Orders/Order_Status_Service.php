<?php
/**
 * WooCommerce custom order status for {{PLUGIN_NAME}}.
 *
 * @package {{NS}}\Woo\Orders
 */

declare(strict_types=1);

namespace {{NS}}\Woo\Orders;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Order_Status_Service.
 */
class Order_Status_Service {

	/**
	 * Custom order status slug.
	 */
	public const STATUS_SLUG = 'wc-{{PREFIX}}-custom';

	/**
	 * Register the custom post status with WordPress.
	 *
	 * @return void
	 */
	public function register_status(): void {
		register_post_status(
			self::STATUS_SLUG,
			array(
				'label'                     => _x( 'Custom Status', 'Order status', '{{SLUG}}' ),
				'public'                    => true,
				'exclude_from_search'       => false,
				'show_in_admin_all_list'    => true,
				'show_in_admin_status_list' => true,
				/* translators: %s: count */
				'label_count'               => _n_noop( 'Custom Status <span class="count">(%s)</span>', 'Custom Status <span class="count">(%s)</span>', '{{SLUG}}' ),
			)
		);
	}

	/**
	 * Add custom status to WooCommerce order status list.
	 *
	 * @param array $order_statuses Existing order statuses.
	 * @return array
	 */
	public function add_to_order_statuses( array $order_statuses ): array {
		$order_statuses[ self::STATUS_SLUG ] = _x( 'Custom Status', 'Order status', '{{SLUG}}' );
		return $order_statuses;
	}
}
