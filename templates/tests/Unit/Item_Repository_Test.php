<?php
/**
 * Item Repository Unit Test.
 *
 * @package {{NS}}\Tests\Unit
 */

declare(strict_types=1);

namespace {{NS}}\Tests\Unit;

use Brain\Monkey;
use {{NS}}\Database\Item_Repository;
use {{NS}}\Database\Schema;

/**
 * Class Item_Repository_Test.
 */
class Item_Repository_Test extends Plugin_TestCase {

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
	 * Test insert item.
	 */
	public function test_insert_item(): void {
		global $wpdb;
		$wpdb->insert_id = 42;

		$wpdb->shouldReceive( 'insert' )
			->once()
			->with(
				Schema::table_name(),
				array(
					'name'   => 'Test Item',
					'status' => 'active',
				),
				array( '%s', '%s' )
			)
			->andReturn( 1 );

		$repo = new Item_Repository();
		$id   = $repo->insert( 'Test Item', 'active' );

		$this->assertEquals( 42, $id );
	}

	/**
	 * Test delete item.
	 */
	public function test_delete_item(): void {
		global $wpdb;

		$wpdb->shouldReceive( 'delete' )
			->once()
			->with( Schema::table_name(), array( 'id' => 10 ), array( '%d' ) )
			->andReturn( 1 );

		$repo   = new Item_Repository();
		$result = $repo->delete( 10 );

		$this->assertTrue( $result );
	}
}
