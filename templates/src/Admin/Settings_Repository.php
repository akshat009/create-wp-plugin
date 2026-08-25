<?php
/**
 * Admin Settings Data Repository.
 *
 * @package {{NS}}\Admin
 */

declare(strict_types=1);

namespace {{NS}}\Admin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Settings_Repository.
 *
 * Pure data access for the plugin's settings-page option — no WordPress
 * hooks are registered here, only get_option()/register_setting().
 */
class Settings_Repository {

	/**
	 * Settings API option group.
	 *
	 * @var string
	 */
	private const OPTIONS_GROUP = '{{PREFIX}}_options_group';

	/**
	 * Settings API option name.
	 *
	 * @var string
	 */
	private const OPTION_NAME = '{{PREFIX}}_option_name';

	/**
	 * Get the option name this repository manages.
	 *
	 * @return string
	 */
	public function get_option_name(): string {
		return self::OPTION_NAME;
	}

	/**
	 * Get the Settings API option group this option belongs to.
	 *
	 * @return string
	 */
	public function get_options_group(): string {
		return self::OPTIONS_GROUP;
	}

	/**
	 * Get the current stored value.
	 *
	 * @return string
	 */
	public function get_value(): string {
		return (string) get_option( self::OPTION_NAME, '' );
	}

	/**
	 * Register the option with the Settings API.
	 *
	 * @return void
	 */
	public function register_setting(): void {
		register_setting(
			self::OPTIONS_GROUP,
			self::OPTION_NAME,
			array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'default'           => '',
			)
		);
	}
}
