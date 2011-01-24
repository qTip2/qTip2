function Ajax(qTip)
{
	var self = this,
		tooltip = qTip.elements.tooltip,
		opts = qTip.options.content.ajax,
		namespace = '.qtip-ajax',
		rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

	self.checks = {
		'^content.ajax': function(obj, name) {
			if(name === 'once') {
				self.once();
			}
			else if(opts && opts.url) {
				self.load();
			}
		}
	};

	$.extend(self, {
		init: function()
		{
			// Make sure ajax options are enabled before proceeding
			if(opts && opts.url) {
				self.load();
				tooltip.one('tooltipshow', self.once);
			}
		},

		once: function()
		{
			if(opts.once) {
				self.destroy();
			}
			else {
				tooltip.bind('tooltipshow'+namespace, self.load);
			}
		},

		load: function()
		{
			var hasSelector = opts.url.indexOf(' '), 
				url = opts.url,
				selector;

			// Check if user delcared a content selector like in .load()
			if(hasSelector > -1) {
				selector = url.substr(hasSelector);
				url = url.substr(0, hasSelector);
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
				qTip.set('content.text', content);
			}

			// Error handler
			function errorHandler(xh, status, error){ qTip.set('content.text', status + ': ' + error); }

			// Setup $.ajax option object and process the request
			$.ajax( $.extend({ success: successHandler, error: errorHandler, context: qTip }, opts, { url: url }) );

			return self;
		},

		destroy: function()
		{
			// Remove bound events
			tooltip.unbind(namespace);
		}
	});

	self.init();
}


$.fn.qtip.plugins.ajax = function(qTip)
{
	var api = qTip.plugins.ajax;
	
	return 'object' === typeof api ? api : (qTip.plugins.ajax = new Ajax(qTip));
};

$.fn.qtip.plugins.ajax.initialize = 'render';

// Setup plugin sanitization
$.fn.qtip.plugins.ajax.sanitize = function(options)
{
	var content = options.content, opts;
	if(content && 'ajax' in content) {
		opts = content.ajax;
		if(typeof opts !== 'object') { opts = options.content.ajax = { url: opts }; }
		if('boolean' !== typeof opts.once && opts.once) { opts.once = !!opts.once; }
	}
};

// Extend original qTip defaults
$.extend(TRUE, $.fn.qtip.defaults, {
	content: {
		ajax: {
			once: TRUE
		}
	}
});