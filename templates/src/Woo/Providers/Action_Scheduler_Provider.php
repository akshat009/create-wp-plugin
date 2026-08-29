<?php
/**
 * Action Scheduler provider registration for {{PLUGIN_NAME}}.
 *
 * @package {{NS}}\Woo\Providers
 */

declare(strict_types=1);

namespace {{NS}}\Woo\Providers;

use {{NS}}\Contracts\Conditional;
use {{NS}}\Contracts\Service_Provider;
use {{NS}}\Core\Container;
use {{NS}}\Woo\Tasks\Action_Scheduler_Service;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Action_Scheduler_Provider.
 */
class Action_Scheduler_Provider implements Service_Provider, Conditional {

	/**
	 * Accept an optional service override; the container builds a default
	 * lazily when one isn't injected.
	 *
	 * @param Action_Scheduler_Service|null $service Service instance.
	 */
	public function __construct( private readonly ?Action_Scheduler_Service $service = null ) {
	}

	/**
	 * Needed when WooCommerce or Action Scheduler is active.
	 *
	 * @return bool
	 */
	public function is_needed(): bool {
		return class_exists( 'WooCommerce' ) || function_exists( 'as_schedule_recurring_action' );
	}

	/**
	 * Register service in container.
	 *
	 * @param Container $container Application container.
	 * @return void
	 */
	public function register( Container $container ): void {
		$container->singleton(
			Action_Scheduler_Service::class,
			function () {
				return $this->service ?? new Action_Scheduler_Service();
			}
		);
	}

	/**
	 * Register hooks.
	 *
	 * @param Container $container Application container.
	 * @return void
	 */
	public function boot( Container $container ): void {
		$service = $container->get( Action_Scheduler_Service::class );

		add_action( 'init', array( $service, 'schedule_tasks' ) );
		add_action( Action_Scheduler_Service::HOOK, array( $service, 'handle_task' ) );
	}
}
