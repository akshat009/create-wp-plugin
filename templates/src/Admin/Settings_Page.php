<?php
/**
 * Admin Settings Page Service.
 *
 * @package {{NS}}\Admin
 */

namespace {{NS}}\Admin;

use {{NS}}\Contracts\Registrable;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Settings_Page.
 */
class Settings_Page implements Registrable {

	/**
	 * Register admin menu and settings hooks.
	 *
	 * @return void
	 */
	public function register(): void {
		add_action( 'admin_menu', array( $this, 'add_menu_page' ) );
		add_action( 'admin_init', array( $this, 'register_settings' ) );
	}

	/**
	 * Add admin menu page.
	 *
	 * @return void
	 */
	public function add_menu_page() {
		add_options_page(
			__( '{{PLUGIN_NAME}} Settings', '{{SLUG}}' ),
			__( '{{PLUGIN_NAME}}', '{{SLUG}}' ),
			'manage_options',
			'{{SLUG}}',
			array( $this, 'render_page' )
		);
	}

	/**
	 * Register settings using Settings API.
	 *
	 * @return void
	 */
	public function register_settings() {
		register_setting(
			'{{PREFIX}}_options_group',
			'{{PREFIX}}_option_name',
			array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'default'           => '',
			)
		);

		add_settings_section(
			'{{PREFIX}}_main_section',
			__( 'General Settings', '{{SLUG}}' ),
			null,
			'{{SLUG}}'
		);

		add_settings_field(
			'{{PREFIX}}_option_name',
			__( 'Sample Setting', '{{SLUG}}' ),
			array( $this, 'render_sample_field' ),
			'{{SLUG}}',
			'{{PREFIX}}_main_section'
		);
	}

	/**
	 * Render sample setting field input.
	 *
	 * @return void
	 */
	public function render_sample_field() {
		$value = get_option( '{{PREFIX}}_option_name', '' );
		echo '<input type="text" name="' . esc_attr( '{{PREFIX}}_option_name' ) . '" value="' . esc_attr( (string) $value ) . '" class="regular-text" />';
	}

	/**
	 * Render admin page content.
	 *
	 * @return void
	 */
	public function render_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have sufficient permissions to access this page.', '{{SLUG}}' ) );
		}
		?>
		<div class="wrap">
			<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
			<form method="post" action="options.php">
				<?php
				settings_fields( '{{PREFIX}}_options_group' );
				do_settings_sections( '{{SLUG}}' );
				submit_button();
				?>
			</form>
		</div>
		<?php
	}
}
