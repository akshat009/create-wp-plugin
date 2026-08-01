<?php
/**
 * Sample Elementor Widget.
 *
 * @package {{NS}}\Widgets
 */

namespace {{NS}}\Widgets;

use Elementor\Widget_Base;
use Elementor\Controls_Manager;
use Elementor\Repeater;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Sample_Widget.
 */
class Sample_Widget extends Widget_Base {

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
	 * Get widget style dependencies.
	 *
	 * @return array
	 */
	public function get_style_depends() {
		return array( '{{PREFIX}}-sample-widget' );
	}

	/**
	 * Get widget script dependencies.
	 *
	 * @return array
	 */
	public function get_script_depends() {
		return array( '{{PREFIX}}-sample-widget' );
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
	 * Register controls for the widget.
	 *
	 * @return void
	 */
	protected function register_controls() {
		$this->start_controls_section(
			'content_section',
			array(
				'label' => __( 'Content', '{{SLUG}}' ),
				'tab'   => Controls_Manager::TAB_CONTENT,
			)
		);

		$this->add_control(
			'title',
			array(
				'label'       => __( 'Title', '{{SLUG}}' ),
				'type'        => Controls_Manager::TEXT,
				'default'     => __( 'Hello World', '{{SLUG}}' ),
				'placeholder' => __( 'Enter title', '{{SLUG}}' ),
			)
		);

		$this->add_control(
			'description',
			array(
				'label'       => __( 'Description', '{{SLUG}}' ),
				'type'        => Controls_Manager::TEXTAREA,
				'default'     => __( 'This is a sample Elementor widget built with {{PLUGIN_NAME}}.', '{{SLUG}}' ),
				'placeholder' => __( 'Enter description', '{{SLUG}}' ),
			)
		);

		$repeater = new Repeater();

		$repeater->add_control(
			'item_text',
			array(
				'label'       => __( 'Item Text', '{{SLUG}}' ),
				'type'        => Controls_Manager::TEXT,
				'default'     => __( 'Feature Item', '{{SLUG}}' ),
				'label_block' => true,
			)
		);

		$this->add_control(
			'items',
			array(
				'label'       => __( 'Items', '{{SLUG}}' ),
				'type'        => Controls_Manager::REPEATER,
				'fields'      => $repeater->get_controls(),
				'default'     => array(
					array( 'item_text' => __( 'Feature 1', '{{SLUG}}' ) ),
					array( 'item_text' => __( 'Feature 2', '{{SLUG}}' ) ),
				),
				'title_field' => '{{{ item_text }}}',
			)
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'style_section',
			array(
				'label' => __( 'Style', '{{SLUG}}' ),
				'tab'   => Controls_Manager::TAB_STYLE,
			)
		);

		$this->add_control(
			'title_color',
			array(
				'label'     => __( 'Title Color', '{{SLUG}}' ),
				'type'      => Controls_Manager::COLOR,
				'selectors' => array(
					'{{WRAPPER}} .sample-widget-title' => 'color: {{VALUE}};',
				),
			)
		);

		$this->end_controls_section();
	}

	/**
	 * Render widget output on frontend.
	 *
	 * @return void
	 */
	protected function render() {
		$settings = $this->get_settings_for_display();

		$this->add_inline_editing_attributes( 'title', 'none' );
		$this->add_inline_editing_attributes( 'description', 'basic' );
		?>
		<div class="sample-widget-wrapper">
			<?php if ( ! empty( $settings['title'] ) ) : ?>
				<h3 class="sample-widget-title" <?php echo $this->get_render_attribute_string( 'title' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>><?php echo esc_html( $settings['title'] ); ?></h3>
			<?php endif; ?>

			<?php if ( ! empty( $settings['description'] ) ) : ?>
				<p class="sample-widget-description" <?php echo $this->get_render_attribute_string( 'description' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>><?php echo esc_html( $settings['description'] ); ?></p>
			<?php endif; ?>

			<?php if ( ! empty( $settings['items'] ) ) : ?>
				<ul class="sample-widget-list">
					<?php foreach ( $settings['items'] as $index => $item ) : ?>
						<?php
						$item_key = $this->get_repeater_setting_key( 'item_text', 'items', $index );
						$this->add_inline_editing_attributes( $item_key, 'none' );
						?>
						<li class="sample-widget-item">
							<span <?php echo $this->get_render_attribute_string( $item_key ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>><?php echo esc_html( $item['item_text'] ); ?></span>
						</li>
					<?php endforeach; ?>
				</ul>
			<?php endif; ?>
		</div>
		<?php
	}
}
