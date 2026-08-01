<?php
/**
 * Example Unit Test.
 *
 * @package {{NS}}\Tests\Unit
 */

namespace {{NS}}\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Brain\Monkey;
use Brain\Monkey\Functions;
use {{NS}}\Plugin;
use {{NS}}\Contracts\Registrable;

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
	 * Test that plugin orchestrator boots registered services.
	 */
	public function test_plugin_boot() {
		Functions\stubs(
			array(
				'apply_filters' => function ( $tag, $value ) {
					return $value;
				},
				'add_action',
				'add_filter',
				'add_shortcode',
				'register_post_type',
				'register_taxonomy',
				'register_setting',
				'add_settings_section',
				'add_settings_field',
				'add_options_page',
				'wp_next_scheduled',
				'wp_schedule_event',
				'wp_enqueue_script',
				'wp_enqueue_style',
				'wp_register_script',
				'wp_register_style',
			)
		);

		$plugin = Plugin::get_instance();
		$plugin->boot();

		$services = $plugin->get_services();
		$this->assertIsArray( $services );

		foreach ( $services as $service ) {
			$this->assertInstanceOf( Registrable::class, $service );
		}
	}
}
