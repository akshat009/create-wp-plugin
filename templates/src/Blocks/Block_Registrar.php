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
 * Registers the plugin's native blocks from their compiled block.json
 * metadata. `npm run build` compiles assets/src/blocks/* into
 * assets/build/blocks/*; each of those directories is registered on `init`.
 * Two starters ship: `example` (dynamic, server-rendered via render.php) and
 * `example-static` (save() serializes markup into post content).
 */
class Block_Registrar implements Service_Provider {

	/**
	 * Compiled metadata directories (relative to the plugin root) to register.
	 */
	private const BLOCKS = array(
		'assets/build/blocks/example',
		'assets/build/blocks/example-static',
	);

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
		add_action( 'init', array( $this, 'register_blocks' ) );
	}

	/**
	 * Register the bundled blocks.
	 *
	 * To add another block, drop a new assets/src/blocks/<name>/ directory
	 * (block.json + index.js + edit.js, plus save.js for a static block or
	 * render.php for a dynamic one) and add its build path to self::BLOCKS —
	 * the build step picks the source up automatically.
	 *
	 * @return void
	 */
	public function register_blocks(): void {
		foreach ( self::BLOCKS as $relative_dir ) {
			$block_dir = {{PREFIX_UPPER}}_PATH . $relative_dir;

			// No-op until `npm run build` has produced the compiled metadata,
			// so a fresh checkout never fatals on activation.
			if ( file_exists( $block_dir . '/block.json' ) ) {
				register_block_type( $block_dir );
			}
		}
	}
}
