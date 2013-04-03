/*jslint browser: true, onevar: true, undef: true, nomen: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
/*global window: false, jQuery: false, console: false, define: false */

/* Cache window, document, undefined */
(function( window, document, undefined ) {

// Uses AMD or browser globals to create a jQuery plugin.
(function( factory ) {
	"use strict";
	if(typeof define === 'function' && define.amd) {
		define(['jquery'], factory);
	}
	else if(jQuery && !jQuery.fn.qtip) {
		factory(jQuery);
	}
}
(function($) {
	/* This currently causes issues with Safari 6, so for it's disabled */
	//"use strict"; // (Dis)able ECMAScript "strict" operation for this function. See more: http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/

	// Munge the primitives - Paul Irish tip
	var TRUE = true,
		FALSE = false,
		NULL = null,

		// Common variables
		X = 'x', Y = 'y',
		WIDTH = 'width',
		HEIGHT = 'height',

		// Positioning sides
		TOP = 'top',
		LEFT = 'left',
		BOTTOM = 'bottom',
		RIGHT = 'right',
		CENTER = 'center',

		// Position adjustment types
		FLIP = 'flip',
		FLIPINVERT = 'flipinvert',
		SHIFT = 'shift',

		// Shortcut vars
		QTIP, PLUGINS,
		NAMESPACE = 'qtip',
		HASATTR = 'data-hasqtip',
		WIDGET = ['ui-widget', 'ui-tooltip'],
		MOUSE = {},
		usedIDs = {},
		selector = 'div.qtip.'+NAMESPACE,
		defaultClass = NAMESPACE + '-default',
		focusClass = NAMESPACE + '-focus',
		hoverClass = NAMESPACE + '-hover',
		replaceSuffix = '_replacedByqTip',
		oldtitle = 'oldtitle',
		trackingBound;

	// Store mouse coordinates
	function storeMouse(id, event) {
		MOUSE[id] = {
			pageX: event.pageX,
			pageY: event.pageY,
			type: 'mousemove',
			scrollX: window.pageXOffset || document.body.scrollLeft || document.documentElement.scrollLeft,
			scrollY: window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop
		};
	}

	// Widget class creator
	function createWidgetClass(cls) {
		return WIDGET.concat('').join(cls ? '-'+cls+' ' : ' ');
	}

	// Dot notation converter
	function convertNotation(options, notation) {
		var i = 0, obj, option = options,

		// Split notation into array
		levels = notation.split('.');

		// Loop through
		while( option = option[ levels[i++] ] ) {
			if(i < levels.length) { obj = option; }
		}

		return [obj || options, levels.pop()];
	}

	// Option object sanitizer
	function sanitizeOptions(opts) {
		var invalid = function(a) { return a === NULL || !$.isPlainObject(a); },
			invalidContent = function(c) { return !$.isFunction(c) && ((!c && !c.attr) || c.length < 1 || ('object' === typeof c && !c.jquery && !c.then)); },
			once;

		if(!opts || 'object' !== typeof opts) { return FALSE; }

		if(invalid(opts.metadata)) {
			opts.metadata = { type: opts.metadata };
		}

		if('content' in opts) {
			if(invalid(opts.content) || opts.content.jquery || opts.content.done) {
				opts.content = { text: opts.content };
			}

			if(invalidContent(opts.content.text || FALSE)) {
				opts.content.text = FALSE;
			}

			// DEPRECATED - Old content.ajax plugin functionality
			// Converts it into the proper Deferred syntax
			if('ajax' in opts.content) {
				once = opts.content.ajax.once !== FALSE;
				opts.content.text = function(event, api) {
					var deferred = $.ajax(opts.content.ajax)
						.then(function(content) {
							if(once) { api.set('content.text', content); }
							return content;
						},
						function(xhr, status, error) {
							if(api.destroyed || xhr.status === 0) { return; }
							api.set('content.text', status + ': ' + error);
						});

					return !once ? deferred : 'Loading...';
				};
			}

			if('title' in opts.content) {
				if(!invalid(opts.content.title)) {
					opts.content.button = opts.content.title.button;
					opts.content.title = opts.content.title.text;
				}

				if(invalidContent(opts.content.title || FALSE)) {
					opts.content.title = FALSE;
				}
			}
		}

		if('position' in opts && invalid(opts.position)) {
			opts.position = { my: opts.position, at: opts.position };
		}

		if('show' in opts && invalid(opts.show)) {
			opts.show = opts.show.jquery ? { target: opts.show } : 
				opts.show === TRUE ? { ready: TRUE } : { event: opts.show };
		}

		if('hide' in opts && invalid(opts.hide)) {
			opts.hide = opts.hide.jquery ? { target: opts.hide } : { event: opts.hide };
		}

		if('style' in opts && invalid(opts.style)) {
			opts.style = { classes: opts.style };
		}

		// Sanitize plugin options
		$.each(PLUGINS, function() {
			if(this.sanitize) { this.sanitize(opts); }
		});

		return opts;
	}