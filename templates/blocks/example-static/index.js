import { registerBlockType } from '@wordpress/blocks';
import metadata from './block.json';
import Edit from './edit';
import save from './save';

/**
 * Static block: save() returns the markup serialized into post content —
 * no render.php and no PHP render callback. Registration is still handled
 * by Blocks\Block_Registrar, which registers every built block directory.
 */
registerBlockType( metadata.name, {
	edit: Edit,
	save,
} );
