<?php
/**
 * Custom Post Type and Taxonomy Definitions.
 *
 * @package {{NS}}\PostTypes
 */

declare(strict_types=1);

namespace {{NS}}\PostTypes;

use {{NS}}\Contracts\Service_Provider;
use {{NS}}\Core\Container;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Post_Types.
 */
class Post_Types implements Service_Provider {

	/**
	 * Bind this instance so Activator can resolve it to run
	 * register_cpt_and_taxonomy() once, synchronously, on activation
	 * (before the 'init' hook it's normally registered against would fire).
	 *
	 * @param Container $container Application container.
	 * @return void
	 */
	public function register( Container $container ): void {
		$container->instance( self::class, $this );
	}

	/**
	 * Register post types and taxonomies.
	 *
	 * @param Container $container Application container.
	 * @return void
	 */
	public function boot( Container $container ): void { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
		add_action( 'init', $this->register_cpt_and_taxonomy( ... ) );
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
			'labels'          => $cpt_labels,
			'public'          => true,
			'has_archive'     => true,
			'show_in_rest'    => true,
			'supports'        => array( 'title', 'editor', 'thumbnail' ),
			'capability_type' => 'post',
			'map_meta_cap'    => true,
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
