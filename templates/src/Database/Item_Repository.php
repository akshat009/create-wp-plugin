<?php
/**
 * Repository for the custom database table.
 *
 * @package {{NS}}\Database
 */

declare(strict_types=1);

namespace {{NS}}\Database;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Item_Repository.
 *
 * Minimal CRUD example against Schema::table_name() — replace the columns
 * and queries with your own; this exists to show the $wpdb + prepare()
 * pattern for the custom table, not as a real feature.
 */
class Item_Repository {

	/**
	 * Insert a row.
	 *
	 * @param string $name   Item name.
	 * @param string $status Item status. Default 'active'.
	 * @return int Inserted row id, or 0 on failure.
	 */
	public function insert( string $name, string $status = 'active' ): int {
		global $wpdb;

		$inserted = $wpdb->insert(
			Schema::table_name(),
			array(
				'name'   => $name,
				'status' => $status,
			),
			array( '%s', '%s' )
		);

		return $inserted ? (int) $wpdb->insert_id : 0;
	}

	/**
	 * Get a row by id.
	 *
	 * @param int $id Row id.
	 * @return array|null
	 */
	public function find( int $id ): ?array {
		global $wpdb;

		$table = Schema::table_name();
		$row   = $wpdb->get_row(
			$wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", $id ), // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name isn't user input, only interpolated to build the query string; %d is still bound via prepare().
			ARRAY_A
		);

		return null !== $row ? $row : null;
	}

	/**
	 * Get all rows with a given status.
	 *
	 * @param string $status Status to filter by.
	 * @return array
	 */
	public function find_by_status( string $status ): array {
		global $wpdb;

		$table   = Schema::table_name();
		$results = $wpdb->get_results(
			$wpdb->prepare( "SELECT * FROM {$table} WHERE status = %s ORDER BY created_at DESC", $status ), // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- table name isn't user input, only interpolated to build the query string; %s is still bound via prepare().
			ARRAY_A
		);

		return is_array( $results ) ? $results : array();
	}

	/**
	 * Delete a row by id.
	 *
	 * @param int $id Row id.
	 * @return bool
	 */
	public function delete( int $id ): bool {
		global $wpdb;

		return (bool) $wpdb->delete( Schema::table_name(), array( 'id' => $id ), array( '%d' ) );
	}
}
