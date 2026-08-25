<?php
/**
 * Sample setting field view.
 *
 * Included by {{NS}}\Admin\Settings_Registrar::render_sample_field() with
 * $name (string) and $value (string) in scope.
 *
 * @package {{NS}}\Admin
 *
 * @var string $name  The option's form field name/id.
 * @var string $value The option's current value.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<input type="text" name="<?php echo esc_attr( $name ); ?>" value="<?php echo esc_attr( $value ); ?>" class="regular-text" />
