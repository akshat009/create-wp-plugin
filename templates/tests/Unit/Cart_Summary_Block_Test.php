<?php
/**
 * Cart_Summary_Block unit test.
 *
 * @package {{NS}}\Tests\Unit
 */

declare(strict_types=1);

namespace {{NS}}\Tests\Unit;

use Brain\Monkey\Functions;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use {{NS}}\Woo\Blocks\Cart_Summary_Block;

/**
 * Class Cart_Summary_Block_Test.
 */
class Cart_Summary_Block_Test extends Plugin_TestCase {

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
	 * Test register returns early if block.json not built.
	 */
	public function test_register_when_unbuilt(): void {
		Functions\expect( 'register_block_type' )->never();

		Cart_Summary_Block::register();

		$this->assertTrue( true );
	}
}
