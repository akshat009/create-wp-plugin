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
	 *
	 * @param array|null $services Optional injected services array.
	 */
	private function __construct( array $services = null ) {
		$this->services = null !== $services ? $services : $this->build_services();
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
	 * Get registered services.
	 *
	 * @return array
	 */
	public function get_services(): array {
		return $this->services;
	}

	/**
	 * Build built-in services array.
	 *
	 * @return array
	 */
	private function build_services(): array {
		$services = array();

		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			$services['cli'] = new CLI\Commands();
		}
{{REACT_ASSETS_REGISTRATION}}{{MODULE_REGISTRATIONS}}
		return $services;
	}

{{ELEMENTOR_WIDGET_METHODS}}	/**
	 * Boot all registered services and modules.
	 *
	 * @return void
	 */
	public function boot(): void {
		/**
		 * Filter the services to be registered.
		 *
		 * @param array $services Array of Registrable service instances.
		 */
		$services = apply_filters( '{{PREFIX}}_services', $this->services );

		foreach ( $services as $service ) {
			if ( $service instanceof Contracts\Registrable ) {
				$service->register();
			}
		}
	}
}
