<?php
/**
 * Main Plugin Orchestrator.
 *
 * @package {{NS}}
 */

namespace {{NS}};

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Singleton orchestrator class for {{PLUGIN_NAME}}.
 */
final class Plugin {

	/**
	 * Instance of this class.
	 *
	 * @var Plugin|null
	 */
	private static $instance = null;

	/**
	 * Services container array.
	 *
	 * @var array
	 */
	private $services = array();

	/**
	 * Private constructor for singleton.
	 */
	private function __construct() {
		$this->register_services();
		$this->register_modules();
	}

	/**
	 * Get instance.
	 *
	 * @return Plugin
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Register core services.
	 *
	 * @return void
	 */
	private function register_services() {
		// Register services here.
		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			$this->services['cli'] = new CLI\Commands();
		}
{{REACT_ASSETS_REGISTRATION}}	}

	/**
	 * Register optional plugin modules.
	 *
	 * @return void
	 */
	private function register_modules() {
		// Register modules here.
{{MODULE_REGISTRATIONS}}	}

	/**
	 * Boot all registered services and modules.
	 *
	 * @return void
	 */
	public function boot() {
		foreach ( $this->services as $service ) {
			if ( method_exists( $service, 'register' ) ) {
				$service->register();
			}
		}
	}
}
