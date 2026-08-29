import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import metadata from './block.json';

const PLACEHOLDER = __( 'Cart summary', '{{SLUG}}' );

/**
 * Editor placeholder — the real frontend markup is produced by render.php,
 * so the output stays filterable and translatable server-side.
 *
 * @return {Element} Editor markup.
 */
function Edit() {
	const blockProps = useBlockProps();
	return <div { ...blockProps }>{ PLACEHOLDER }</div>;
}

/**
 * Dynamic block — save() stays empty, real output comes from render.php.
 */
registerBlockType( metadata.name, {
	edit: Edit,
	save: () => null,
} );
