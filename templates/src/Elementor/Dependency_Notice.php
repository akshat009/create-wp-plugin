<?php
/**
 * Elementor Dependency Notice Service.
 *
 * @package {{NS}}\Elementor
 */

declare(strict_types=1);

namespace {{NS}}\Elementor;

use {{NS}}\Contracts\Service_Provider;
use {{NS}}\Core\Container;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Dependency_Notice.
 */
class Dependency_Notice implements Service_Provider {

	/**
	 * No bindings needed.
	 *
	 * @param Container $container Application container.
	 * @return void
	 */
	public function register( Container $container ): void { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
	}

	/**
	 * Register admin notice hooks.
	 *
	 * @param Container $container Application container.
	 * @return void
	 */
	public function boot( Container $container ): void { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
		add_action( 'admin_notices', $this->render_notice( ... ) );
	}

	/**
	 * Render notice if Elementor is not active and user has permission.
	 *
	 * @return void
	 */
	public function render_notice(): void {
		if ( did_action( 'elementor/loaded' ) ) {
			return;
		}

		if ( ! current_user_can( 'activate_plugins' ) ) {
			return;
		}

		$install_url = self_admin_url( 'plugin-install.php?tab=plugin-information&plugin=elementor' );
		?>
		<div class="notice notice-warning is-dismissible">
			<p>
				<?php
				echo wp_kses_post(
					sprintf(
						/* translators: 1: Plugin name, 2: Install Elementor link */
						__( '%1$s requires Elementor to be installed and activated. %2$s', '{{SLUG}}' ),
						'<strong>' . esc_html( '{{PLUGIN_NAME_ESC}}' ) . '</strong>',
						'<a href="' . esc_url( $install_url ) . '">' . esc_html__( 'Install Elementor', '{{SLUG}}' ) . '</a>'
					)
				);
				?>
			</p>
		</div>
		<?php
	}
}
