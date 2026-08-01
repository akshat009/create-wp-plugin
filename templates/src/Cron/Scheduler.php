<?php
/**
 * WP-Cron Task Scheduler.
 *
 * @package {{NS}}\Cron
 */

namespace {{NS}}\Cron;

use {{NS}}\Contracts\Registrable;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Scheduler.
 */
class Scheduler implements Registrable {

	/**
	 * Register cron event actions.
	 *
	 * @return void
	 */
	public function register(): void {
		add_action( '{{PREFIX}}_cron_event', array( $this, 'execute_cron_job' ) );

		if ( ! wp_next_scheduled( '{{PREFIX}}_cron_event' ) ) {
			wp_schedule_event( time(), 'hourly', '{{PREFIX}}_cron_event' );
		}
	}

	/**
	 * Execute cron job logic.
	 *
	 * @return void
	 */
	public function execute_cron_job() {
		// TODO: SECURITY - Validate background task authorization / parameters.
	}
}
