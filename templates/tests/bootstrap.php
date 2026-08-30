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
	define( '{{PREFIX_UPPER}}_VERSION', '{{VERSION}}' );
}
if ( ! defined( '{{PREFIX_UPPER}}_FILE' ) ) {
	define( '{{PREFIX_UPPER}}_FILE', dirname( __DIR__ ) . '/{{SLUG}}.php' );
}
if ( ! defined( '{{PREFIX_UPPER}}_PATH' ) ) {
	define( '{{PREFIX_UPPER}}_PATH', dirname( __DIR__ ) . '/' );
}
if ( ! defined( '{{PREFIX_UPPER}}_URL' ) ) {
	define( '{{PREFIX_UPPER}}_URL', 'https://example.com/wp-content/plugins/{{SLUG}}/' );
}
if ( ! defined( 'MINUTE_IN_SECONDS' ) ) {
	define( 'MINUTE_IN_SECONDS', 60 );
}
if ( ! defined( 'HOUR_IN_SECONDS' ) ) {
	define( 'HOUR_IN_SECONDS', 3600 );
}
if ( ! defined( 'DAY_IN_SECONDS' ) ) {
	define( 'DAY_IN_SECONDS', 86400 );
}
if ( ! defined( 'WEEK_IN_SECONDS' ) ) {
	define( 'WEEK_IN_SECONDS', 604800 );
}
if ( ! defined( 'MONTH_IN_SECONDS' ) ) {
	define( 'MONTH_IN_SECONDS', 2592000 );
}
if ( ! defined( 'YEAR_IN_SECONDS' ) ) {
	define( 'YEAR_IN_SECONDS', 31536000 );
}

if ( ! class_exists( 'WP_REST_Controller' ) ) {
	/**
	 * Stub for WP_REST_Controller when WordPress core is not loaded.
	 */
	// phpcs:ignore Generic.Files.OneObjectStructurePerFile.MultipleFound, PSR1.Classes.ClassDeclaration.MultipleClasses
	class WP_REST_Controller {
		/**
		 * The namespace of this controller's route.
		 *
		 * @var string
		 */
		protected $namespace;

		/**
		 * The base of this controller's route.
		 *
		 * @var string
		 */
		protected $rest_base;

		/**
		 * The controller's cached item schema.
		 *
		 * @var array|null
		 */
		protected $schema;

		/**
		 * Stub: real core strips arg-only properties before exposing a schema
		 * over OPTIONS; there are none to strip in this minimal stub.
		 *
		 * @return array
		 */
		public function get_public_item_schema() {
			return $this->get_item_schema();
		}

		/**
		 * Stub: real core merges in schema for fields added via
		 * register_rest_field(); none are registered in this stub.
		 *
		 * @param array $schema Item schema.
		 * @return array
		 */
		protected function add_additional_fields_schema( $schema ) {
			return $schema;
		}

		/**
		 * Stub default; a subclass implementing get_item_schema() overrides
		 * this.
		 *
		 * @return array
		 */
		public function get_item_schema() {
			return array();
		}
	}
}

if ( ! class_exists( 'WP_REST_Server' ) ) {
	/**
	 * Stub for WP_REST_Server when WordPress core is not loaded.
	 */
	// phpcs:ignore Generic.Files.OneObjectStructurePerFile.MultipleFound, PSR1.Classes.ClassDeclaration.MultipleClasses
	class WP_REST_Server {
		const READABLE   = 'GET';
		const CREATABLE  = 'POST';
		const EDITABLE   = 'POST, PUT, PATCH';
		const DELETABLE  = 'DELETE';
		const ALLMETHODS = 'GET, POST, PUT, PATCH, DELETE';
	}
}

if ( ! class_exists( 'WP_CLI' ) ) {
	/**
	 * Minimal stub for WP_CLI so the CLI\Commands service can be unit-tested
	 * outside a real WP-CLI runtime.
	 */
	// phpcs:ignore Generic.Files.OneObjectStructurePerFile.MultipleFound, PSR1.Classes.ClassDeclaration.MultipleClasses
	class WP_CLI {

		/**
		 * Commands registered via add_command(), keyed by name (for test assertions).
		 *
		 * @var array<string, callable>
		 */
		public static $commands = array();

		/**
		 * Record a command registration.
		 *
		 * @param string   $name    Command name.
		 * @param callable $handler Command handler.
		 * @return void
		 */
		public static function add_command( $name, $handler ) {
			self::$commands[ $name ] = $handler;
		}

		/**
		 * No-op success reporter.
		 *
		 * @param string $message Message. Unused in the stub.
		 * @return void
		 */
		public static function success( $message ) {} // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
	}
}

if ( ! class_exists( 'WC_Payment_Gateway' ) ) {
	/**
	 * Stub for WC_Payment_Gateway when WooCommerce is not loaded.
	 */
	// phpcs:ignore Generic.Files.OneObjectStructurePerFile.MultipleFound, PSR1.Classes.ClassDeclaration.MultipleClasses
	class WC_Payment_Gateway {
		/**
		 * Gateway ID.
		 *
		 * @var string
		 */
		public $id;

		/**
		 * Icon.
		 *
		 * @var string
		 */
		public $icon;

		/**
		 * Supports.
		 *
		 * @var array
		 */
		public $supports;

		/**
		 * Form fields.
		 *
		 * @var array
		 */
		public $form_fields;

		/**
		 * Method title.
		 *
		 * @var string
		 */
		public $method_title;

		/**
		 * Method description.
		 *
		 * @var string
		 */
		public $method_description;

		/**
		 * Has fields.
		 *
		 * @var bool
		 */
		public $has_fields;

		/**
		 * Title.
		 *
		 * @var string
		 */
		public $title;

		/**
		 * Description.
		 *
		 * @var string
		 */
		public $description;

		/**
		 * Enabled.
		 *
		 * @var string
		 */
		public $enabled;

		/**
		 * Get option stub.
		 *
		 * @param string $key Option key.
		 * @param mixed  $empty_value Fallback value.
		 * @return mixed
		 */
		public function get_option( $key, $empty_value = null ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
			return $empty_value;
		}

		/**
		 * Get return URL stub.
		 *
		 * @param mixed $order Order.
		 * @return string
		 */
		public function get_return_url( $order = null ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
			return 'https://example.com/return';
		}

		/**
		 * Init form fields stub.
		 *
		 * @return void
		 */
		public function init_form_fields() {}

		/**
		 * Init settings stub.
		 *
		 * @return void
		 */
		public function init_settings() {}

		/**
		 * Process admin options stub.
		 *
		 * @return void
		 */
		public function process_admin_options() {}
	}
}

if ( ! class_exists( 'WC_Shipping_Method' ) ) {
	/**
	 * Stub for WC_Shipping_Method when WooCommerce is not loaded.
	 */
	// phpcs:ignore Generic.Files.OneObjectStructurePerFile.MultipleFound, PSR1.Classes.ClassDeclaration.MultipleClasses
	class WC_Shipping_Method {
		/**
		 * ID.
		 *
		 * @var string
		 */
		public $id;

		/**
		 * Instance ID.
		 *
		 * @var int
		 */
		public $instance_id;

		/**
		 * Method title.
		 *
		 * @var string
		 */
		public $method_title;

		/**
		 * Method description.
		 *
		 * @var string
		 */
		public $method_description;

		/**
		 * Supports.
		 *
		 * @var array
		 */
		public $supports;

		/**
		 * Title.
		 *
		 * @var string
		 */
		public $title;

		/**
		 * Enabled.
		 *
		 * @var string
		 */
		public $enabled;

		/**
		 * Cost.
		 *
		 * @var string
		 */
		public $cost;

		/**
		 * Instance form fields.
		 *
		 * @var array
		 */
		public $instance_form_fields;

		/**
		 * Init form fields stub.
		 *
		 * @return void
		 */
		public function init_form_fields() {}

		/**
		 * Init settings stub.
		 *
		 * @return void
		 */
		public function init_settings() {}

		/**
		 * Get option stub.
		 *
		 * @param string $key Option key.
		 * @param mixed  $empty_value Fallback value.
		 * @return mixed
		 */
		public function get_option( $key, $empty_value = null ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
			return $empty_value;
		}

		/**
		 * Process admin options stub.
		 *
		 * @return void
		 */
		public function process_admin_options() {}

		/**
		 * Get rate ID stub.
		 *
		 * @return string
		 */
		public function get_rate_id() {
			return $this->id;
		}

		/**
		 * Add rate stub.
		 *
		 * @param array $args Rate arguments.
		 * @return void
		 */
		public function add_rate( $args = array() ) {} // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
	}
}

if ( ! class_exists( 'WC_Email' ) ) {
	/**
	 * Stub for WC_Email when WooCommerce is not loaded.
	 */
	// phpcs:ignore Generic.Files.OneObjectStructurePerFile.MultipleFound, PSR1.Classes.ClassDeclaration.MultipleClasses
	class WC_Email {
		/**
		 * ID.
		 *
		 * @var string
		 */
		public $id;

		/**
		 * Title.
		 *
		 * @var string
		 */
		public $title;

		/**
		 * Description.
		 *
		 * @var string
		 */
		public $description;

		/**
		 * Template HTML path.
		 *
		 * @var string
		 */
		public $template_html;

		/**
		 * Template Plain path.
		 *
		 * @var string
		 */
		public $template_plain;

		/**
		 * Template base.
		 *
		 * @var string
		 */
		public $template_base;

		/**
		 * Placeholders.
		 *
		 * @var array
		 */
		public $placeholders;

		/**
		 * Object.
		 *
		 * @var mixed
		 */
		public $object;

		/**
		 * Recipient.
		 *
		 * @var string
		 */
		public $recipient;

		/**
		 * Customer email flag.
		 *
		 * @var bool
		 */
		public $customer_email = false;

		/**
		 * Constructor.
		 */
		public function __construct() {}

		/**
		 * Init form fields stub.
		 *
		 * @return void
		 */
		public function init_form_fields() {}

		/**
		 * Init settings stub.
		 *
		 * @return void
		 */
		public function init_settings() {}

		/**
		 * Get option stub.
		 *
		 * @param string $key Option key.
		 * @param mixed  $empty_value Fallback value.
		 * @return mixed
		 */
		public function get_option( $key, $empty_value = null ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
			return $empty_value;
		}

		/**
		 * Get recipient stub.
		 *
		 * @return string
		 */
		public function get_recipient() {
			return $this->recipient ?? 'customer@example.com';
		}

		/**
		 * Get headers stub.
		 *
		 * @return string
		 */
		public function get_headers() {
			return '';
		}

		/**
		 * Get attachments stub.
		 *
		 * @return array
		 */
		public function get_attachments() {
			return array();
		}

		/**
		 * Get subject stub.
		 *
		 * @return string
		 */
		public function get_subject() {
			return 'Sample Subject';
		}

		/**
		 * Get heading stub.
		 *
		 * @return string
		 */
		public function get_heading() {
			return 'Sample Heading';
		}

		/**
		 * Send email stub.
		 *
		 * @param string $to Recipient.
		 * @param string $subject Subject.
		 * @param string $message Message body.
		 * @param string $headers Headers.
		 * @param array  $attachments Attachments.
		 * @return bool
		 */
		public function send( $to, $subject, $message, $headers, $attachments ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found
			return true;
		}
	}
}

if ( ! class_exists( 'WC_Product' ) ) {
	/**
	 * Stub for WC_Product when WooCommerce is not loaded.
	 */
	// phpcs:ignore Generic.Files.OneObjectStructurePerFile.MultipleFound, PSR1.Classes.ClassDeclaration.MultipleClasses
	class WC_Product {
		/**
		 * Get product type.
		 *
		 * @return string
		 */
		public function get_type() {
			return 'simple';
		}
	}
}
