<?php
/**
 * Main Plugin Composition Root.
 *
 * @package {{NS}}
 */

declare(strict_types=1);

namespace {{NS}};

use {{NS}}\Core\Container;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Composition root for {{PLUGIN_NAME}}.
 *
 * Holds the application Container and the list of Service_Provider instances,
 * and knows how to run them. This is intentionally NOT a singleton: build one
 * with create() at runtime, or construct one directly with a fake container
 * and provider list in tests.
 */
final class Plugin {

	/**
	 * Hold the container and the (unfiltered, unconditioned) provider list.
	 *
	 * @param Container $container Application container.
	 * @param array     $providers Service_Provider instances to run.
	 */
	public function __construct(
		private readonly Container $container,
		private readonly array $providers
	) {
	}

	/**
	 * Build the real Plugin for this request: a fresh Container plus every
	 * selected module's provider.
	 *
	 * @return self
	 */
	public static function create(): self {
		$container = new Container();
		$providers = array();
{{#if cli}}

		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			$providers[] = new CLI\Commands();
		}
{{/if}}
{{#if use_react}}

		$providers[] = new Admin\Assets();
{{/if}}{{PROVIDER_REGISTRATIONS}}
		return new self( $container, $providers );
	}

	/**
	 * Get the application container.
	 *
	 * @return Container
	 */
	public function get_container(): Container {
		return $this->container;
	}

	/**
	 * Get the registered providers (unfiltered, unconditioned).
	 *
	 * @return array<int, Contracts\Service_Provider>
	 */
	public function get_providers(): array {
		return $this->providers;
	}

	/**
	 * Run only the register() pass on every active provider.
	 *
	 * Used by the activation/deactivation bridge in the main plugin file,
	 * which needs bindings available (e.g. so Activator can resolve a
	 * service from the container) without booting WordPress hooks that
	 * make no sense to fire during activation, and without running the
	 * '{{PREFIX}}_providers' filter (third-party filter callbacks aren't
	 * reliably available that early).
	 *
	 * @return void
	 */
	public function register_all(): void {
		foreach ( $this->active_providers( $this->providers ) as $provider ) {
			$provider->register( $this->container );
		}
	}

	/**
	 * Register and boot every active provider for a normal request.
	 *
	 * @return void
	 */
	public function boot(): void {
		/**
		 * Filter the providers to be registered and booted.
		 *
		 * @param array $providers Array of Service_Provider instances.
		 */
		$providers = apply_filters( '{{PREFIX}}_providers', $this->providers );

		foreach ( $this->active_providers( is_array( $providers ) ? $providers : $this->providers ) as $provider ) {
			$provider->register( $this->container );
			$provider->boot( $this->container );
		}
	}

	/**
	 * Filter a provider list down to the ones that should actually run:
	 * must implement Service_Provider, and if it also implements
	 * Conditional, is_needed() must return true.
	 *
	 * @param array $providers Candidate provider list (e.g. straight from
	 *                         the constructor, or from the '{{PREFIX}}_providers' filter).
	 * @return array<int, Contracts\Service_Provider>
	 */
	private function active_providers( array $providers ): array {
		$active = array();

		foreach ( $providers as $provider ) {
			if ( ! $provider instanceof Contracts\Service_Provider ) {
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					_doing_it_wrong(
						__METHOD__,
						esc_html__( 'Every entry filtered into the providers list must implement Service_Provider.', '{{SLUG}}' ),
						'{{VERSION}}'
					);
				}
				continue;
			}

			if ( $provider instanceof Contracts\Conditional && ! $provider->is_needed() ) {
				continue;
			}

			$active[] = $provider;
		}

		return $active;
	}
}
