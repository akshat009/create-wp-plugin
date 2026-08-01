<?php
/**
 * Frontend Shortcode Handler.
 *
 * @package {{NS}}\Frontend
 */

namespace {{NS}}\Frontend;

use {{NS}}\Contracts\Registrable;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Shortcode.
 */
class Shortcode implements Registrable {

	/**
	 * Register shortcode.
	 *
	 * @return void
	 */
	public function register(): void {
		add_shortcode( '{{PREFIX}}_display', array( $this, 'render_shortcode' ) );
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

		// TODO: SECURITY - Sanitize attribute inputs ($atts) and escape output HTML.
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
