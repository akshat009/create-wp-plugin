<?php
/**
 * Admin Settings Page Registrar.
 *
 * @package {{NS}}\Admin
 */

declare(strict_types=1);

namespace {{NS}}\Admin;

use {{NS}}\Contracts\Service_Provider;
use {{NS}}\Core\Container;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Settings_Registrar.
 *
 * Registers the admin menu page and Settings API hooks. Data access is
 * delegated to Settings_Repository; markup lives in src/Admin/views/.
 */
class Settings_Registrar implements Service_Provider {

	/**
	 * Application container, kept for on-demand Settings_Repository lookups
	 * from inside WordPress-invoked callbacks (add_options_page() and
	 * add_settings_field() call these with fixed signatures, so the
	 * repository can't be a constructor argument here).
	 *
	 * @var Container
	 */
	private Container $container;

	/**
	 * Bind Settings_Repository as a singleton.
	 *
	 * @param Container $container Application container.
	 * @return void
	 */
	public function register( Container $container ): void {
		$container->singleton( Settings_Repository::class, static fn () => new Settings_Repository() );
	}

	/**
	 * Register admin menu and settings hooks.
	 *
	 * @param Container $container Application container.
	 * @return void
	 */
	public function boot( Container $container ): void {
		$this->container = $container;

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
		$repository = $this->container->get( Settings_Repository::class );
		$repository->register_setting();

		add_settings_section(
			'{{PREFIX}}_main_section',
			__( 'General Settings', '{{SLUG}}' ),
			null,
			'{{SLUG}}'
		);

		add_settings_field(
			$repository->get_option_name(),
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
		$repository = $this->container->get( Settings_Repository::class );
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

		$repository = $this->container->get( Settings_Repository::class );

		include {{PREFIX_UPPER}}_PATH . 'src/Admin/views/settings-page.php';
	}
}
