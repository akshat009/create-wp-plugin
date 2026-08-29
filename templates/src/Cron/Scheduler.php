<?php
/**
 * WP-Cron Task Scheduler.
 *
 * @package {{NS}}\Cron
 */

declare(strict_types=1);

namespace {{NS}}\Cron;

use {{NS}}\Contracts\Service_Provider;
use {{NS}}\Core\Container;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Scheduler.
 */
class Scheduler implements Service_Provider {

	/**
	 * No bindings needed.
	 *
	 * @param Container $container Application container.
	 * @return void
	 */
	public function register( Container $container ): void { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
	}

	/**
	 * Register cron event actions.
	 *
	 * @param Container $container Application container.
	 * @return void
	 */
	public function boot( Container $container ): void { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
		add_action( '{{PREFIX}}_cron_event', $this->execute_cron_job(...) );
	}

	/**
	 * Execute cron job logic.
	 *
	 * Demonstrates a scheduled background task (e.g., updating an option timestamp or running periodic maintenance).
	 *
	 * @return void
	 */
	public function execute_cron_job(): void {
		update_option( '{{PREFIX}}_last_cron_run', time() );
	}
}
