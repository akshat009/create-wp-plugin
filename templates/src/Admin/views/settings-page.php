<?php
/**
 * Settings page view.
 *
 * Included by {{NS}}\Admin\Settings_Registrar::render_page() with
 * $repository (a Settings_Repository instance) in scope.
 *
 * @package {{NS}}\Admin
 *
 * @var \{{NS}}\Admin\Settings_Repository $repository Settings data repository.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div class="wrap">
	<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
{{REACT_ADMIN_ROOT}}	<form method="post" action="options.php">
		<?php
		settings_fields( $repository->get_options_group() );
		do_settings_sections( '{{SLUG}}' );
		submit_button();
		?>
	</form>
</div>
