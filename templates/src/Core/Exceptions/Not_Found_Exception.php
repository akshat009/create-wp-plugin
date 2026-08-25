<?php
/**
 * Thrown by Container::get() when an id has no instance or binding registered.
 *
 * @package {{NS}}\Core\Exceptions
 */

declare(strict_types=1);

namespace {{NS}}\Core\Exceptions;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Not_Found_Exception.
 */
class Not_Found_Exception extends \RuntimeException {
}
