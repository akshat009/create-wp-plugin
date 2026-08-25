<?php
/**
 * Integration test: boots the plugin against a real WordPress test environment.
 *
 * @package {{NS}}\Tests\Integration
 */

declare(strict_types=1);

namespace {{NS}}\Tests\Integration;

use {{NS}}\Plugin;
use {{NS}}\Contracts\Service_Provider;
use {{NS}}\Core\Container;
use {{NS}}\Core\Activator;
use WP_UnitTestCase;

/**
 * Class Plugin_Boot_Test.
 *
 * Unlike tests/Unit/Example_Test.php (Brain Monkey — WordPress functions are
 * stubs), this runs against a real, if minimal, WordPress install:
 * register_post_type(), get_option(), and add_filter() below are the genuine
 * WordPress Core implementations, not test doubles. Use this file as the
 * starting point for tests that need real WordPress behavior (taxonomy
 * term relationships, real option persistence, real REST dispatch, etc.)
 * that Brain Monkey can't meaningfully fake.
 */
class Plugin_Boot_Test extends WP_UnitTestCase {

	/**
	 * A provider added via the '{{PREFIX}}_providers' filter should be
	 * booted exactly like one built into Plugin::create().
	 *
	 * @return void
	 */
	public function test_plugin_boots_providers_added_via_the_providers_filter(): void {
		$probe = new class() implements Service_Provider {
			/**
			 * Whether boot() ran.
			 *
			 * @var bool
			 */
			public bool $booted = false;

			/**
			 * No bindings needed.
			 *
			 * @param Container $container Application container.
			 * @return void
			 */
			public function register( Container $container ): void { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
			}

			/**
			 * Record that boot() ran.
			 *
			 * @param Container $container Application container.
			 * @return void
			 */
			public function boot( Container $container ): void { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
				$this->booted = true;
			}
		};

		add_filter(
			'{{PREFIX}}_providers',
			function ( $providers ) use ( $probe ) {
				$providers[] = $probe;
				return $providers;
			}
		);

		Plugin::create()->boot();

		$this->assertTrue( $probe->booted );
	}

	/**
	 * Activation should persist the current version through a real get_option()/update_option() round trip.
	 *
	 * @return void
	 */
	public function test_activation_persists_the_version_option(): void {
		( new Activator() )->activate( new Container() );

		$this->assertSame( {{PREFIX_UPPER}}_VERSION, get_option( '{{PREFIX}}_version' ) );
	}
}
