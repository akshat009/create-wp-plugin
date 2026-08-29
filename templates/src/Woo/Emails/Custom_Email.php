<?php
/**
 * {{PLUGIN_NAME}} Custom Order Email.
 *
 * @package {{NS}}\Woo\Emails
 */

declare(strict_types=1);

namespace {{NS}}\Woo\Emails;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Custom_Email.
 *
 * Fires on order completion by default — change the triggering hook and the
 * template content in templates/emails/ for your real notification.
 */
class Custom_Email extends \WC_Email {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->id             = '{{PREFIX}}_custom_email';
		$this->title          = __( '{{PLUGIN_NAME_ESC}} Custom Email', '{{SLUG}}' );
		$this->description    = __( 'Sent when an order is marked complete. Change the trigger and content for your use case.', '{{SLUG}}' );
		$this->customer_email = true;
		$this->template_html  = 'emails/{{PREFIX}}-custom-email.php';
		$this->template_plain = 'emails/plain/{{PREFIX}}-custom-email.php';
		$this->template_base  = {{PREFIX_UPPER}}_PATH . 'templates/';
		$this->placeholders   = array(
			'{order_number}' => '',
		);

		add_action( 'woocommerce_order_status_completed', $this->trigger( ... ) );

		parent::__construct();
	}

	/**
	 * Trigger the email for a given order.
	 *
	 * @param int $order_id Order ID.
	 * @return void
	 */
	public function trigger( $order_id ) {
		if ( ! $order_id ) {
			return;
		}

		$this->object = wc_get_order( $order_id );

		if ( ! $this->object ) {
			return;
		}

		$this->placeholders['{order_number}'] = $this->object->get_order_number();
		$this->recipient                      = $this->object->get_billing_email();

		if ( ! $this->is_enabled() || ! $this->get_recipient() ) {
			return;
		}

		$this->send( $this->get_recipient(), $this->get_subject(), $this->get_content(), $this->get_headers(), $this->get_attachments() );
	}

	/**
	 * Get default email subject.
	 *
	 * @return string
	 */
	public function get_default_subject() {
		return __( '[{site_title}]: Custom order notification #{order_number}', '{{SLUG}}' );
	}

	/**
	 * Get default email heading.
	 *
	 * @return string
	 */
	public function get_default_heading() {
		return __( 'Custom Order Notification: #{order_number}', '{{SLUG}}' );
	}

	/**
	 * Initialise Settings Form Fields.
	 *
	 * @return void
	 */
	public function init_form_fields() {
		$this->form_fields = array(
			'enabled'    => array(
				'title'   => __( 'Enable/Disable', '{{SLUG}}' ),
				'type'    => 'checkbox',
				'label'   => __( 'Enable this email notification', '{{SLUG}}' ),
				'default' => 'yes',
			),
			'subject'    => array(
				'title'       => __( 'Subject', '{{SLUG}}' ),
				'type'        => 'text',
				'desc_tip'    => true,
				'description' => sprintf(
					/* translators: %s: default subject */
					__( 'Available placeholders: {site_title}, {order_number}. Default: %s', '{{SLUG}}' ),
					'<code>' . $this->get_default_subject() . '</code>'
				),
				'placeholder' => $this->get_default_subject(),
				'default'     => '',
			),
			'heading'    => array(
				'title'       => __( 'Email heading', '{{SLUG}}' ),
				'type'        => 'text',
				'desc_tip'    => true,
				'description' => sprintf(
					/* translators: %s: default heading */
					__( 'Available placeholders: {site_title}, {order_number}. Default: %s', '{{SLUG}}' ),
					'<code>' . $this->get_default_heading() . '</code>'
				),
				'placeholder' => $this->get_default_heading(),
				'default'     => '',
			),
			'email_type' => array(
				'title'       => __( 'Email type', '{{SLUG}}' ),
				'type'        => 'select',
				'description' => __( 'Choose which format of email to send.', '{{SLUG}}' ),
				'default'     => 'html',
				'class'       => 'email_type wc-enhanced-select',
				'options'     => $this->get_email_type_options(),
				'desc_tip'    => true,
			),
		);
	}

	/**
	 * Get the HTML content of the email.
	 *
	 * @return string
	 */
	public function get_content_html() {
		return wc_get_template_html(
			$this->template_html,
			array(
				'order'         => $this->object,
				'email_heading' => $this->get_heading(),
				'sent_to_admin' => false,
				'plain_text'    => false,
				'email'         => $this,
			),
			'woocommerce/',
			$this->template_base
		);
	}

	/**
	 * Get the plain text content of the email.
	 *
	 * @return string
	 */
	public function get_content_plain() {
		return wc_get_template_html(
			$this->template_plain,
			array(
				'order'         => $this->object,
				'email_heading' => $this->get_heading(),
				'sent_to_admin' => false,
				'plain_text'    => true,
				'email'         => $this,
			),
			'woocommerce/',
			$this->template_base
		);
	}
}
