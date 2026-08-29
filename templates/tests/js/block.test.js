import { registerBlockType } from '@wordpress/blocks';

jest.mock( '@wordpress/blocks', () => ( {
	registerBlockType: jest.fn(),
} ) );

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: () => ( {} ),
	RichText: 'rich-text',
} ) );

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
