<?php
/**
 * Commands Unit Test.
 *
 * @package {{NS}}\Tests\Unit
 */

declare(strict_types=1);

namespace {{NS}}\Tests\Unit;

use Brain\Monkey;
use Brain\Monkey\Functions;
use {{NS}}\CLI\Commands;

/**
 * Class Commands_Test.
 *
 * Runs in a separate process: it defines the WP_CLI constant, and define()
 * cannot be undone — without isolation that would leak into every test that
 * ran afterwards (e.g. Schema_Test's front-end-context check).
 *
 * @runInSeparateProcess
 * @preserveGlobalState disabled
 */
class Commands_Test extends Plugin_TestCase {

	/**
	 * Set up test environment.
	 */
	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
		\WP_CLI::$commands = array();
	}

	/**
	 * Tear down test environment.
	 */
	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Both WP-CLI commands are registered by init_hooks() when WP_CLI is defined.
	 */
	public function test_init_hooks_registers_commands_under_wp_cli(): void {
		if ( ! defined( 'WP_CLI' ) ) {
			define( 'WP_CLI', true );
		}

		( new Commands() )->init_hooks();

		$this->assertArrayHasKey( '{{PREFIX}} status', \WP_CLI::$commands );
		$this->assertArrayHasKey( '{{PREFIX}} cache clear', \WP_CLI::$commands );
	}

	/**
	 * Every transient advertised through the {{PREFIX}}_cache_keys filter is
	 * purged by cache_clear(), which names no single module's key itself.
	 */
	public function test_cache_clear_purges_keys_from_the_filter(): void {
		Functions\when( 'wp_cache_flush_group' )->justReturn( true );
		Functions\when( '__' )->returnArg();
		Functions\when( 'apply_filters' )->alias(
			static function ( $hook, $value ) {
				return '{{PREFIX}}_cache_keys' === $hook
					? array( '{{PREFIX}}_widgets', '{{PREFIX}}_widgets', '', '{{PREFIX}}_report' )
					: $value;
			}
		);

		$deleted = array();
		Functions\when( 'delete_transient' )->alias(
			static function ( $key ) use ( &$deleted ) {
				$deleted[] = $key;
				return true;
			}
		);

		( new Commands() )->cache_clear();

		// De-duplicated, empties dropped, only what the filter advertised.
		$this->assertSame( array( '{{PREFIX}}_widgets', '{{PREFIX}}_report' ), $deleted );
	}
}
