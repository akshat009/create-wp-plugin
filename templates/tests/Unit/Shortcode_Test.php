<?php
/**
 * Shortcode Unit Test.
 *
 * @package {{NS}}\Tests\Unit
 */

declare(strict_types=1);

namespace {{NS}}\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Brain\Monkey;
use Brain\Monkey\Functions;
use {{NS}}\Frontend\Shortcode;

/**
 * Class Shortcode_Test.
 */
class Shortcode_Test extends TestCase {

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
	 * Test render shortcode.
	 */
	public function test_render_shortcode(): void {
		Functions\stubs(
			array(
				'shortcode_atts'      => function ( $pairs, $atts ) {
					return array_merge( $pairs, (array) $atts );
				},
				'sanitize_text_field' => fn( $str ) => $str,
				'esc_html'            => fn( $str ) => $str,
				'__'                  => fn( $str ) => $str,
			)
		);

		$shortcode = new Shortcode();
		$output    = $shortcode->render_shortcode( array( 'title' => 'Test Title' ) );

		$this->assertStringContainsString( 'Test Title', $output );
	}
}
