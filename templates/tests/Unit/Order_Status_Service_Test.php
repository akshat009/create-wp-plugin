<?php
/**
 * Order_Status_Service unit test.
 *
 * @package {{NS}}\Tests\Unit
 */

declare(strict_types=1);

namespace {{NS}}\Tests\Unit;

use Brain\Monkey\Functions;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use {{NS}}\Woo\Orders\Order_Status_Service;

/**
 * Class Order_Status_Service_Test.
 */
class Order_Status_Service_Test extends Plugin_TestCase {

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
	 * Test register_status calls register_post_status.
	 */
	public function test_register_status(): void {
		Functions\expect( '_x' )
			->andReturn( 'Custom Status' );

		Functions\expect( '_n_noop' )
			->andReturn( array( 'Custom Status', 'Custom Status' ) );

		Functions\expect( 'register_post_status' )
			->once()
			->with(
				Order_Status_Service::STATUS_SLUG,
				\Mockery::type( 'array' )
			);

		$service = new Order_Status_Service();
		$service->register_status();

		$this->assertTrue( true );
	}

	/**
	 * Test add_to_order_statuses appends custom status.
	 */
	public function test_add_to_order_statuses(): void {
		Functions\expect( '_x' )
			->andReturn( 'Custom Status' );

		$service  = new Order_Status_Service();
		$statuses = $service->add_to_order_statuses( array( 'wc-completed' => 'Completed' ) );

		$this->assertArrayHasKey( Order_Status_Service::STATUS_SLUG, $statuses );
		$this->assertSame( 'Custom Status', $statuses[ Order_Status_Service::STATUS_SLUG ] );
	}
}
