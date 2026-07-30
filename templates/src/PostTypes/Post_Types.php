<?php
/**
 * Custom Post Type and Taxonomy Definitions.
 *
 * @package {{NS}}\PostTypes
 */

namespace {{NS}}\PostTypes;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Post_Types.
 */
class Post_Types {

	/**
	 * Register post types and taxonomies.
	 *
	 * @return void
	 */
	public function register() {
		add_action( 'init', array( $this, 'register_cpt_and_taxonomy' ) );
	}

	/**
	 * Register custom post type and custom taxonomy.
	 *
	 * @return void
	 */
	public function register_cpt_and_taxonomy() {
		$cpt_labels = array(
			'name'          => __( 'Items', '{{SLUG}}' ),
			'singular_name' => __( 'Item', '{{SLUG}}' ),
		);

		$cpt_args = array(
			'labels'       => $cpt_labels,
			'public'       => true,
			'has_archive'  => true,
			'show_in_rest' => true,
			'supports'     => array( 'title', 'editor', 'thumbnail' ),
			// TODO: SECURITY - Set custom capability_type if user capabilities are restricted.
		);

		register_post_type( '{{PREFIX}}_item', $cpt_args );

		$tax_labels = array(
			'name'          => __( 'Categories', '{{SLUG}}' ),
			'singular_name' => __( 'Category', '{{SLUG}}' ),
		);

		$tax_args = array(
			'labels'       => $tax_labels,
			'hierarchical' => true,
			'show_in_rest' => true,
		);

		register_taxonomy( '{{PREFIX}}_category', array( '{{PREFIX}}_item' ), $tax_args );
	}
}
