<?php
/**
 * Post Types Unit Test.
 *
 * @package {{NS}}\Tests\Unit
 */

declare(strict_types=1);

namespace {{NS}}\Tests\Unit;

use Brain\Monkey;
use Brain\Monkey\Functions;
use {{NS}}\PostTypes\Post_Types;

/**
 * Class Post_Types_Test.
 */
class Post_Types_Test extends Plugin_TestCase {

	/**
	 * Set up test environment.
	 */
	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
		Functions\stubs(
			array(
				'__' => fn( $msg ) => $msg,
				'_x' => fn( $msg ) => $msg,
			)
		);
	}

	/**
	 * Tear down test environment.
	 */
	protected function tearDown(): void {
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Test custom post type and taxonomy registration.
	 */
	public function test_register_cpt_and_taxonomy(): void {
		Functions\expect( 'register_post_type' )
			->once()
			->with( '{{PREFIX}}_item', \Mockery::type( 'array' ) );

		Functions\expect( 'register_taxonomy' )
			->once()
			->with( '{{PREFIX}}_category', array( '{{PREFIX}}_item' ), \Mockery::type( 'array' ) );

		$post_types = new Post_Types();
		$post_types->register_cpt_and_taxonomy();

		$this->assertTrue( true );
	}
}
