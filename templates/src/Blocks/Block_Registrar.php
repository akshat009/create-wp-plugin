<?php
/**
 * Native Gutenberg block registration for {{PLUGIN_NAME}}.
 *
 * @package {{NS}}\Blocks
 */

declare(strict_types=1);

namespace {{NS}}\Blocks;

use {{NS}}\Contracts\Service_Provider;
use {{NS}}\Core\Container;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Block_Registrar.
 *
 * Discovers and registers every compiled block under assets/build/blocks/.
 * `npm run build` compiles each assets/src/blocks/<name>/ source directory
 * (block.json + index.js + edit.js, plus render.php for a dynamic block or
 * save.js for a static one) into assets/build/blocks/<name>/.
 *
 * To add another block later, scaffold its source folder — e.g.
 * `npx @wordpress/create-block <name> --no-plugin --target-dir assets/src/blocks/<name>`
 * (add `--variant dynamic` for a server-rendered one) — then rebuild. It is
 * picked up automatically; nothing here changes.
 */
class Block_Registrar implements Service_Provider {

	/**
	 * Directory (relative to the plugin root) holding compiled block metadata.
	 */
	private const BUILD_DIR = 'assets/build/blocks';

	/**
	 * No bindings needed.
	 *
	 * @param Container $container Application container.
	 * @return void
	 */
	public function register( Container $container ): void { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
	}

	/**
	 * Register block hooks.
	 *
	 * @param Container $container Application container.
	 * @return void
	 */
	public function boot( Container $container ): void { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
		add_action( 'init', $this->register_blocks(...) );
	}

	/**
	 * Register every built block directory that carries a block.json.
	 *
	 * A no-op until `npm run build` has produced assets/build/blocks/, so a
	 * fresh checkout never fatals on activation.
	 *
	 * @return void
	 */
	public function register_blocks(): void {
		$build_dir = {{PREFIX_UPPER}}_PATH . self::BUILD_DIR;

		if ( ! is_dir( $build_dir ) ) {
			return;
		}

		// Scanning the plugin's own compiled output, not user input — the VIP
		// restriction on glob() does not apply here.
		$dirs = glob( $build_dir . '/*', GLOB_ONLYDIR ); // phpcs:ignore WordPressVIPMinimum.Functions.RestrictedFunctions.glob_glob

		foreach ( (array) $dirs as $block_dir ) {
			if ( is_string( $block_dir ) && file_exists( $block_dir . '/block.json' ) ) {
				register_block_type( $block_dir );
			}
		}
	}
}
