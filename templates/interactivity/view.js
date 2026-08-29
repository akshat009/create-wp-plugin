import { store, getContext } from '@wordpress/interactivity';

store( '{{SLUG}}', {
	actions: {
		increment() {
			const context = getContext();
			context.count++;
		},
	},
} );
