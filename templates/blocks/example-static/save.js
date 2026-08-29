import { useBlockProps, RichText } from '@wordpress/block-editor';

/**
 * Serialized output stored in post content. Keep this a pure function of
 * `attributes` — changing it after a block has been saved triggers a block
 * validation error in the editor (use a deprecation to migrate).
 *
 * @param {Object} props            Block props.
 * @param {Object} props.attributes Block attributes.
 * @return {Element} Saved markup.
 */
export default function save( { attributes } ) {
	const blockProps = useBlockProps.save();

	return (
		<RichText.Content
			{ ...blockProps }
			tagName="p"
			value={ attributes.content }
		/>
	);
}
