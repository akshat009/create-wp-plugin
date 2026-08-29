import { render, screen, fireEvent } from '@testing-library/react';
import { App } from '../../assets/src/index.js';

describe( 'App', () => {
	it( 'increments the click count when the button is clicked', () => {
		render( <App /> );

		const button = screen.getByRole( 'button' );
		expect( button ).toHaveTextContent( '0' );

		fireEvent.click( button );

		expect( button ).toHaveTextContent( '1' );
	} );
} );
