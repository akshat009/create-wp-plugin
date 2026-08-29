<?php
/**
 * React Admin App Build Pipeline Manager (@wordpress/scripts).
 *
 * Scoped to wp-admin: WordPress core does not ship a React runtime to
 * frontend visitors, so this pipeline is for the plugin's own admin
 * screens only. For interactive frontend markup, use the "Frontend
 * Interactivity" module (WordPress's native Interactivity API) instead
 * of mounting a React app publicly.
 *
 * @package {{NS}}\Admin
 */

declare(strict_types=1);

namespace {{NS}}\Admin;

use {{NS}}\Contracts\Service_Provider;
use {{NS}}\Core\Container;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Assets.
 */
class Assets implements Service_Provider {

	/**
	 * No bindings needed.
	 *
	 * @param Container $container Application container.
	 * @return void
	 */
	public function register( Container $container ): void { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
	}

	/**
	 * Register asset hooks.
	 *
	 * @param Container $container Application container.
	 * @return void
	 */
	public function boot( Container $container ): void { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
	}

	/**
	 * Enqueue compiled React admin app assets.
	 *
	 * @param string $hook_suffix Current admin page hook suffix.
	 * @return void
	 */
	public function enqueue_assets( $hook_suffix = '' ) {
{{#if admin_settings}}		if ( 'settings_page_{{SLUG}}' !== $hook_suffix ) {
			return;
		}

{{else}}		// TODO: narrow this to your plugin's own admin screen(s), e.g. compare $hook_suffix.
{{/if}}		$asset_file = {{PREFIX_UPPER}}_PATH . 'assets/build/index.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = require $asset_file;

		wp_enqueue_script(
			'{{PREFIX}}-admin-app',
			{{PREFIX_UPPER}}_URL . 'assets/build/index.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		if ( file_exists( {{PREFIX_UPPER}}_PATH . 'assets/build/index.css' ) ) {
			wp_enqueue_style(
				'{{PREFIX}}-admin-app',
				{{PREFIX_UPPER}}_URL . 'assets/build/index.css',
				array(),
				$asset['version']
			);
		}
	}
}
