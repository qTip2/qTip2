function Ajax(api)
{
	var self = this,
		tooltip = api.elements.tooltip,
		opts = api.options.content.ajax,
		namespace = '.qtip-ajax',
		rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
		first = TRUE;

	api.checks.ajax = {
		'^content.ajax': function(obj, name, v) {
			// If content.ajax object was reset, set our local var
			if(name === 'ajax') { opts = v; }

			if(name === 'once') {
				tooltip.unbind(namespace);
				if(v) { tooltip.bind('tooltipshow'+namespace, self.load); }
			}
			else if(opts && opts.url) {
				self.load();
			}
			else {
				tooltip.unbind(namespace);
			}
		}
	};

	$.extend(self, {
		init: function()
		{
			// Make sure ajax options are enabled and bind event
			if(opts && opts.url) {
				tooltip[ opts.once ? 'one' : 'bind' ]('tooltipshow'+namespace, self.load);
			}

			return self;
		},

		load: function(event, first)
		{
			// Make sure default event hasn't been prevented
			if(event.isDefaultPrevented()) { return self; }
			
			var hasSelector = opts.url.indexOf(' '), 
				url = opts.url,
				selector,
				hideFirst = opts.once && !opts.loading && first;

			// If loading option is disabled, hide the tooltip until content is retrieved (first time only)
			if(hideFirst) { tooltip.css('visibility', 'hidden'); }

			// Check if user delcared a content selector like in .load()
			if(hasSelector > -1) {
				selector = url.substr(hasSelector);
				url = url.substr(0, hasSelector);
			}

			// Define common after callback for both success/error handlers
			function after() {
				// Re-display tip if loading and first time, and reset first flag
				if(hideFirst) { tooltip.css('visibility', ''); first = FALSE; }
			}

			// Define success handler
			function successHandler(content) {
				if(selector) {
					// Create a dummy div to hold the results and grab the selector element
					content = $('<div/>')
						// inject the contents of the document in, removing the scripts
						// to avoid any 'Permission Denied' errors in IE
						.append(content.replace(rscript, ""))
						
						// Locate the specified elements
						.find(selector);
				}

				// Set the content
				api.set('content.text', content);

				after(); // Call common callback
			}

			// Error handler
			function errorHandler(xh, status, error){ api.set('content.text', status + ': ' + error); after(); }

			// Setup $.ajax option object and process the request
			$.ajax( $.extend({ success: successHandler, error: errorHandler, context: api }, opts, { url: url }) );
			
			return self;
		}
	});

	self.init();
}


PLUGINS.ajax = function(api)
{
	var self = api.plugins.ajax;
	
	return 'object' === typeof self ? self : (api.plugins.ajax = new Ajax(api));
};

PLUGINS.ajax.initialize = 'render';

// Setup plugin sanitization
PLUGINS.ajax.sanitize = function(options)
{
	var content = options.content, opts;
	if(content && 'ajax' in content) {
		opts = content.ajax;
		if(typeof opts !== 'object') { opts = options.content.ajax = { url: opts }; }
		if('boolean' !== typeof opts.once && opts.once) { opts.once = !!opts.once; }
	}
};

// Extend original api defaults
$.extend(TRUE, QTIP.defaults, {
	content: {
		ajax: {
			loading: TRUE,
			once: TRUE
		}
	}
});