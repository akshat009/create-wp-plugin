<?php
/**
 * Action_Scheduler_Service unit test.
 *
 * @package {{NS}}\Tests\Unit
 */

declare(strict_types=1);

namespace {{NS}}\Tests\Unit;

use Brain\Monkey\Functions;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use {{NS}}\Woo\Tasks\Action_Scheduler_Service;

/**
 * Class Action_Scheduler_Service_Test.
 */
class Action_Scheduler_Service_Test extends Plugin_TestCase {

	use MockeryPHPUnitIntegration;

	/**
	 * Setup test doubles.
	 */
	protected function setUp(): void {
		parent::setUp();
		\Brain\Monkey\setUp();
	}

	/**
	 * Tear down test doubles.
	 */
	protected function tearDown(): void {
		\Brain\Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * Test schedule_tasks schedules recurring action when not already queued.
	 */
	public function test_schedule_tasks_when_not_scheduled(): void {
		Functions\expect( 'as_next_scheduled_action' )
			->once()
			->with( Action_Scheduler_Service::HOOK )
			->andReturn( false );

		Functions\expect( 'as_schedule_recurring_action' )
			->once();

		$service = new Action_Scheduler_Service();
		$service->schedule_tasks();

		$this->assertTrue( true );
	}

	/**
	 * Test schedule_tasks does not re-schedule when action is already queued.
	 */
	public function test_schedule_tasks_when_already_scheduled(): void {
		Functions\expect( 'as_next_scheduled_action' )
			->once()
			->with( Action_Scheduler_Service::HOOK )
			->andReturn( 123456 );

		Functions\expect( 'as_schedule_recurring_action' )
			->never();

		$service = new Action_Scheduler_Service();
		$service->schedule_tasks();

		$this->assertTrue( true );
	}
}
