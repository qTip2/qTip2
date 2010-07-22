/* BGIFrame adaption (http://plugins.jquery.com/project/bgiframe) - Special thanks to Brandon Aaron */
function BGIFrame(qTip)
{
	var self = this,
		tooltip = qTip.elements.tooltip,
		ns = '.bgiframe-' + qTip.id,
		events = 'tooltipmove'+namespace+' tooltipshow'+namespace;

	self.frame = NULL;

	$.extend(self, {
		init: function()
		{
			// Create the BGIFrame element
			self.frame = $('<iframe class="ui-tooltip-bgiframe" frameborder="0" tabindex="-1" src="javascript:\'\';" ' +
				' style="display:block; position:absolute; z-index:-1; filter:alpha(opacity=0);"></iframe>');

			// Append the new element to the tooltip
			self.frame.appendTo(tooltip);

			// Update BGIFrame on tooltip move
			tooltip.bind(events, self.adjust);
		},

		adjust: function()
		{
			var dimensions = qTip.calculate('dimensions'), // Determine current tooltip dimensions
				plugin = qTip.plugins.tip,
				tip = qTip.elements.tip,
				tipAdjust, offset;

			// Adjust border offset
			offset = parseInt(tooltip.css('border-left-width'), 10);
			offset = { left: -offset, top: -offset };

			// Adjust for tips plugin
			if(plugin && tip) {
				tipAdjust = (plugin.corner.precedance === 'x') ? ['width', 'left'] : ['height', 'top'];
				offset[ tipAdjust[1] ] -= tip[ tipAdjust[0] ]();
			}

			// Update bgiframe
			self.frame.css(offset).css(dimensions);
		},

		destroy: function()
		{
			// Remove iframe
			self.iframe.remove();

			// Remove bound events
			tooltip.unbind(events);
		}
	});

	self.init();
}

$.fn.qtip.plugins.bgiframe = function(qTip)
{
	// Proceed only if the browser is IE6 and offending elements are present
	if(!($.browser.msie && (/^6\.[0-9]/).test($.browser.version) && $('select, object').length)) {
		return FALSE;
	}

	// Retrieve previous API object
	var api = qTip.plugins.bgiframe;

	// An API is already present,
	if(api) {
		return api;
	}
	// No API was found, create new instance
	else {
		qTip.plugins.bgiframe = new BGIFrame(qTip);
		return qTip.plugins.bgiframe;
	}
};

// Plugin needs to be initialized on render
$.fn.qtip.plugins.bgiframe.initialize = 'render';

