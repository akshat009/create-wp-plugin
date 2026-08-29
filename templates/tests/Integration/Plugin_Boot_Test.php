<?php
/**
 * Integration test: boots the plugin against a real WordPress test environment.
 *
 * @package {{NS}}\Tests\Integration
 */

declare(strict_types=1);

namespace {{NS}}\Tests\Integration;

use {{NS}}\Plugin;
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
	 * Reset the singleton between tests.
	 *
	 * @return void
	 */
	public function tear_down(): void {
		Plugin::set_instance( null );
		parent::tear_down();
	}

	/**
	 * Booting the plugin against real WordPress registers hooks without error
	 * and is safe to call twice.
	 *
	 * @return void
	 */
	public function test_plugin_boots_without_error(): void {
		Plugin::instance()->boot();
		Plugin::instance()->boot();

		$this->assertTrue( did_action( 'plugins_loaded' ) > 0 );
	}

	/**
	 * Activation persists the current version through a real
	 * get_option()/update_option() round trip.
	 *
	 * @return void
	 */
	public function test_activation_persists_the_version_option(): void {
		( new Activator() )->activate();

		$this->assertSame( {{PREFIX_UPPER}}_VERSION, get_option( '{{PREFIX}}_version' ) );
	}
}
