/*jslint browser: true, onevar: true, undef: true, nomen: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global window: false, jQuery: false, console: false, define: false */

/* Cache window, document, undefined */
(function( window, document, undefined ) {

// Uses CommonJS, AMD, or browser globals to create a jQuery plugin.
(function( factory ) {
	"use strict";
	if(typeof jQuery !== 'undefined' && !jQuery.fn.qtip) {
		factory(jQuery);
	}
	else if(typeof module !== 'undefined' && module.exports) {
		module.exports = factory;
	}
	else if(typeof define === 'function' && define.amd) {
		define(['jquery'], factory);
	}
}
(function($) {
	"use strict"; // Enable ECMAScript "strict" operation for this function. See more: http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
