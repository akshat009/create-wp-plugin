<?php
/**
 * Settings Repository Unit Test.
 *
 * @package {{NS}}\Tests\Unit
 */

declare(strict_types=1);

namespace {{NS}}\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Brain\Monkey;
use Brain\Monkey\Functions;
use {{NS}}\Admin\Settings_Repository;

/**
 * Class Settings_Repository_Test.
 */
class Settings_Repository_Test extends TestCase {

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
	 * Test option name and group getters.
	 */
	public function test_option_name_and_group(): void {
		$repo = new Settings_Repository();
		$this->assertEquals( '{{PREFIX}}_option_name', $repo->get_option_name() );
		$this->assertEquals( '{{PREFIX}}_options_group', $repo->get_options_group() );
	}

	/**
	 * Test get_value returns stored option value.
	 */
	public function test_get_value_returns_string(): void {
		Functions\stubs(
			array(
				'get_option' => 'stored_value',
			)
		);

		$repo  = new Settings_Repository();
		$value = $repo->get_value();

		$this->assertEquals( 'stored_value', $value );
	}

	/**
	 * Test register_setting registers with Settings API.
	 */
	public function test_register_setting(): void {
		Functions\expect( 'register_setting' )
			->once()
			->with(
				'{{PREFIX}}_options_group',
				'{{PREFIX}}_option_name',
				\Mockery::type( 'array' )
			);

		$repo = new Settings_Repository();
		$repo->register_setting();

		$this->assertTrue( true );
	}
}
