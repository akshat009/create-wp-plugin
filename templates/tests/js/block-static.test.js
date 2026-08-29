import { registerBlockType } from '@wordpress/blocks';

jest.mock( '@wordpress/blocks', () => ( {
	registerBlockType: jest.fn(),
} ) );

jest.mock( '@wordpress/block-editor', () => {
	const useBlockProps = () => ( {} );
	useBlockProps.save = () => ( {} );
	return {
		useBlockProps,
		RichText: { Content: 'rich-text-content' },
	};
} );

require( '../../assets/src/blocks/example-static/index.js' );

describe( '{{SLUG}}/example-static block', () => {
	it( 'registers as a static block (save returns serialized markup, not null)', () => {
		expect( registerBlockType ).toHaveBeenCalledTimes( 1 );

		const [ name, settings ] = registerBlockType.mock.calls[ 0 ];
		expect( name ).toBe( '{{SLUG}}/example-static' );
		expect( typeof settings.edit ).toBe( 'function' );
		expect( typeof settings.save ).toBe( 'function' );
		expect( settings.save( { attributes: { content: 'hello' } } ) ).not.toBeNull();
	} );
} );
