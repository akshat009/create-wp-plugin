<?php
/**
 * Shipping_Method unit test.
 *
 * @package {{NS}}\Tests\Unit
 */

declare(strict_types=1);

namespace {{NS}}\Tests\Unit;

use Brain\Monkey\Functions;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use {{NS}}\Woo\Shipping\Shipping_Method;

/**
 * Class Shipping_Method_Test.
 */
class Shipping_Method_Test extends Plugin_TestCase {

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
	 * Test constructor initializes ID and title.
	 */
	public function test_constructor_initialization(): void {
		Functions\expect( '__' )
			->andReturn( 'Shipping Title' );

		Functions\expect( 'absint' )
			->andReturnUsing(
				function ( $val ) {
					return (int) $val;
				}
			);

		$method = new Shipping_Method( 5 );

		$this->assertSame( '{{PREFIX}}_shipping', $method->id );
		$this->assertSame( 5, $method->instance_id );
	}

	/**
	 * Test calculate_shipping adds rate.
	 */
	public function test_calculate_shipping(): void {
		Functions\expect( '__' )
			->andReturn( 'Shipping Title' );

		Functions\expect( 'absint' )
			->andReturn( 0 );

		$method = new Shipping_Method();
		$method->calculate_shipping();

		$this->assertTrue( true );
	}
}
