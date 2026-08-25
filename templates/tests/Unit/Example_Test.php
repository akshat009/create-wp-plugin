<?php
/**
 * Example Unit Test.
 *
 * @package {{NS}}\Tests\Unit
 */

declare(strict_types=1);

namespace {{NS}}\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Brain\Monkey;
use Brain\Monkey\Functions;
use {{NS}}\Plugin;
use {{NS}}\Contracts\Service_Provider;
use {{NS}}\Core\Container;

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
	 * Test that plugin version constant is defined.
	 */
	public function test_plugin_version_constant() {
		$this->assertEquals( '{{VERSION}}', {{PREFIX_UPPER}}_VERSION );
	}

	/**
	 * Test that Plugin::boot() registers and boots every active provider,
	 * using a fake Service_Provider injected directly into the constructor
	 * rather than going through create()'s real module discovery.
	 */
	public function test_plugin_boot() {
		Functions\stubs(
			array(
				'apply_filters' => function ( $tag, $value ) {
					return $value;
				},
			)
		);

		$provider = new class() implements Service_Provider {
			/**
			 * Whether register() ran.
			 *
			 * @var bool
			 */
			public bool $registered = false;

			/**
			 * Whether boot() ran.
			 *
			 * @var bool
			 */
			public bool $booted = false;

			/**
			 * Record that register() ran.
			 *
			 * @param Container $container Application container.
			 * @return void
			 */
			public function register( Container $container ): void { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
				$this->registered = true;
			}

			/**
			 * Record that boot() ran.
			 *
			 * @param Container $container Application container.
			 * @return void
			 */
			public function boot( Container $container ): void { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
				$this->booted = true;
			}
		};

		$plugin = new Plugin( new Container(), array( $provider ) );
		$plugin->boot();

		$this->assertTrue( $provider->registered );
		$this->assertTrue( $provider->booted );
	}
}
