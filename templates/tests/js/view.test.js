import { store, getContext } from '@wordpress/interactivity';

jest.mock( '@wordpress/interactivity', () => {
	const registeredStores = {};
	let currentContext = { count: 0 };
	return {
		store: jest.fn( ( namespace, storeConfig ) => {
			registeredStores[ namespace ] = storeConfig;
			return storeConfig;
		} ),
		getContext: jest.fn( () => currentContext ),
		_getStore: ( namespace ) => registeredStores[ namespace ],
		_setContext: ( ctx ) => {
			currentContext = ctx;
		},
	};
} );

require( '../../assets/src/view.js' );

describe( 'Interactivity API view store', () => {
	it( 'registers store under {{SLUG}} namespace and increments count', () => {
		const { store, _getStore, _setContext } = require( '@wordpress/interactivity' );
		expect( store ).toHaveBeenCalled();

		const config = _getStore( '{{SLUG}}' );
		expect( config ).toBeDefined();

		const context = { count: 1 };
		_setContext( context );

		config.actions.increment();
		expect( context.count ).toBe( 2 );
	} );
} );
