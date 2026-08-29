<?php
/**
 * WooCommerce custom order email registration for {{PLUGIN_NAME}}.
 *
 * @package {{NS}}\Woo\Providers
 */

declare(strict_types=1);

namespace {{NS}}\Woo\Providers;

use {{NS}}\Contracts\Conditional;
use {{NS}}\Contracts\Service_Provider;
use {{NS}}\Core\Container;
use {{NS}}\Woo\Emails\Custom_Email;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Email_Provider.
 */
class Email_Provider implements Service_Provider, Conditional {

	/**
	 * Only needed when WooCommerce is active.
	 *
	 * @return bool
	 */
	public function is_needed(): bool {
		return class_exists( 'WooCommerce' );
	}

	/**
	 * No bindings needed.
	 *
	 * @param Container $container Application container.
	 * @return void
	 */
	public function register( Container $container ): void { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
	}

	/**
	 * Register hooks.
	 *
	 * @param Container $container Application container.
	 * @return void
	 */
	public function boot( Container $container ): void { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
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
