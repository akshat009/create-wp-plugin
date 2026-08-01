<?php
/**
 * React Asset Build Pipeline Manager (@wordpress/scripts).
 *
 * @package {{NS}}\Frontend
 */

namespace {{NS}}\Frontend;

use {{NS}}\Contracts\Registrable;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Assets.
 */
class Assets implements Registrable {

	/**
	 * Register asset hooks.
	 *
	 * @return void
	 */
	public function register(): void {
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );
		// To enqueue assets in WordPress admin dashboard instead, hook 'admin_enqueue_scripts' here.
	}

	/**
	 * Enqueue compiled React assets.
	 *
	 * @return void
	 */
	public function enqueue_assets() {
		$asset_file = {{PREFIX_UPPER}}_PATH . 'assets/build/index.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = require $asset_file;

		wp_enqueue_script(
			'{{PREFIX}}-react-app',
			{{PREFIX_UPPER}}_URL . 'assets/build/index.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		if ( file_exists( {{PREFIX_UPPER}}_PATH . 'assets/build/index.css' ) ) {
			wp_enqueue_style(
				'{{PREFIX}}-react-app',
				{{PREFIX_UPPER}}_URL . 'assets/build/index.css',
				array(),
				$asset['version']
			);
		}
	}
}
