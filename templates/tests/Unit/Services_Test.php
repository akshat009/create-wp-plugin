<?php
/**
 * Services locator Unit Test.
 *
 * @package {{NS}}\Tests\Unit
 */

declare(strict_types=1);

namespace {{NS}}\Tests\Unit;

use {{NS}}\Services;

/**
 * Class Services_Test.
 *
 * Each accessor is a memoised, overridable singleton: set() swaps a double
 * in, a repeat call returns the same object, reset() forgets everything.
 * Plugin_TestCase calls Services::reset() after every test.
 */
class Services_Test extends Plugin_TestCase {

{{SERVICES_ACCESSOR_TESTS}}}
