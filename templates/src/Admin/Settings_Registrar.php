<?php
/**
 * Admin Settings Page Registrar.
 *
 * @package {{NS}}\Admin
 */

declare(strict_types=1);

namespace {{NS}}\Admin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Settings_Registrar.
 *
 * Registers the admin menu page and Settings API hooks. Data access is
 * delegated to Settings_Repository; markup lives in src/Admin/views/.
 */
class Settings_Registrar {

	/**
	 * Data-access layer for the plugin's option.
	 *
	 * @param Settings_Repository $repository Settings repository.
	 */
	public function __construct( private readonly Settings_Repository $repository ) {
	}

	/**
	 * Register admin menu and settings hooks.
	 *
	 * @return void
	 */
	public function init_hooks(): void {
		add_action( 'admin_menu', $this->add_menu_page( ... ) );
		add_action( 'admin_init', $this->register_settings( ... ) );
	}

	/**
	 * Add admin menu page.
	 *
	 * @return void
	 */
	public function add_menu_page() {
		add_options_page(
			__( '{{PLUGIN_NAME_ESC}} Settings', '{{SLUG}}' ),
			__( '{{PLUGIN_NAME_ESC}}', '{{SLUG}}' ),
			'manage_options',
			'{{SLUG}}',
			$this->render_page( ... )
		);
	}

	/**
	 * Register settings using the Settings API.
	 *
	 * @return void
	 */
	public function register_settings() {
		$this->repository->register_setting();

		add_settings_section(
			'{{PREFIX}}_main_section',
			__( 'General Settings', '{{SLUG}}' ),
			null,
			'{{SLUG}}'
		);

		add_settings_field(
			$this->repository->get_option_name(),
			__( 'Sample Setting', '{{SLUG}}' ),
			$this->render_sample_field( ... ),
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
		$repository = $this->repository;
		$name       = $repository->get_option_name();
		$value      = $repository->get_value();

		include {{PREFIX_UPPER}}_PATH . 'src/Admin/views/sample-field.php';
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

		$repository = $this->repository;

		include {{PREFIX_UPPER}}_PATH . 'src/Admin/views/settings-page.php';
	}
}
