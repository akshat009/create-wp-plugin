import { registerBlockType } from '@wordpress/blocks';

// `@wordpress/*` runtime packages are webpack externals, not devDependencies —
// `virtual: true` lets Jest mock them without resolving them on disk.
jest.mock(
	'@wordpress/blocks',
	() => ( {
		registerBlockType: jest.fn(),
	} ),
	{ virtual: true }
);

jest.mock(
	'@wordpress/block-editor',
	() => ( {
		useBlockProps: () => ( {} ),
		RichText: 'rich-text',
	} ),
	{ virtual: true }
);

require( '../../assets/src/blocks/example/index.js' );

describe( '{{SLUG}}/example block', () => {
	it( 'registers as a dynamic block (null save, editor component)', () => {
		expect( registerBlockType ).toHaveBeenCalledTimes( 1 );

		const [ name, settings ] = registerBlockType.mock.calls[ 0 ];
		expect( name ).toBe( '{{SLUG}}/example' );
		expect( settings.save() ).toBeNull();
		expect( typeof settings.edit ).toBe( 'function' );
	} );
} );
