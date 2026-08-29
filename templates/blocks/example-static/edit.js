import { useBlockProps, RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Editor UI — same shape as the dynamic block's, but here the edited value
 * is also exactly what gets saved (see save.js).
 *
 * @param {Object}   props               Block props.
 * @param {Object}   props.attributes    Block attributes.
 * @param {Function} props.setAttributes Attribute setter.
 * @return {Element} Editor markup.
 */
export default function Edit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps();

	return (
		<RichText
			{ ...blockProps }
			tagName="p"
			value={ attributes.content }
			onChange={ ( content ) => setAttributes( { content } ) }
			placeholder={ __( 'Write something…', '{{SLUG}}' ) }
		/>
	);
}
