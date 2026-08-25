<?php
/**
 * {{PLUGIN_NAME}} Custom WooCommerce Product Type.
 *
 * @package {{NS}}\Woo\Products
 */

declare(strict_types=1);

namespace {{NS}}\Woo\Products;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Custom_Product.
 *
 * Registers a new WooCommerce product type ("{{PREFIX}}_custom"), selectable
 * from the "Product data" dropdown in wp-admin. This registers the type
 * itself; add a "Product data" panel/tab (see the
 * `woocommerce_product_data_tabs` / `woocommerce_product_data_panels` filters)
 * to expose custom fields for it.
 */
class Custom_Product extends \WC_Product {

	/**
	 * Product type slug used throughout WooCommerce (product_type term, admin dropdown, etc.).
	 *
	 * @var string
	 */
	protected $product_type = '{{PREFIX}}_custom';

	/**
	 * Resolve "{{PREFIX}}_custom" products to this class.
	 *
	 * @param string $classname    Resolved product class.
	 * @param string $product_type Product type slug.
	 * @return string
	 */
	public static function filter_product_class( $classname, $product_type ) {
		if ( '{{PREFIX}}_custom' === $product_type ) {
			return self::class;
		}
		return $classname;
	}

	/**
	 * Add this product type to the "Product data" type dropdown in wp-admin.
	 *
	 * @param array $types Existing product types.
	 * @return array
	 */
	public static function filter_product_type_selector( $types ) {
		$types['{{PREFIX}}_custom'] = __( '{{PLUGIN_NAME}} Product', '{{SLUG}}' );
		return $types;
	}
}
