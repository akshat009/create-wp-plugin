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
	 * Test maybe_upgrade skips when version is current (in an admin request).
	 */
	public function test_maybe_upgrade_skips_when_version_matches(): void {
		Functions\stubs(
			array(
				'is_admin'      => true,
				'wp_doing_cron' => false,
				'get_option'    => \{{NS}}\Database\Schema::VERSION,
			)
		);

		$schema = new \{{NS}}\Database\Schema();
		$schema->maybe_upgrade();

		$this->assertTrue( true );
	}

	/**
	 * Test maybe_upgrade does not even read the version option on a plain
	 * front-end request — dbDelta() is admin/cron/CLI-only.
	 */
	public function test_maybe_upgrade_skips_on_a_frontend_request(): void {
		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			$this->markTestSkipped( 'WP_CLI is defined in this test process; the front-end gate cannot be exercised.' );
		}

		Functions\when( 'is_admin' )->justReturn( false );
		Functions\when( 'wp_doing_cron' )->justReturn( false );
		Functions\expect( 'get_option' )->never();

		$schema = new \{{NS}}\Database\Schema();
		$schema->maybe_upgrade();

		$this->assertTrue( true );
	}
}
