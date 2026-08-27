/**
 * Main JavaScript file for {{PLUGIN_NAME}}.
 *
 * Demonstrates wiring an admin-ajax request to a user event (button click).
 */
document.addEventListener( 'DOMContentLoaded', function() {
	const trigger = document.querySelector( '.{{SLUG}}-ajax-trigger' );
	if ( ! trigger || typeof window.{{PREFIX}}Ajax === 'undefined' ) {
		return;
	}

	trigger.addEventListener( 'click', function( event ) {
		event.preventDefault();

		const formData = new FormData();
		formData.append( 'action', '{{PREFIX}}_action' );
		formData.append( 'nonce', window.{{PREFIX}}Ajax.nonce );
		formData.append( 'input_text', 'hello' );

		fetch( window.{{PREFIX}}Ajax.ajax_url, {
			method: 'POST',
			body: formData
		} )
			.then( response => response.json() )
			.then( data => {
				// Handle AJAX response.
			} )
			.catch( error => console.error( '{{PLUGIN_NAME}} AJAX error:', error ) );
	} );
} );

