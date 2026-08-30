<?php
/**
 * Module init_hooks() Contract Unit Test.
 *
 * @package {{NS}}\Tests\Unit
 */

declare(strict_types=1);

namespace {{NS}}\Tests\Unit;

use Brain\Monkey;
use Brain\Monkey\Actions;
use Brain\Monkey\Filters;
use Brain\Monkey\Functions;

/**
 * Class Module_Hooks_Test.
 *
 * Every module class in this scaffold shares one contract: init_hooks()
 * registers whatever hooks the class exists to register, nothing more.
 * This asserts that contract directly and uniformly, instead of leaving it
 * to be an incidental side effect of whichever other method each module's
 * own test happens to exercise -- most of those tests cover a *handler*
 * method (e.g. Shortcode_Test asserts render_shortcode()'s output), never
 * init_hooks() itself.
 */
class Module_Hooks_Test extends Plugin_TestCase {

	/**
	 * Set up test environment.
	 */
	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
		// Shared static state a CLI-module case writes to; reset per test
		// (and per data set -- PHPUnit re-runs setUp() for each one) so one
		// case's commands can't be mistaken for another's.
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
	 * Every module present in this build, how to construct it, and exactly
	 * which hooks its init_hooks() is expected to register.
	 *
	 * @return array<string, array{0: callable(): object, 1: array<int, array{type: string, hook: string}>}>
	 */
	public static function module_hook_provider(): array {
		return array(
{{MODULE_HOOK_CASES}}
		);
	}

	/**
	 * Assert init_hooks() registers exactly the hooks a case expects.
	 *
	 * @dataProvider module_hook_provider
	 *
	 * @param callable(): object                            $factory Builds the module instance.
	 * @param array<int, array{type: string, hook: string}> $expected_hooks Hooks init_hooks() must register.
	 * @return void
	 */
	public function test_module_registers_its_hooks( callable $factory, array $expected_hooks ): void {
		foreach ( $expected_hooks as $expectation ) {
			switch ( $expectation['type'] ) {
				case 'action':
					Actions\expectAdded( $expectation['hook'] )->once();
					break;
				case 'filter':
					Filters\expectAdded( $expectation['hook'] )->once();
					break;
				case 'shortcode':
					Functions\expect( 'add_shortcode' )
						->once()
						->with( $expectation['hook'], \Mockery::type( 'callable' ) );
					break;
				case 'cli_command':
					// Verified after init_hooks() runs, below --
					// \WP_CLI::add_command() is the real stub method, not a
					// Brain Monkey function mock.
					break;
			}
		}

		$module = $factory();
		$module->init_hooks();

		foreach ( $expected_hooks as $expectation ) {
			if ( 'cli_command' === $expectation['type'] ) {
				$this->assertArrayHasKey(
					$expectation['hook'],
					\WP_CLI::$commands,
					"WP_CLI command '{$expectation['hook']}' was not registered"
				);
			}
		}

		// A case whose only expectations are action/filter/shortcode ones is
		// otherwise "risky: this test did not perform any assertions" --
		// Mockery verifies those on tearDown(), not through a PHPUnit
		// assertion the runner can see. Matches this suite's existing
		// convention for expectation-only tests (Ajax_Handler_Test et al.).
		$this->assertTrue( true );
	}
}
