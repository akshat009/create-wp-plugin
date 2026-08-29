<?php
/**
 * Account_Endpoint_Service unit test.
 *
 * @package {{NS}}\Tests\Unit
 */

declare(strict_types=1);

namespace {{NS}}\Tests\Unit;

use Brain\Monkey\Functions;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use {{NS}}\Woo\Account\Account_Endpoint_Service;

/**
 * Class Account_Endpoint_Service_Test.
 */
class Account_Endpoint_Service_Test extends TestCase {

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
	 * Test register_endpoint registers rewrite endpoint.
	 */
	public function test_register_endpoint(): void {
		if ( ! defined( 'EP_ROOT' ) ) {
			define( 'EP_ROOT', 1 );
		}
		if ( ! defined( 'EP_PAGES' ) ) {
			define( 'EP_PAGES', 4096 );
		}

		Functions\expect( 'add_rewrite_endpoint' )
			->once()
			->with( Account_Endpoint_Service::ENDPOINT, EP_ROOT | EP_PAGES );

		$service = new Account_Endpoint_Service();
		$service->register_endpoint();

		$this->assertTrue( true );
	}

	/**
	 * Test add_menu_item appends custom endpoint to account menu.
	 */
	public function test_add_menu_item(): void {
		Functions\expect( '__' )
			->andReturn( 'Custom Area' );

		$service = new Account_Endpoint_Service();
		$items   = $service->add_menu_item(
			array(
				'dashboard'       => 'Dashboard',
				'orders'          => 'Orders',
				'customer-logout' => 'Logout',
			)
		);

		$this->assertArrayHasKey( Account_Endpoint_Service::ENDPOINT, $items );
		$this->assertSame( 'Custom Area', $items[ Account_Endpoint_Service::ENDPOINT ] );
	}
}
