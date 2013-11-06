// Buttons bar
function ButtonsBar(api) {
	var self = this,
			buttons = api.options.content.buttons,
			classes = api.options.style.buttons && api.options.style.buttons.classes,
			elements = api.elements,
			tooltip = elements.tooltip,
			tooltipClass = 'qtip-has-buttonbar';

	api.checks.buttons = {
		'^content.buttons$': function () {
			buttons = api.options.content.buttons;
			self.init();
		}
	};

	$.extend(self, {
		init: function () {
			if (!buttons) {
				if (elements.buttonbar) {
					elements.buttonbar.remove();
					delete elements.buttonbar;
					tooltip.removeClass(tooltipClass);
				}
				return self;
			}

			if (!elements.buttonbar) {
				elements.buttonbar = $('<div class="qtip-buttonbar"></div>').appendTo(tooltip);
			}
			tooltip.addClass(tooltipClass);
			return self.set(buttons);
		},
		add: function (button) {
			if (!elements.buttons) {
				return self.set([button]);
			}

			var btn;

			if (button.jquery) {
				btn = button;
			} else {
				btn = $('<button>' + button.text + '</button>');
				(classes && (typeof button.def == 'undefined' || button.def) && btn.addClass(classes));
				(button.classes && btn.addClass(button.classes));
				(button['attr'] && btn.attr(button['attr']));
				(button['prop'] && btn.attr(button['prop']));
				if (button.action) {

					var action = button.action;
					if (!action || typeof action == 'string') {
						switch (action)
						{
							case 'close':
							case 'hide':
								action = function(e, api) {api.hide()};
								break;
							case 'cancel':
							case 'destroy':
								action = function(e, api) {api.destroy()};
								break;
							case 'submit':
							case 'reset':
								action = (function(method) {
									return function(e, api) {
										api.elements.content.find('form')[0][method]();
									}
								}(action));
								break;
							default:
								action = function() {};
						}
					}
					btn.bind('click', function (e) {
						action.apply(btn, [e, api]);
					});
				}
			}
			btn.appendTo(elements.buttons);

			return self;
		},
		set: function (buttons) {
			(elements.buttons && elements.buttons.remove());
			if (elements.buttonbar && typeof buttons === 'object' && !$.isEmptyObject(buttons)) {
				elements.buttons = $('<div class="qtip-buttonbar-buttons"></div>').appendTo(elements.buttonbar);
				$.each(buttons, function () {
					self.add(this);
				});
			}

			return self;
		}
	});

	self.init();
}


PLUGINS.buttons = function (api) {
	return new ButtonsBar(api);
};

PLUGINS.buttons.initialize = 'render';

// Extend original qTip defaults
$.extend(TRUE, QTIP.defaults, {
	content: {
		buttons: false
	},
	style: {
		buttons: {
			classes: 'btn'
		}
	}
});
