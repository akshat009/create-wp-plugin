<?php
/**
 * Elementor Abstract Widget Base.
 *
 * @package {{NS}}\Widgets
 */

namespace {{NS}}\Widgets;

use Elementor\Widget_Base as Elementor_Widget_Base;
use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Group_Control_Border;
use Elementor\Group_Control_Box_Shadow;
use Elementor\Group_Control_Background;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( '\Elementor\Widget_Base' ) ) {
	return;
}

/**
 * Abstract Class Abstract_Widget.
 *
 * Extends Elementor's Widget_Base and provides helper methods to easily add
 * common Elementor controls (text, textarea, wysiwyg, number, select, switcher,
 * color, typography, media, url, choose, dimensions, slider, icons, group controls).
 */
abstract class Abstract_Widget extends Elementor_Widget_Base {

	/**
	 * Get widget categories.
	 * Default category is 'general'. Can be overridden by child classes.
	 *
	 * @return array
	 */
	public function get_categories() {
		return array( 'general' );
	}

	/**
	 * Register controls for the widget.
	 * Calls content and style control registration methods.
	 *
	 * @return void
	 */
	protected function register_controls() {
		$this->register_content_controls();
		$this->register_style_controls();
	}

	/**
	 * Register Content tab controls. Override in child widget class.
	 *
	 * @return void
	 */
	protected function register_content_controls() {}

	/**
	 * Register Style tab controls. Override in child widget class.
	 *
	 * @return void
	 */
	protected function register_style_controls() {}

	/* ------------------------------------------------------------------------
	 * Helper Methods for Adding Controls Easily
	 * ------------------------------------------------------------------------ */

	/**
	 * Add Text Control.
	 *
	 * @param string $id          Control ID.
	 * @param string $label       Control Label.
	 * @param string $default     Default value.
	 * @param string $placeholder Placeholder text.
	 * @param array  $args        Additional arguments.
	 * @return void
	 */
	protected function add_text_control( $id, $label, $default = '', $placeholder = '', $args = array() ) {
		$control_args = array_merge(
			array(
				'label'       => $label,
				'type'        => Controls_Manager::TEXT,
				'default'     => $default,
				'placeholder' => $placeholder,
			),
			$args
		);
		$this->add_control( $id, $control_args );
	}

	/**
	 * Add Textarea Control.
	 *
	 * @param string $id          Control ID.
	 * @param string $label       Control Label.
	 * @param string $default     Default value.
	 * @param string $placeholder Placeholder text.
	 * @param array  $args        Additional arguments.
	 * @return void
	 */
	protected function add_textarea_control( $id, $label, $default = '', $placeholder = '', $args = array() ) {
		$control_args = array_merge(
			array(
				'label'       => $label,
				'type'        => Controls_Manager::TEXTAREA,
				'default'     => $default,
				'placeholder' => $placeholder,
			),
			$args
		);
		$this->add_control( $id, $control_args );
	}

	/**
	 * Add WYSIWYG Editor Control.
	 *
	 * @param string $id      Control ID.
	 * @param string $label   Control Label.
	 * @param string $default Default value.
	 * @param array  $args    Additional arguments.
	 * @return void
	 */
	protected function add_wysiwyg_control( $id, $label, $default = '', $args = array() ) {
		$control_args = array_merge(
			array(
				'label'   => $label,
				'type'    => Controls_Manager::WYSIWYG,
				'default' => $default,
			),
			$args
		);
		$this->add_control( $id, $control_args );
	}

	/**
	 * Add Number Control.
	 *
	 * @param string    $id      Control ID.
	 * @param string    $label   Control Label.
	 * @param float|int $default Default value.
	 * @param float|int $min     Minimum value.
	 * @param float|int $max     Maximum value.
	 * @param float|int $step    Step value.
	 * @param array     $args    Additional arguments.
	 * @return void
	 */
	protected function add_number_control( $id, $label, $default = 0, $min = null, $max = null, $step = 1, $args = array() ) {
		$control_args = array(
			'label'   => $label,
			'type'    => Controls_Manager::NUMBER,
			'default' => $default,
			'step'    => $step,
		);
		if ( null !== $min ) {
			$control_args['min'] = $min;
		}
		if ( null !== $max ) {
			$control_args['max'] = $max;
		}
		$this->add_control( $id, array_merge( $control_args, $args ) );
	}

	/**
	 * Add Select Control.
	 *
	 * @param string $id      Control ID.
	 * @param string $label   Control Label.
	 * @param array  $options Array of options (key => label).
	 * @param string $default Default key.
	 * @param array  $args    Additional arguments.
	 * @return void
	 */
	protected function add_select_control( $id, $label, array $options, $default = '', $args = array() ) {
		$control_args = array_merge(
			array(
				'label'   => $label,
				'type'    => Controls_Manager::SELECT,
				'options' => $options,
				'default' => $default ? $default : array_key_first( $options ),
			),
			$args
		);
		$this->add_control( $id, $control_args );
	}

	/**
	 * Add Switcher / Toggle Control.
	 *
	 * @param string $id        Control ID.
	 * @param string $label     Control Label.
	 * @param string $default   Default ('yes' or '').
	 * @param string $label_on  Label when ON.
	 * @param string $label_off Label when OFF.
	 * @param array  $args      Additional arguments.
	 * @return void
	 */
	protected function add_switcher_control( $id, $label, $default = 'yes', $label_on = 'Yes', $label_off = 'No', $args = array() ) {
		$control_args = array_merge(
			array(
				'label'        => $label,
				'type'         => Controls_Manager::SWITCHER,
				'label_on'     => $label_on,
				'label_off'    => $label_off,
				'return_value' => 'yes',
				'default'      => $default,
			),
			$args
		);
		$this->add_control( $id, $control_args );
	}

	/**
	 * Add Color Control.
	 *
	 * @param string $id        Control ID.
	 * @param string $label     Control Label.
	 * @param string $default   Default hex color.
	 * @param array  $selectors CSS Selector mapping.
	 * @param array  $args      Additional arguments.
	 * @return void
	 */
	protected function add_color_control( $id, $label, $default = '', $selectors = array(), $args = array() ) {
		$control_args = array(
			'label'   => $label,
			'type'    => Controls_Manager::COLOR,
			'default' => $default,
		);
		if ( ! empty( $selectors ) ) {
			$control_args['selectors'] = $selectors;
		}
		$this->add_control( $id, array_merge( $control_args, $args ) );
	}

	/**
	 * Add Media / Image Control.
	 *
	 * @param string $id    Control ID.
	 * @param string $label Control Label.
	 * @param array  $args  Additional arguments.
	 * @return void
	 */
	protected function add_media_control( $id, $label, $args = array() ) {
		$control_args = array_merge(
			array(
				'label'   => $label,
				'type'    => Controls_Manager::MEDIA,
				'default' => array(
					'url' => \Elementor\Utils::get_placeholder_image_src(),
				),
			),
			$args
		);
		$this->add_control( $id, $control_args );
	}

	/**
	 * Add URL / Link Control.
	 *
	 * @param string $id    Control ID.
	 * @param string $label Control Label.
	 * @param array  $args  Additional arguments.
	 * @return void
	 */
	protected function add_url_control( $id, $label, $args = array() ) {
		$control_args = array_merge(
			array(
				'label'         => $label,
				'type'          => Controls_Manager::URL,
				'placeholder'   => __( 'https://your-link.com', '{{SLUG}}' ),
				'show_external' => true,
				'default'       => array(
					'url'         => '',
					'is_external' => false,
					'nofollow'    => false,
				),
			),
			$args
		);
		$this->add_control( $id, $control_args );
	}

	/**
	 * Add Alignment / Choose Control.
	 *
	 * @param string     $id        Control ID.
	 * @param string     $label     Control Label.
	 * @param string     $default   Default option.
	 * @param array|null $options   Custom choices array or null for default alignment options.
	 * @param array      $selectors Selectors mapping.
	 * @param array      $args      Additional arguments.
	 * @return void
	 */
	protected function add_choose_control( $id, $label, $default = 'left', $options = null, $selectors = array(), $args = array() ) {
		if ( null === $options ) {
			$options = array(
				'left'    => array(
					'title' => __( 'Left', '{{SLUG}}' ),
					'icon'  => 'eicon-text-align-left',
				),
				'center'  => array(
					'title' => __( 'Center', '{{SLUG}}' ),
					'icon'  => 'eicon-text-align-center',
				),
				'right'   => array(
					'title' => __( 'Right', '{{SLUG}}' ),
					'icon'  => 'eicon-text-align-right',
				),
				'justify' => array(
					'title' => __( 'Justify', '{{SLUG}}' ),
					'icon'  => 'eicon-text-align-justify',
				),
			);
		}
		$control_args = array(
			'label'   => $label,
			'type'    => Controls_Manager::CHOOSE,
			'options' => $options,
			'default' => $default,
			'toggle'  => true,
		);
		if ( ! empty( $selectors ) ) {
			$control_args['selectors'] = $selectors;
		}
		$this->add_control( $id, array_merge( $control_args, $args ) );
	}

	/**
	 * Add Slider Control.
	 *
	 * @param string $id        Control ID.
	 * @param string $label     Control Label.
	 * @param int    $min       Min value.
	 * @param int    $max       Max value.
	 * @param string $unit      Unit ('px', 'em', '%', etc.).
	 * @param int    $default   Default size value.
	 * @param array  $selectors CSS selector mapping.
	 * @param array  $args      Additional arguments.
	 * @return void
	 */
	protected function add_slider_control( $id, $label, $min = 0, $max = 100, $unit = 'px', $default = 16, $selectors = array(), $args = array() ) {
		$control_args = array(
			'label'      => $label,
			'type'       => Controls_Manager::SLIDER,
			'size_units' => array( 'px', 'em', 'rem', '%' ),
			'range'      => array(
				$unit => array(
					'min' => $min,
					'max' => $max,
				),
			),
			'default'    => array(
				'unit' => $unit,
				'size' => $default,
			),
		);
		if ( ! empty( $selectors ) ) {
			$control_args['selectors'] = $selectors;
		}
		$this->add_control( $id, array_merge( $control_args, $args ) );
	}

	/**
	 * Add Dimensions Control.
	 *
	 * @param string $id        Control ID.
	 * @param string $label     Control Label.
	 * @param array  $selectors CSS Selector mapping.
	 * @param array  $args      Additional arguments.
	 * @return void
	 */
	protected function add_dimensions_control( $id, $label, $selectors = array(), $args = array() ) {
		$control_args = array(
			'label'      => $label,
			'type'       => Controls_Manager::DIMENSIONS,
			'size_units' => array( 'px', '%', 'em', 'rem' ),
		);
		if ( ! empty( $selectors ) ) {
			$control_args['selectors'] = $selectors;
		}
		$this->add_control( $id, array_merge( $control_args, $args ) );
	}

	/**
	 * Add Icon Control.
	 *
	 * @param string $id      Control ID.
	 * @param string $label   Control Label.
	 * @param array  $default Default icon array.
	 * @param array  $args    Additional arguments.
	 * @return void
	 */
	protected function add_icon_control( $id, $label, $default = array(), $args = array() ) {
		$control_args = array_merge(
			array(
				'label'   => $label,
				'type'    => Controls_Manager::ICONS,
				'default' => $default,
			),
			$args
		);
		$this->add_control( $id, $control_args );
	}

	/**
	 * Add Typography Group Control.
	 *
	 * @param string $id       Control group ID prefix.
	 * @param string $selector CSS Selector targeting the text element.
	 * @param array  $args     Additional arguments.
	 * @return void
	 */
	protected function add_typography_group_control( $id, $selector, $args = array() ) {
		$group_args = array_merge(
			array(
				'name'     => $id,
				'selector' => $selector,
			),
			$args
		);
		$this->add_group_control( Group_Control_Typography::get_type(), $group_args );
	}

	/**
	 * Add Border Group Control.
	 *
	 * @param string $id       Control group ID prefix.
	 * @param string $selector CSS Selector targeting the element.
	 * @param array  $args     Additional arguments.
	 * @return void
	 */
	protected function add_border_group_control( $id, $selector, $args = array() ) {
		$group_args = array_merge(
			array(
				'name'     => $id,
				'selector' => $selector,
			),
			$args
		);
		$this->add_group_control( Group_Control_Border::get_type(), $group_args );
	}

	/**
	 * Add Box Shadow Group Control.
	 *
	 * @param string $id       Control group ID prefix.
	 * @param string $selector CSS Selector targeting the element.
	 * @param array  $args     Additional arguments.
	 * @return void
	 */
	protected function add_box_shadow_group_control( $id, $selector, $args = array() ) {
		$group_args = array_merge(
			array(
				'name'     => $id,
				'selector' => $selector,
			),
			$args
		);
		$this->add_group_control( Group_Control_Box_Shadow::get_type(), $group_args );
	}

	/**
	 * Add Background Group Control.
	 *
	 * @param string $id       Control group ID prefix.
	 * @param string $selector CSS Selector targeting the element.
	 * @param array  $args     Additional arguments.
	 * @return void
	 */
	protected function add_background_group_control( $id, $selector, $args = array() ) {
		$group_args = array_merge(
			array(
				'name'     => $id,
				'types'    => array( 'classic', 'gradient' ),
				'selector' => $selector,
			),
			$args
		);
		$this->add_group_control( Group_Control_Background::get_type(), $group_args );
	}
}
