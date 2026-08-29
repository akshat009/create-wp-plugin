<?php
/**
 * WooCommerce My Account Custom Endpoint Service for {{PLUGIN_NAME}}.
 *
 * @package {{NS}}\Woo\Account
 */

declare(strict_types=1);

namespace {{NS}}\Woo\Account;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Account_Endpoint_Service.
 */
class Account_Endpoint_Service {

	/**
	 * Endpoint query var / slug.
	 */
	public const ENDPOINT = '{{PREFIX}}-custom';

	/**
	 * Register rewrite endpoint.
	 *
	 * @return void
	 */
	public function register_endpoint(): void {
		add_rewrite_endpoint( self::ENDPOINT, EP_ROOT | EP_PAGES );
	}

	/**
	 * Add custom item to WooCommerce My Account navigation menu.
	 *
	 * @param array $items Existing navigation menu items.
	 * @return array
	 */
	public function add_menu_item( array $items ): array {
		$new_items = array();

		foreach ( $items as $key => $label ) {
			$new_items[ $key ] = $label;

			// Insert our custom tab just before customer logout.
			if ( 'customer-logout' === $key ) {
				$new_items[ self::ENDPOINT ] = __( 'Custom Area', '{{SLUG}}' );
			}
		}

		if ( ! isset( $new_items[ self::ENDPOINT ] ) ) {
			$new_items[ self::ENDPOINT ] = __( 'Custom Area', '{{SLUG}}' );
		}

		return $new_items;
	}

	/**
	 * Render custom endpoint content in My Account.
	 *
	 * @return void
	 */
	public function render_endpoint(): void {
		$template_path = locate_template( 'woocommerce/my-account/' . self::ENDPOINT . '.php' );

		if ( ! $template_path ) {
			$template_path = dirname( __DIR__, 3 ) . '/templates/my-account/' . self::ENDPOINT . '.php';
		}

		if ( file_exists( $template_path ) ) {
			include $template_path;
		} else {
			echo '<p>' . esc_html__( 'Welcome to your custom account area.', '{{SLUG}}' ) . '</p>';
		}
	}
}
