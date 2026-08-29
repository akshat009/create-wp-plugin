<?php
/**
 * Gateway Unit Test.
 *
 * @package {{NS}}\Tests\Unit
 */

declare(strict_types=1);

namespace {{NS}}\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Brain\Monkey;
use Brain\Monkey\Functions;

/**
 * Class Gateway_Test.
 */
class Gateway_Test extends TestCase {

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
	 * Test Gateway instantiation and property set.
	 */
	public function test_gateway_instantiation(): void {
		Functions\stubs(
			array(
				'__' => fn( $msg ) => $msg,
			)
		);

		$gateway = new \{{NS}}\Woo\Gateways\Gateway();
		$this->assertEquals( '{{PREFIX}}_gateway', $gateway->id );
	}

	/**
	 * The unimplemented stub must fail closed — never mark an order paid.
	 */
	public function test_process_payment_fails_closed(): void {
		Functions\stubs(
			array(
				'__'           => fn( $msg ) => $msg,
				'wc_add_notice' => null,
			)
		);

		$order = \Mockery::mock();
		$order->shouldNotReceive( 'payment_complete' );
		Functions\when( 'wc_get_order' )->justReturn( $order );

		$result = ( new \{{NS}}\Woo\Gateways\Gateway() )->process_payment( 123 );

		$this->assertSame( 'failure', $result['result'] );
	}
}
