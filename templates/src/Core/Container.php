<?php
/**
 * Minimal service container.
 *
 * @package {{NS}}\Core
 */

declare(strict_types=1);

namespace {{NS}}\Core;

use {{NS}}\Core\Exceptions\Not_Found_Exception;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Container.
 *
 * A deliberately minimal service container: explicit factories only, no
 * reflection-based autowiring. Bindings are resolved lazily on get() so
 * nothing is constructed until it's actually needed.
 */
final class Container {

	/**
	 * Registered factory bindings, keyed by id.
	 *
	 * @var array<string, array{factory: callable, singleton: bool}>
	 */
	private array $bindings = array();

	/**
	 * Already-resolved singleton instances and explicit instance() values, keyed by id.
	 *
	 * @var array<string, mixed>
	 */
	private array $instances = array();

	/**
	 * Bind a factory that runs on every get() call.
	 *
	 * @param string   $id      Binding identifier (typically a fully-qualified class name).
	 * @param callable $factory Factory receiving this Container, returning the resolved value.
	 * @return void
	 */
	public function bind( string $id, callable $factory ): void {
		$this->bindings[ $id ] = array(
			'factory'   => $factory,
			'singleton' => false,
		);
		unset( $this->instances[ $id ] );
	}

	/**
	 * Bind a factory whose result is cached after the first get() call.
	 *
	 * @param string   $id      Binding identifier (typically a fully-qualified class name).
	 * @param callable $factory Factory receiving this Container, returning the resolved value.
	 * @return void
	 */
	public function singleton( string $id, callable $factory ): void {
		$this->bindings[ $id ] = array(
			'factory'   => $factory,
			'singleton' => true,
		);
		unset( $this->instances[ $id ] );
	}

	/**
	 * Register an already-constructed value directly (no factory involved).
	 *
	 * @param string $id    Binding identifier.
	 * @param object $value The value to return for every subsequent get() call.
	 * @return void
	 */
	public function instance( string $id, object $value ): void {
		$this->instances[ $id ] = $value;
	}

	/**
	 * Whether an id has an instance or a factory binding registered.
	 *
	 * @param string $id Binding identifier.
	 * @return bool
	 */
	public function has( string $id ): bool {
		return isset( $this->instances[ $id ] ) || isset( $this->bindings[ $id ] );
	}

	/**
	 * Resolve a binding.
	 *
	 * @param string $id Binding identifier.
	 * @return mixed
	 *
	 * @throws Not_Found_Exception When no instance or binding is registered for $id.
	 */
	public function get( string $id ): mixed {
		if ( isset( $this->instances[ $id ] ) ) {
			return $this->instances[ $id ];
		}

		if ( ! isset( $this->bindings[ $id ] ) ) {
			throw new Not_Found_Exception( sprintf( 'No binding registered for "%s".', $id ) ); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- $id is a developer-supplied binding identifier, not user input or output.
		}

		$binding = $this->bindings[ $id ];
		$value   = ( $binding['factory'] )( $this );

		if ( $binding['singleton'] ) {
			$this->instances[ $id ] = $value;
		}

		return $value;
	}
}
