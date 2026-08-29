import { useBlockProps, RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Block editor UI: a single editable rich-text field bound to the `content`
 * attribute. Duplicate this pattern for real fields (InspectorControls,
 * more attributes, ...).
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
