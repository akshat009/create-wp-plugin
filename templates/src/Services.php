<?php
/**
 * Shared service instances.
 *
 * @package {{NS}}
 */

declare(strict_types=1);

namespace {{NS}};

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Static service locator.
 *
 * Each accessor builds its service the first time it's called and returns
 * that same instance forever after — a singleton per accessor, without a
 * container. Tests swap a double in with set() and clear everything with
 * reset() in tearDown().
 */
final class Services {

	/**
	 * Memoised instances, keyed by accessor name.
	 *
	 * @var array<string, object>
	 */
	private static array $instances = array();

{{SERVICES_ACCESSORS}}
	/**
	 * Replace a memoised service (test seam).
	 *
	 * @param string $name    Accessor name (e.g. 'cache').
	 * @param object $service Replacement instance.
	 * @return void
	 */
	public static function set( string $name, object $service ): void {
		self::$instances[ $name ] = $service;
	}

	/**
	 * Forget every memoised service (test seam — call in tearDown()).
	 *
	 * @return void
	 */
	public static function reset(): void {
		self::$instances = array();
	}
}
