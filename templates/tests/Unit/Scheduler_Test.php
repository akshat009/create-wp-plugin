<?php
/**
 * Scheduler Unit Test.
 *
 * @package {{NS}}\Tests\Unit
 */

declare(strict_types=1);

namespace {{NS}}\Tests\Unit;

use PHPUnit\Framework\TestCase;
use Brain\Monkey;
use Brain\Monkey\Functions;
use {{NS}}\Cron\Scheduler;

/**
 * Class Scheduler_Test.
 */
class Scheduler_Test extends TestCase {

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
	 * Test execute_cron_job fires expected action hook.
	 */
	public function test_execute_cron_job(): void {
		Functions\expect( 'update_option' )
			->once()
			->with( '{{PREFIX}}_last_cron_run', \Mockery::type( 'int' ) );

		$scheduler = new Scheduler();
		$scheduler->execute_cron_job();

		$this->assertTrue( true );
	}
}
