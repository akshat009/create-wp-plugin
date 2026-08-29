<?php
/**
 * Cache Service Unit Test.
 *
 * @package {{NS}}\Tests\Unit
 */

declare(strict_types=1);

namespace {{NS}}\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Brain\Monkey;
use Brain\Monkey\Functions;
use {{NS}}\Cache\Cache_Service;

/**
 * Class Cache_Service_Test.
 */
class Cache_Service_Test extends TestCase {

	/**
	 * Set up test environment.
	 */
	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	/**
	 * Tear down test environment.
	 */
	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * A miss returns the fallback (transient branch, no persistent object cache).
	 */
	public function test_get_fallback_on_transient_miss(): void {
		Functions\when( 'wp_using_ext_object_cache' )->justReturn( false );
		Functions\stubs( array( 'get_transient' => false ) );

		$service = new Cache_Service();

		$this->assertSame( 'fallback_value', $service->get( 'my_key', 'fallback_value' ) );
	}

	/**
	 * With a persistent object cache, set() writes to wp_cache_* only —
	 * set_transient() would just store the value in the same backend twice.
	 */
	public function test_set_uses_object_cache_when_available(): void {
		Functions\when( 'wp_using_ext_object_cache' )->justReturn( true );

		Functions\expect( 'wp_cache_set' )->once()->with( 'my_key', 'my_val', '{{PREFIX}}', 3600 );
		Functions\expect( 'set_transient' )->never();

		$service = new Cache_Service();
		$service->set( 'my_key', 'my_val', 3600 );

		$this->assertTrue( true );
	}

	/**
	 * Without one, set() persists via a transient instead.
	 */
	public function test_set_falls_back_to_transient(): void {
		Functions\when( 'wp_using_ext_object_cache' )->justReturn( false );

		Functions\expect( 'set_transient' )->once()->with( '{{PREFIX}}_my_key', 'my_val', 3600 );
		Functions\expect( 'wp_cache_set' )->never();

		$service = new Cache_Service();
		$service->set( 'my_key', 'my_val', 3600 );

		$this->assertTrue( true );
	}

	/**
	 * Whichever backend is in use is cleared by delete() — here, the transient.
	 */
	public function test_delete_clears_the_active_backend(): void {
		Functions\when( 'wp_using_ext_object_cache' )->justReturn( false );

		Functions\expect( 'delete_transient' )->once()->with( '{{PREFIX}}_my_key' );
		Functions\expect( 'wp_cache_delete' )->never();

		$service = new Cache_Service();
		$service->delete( 'my_key' );

		$this->assertTrue( true );
	}
}
