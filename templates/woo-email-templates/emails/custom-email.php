<?php
/**
 * Custom order email template (HTML).
 *
 * Copied into the generated plugin at templates/emails/{{PREFIX}}-custom-email.php
 * and loaded by {{NS}}\Woo\Emails\Custom_Email — customize freely.
 *
 * @package {{NS}}\Woo\Emails
 *
 * @var WC_Order $order         Order object.
 * @var string   $email_heading Email heading.
 * @var bool     $sent_to_admin Whether this copy is for the store admin.
 * @var bool     $plain_text    Whether this is the plain-text version.
 * @var WC_Email $email         Email object.
 */

defined( 'ABSPATH' ) || exit;

do_action( 'woocommerce_email_header', $email_heading, $email );
?>
<p>
	<?php
	$first_name = ( $order && method_exists( $order, 'get_billing_first_name' ) ) ? $order->get_billing_first_name() : __( 'Customer', '{{SLUG}}' );
	printf(
		/* translators: %s: Customer first name. */
		esc_html__( 'Hi %s,', '{{SLUG}}' ),
		esc_html( $first_name )
	);
	?>
</p>
<p><?php esc_html_e( 'This is a custom notification email — replace this content with your own.', '{{SLUG}}' ); ?></p>

<?php
/**
 * Hook for adding content after the main email content.
 *
 * @param WC_Order $order         Order object.
 * @param bool     $sent_to_admin Whether this copy is for the store admin.
 * @param bool     $plain_text    Whether this is the plain-text version.
 * @param WC_Email $email         Email object.
 */
do_action( 'woocommerce_email_order_details', $order, $sent_to_admin, $plain_text, $email );

do_action( 'woocommerce_email_footer', $email );
