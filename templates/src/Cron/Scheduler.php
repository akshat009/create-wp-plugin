<?php
/**
 * WP-Cron Task Scheduler.
 *
 * @package {{NS}}\Cron
 */

declare(strict_types=1);

namespace {{NS}}\Cron;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Scheduler.
 */
class Scheduler {

	/**
	 * Register cron event actions.
	 *
	 * @return void
	 */
	public function init_hooks(): void {
		add_action( '{{PREFIX}}_cron_event', $this->execute_cron_job( ... ) );
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
