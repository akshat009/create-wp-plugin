<?php
/**
 * Custom order email template (plain text).
 *
 * Copied into the generated plugin at templates/emails/plain/{{PREFIX}}-custom-email.php
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

echo esc_html( wp_strip_all_tags( $email_heading ) ) . "\n\n";

$first_name = ( $order && method_exists( $order, 'get_billing_first_name' ) ) ? $order->get_billing_first_name() : __( 'Customer', '{{SLUG}}' );

/* translators: %s: Customer first name. */
echo esc_html( sprintf( __( 'Hi %s,', '{{SLUG}}' ), $first_name ) ) . "\n\n";

esc_html_e( 'This is a custom notification email — replace this content with your own.', '{{SLUG}}' );

echo "\n\n" . str_repeat( '-', 40 ) . "\n\n";

do_action( 'woocommerce_email_order_details', $order, $sent_to_admin, $plain_text, $email );
