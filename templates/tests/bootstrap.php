<?php
/**
 * PHPUnit Bootstrap file.
 *
 * @package {{NS}}\Tests
 */

require_once dirname( __DIR__ ) . '/vendor/autoload.php';

// Define WordPress constants for unit testing if not defined.
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', '/tmp/wordpress/' );
}
if ( ! defined( '{{PREFIX_UPPER}}_VERSION' ) ) {
	define( '{{PREFIX_UPPER}}_VERSION', '0.1.0' );
}
if ( ! defined( '{{PREFIX_UPPER}}_FILE' ) ) {
	define( '{{PREFIX_UPPER}}_FILE', dirname( __DIR__ ) . '/{{SLUG}}.php' );
}

Brain\Monkey\setUp();
