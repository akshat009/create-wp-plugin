<?php
/**
 * WooCommerce custom order email registration for {{PLUGIN_NAME}}.
 *
 * @package {{NS}}\Woo\Providers
 */

declare(strict_types=1);

namespace {{NS}}\Woo\Providers;

use {{NS}}\Woo\Emails\Custom_Email;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Email_Provider.
 */
class Email_Provider {

	/**
	 * Register hooks.
	 *
	 * @return void
	 */
	public function init_hooks(): void {
		add_filter( 'woocommerce_email_classes', $this->register_email( ... ) );
	}

	/**
	 * Register the custom order email with WooCommerce.
	 *
	 * @param array $emails Existing email classes (already-constructed instances).
	 * @return array
	 */
	public function register_email( $emails ) {
		$emails['{{PREFIX}}_custom_email'] = new Custom_Email();
		return $emails;
	}
}
