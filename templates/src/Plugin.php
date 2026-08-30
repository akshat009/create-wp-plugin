<?php
/**
 * Plugin bootloader -- the composition root. Instantiates every selected
 * module's class and registers its WordPress hooks. A class missing from
 * boot() never has its hooks fire.
 *
 * @package {{NS}}
 */

declare(strict_types=1);

namespace {{NS}};

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Singleton bootloader for {{PLUGIN_NAME}}.
 *
 * Not a service container: modules are plain classes with an init_hooks()
 * method.{{#if has_services}} Shared services come from {@see Services}.{{/if}}
 * One instance per request, reached with instance(); boot() is idempotent.
 */
final class Plugin {

	/**
	 * The one shared instance.
	 *
	 * @var self|null
	 */
	private static ?self $instance = null;

	/**
	 * Whether boot() has already run on this instance.
	 *
	 * @var bool
	 */
	private bool $booted = false;

	/**
	 * Private -- construct via instance().
	 */
	private function __construct() {
	}

	/**
	 * The shared Plugin instance.
	 *
	 * @return self
	 */
	public static function instance(): self {
		return self::$instance ??= new self();
	}

	/**
	 * Replace (or, with null, clear) the shared instance. Test seam.
	 *
	 * @param self|null $plugin Replacement instance, or null to reset.
	 * @return void
	 */
	public static function set_instance( ?self $plugin ): void {
		self::$instance = $plugin;
	}

	/**
	 * Instantiate every selected module and register its WordPress hooks.
	 *
	 * Idempotent: safe to call more than once, only the first call wires
	 * anything up.
	 *
	 * @return void
	 */
	public function boot(): void {
		if ( $this->booted ) {
			return;
		}

		$this->booted = true;
{{BOOTLOADER_LINES}}	}
}
