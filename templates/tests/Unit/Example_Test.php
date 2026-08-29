<?php
/**
 * Example Unit Test.
 *
 * @package {{NS}}\Tests\Unit
 */

declare(strict_types=1);

namespace {{NS}}\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Brain\Monkey;
use {{NS}}\Plugin;

/**
 * Class Example_Test.
 */
class Example_Test extends TestCase {

	/**
	 * Set up test environment before each test.
	 */
	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	/**
	 * Tear down test environment after each test.
	 */
	protected function tearDown(): void {
		Plugin::set_instance( null );
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Test that plugin version constant is defined.
	 */
	public function test_plugin_version_constant() {
		$this->assertEquals( '{{VERSION}}', {{PREFIX_UPPER}}_VERSION );
	}

	/**
	 * instance() hands back the same object every time.
	 */
	public function test_instance_is_shared() {
		$this->assertSame( Plugin::instance(), Plugin::instance() );
	}

	/**
	 * set_instance() swaps the shared instance; null clears it.
	 */
	public function test_set_instance_controls_the_singleton() {
		$first = Plugin::instance();
		Plugin::set_instance( null );

		$this->assertNotSame( $first, Plugin::instance() );
	}

	/**
	 * boot() runs once; a second call is a no-op (no double hook registration).
	 */
	public function test_boot_is_idempotent() {
		$calls = 0;
		Monkey\Functions\when( 'add_action' )->alias(
			static function () use ( &$calls ) {
				++$calls;
			}
		);
		Monkey\Functions\when( 'add_filter' )->justReturn( true );
		Monkey\Functions\when( 'add_shortcode' )->justReturn( true );

		$plugin = Plugin::instance();
		$plugin->boot();
		$after_first = $calls;
		$plugin->boot();

		$this->assertSame( $after_first, $calls, 'boot() must not re-register hooks' );
	}
}
