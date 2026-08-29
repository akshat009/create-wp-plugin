<?php
/**
 * Server-side render for the {{SLUG}}/example block.
 *
 * @package {{NS}}\Blocks
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Inner block content (unused — this block has none).
 * @var WP_Block $block      Block instance (unused).
 */

defined( 'ABSPATH' ) || exit;

$text = isset( $attributes['content'] ) ? (string) $attributes['content'] : '';

if ( '' === trim( wp_strip_all_tags( $text ) ) ) {
	return;
}

printf(
	'<p %1$s>%2$s</p>',
	get_block_wrapper_attributes(), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- core helper escapes its attributes internally.
	wp_kses_post( $text )
);
