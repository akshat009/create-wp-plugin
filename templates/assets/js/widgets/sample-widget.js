/**
 * Sample Widget Elementor Frontend Handler.
 */
(function ($) {
	'use strict';

	/**
	 * Widget Handler Function.
	 *
	 * @param {jQuery} $scope The Widget wrapper element.
	 */
	const SampleWidgetHandler = function ($scope) {
		console.log('Sample Widget initialized:', $scope);
	};

	$(window).on('elementor/frontend/init', function () {
		elementorFrontend.hooks.addAction('frontend/element_ready/{{PREFIX}}_sample_widget.default', SampleWidgetHandler);
	});
})(jQuery);
