<?php
/**
 * Caching Layer Service.
 *
 * @package {{NS}}\Cache
 */

declare(strict_types=1);

namespace {{NS}}\Cache;

use {{NS}}\Contracts\Service_Provider;
use {{NS}}\Core\Container;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Cache_Service.
 *
 * A thin cache with one backend chosen at call time:
 *   - a persistent object cache (Redis/Memcached via a drop-in), when the
 *     site has one — reads/writes go through wp_cache_* in a dedicated group;
 *   - otherwise transients, which persist in the options table.
 *
 * `set_transient()` already routes to the object cache when one is present,
 * so writing to both would just store every value twice on a Redis site —
 * this picks one. Resolve from the container:
 * $container->get( Cache_Service::class ).
 */
class Cache_Service implements Service_Provider {

	/**
	 * Object cache group / transient key prefix.
	 *
	 * @var string
	 */
	private const GROUP = '{{PREFIX}}';

	/**
	 * Bind this instance so other services can resolve it from the container.
	 *
	 * @param Container $container Application container.
	 * @return void
	 */
	public function register( Container $container ): void {
		$container->instance( self::class, $this );
	}

	/**
	 * No hooks to register — this is a plain utility service, not a hook registrar.
	 *
	 * @param Container $container Application container.
	 * @return void
	 */
	public function boot( Container $container ): void { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
	}

	/**
	 * Get a cached value, or $fallback if it isn't cached (or has expired).
	 *
	 * @param string $key      Cache key (unprefixed; scoped by the plugin's own group).
	 * @param mixed  $fallback Value to return on a cache miss.
	 * @return mixed
	 */
	public function get( string $key, $fallback = null ) {
		if ( $this->has_object_cache() ) {
			$found = false;
			$value = wp_cache_get( $key, self::GROUP, false, $found );

			return $found ? $value : $fallback;
		}

		$value = get_transient( $this->transient_key( $key ) );

		return false !== $value ? $value : $fallback;
	}

	/**
	 * Store a value in the active backend.
	 *
	 * @param string $key   Cache key (unprefixed; scoped by the plugin's own group).
	 * @param mixed  $value Value to store.
	 * @param int    $ttl   Time to live, in seconds. Default 1 hour.
	 * @return void
	 */
	public function set( string $key, $value, int $ttl = HOUR_IN_SECONDS ): void {
		if ( $this->has_object_cache() ) {
			wp_cache_set( $key, $value, self::GROUP, $ttl );

			return;
		}

		set_transient( $this->transient_key( $key ), $value, $ttl );
	}

	/**
	 * Remove a cached value from the active backend.
	 *
	 * @param string $key Cache key (unprefixed; scoped by the plugin's own group).
	 * @return void
	 */
	public function delete( string $key ): void {
		if ( $this->has_object_cache() ) {
			wp_cache_delete( $key, self::GROUP );

			return;
		}

		delete_transient( $this->transient_key( $key ) );
	}

	/**
	 * Get a cached value, computing and storing it via $callback on a miss.
	 *
	 * @param string   $key      Cache key (unprefixed; scoped by the plugin's own group).
	 * @param int      $ttl      Time to live, in seconds, for a freshly-computed value.
	 * @param callable $callback Produces the value to cache when there's no cached value yet.
	 * @return mixed
	 */
	public function remember( string $key, int $ttl, callable $callback ) {
		$sentinel = null;
		$cached   = $this->get( $key, $sentinel );

		if ( $sentinel !== $cached ) {
			return $cached;
		}

		$value = $callback();
		$this->set( $key, $value, $ttl );

		return $value;
	}

	/**
	 * Whether the site has a persistent object cache (Redis/Memcached drop-in).
	 *
	 * @return bool
	 */
	private function has_object_cache(): bool {
		return function_exists( 'wp_using_ext_object_cache' ) && wp_using_ext_object_cache();
	}

	/**
	 * Build the transient name for a given cache key.
	 *
	 * @param string $key Cache key.
	 * @return string
	 */
	private function transient_key( string $key ): string {
		return self::GROUP . '_' . $key;
	}
}
