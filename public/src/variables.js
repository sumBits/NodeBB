"use strict";
/*global ajaxify*/

(function(ajaxify) {

	ajaxify.variables = {};

	ajaxify.variables.parse = function() {
		var dataEl = $('#content #ajaxify-data');
		if (dataEl.length) {
			ajaxify.data = JSON.parse(dataEl.text());
		}
	};
}(ajaxify || {}));
