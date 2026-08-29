<?php
/**
 * WooCommerce Action Scheduler background queue service for {{PLUGIN_NAME}}.
 *
 * @package {{NS}}\Woo\Tasks
 */

declare(strict_types=1);

namespace {{NS}}\Woo\Tasks;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Action_Scheduler_Service.
 */
class Action_Scheduler_Service {

	/**
	 * Recurring hook name.
	 */
	public const HOOK = '{{PREFIX}}_process_background_task';

	/**
	 * Schedule recurring background task if not already scheduled.
	 *
	 * @return void
	 */
	public function schedule_tasks(): void {
		if ( ! function_exists( 'as_next_scheduled_action' ) || ! function_exists( 'as_schedule_recurring_action' ) ) {
			return;
		}

		if ( false === as_next_scheduled_action( self::HOOK ) ) {
			as_schedule_recurring_action(
				time(),
				DAY_IN_SECONDS,
				self::HOOK,
				array(),
				'{{SLUG}}'
			);
		}
	}

	/**
	 * Handle background task execution.
	 *
	 * @return void
	 */
	public function handle_task(): void {
		// Scaffolding: Place your scheduled background processing logic here.
		do_action( '{{PREFIX}}_background_task_completed' );
	}
}
