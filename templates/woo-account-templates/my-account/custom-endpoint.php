<?php
/**
 * My Account Custom Endpoint View for {{PLUGIN_NAME}}.
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/my-account/{{PREFIX}}-custom.php.
 *
 * @package {{NS}}
 */

declare(strict_types=1);

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div class="woocommerce-MyAccount-content {{SLUG}}-custom-account-section">
	<h3><?php esc_html_e( 'Custom Account Section', '{{SLUG}}' ); ?></h3>
	<p><?php esc_html_e( 'This is a sample custom endpoint in WooCommerce My Account dashboard.', '{{SLUG}}' ); ?></p>
</div>
