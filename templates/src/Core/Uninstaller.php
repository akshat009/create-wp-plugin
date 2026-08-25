<?php
/**
 * Uninstall cleanup service.
 *
 * @package {{NS}}\Core
 */

declare(strict_types=1);

namespace {{NS}}\Core;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Uninstaller.
 *
 * OOP wrapper for uninstall.php's cleanup logic — constructed and invoked
 * once per site from uninstall.php's multisite loop.
 */
class Uninstaller {

	/**
	 * Perform uninstall cleanup tasks for the current site.
	 *
	 * @return void
	 */
	public function cleanup(): void {
		delete_option( '{{PREFIX}}_version' );
{{UNINSTALL_BODY}}		delete_transient( '{{PREFIX}}_elementor_widgets' );
	}
}
