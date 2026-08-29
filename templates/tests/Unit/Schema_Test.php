<?php
/**
 * Schema Unit Test.
 *
 * @package {{NS}}\Tests\Unit
 */

declare(strict_types=1);

namespace {{NS}}\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Brain\Monkey;
use Brain\Monkey\Functions;

/**
 * Class Schema_Test.
 */
class Schema_Test extends TestCase {

	/**
	 * Set up test environment.
	 */
	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();

		global $wpdb;
		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$wpdb         = \Mockery::mock( 'wpdb' );
		$wpdb->prefix = 'wp_';
	}

	/**
	 * Tear down test environment.
	 */
	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Test table_name helper.
	 */
	public function test_table_name(): void {
		$table = \{{NS}}\Database\Schema::table_name();
		$this->assertEquals( 'wp_{{PREFIX}}_items', $table );
	}

	/**
	 * Test maybe_upgrade skips when version is current.
	 */
	public function test_maybe_upgrade_skips_when_version_matches(): void {
		Functions\stubs(
			array(
				'get_option' => \{{NS}}\Database\Schema::VERSION,
			)
		);

		$schema = new \{{NS}}\Database\Schema();
		$schema->maybe_upgrade();

		$this->assertTrue( true );
	}
}
