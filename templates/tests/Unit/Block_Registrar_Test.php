<?php
/**
 * Block_Registrar unit test.
 *
 * @package {{NS}}\Tests\Unit
 */

declare(strict_types=1);

namespace {{NS}}\Tests\Unit;

use Brain\Monkey;
use Brain\Monkey\Actions;
use Brain\Monkey\Functions;
use {{NS}}\Blocks\Block_Registrar;

/**
 * Class Block_Registrar_Test.
 */
class Block_Registrar_Test extends Plugin_TestCase {

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
	 * Block registration is deferred to the `init` hook by init_hooks().
	 */
	public function test_init_hooks_hooks_init(): void {
		Actions\expectAdded( 'init' )->once();

		( new Block_Registrar() )->init_hooks();

		$this->assertTrue( true );
	}

	/**
	 * Registration is a no-op until `npm run build` has produced the compiled
	 * block metadata, so a fresh checkout never fatals.
	 */
	public function test_register_blocks_is_noop_when_unbuilt(): void {
		Functions\expect( 'register_block_type' )->never();

		( new Block_Registrar() )->register_blocks();

		$this->assertTrue( true );
	}
}
