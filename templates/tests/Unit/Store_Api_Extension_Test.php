<?php
/**
 * Store_Api_Extension unit test.
 *
 * @package {{NS}}\Tests\Unit
 */

declare(strict_types=1);

namespace {{NS}}\Tests\Unit;

use Brain\Monkey\Functions;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use {{NS}}\Woo\Api\Store_Api_Extension;

/**
 * Class Store_Api_Extension_Test.
 */
class Store_Api_Extension_Test extends TestCase {

	use MockeryPHPUnitIntegration;

	/**
	 * Setup test doubles.
	 */
	protected function setUp(): void {
		parent::setUp();
		\Brain\Monkey\setUp();
	}

	/**
	 * Tear down test doubles.
	 */
	protected function tearDown(): void {
		\Brain\Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Test register_store_api_extension registers endpoint data.
	 */
	public function test_register_store_api_extension(): void {
		if ( ! defined( 'ARRAY_A' ) ) {
			define( 'ARRAY_A', 'ARRAY_A' );
		}

		Functions\expect( 'woocommerce_store_api_register_endpoint_data' )
			->once()
			->with(
				\Mockery::on(
					function ( $args ) {
						return isset( $args['endpoint'], $args['namespace'] ) &&
							'cart' === $args['endpoint'] &&
							Store_Api_Extension::IDENTIFIER === $args['namespace'];
					}
				)
			);

		$extension = new Store_Api_Extension();
		$extension->register_store_api_extension();

		$this->assertTrue( true );
	}

	/**
	 * Test get_cart_data returns array with custom message.
	 */
	public function test_get_cart_data(): void {
		Functions\expect( '__' )
			->andReturn( 'Sample message' );

		$extension = new Store_Api_Extension();
		$data      = $extension->get_cart_data();

		$this->assertArrayHasKey( 'plugin_version', $data );
		$this->assertArrayHasKey( 'custom_message', $data );
	}
}
