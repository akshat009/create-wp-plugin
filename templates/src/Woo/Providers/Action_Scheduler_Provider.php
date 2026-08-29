<?php
/**
 * Action Scheduler provider registration for {{PLUGIN_NAME}}.
 *
 * @package {{NS}}\Woo\Providers
 */

declare(strict_types=1);

namespace {{NS}}\Woo\Providers;

use {{NS}}\Woo\Tasks\Action_Scheduler_Service;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Action_Scheduler_Provider.
 */
class Action_Scheduler_Provider {

	/**
	 * Recurring-task service.
	 *
	 * @param Action_Scheduler_Service $service Task service.
	 */
	public function __construct( private readonly Action_Scheduler_Service $service ) {
	}

	/**
	 * Register hooks.
	 *
	 * @return void
	 */
	public function init_hooks(): void {
		add_action( 'init', $this->service->schedule_tasks( ... ) );
		add_action( Action_Scheduler_Service::HOOK, $this->service->handle_task( ... ) );
	}
}
