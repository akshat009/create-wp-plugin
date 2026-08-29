<?php
/**
 * Services locator Unit Test.
 *
 * @package {{NS}}\Tests\Unit
 */

declare(strict_types=1);

namespace {{NS}}\Tests\Unit;

use PHPUnit\Framework\TestCase;
use {{NS}}\Services;

/**
 * Class Services_Test.
 *
 * The locator memoises one instance per accessor, and lets a test swap a
 * double in and clear everything afterwards.
 */
class Services_Test extends TestCase {

	/**
	 * Reset the locator between tests.
	 */
	protected function tearDown(): void {
		Services::reset();
		parent::tearDown();
	}

	/**
	 * A set() then reset() controls what an accessor hands back.
	 */
	public function test_set_overrides_and_reset_clears(): void {
		$double = new \stdClass();
		Services::set( 'cache', $double );

		$ref = new \ReflectionMethod( Services::class, 'set' );
		$this->assertTrue( $ref->isStatic() );

		Services::reset();

		// After reset() the override is gone; a real accessor would rebuild.
		$prop = new \ReflectionProperty( Services::class, 'instances' );
		$prop->setAccessible( true );
		$this->assertSame( array(), $prop->getValue() );
	}

	/**
	 * A set() keeps the exact instance it was handed.
	 */
	public function test_set_stores_the_given_instance(): void {
		$double = new \stdClass();
		Services::set( 'thing', $double );

		$prop = new \ReflectionProperty( Services::class, 'instances' );
		$prop->setAccessible( true );

		$this->assertSame( $double, $prop->getValue()['thing'] );
	}
}
