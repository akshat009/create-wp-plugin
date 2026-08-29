<?php
/**
 * Frontend Shortcode Handler.
 *
 * @package {{NS}}\Frontend
 */

declare(strict_types=1);

namespace {{NS}}\Frontend;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Shortcode.
 */
class Shortcode {

	/**
	 * Register shortcode.
	 *
	 * @return void
	 */
	public function init_hooks(): void {
		add_shortcode( '{{PREFIX}}_display', $this->render_shortcode( ... ) );
	}

	/**
	 * Render shortcode output.
	 *
	 * @param array|string $atts    Shortcode attributes.
	 * @param string|null  $content Shortcode content.
	 * @return string Output HTML.
	 */
	public function render_shortcode( $atts = array(), $content = null ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
		$atts = shortcode_atts(
			array(
				'title' => __( 'Default Title', '{{SLUG}}' ),
			),
			$atts,
			'{{PREFIX}}_display'
		);

		$title = sanitize_text_field( $atts['title'] );

		ob_start();
		?>
		<div class="{{SLUG}}-shortcode">
			<h3><?php echo esc_html( $title ); ?></h3>
		</div>
		<?php
		return (string) ob_get_clean();
	}
}
