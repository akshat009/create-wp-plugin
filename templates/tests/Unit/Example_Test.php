<?php
/**
 * Example Unit Test.
 *
 * @package {{NS}}\Tests\Unit
 */

namespace {{NS}}\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Brain\Monkey;

/**
 * Class Example_Test.
 */
class Example_Test extends TestCase {

	/**
	 * Set up test environment before each test.
	 */
	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	/**
	 * Tear down test environment after each test.
	 */
	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Test that plugin version constant is set.
	 */
	public function test_plugin_version_constant() {
		$this->assertEquals( '{{VERSION}}', {{PREFIX_UPPER}}_VERSION );
	}
}
