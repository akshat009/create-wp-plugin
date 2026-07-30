<?php
/**
 * React / Gutenberg Enqueue Assets Manager.
 *
 * @package {{NS}}\Frontend
 */

namespace {{NS}}\Frontend;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Assets.
 */
class Assets {

	/**
	 * Register asset hooks.
	 *
	 * @return void
	 */
	public function register() {
		add_action( 'enqueue_block_assets', array( $this, 'enqueue_assets' ) );
	}

	/**
	 * Enqueue compiled block / React assets.
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
