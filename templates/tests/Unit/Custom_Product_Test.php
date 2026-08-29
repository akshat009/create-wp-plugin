<?php
/**
 * Custom_Product unit test.
 *
 * @package {{NS}}\Tests\Unit
 */

declare(strict_types=1);

namespace {{NS}}\Tests\Unit;

use Brain\Monkey\Functions;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use {{NS}}\Woo\Products\Custom_Product;

/**
 * Class Custom_Product_Test.
 */
class Custom_Product_Test extends Plugin_TestCase {

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
	 * Test filter_product_class resolves custom type.
	 */
	public function test_filter_product_class(): void {
		$class = Custom_Product::filter_product_class( 'WC_Product_Simple', '{{PREFIX}}_custom' );
		$this->assertSame( Custom_Product::class, $class );

		$fallback = Custom_Product::filter_product_class( 'WC_Product_Simple', 'variable' );
		$this->assertSame( 'WC_Product_Simple', $fallback );
	}

	/**
	 * Test filter_product_type_selector adds custom type to dropdown.
	 */
	public function test_filter_product_type_selector(): void {
		Functions\expect( '__' )
			->andReturn( 'Custom Product' );

		$types = Custom_Product::filter_product_type_selector( array( 'simple' => 'Simple' ) );

		$this->assertArrayHasKey( '{{PREFIX}}_custom', $types );
		$this->assertSame( 'Custom Product', $types['{{PREFIX}}_custom'] );
	}
}
