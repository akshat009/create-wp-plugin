<?php
/**
 * AJAX Handler Unit Test.
 *
 * @package {{NS}}\Tests\Unit
 */

declare(strict_types=1);

namespace {{NS}}\Tests\Unit;

use Brain\Monkey;
use Brain\Monkey\Functions;
use {{NS}}\Ajax\Ajax_Handler;

/**
 * Class Ajax_Handler_Test.
 */
class Ajax_Handler_Test extends Plugin_TestCase {

	/**
	 * Set up test environment.
	 */
	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
		Functions\stubs(
			array(
				'__'               => fn( $msg ) => $msg,
				'current_user_can' => true,
			)
		);
	}

	/**
	 * Tear down test environment.
	 */
	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Test AJAX handler returns 403 error on invalid nonce.
	 */
	public function test_handle_ajax_invalid_nonce(): void {
		Functions\stubs(
			array(
				'check_ajax_referer' => false,
			)
		);

		Functions\expect( 'wp_send_json_error' )
			->once()
			->with(
				array( 'message' => 'Invalid security token.' ),
				403
			);

		$handler = new Ajax_Handler();
		$handler->handle_ajax();

		$this->assertTrue( true );
	}
}
