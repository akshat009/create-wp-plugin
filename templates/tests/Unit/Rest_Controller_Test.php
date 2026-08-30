<?php
/**
 * REST Controller Unit Test.
 *
 * @package {{NS}}\Tests\Unit
 */

declare(strict_types=1);

namespace {{NS}}\Tests\Unit;

use Brain\Monkey;
use Brain\Monkey\Functions;
use {{NS}}\Rest\Rest_Controller;

/**
 * Class Rest_Controller_Test.
 */
class Rest_Controller_Test extends Plugin_TestCase {

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
	 * Test route registration.
	 */
	public function test_register_routes(): void {
		Functions\expect( 'register_rest_route' )
			->once()
			->with(
				'{{PREFIX}}/v1',
				'/data',
				\Mockery::type( 'array' )
			);

		$controller = new Rest_Controller();
		$controller->register_routes();

		$this->assertTrue( true );
	}

	/**
	 * The permission callback fails closed — it gates on a capability, it does
	 * not blanket-allow.
	 */
	public function test_permissions_check_gates_on_capability(): void {
		Functions\expect( 'current_user_can' )->once()->with( 'read' )->andReturn( false );

		$controller = new Rest_Controller();
		$request    = \Mockery::mock( 'WP_REST_Request' );

		$this->assertFalse( $controller->get_items_permissions_check( $request ) );
	}

	/**
	 * The item schema describes get_items()'s response shape, so the
	 * endpoint is self-describing over OPTIONS rather than an empty default.
	 */
	public function test_get_item_schema_describes_the_response_shape(): void {
		Functions\when( '__' )->returnArg();

		$controller = new Rest_Controller();
		$schema     = $controller->get_item_schema();

		$this->assertSame( 'object', $schema['type'] );
		$this->assertArrayHasKey( 'message', $schema['properties'] );
		$this->assertArrayHasKey( 'param', $schema['properties'] );
	}
}
