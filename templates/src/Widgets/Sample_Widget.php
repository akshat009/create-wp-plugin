<?php
/**
 * Sample Elementor Widget.
 *
 * @package {{NS}}\Widgets
 */

namespace {{NS}}\Widgets;

use Elementor\Controls_Manager;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( '\Elementor\Widget_Base' ) ) {
	return;
}

/**
 * Class Sample_Widget.
 */
class Sample_Widget extends Abstract_Widget {

	/**
	 * Get widget name.
	 *
	 * @return string
	 */
	public function get_name() {
		return '{{PREFIX}}_sample_widget';
	}

	/**
	 * Get widget title.
	 *
	 * @return string
	 */
	public function get_title() {
		return __( 'Sample Widget', '{{SLUG}}' );
	}

	/**
	 * Get widget icon.
	 *
	 * @return string
	 */
	public function get_icon() {
		return 'eicon-code';
	}

	/**
	 * Get widget categories.
	 *
	 * @return array
	 */
	public function get_categories() {
		return array( 'general' );
	}

	/**
	 * Register Content tab controls.
	 *
	 * @return void
	 */
	protected function register_content_controls() {
		$this->start_controls_section(
			'content_section',
			array(
				'label' => __( 'Content', '{{SLUG}}' ),
				'tab'   => Controls_Manager::TAB_CONTENT,
			)
		);

		$this->add_text_control( 'title', __( 'Title', '{{SLUG}}' ), __( 'Hello World', '{{SLUG}}' ) );
		$this->add_textarea_control( 'description', __( 'Description', '{{SLUG}}' ), __( 'This is a sample Elementor widget built with {{PLUGIN_NAME}}.', '{{SLUG}}' ) );
		$this->add_url_control( 'button_link', __( 'Button Link', '{{SLUG}}' ) );

		$this->end_controls_section();
	}

	/**
	 * Register Style tab controls.
	 *
	 * @return void
	 */
	protected function register_style_controls() {
		$this->start_controls_section(
			'style_section',
			array(
				'label' => __( 'Style', '{{SLUG}}' ),
				'tab'   => Controls_Manager::TAB_STYLE,
			)
		);

		$this->add_color_control( 'title_color', __( 'Title Color', '{{SLUG}}' ), '', array( '{{WRAPPER}} .sample-widget-title' => 'color: {{VALUE}};' ) );
		$this->add_typography_group_control( 'title_typography', '{{WRAPPER}} .sample-widget-title' );

		$this->end_controls_section();
	}

	/**
	 * Render widget output on frontend.
	 *
	 * @return void
	 */
	protected function render() {
		$settings = $this->get_settings_for_display();
		?>
		<div class="sample-widget-wrapper">
			<?php if ( ! empty( $settings['title'] ) ) : ?>
				<h3 class="sample-widget-title"><?php echo esc_html( $settings['title'] ); ?></h3>
			<?php endif; ?>

			<?php if ( ! empty( $settings['description'] ) ) : ?>
				<p class="sample-widget-description"><?php echo esc_html( $settings['description'] ); ?></p>
			<?php endif; ?>

			<?php if ( ! empty( $settings['button_link']['url'] ) ) : ?>
				<a href="<?php echo esc_url( $settings['button_link']['url'] ); ?>"
				   class="sample-widget-btn"
				   <?php echo ! empty( $settings['button_link']['is_external'] ) ? 'target="_blank"' : ''; ?>
				   <?php echo ! empty( $settings['button_link']['nofollow'] ) ? 'rel="nofollow"' : ''; ?>>
					<?php esc_html_e( 'Click Here', '{{SLUG}}' ); ?>
				</a>
			<?php endif; ?>
		</div>
		<?php
	}
}
