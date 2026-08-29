<?php
/**
 * Container Unit Test.
 *
 * @package {{NS}}\Tests\Unit
 */

declare(strict_types=1);

namespace {{NS}}\Tests\Unit;

use PHPUnit\Framework\TestCase;
use {{NS}}\Core\Container;
use {{NS}}\Core\Exceptions\Not_Found_Exception;

/**
 * Class Container_Test.
 *
 * The container is the composition root's one moving part; if it drifts,
 * every provider does. These are plain assertions — no WordPress needed.
 */
class Container_Test extends TestCase {

	/**
	 * bind() re-runs its factory on every get().
	 */
	public function test_bind_resolves_fresh_each_call(): void {
		$container = new Container();
		$calls     = 0;

		$container->bind(
			'thing',
			static function () use ( &$calls ) {
				++$calls;
				return new \stdClass();
			}
		);

		$first  = $container->get( 'thing' );
		$second = $container->get( 'thing' );

		$this->assertSame( 2, $calls );
		$this->assertNotSame( $first, $second );
	}

	/**
	 * singleton() runs its factory once and caches the result.
	 */
	public function test_singleton_resolves_once(): void {
		$container = new Container();
		$calls     = 0;

		$container->singleton(
			'thing',
			static function () use ( &$calls ) {
				++$calls;
				return new \stdClass();
			}
		);

		$this->assertSame( $container->get( 'thing' ), $container->get( 'thing' ) );
		$this->assertSame( 1, $calls );
	}

	/**
	 * A singleton factory that resolves to null is still cached — array_key_exists,
	 * not isset (this is the regression the audit flagged).
	 */
	public function test_singleton_caches_a_null_result(): void {
		$container = new Container();
		$calls     = 0;

		$container->singleton(
			'maybe',
			static function () use ( &$calls ) {
				++$calls;
				return null;
			}
		);

		$this->assertNull( $container->get( 'maybe' ) );
		$this->assertNull( $container->get( 'maybe' ) );
		$this->assertSame( 1, $calls, 'null must not re-trigger the factory' );
		$this->assertTrue( $container->has( 'maybe' ) );
	}

	/**
	 * instance() returns exactly the object it was given.
	 */
	public function test_instance_returns_the_same_object(): void {
		$container = new Container();
		$object    = new \stdClass();

		$container->instance( 'obj', $object );

		$this->assertSame( $object, $container->get( 'obj' ) );
		$this->assertTrue( $container->has( 'obj' ) );
	}

	/**
	 * The factory receives the container, so bindings can depend on bindings.
	 */
	public function test_factory_receives_the_container(): void {
		$container = new Container();
		$container->instance( 'dep', new \stdClass() );
		$container->bind(
			'consumer',
			static function ( Container $c ) {
				$wrapper      = new \stdClass();
				$wrapper->dep = $c->get( 'dep' );
				return $wrapper;
			}
		);

		$this->assertSame( $container->get( 'dep' ), $container->get( 'consumer' )->dep );
	}

	/**
	 * Re-binding an id drops any cached singleton instance.
	 */
	public function test_rebinding_clears_the_cached_instance(): void {
		$container = new Container();
		$container->singleton( 'thing', static fn () => 'first' );
		$this->assertSame( 'first', $container->get( 'thing' ) );

		$container->bind( 'thing', static fn () => 'second' );
		$this->assertSame( 'second', $container->get( 'thing' ) );
	}

	/**
	 * get() on an unknown id throws Not_Found_Exception; has() reports false.
	 */
	public function test_unknown_id_throws_and_is_absent(): void {
		$container = new Container();

		$this->assertFalse( $container->has( 'nope' ) );
		$this->expectException( Not_Found_Exception::class );
		$container->get( 'nope' );
	}
}
