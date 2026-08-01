/**
 * Main JavaScript file for {{PLUGIN_NAME}}.
 */
console.log( '{{PLUGIN_NAME}} loaded.' );

if ( typeof window.{{PREFIX}}Ajax !== 'undefined' ) {
	const formData = new FormData();
	formData.append( 'action', '{{PREFIX}}_action' );
	formData.append( 'nonce', window.{{PREFIX}}Ajax.nonce );
	formData.append( 'input_text', 'hello' );

	fetch( window.{{PREFIX}}Ajax.ajax_url, {
		method: 'POST',
		body: formData
	} )
		.then( response => response.json() )
		.then( data => console.log( '{{PLUGIN_NAME}} AJAX response:', data ) )
		.catch( error => console.error( '{{PLUGIN_NAME}} AJAX error:', error ) );
}
