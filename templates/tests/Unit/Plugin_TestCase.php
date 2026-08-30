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
{{#if has_services}}
use {{NS}}\Services;
{{/if}}

/**
 * Class Plugin_TestCase.
 *
 * Clears the plugin's process-global state -- the Plugin singleton{{#if has_services}} and the
 * Services locator's memoised instances{{/if}} -- after every test, so nothing a test
 * builds leaks into the next one. Every unit test extends this instead of
 * PHPUnit's TestCase directly.
 */
abstract class Plugin_TestCase extends TestCase {

	/**
	 * Reset plugin-global state after each test.
	 *
	 * @return void
	 */
	protected function tearDown(): void {
{{#if has_services}}
		Services::reset();
{{/if}}
		Plugin::set_instance( null );
		parent::tearDown();
	}
}
