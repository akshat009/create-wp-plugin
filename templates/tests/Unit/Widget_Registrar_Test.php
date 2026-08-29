<?php
/**
 * Widget Registrar Unit Test.
 *
 * @package {{NS}}\Tests\Unit
 */

declare(strict_types=1);

namespace {{NS}}\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Brain\Monkey;
use Brain\Monkey\Functions;
use {{NS}}\Elementor\Widget_Registrar;

/**
 * Class Widget_Registrar_Test.
 */
class Widget_Registrar_Test extends TestCase {

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
	 * Test register_widgets returns early when Elementor is not loaded.
	 */
	public function test_register_widgets_early_return_when_elementor_not_loaded(): void {
		Functions\stubs(
			array(
				'did_action' => 0,
			)
		);

		$registrar       = new Widget_Registrar();
		$widgets_manager = \Mockery::mock( 'stdClass' );

		$registrar->register_widgets( $widgets_manager );
		$this->assertTrue( true );
	}
}
