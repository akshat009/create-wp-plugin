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
	 * Test get falls back to provided default on cache miss.
	 */
	public function test_get_fallback_on_cache_miss(): void {
		Functions\stubs(
			array(
				'wp_cache_get'  => false,
				'get_transient' => false,
			)
		);

		$service = new Cache_Service();
		$value   = $service->get( 'my_key', 'fallback_value' );

		$this->assertEquals( 'fallback_value', $value );
	}

	/**
	 * Test set writes both object cache and transient.
	 */
	public function test_set_writes_cache_and_transient(): void {
		Functions\expect( 'wp_cache_set' )
			->once()
			->with( 'my_key', 'my_val', '{{PREFIX}}', 3600 );

		Functions\expect( 'set_transient' )
			->once()
			->with( '{{PREFIX}}_my_key', 'my_val', 3600 );

		$service = new Cache_Service();
		$service->set( 'my_key', 'my_val', 3600 );

		$this->assertTrue( true );
	}

	/**
	 * Test delete clears both object cache and transient.
	 */
	public function test_delete_clears_cache_and_transient(): void {
		Functions\expect( 'wp_cache_delete' )
			->once()
			->with( 'my_key', '{{PREFIX}}' );

		Functions\expect( 'delete_transient' )
			->once()
			->with( '{{PREFIX}}_my_key' );

		$service = new Cache_Service();
		$service->delete( 'my_key' );

		$this->assertTrue( true );
	}
}
