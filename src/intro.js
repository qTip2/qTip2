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
		selector = 'div.'+NAMESPACE,
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

	function invalidOpt(a) {
		return a === NULL || !$.isPlainObject(a);
	}

	function invalidContent(c) {
		return !$.isFunction(c) && (
			(!c && !c.attr) || c.length < 1 || ('object' === typeof c && !c.jquery && !c.then)
		);
	}

	// Option object sanitizer
	function sanitizeOptions(opts) {
		var content, text, ajax, once;

		if(invalidOpt(opts)) { return FALSE; }

		if(invalidOpt(opts.metadata)) {
			opts.metadata = { type: opts.metadata };
		}

		if('content' in opts) {
			content = opts.content;

			if(invalidOpt(content) || content.jquery || content.done) {
				content = opts.content = {
					text: (text = invalidContent(content) ? FALSE : content)
				};
			}

			// DEPRECATED - Old content.ajax plugin functionality
			// Converts it into the proper Deferred syntax
			if('ajax' in content) {
				ajax = content.ajax;
				once = ajax && ajax.once !== FALSE;
				content.ajax = null;

				content.text = function(event, api) {
					var deferred = $.ajax(
						$.extend({}, ajax, { context: api })
					)
					.then(function(content) {
						if(once) { api.set('content.text', content); }
						return content;
					},
					function(xhr, status, error) {
						if(api.destroyed || xhr.status === 0) { return; }
						api.set('content.text', status + ': ' + error);
					});

					return !once ? deferred : (text || $(this).attr(api.options.content.attr) || 'Loading...');
				};
			}

			if('title' in content) {
				if(!invalidOpt(content.title)) {
					content.button = content.title.button;
					content.title = content.title.text;
				}

				if(invalidContent(content.title || FALSE)) {
					content.title = FALSE;
				}
			}
		}

		if('position' in opts && invalidOpt(opts.position)) {
			opts.position = { my: opts.position, at: opts.position };
		}

		if('show' in opts && invalidOpt(opts.show)) {
			opts.show = opts.show.jquery ? { target: opts.show } : 
				opts.show === TRUE ? { ready: TRUE } : { event: opts.show };
		}

		if('hide' in opts && invalidOpt(opts.hide)) {
			opts.hide = opts.hide.jquery ? { target: opts.hide } : { event: opts.hide };
		}

		if('style' in opts && invalidOpt(opts.style)) {
			opts.style = { classes: opts.style };
		}

		// Sanitize plugin options
		$.each(PLUGINS, function() {
			if(this.sanitize) { this.sanitize(opts); }
		});

		return opts;
	}