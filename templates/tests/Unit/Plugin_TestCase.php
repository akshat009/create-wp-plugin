<?php
/**
 * Base test case for the Brain Monkey unit suite.
 *
 * @package {{NS}}\Tests\Unit
 */

declare(strict_types=1);

namespace {{NS}}\Tests\Unit;

use PHPUnit\Framework\TestCase;
use {{NS}}\Plugin;
use {{NS}}\Services;

/**
 * Class Plugin_TestCase.
 *
 * Clears the two pieces of process-global state the plugin keeps -- the
 * Plugin singleton and the Services locator's memoised instances -- after
 * every test, so nothing a test builds leaks into the next one. Every unit
 * test extends this instead of PHPUnit's TestCase directly.
 */
abstract class Plugin_TestCase extends TestCase {

	/**
	 * Reset plugin-global state after each test.
	 *
	 * @return void
	 */
	protected function tearDown(): void {
		Services::reset();
		Plugin::set_instance( null );
		parent::tearDown();
	}
}
