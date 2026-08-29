import { registerBlockType } from '@wordpress/blocks';
import metadata from './block.json';
import Edit from './edit';

/**
 * Dynamic block: save() returns null, the front-end markup comes from
 * render.php so the output stays filterable and translatable server-side.
 */
registerBlockType( metadata.name, {
	edit: Edit,
	save: () => null,
} );
