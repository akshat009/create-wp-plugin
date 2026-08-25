<?php
/**
 * Registers the {{PREFIX}}/cart-summary dynamic block.
 *
 * The block itself (block.json, compiled index.js, render.php) lives in
 * assets/src/blocks/cart-summary/ and is compiled + copied to
 * assets/build/blocks/cart-summary/ by `npm run build`. Requires WP 6.4+
 * for the block.json "render" field.
 *
 * @package {{NS}}\Woo\Blocks
 */

declare(strict_types=1);

namespace {{NS}}\Woo\Blocks;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Cart_Summary_Block.
 */
class Cart_Summary_Block {

	/**
	 * Register the block from its compiled block.json, if built.
	 *
	 * @return void
	 */
	public static function register(): void {
		$block_dir = {{PREFIX_UPPER}}_PATH . 'assets/build/blocks/cart-summary';

		if ( ! file_exists( $block_dir . '/block.json' ) ) {
			return;
		}

		register_block_type( $block_dir );
	}
}
