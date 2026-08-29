<?php
/**
 * Custom_Email unit test.
 *
 * @package {{NS}}\Tests\Unit
 */

declare(strict_types=1);

namespace {{NS}}\Tests\Unit;

use Brain\Monkey\Functions;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;
use {{NS}}\Woo\Emails\Custom_Email;

/**
 * Class Custom_Email_Test.
 */
class Custom_Email_Test extends TestCase {

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
	 * Test constructor initializes email properties and hooks.
	 */
	public function test_constructor_initialization(): void {
		Functions\expect( '__' )
			->andReturn( 'Custom Email' );

		$email = new Custom_Email();

		$this->assertSame( '{{PREFIX}}_custom_email', $email->id );
		$this->assertTrue( $email->customer_email );
	}
}
