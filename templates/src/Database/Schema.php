<?php
/**
 * Custom database table schema + migrations.
 *
 * @package {{NS}}\Database
 */

declare(strict_types=1);

namespace {{NS}}\Database;

use {{NS}}\Contracts\Service_Provider;
use {{NS}}\Core\Container;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Schema.
 *
 * Owns the plugin's custom table. dbDelta() creates or upgrades it — called
 * synchronously on activation (Activator resolves this from the container),
 * and again on every request via maybe_upgrade() so a plugin *update*
 * (which doesn't fire register_activation_hook()) still gets migrated.
 * dbDelta() is idempotent: re-running it against an up-to-date table is a
 * cheap no-op, it only ever adds/alters, and get_option() short-circuits
 * maybe_upgrade() once VERSION_OPTION already matches VERSION.
 */
class Schema implements Service_Provider {

	/**
	 * Bump this whenever create_table()'s SQL changes — dbDelta() diffs
	 * against the live table and adds/alters columns and indexes without
	 * dropping existing data.
	 *
	 * @var string
	 */
	public const VERSION = '1.0.0';

	/**
	 * Option name storing the schema version currently applied to the database.
	 *
	 * @var string
	 */
	private const VERSION_OPTION = '{{PREFIX}}_db_version';

	/**
	 * Get the custom table's fully-qualified name (respects multisite table prefixing).
	 *
	 * @return string
	 */
	public static function table_name(): string {
		global $wpdb;
		return $wpdb->prefix . '{{PREFIX}}_items';
	}

	/**
	 * Bind this instance so Activator can resolve it to run create_table()
	 * once, synchronously, on activation.
	 *
	 * @param Container $container Application container.
	 * @return void
	 */
	public function register( Container $container ): void {
		$container->instance( self::class, $this );
	}

	/**
	 * Check for pending migrations on every request.
	 *
	 * @param Container $container Application container.
	 * @return void
	 */
	public function boot( Container $container ): void { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
		add_action( 'plugins_loaded', array( $this, 'maybe_upgrade' ) );
	}

	/**
	 * Run create_table() again if the stored schema version is behind VERSION.
	 *
	 * @return void
	 */
	public function maybe_upgrade(): void {
		if ( get_option( self::VERSION_OPTION ) === self::VERSION ) {
			return;
		}

		$this->create_table();
	}

	/**
	 * Create (or, via dbDelta()'s diffing, migrate) the custom table.
	 *
	 * @return void
	 */
	public function create_table(): void {
		global $wpdb;

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		$charset_collate = $wpdb->get_charset_collate();
		$table_name      = self::table_name();

		// dbDelta() is picky about formatting: two spaces after "PRIMARY KEY",
		// each field/index on its own line, no trailing comma on the last one.
		$sql = "CREATE TABLE {$table_name} (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			name VARCHAR(191) NOT NULL,
			status VARCHAR(20) NOT NULL DEFAULT 'active',
			created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY  (id),
			KEY status (status)
		) {$charset_collate};";

		dbDelta( $sql );

		update_option( self::VERSION_OPTION, self::VERSION );
	}

	/**
	 * Drop the custom table. Called from uninstall.php.
	 *
	 * @return void
	 */
	public static function drop_table(): void {
		global $wpdb;
		$table_name = self::table_name();
		$wpdb->query( "DROP TABLE IF EXISTS {$table_name}" ); // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- table name isn't user input; DROP TABLE doesn't support placeholders.
		delete_option( self::VERSION_OPTION );
	}
}
