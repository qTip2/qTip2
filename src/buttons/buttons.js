// Buttons bar
var hasButtonBarClass = 'qtip-has-buttonbar';

function ButtonsBar(api) {
	this.qtip = api;
	this.classes = api.options.style.buttons && api.options.style.buttons.classes;
	this.init(api.options.content.buttons);
}

$.extend(ButtonsBar.prototype, {
	init: function (buttons) {
		var elements = this.qtip.elements;

		if (!buttons) {
			if (elements.buttonbar) {
				elements.buttonbar.remove();
				delete elements.buttonbar;
				elements.tooltip.removeClass(hasButtonBarClass);
			}
			return self;
		}

		if (!elements.buttonbar) {
			elements.buttonbar = $('<div class="qtip-buttonbar"></div>').appendTo(elements.tooltip);
		}
		elements.tooltip.addClass(hasButtonBarClass);
		return this.set(buttons);
	},
	add: function (button) {
		var elements = this.qtip.elements,
			api = this.qtip;

		if (!elements.buttons) {
			return this.set([button]);
		}

		var btn;

		if (button.jquery) {
			btn = button;
		} else {
			btn = $('<button>' + button.text + '</button>');
			(this.classes && (typeof button.def == 'undefined' || button.def) && btn.addClass(this.classes));
			(button.classes && btn.addClass(button.classes));
			(button['attr'] && btn.attr(button['attr']));
			(button['prop'] && btn.attr(button['prop']));
			if (button.action) {

				var action = button.action;
				if (typeof action == 'string') {
					switch (action) {
						case 'close':
						case 'hide':
							action = function (e, api) {
								api.hide()
							};
							break;
						case 'cancel':
						case 'destroy':
							action = function (e, api) {
								api.destroy()
							};
							break;
						case 'submit':
						case 'reset':
							action = (function (method) {
								return function (e, api) {
									api.elements.content.find('form')[0][method]();
								}
							}(action));
							break;
						default:
							action = function () {};
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
		var elements = this.qtip.elements,
			self = this;

		(elements.buttons && elements.buttons.remove());
		if (elements.buttonbar && typeof buttons === 'object' && !$.isEmptyObject(buttons)) {
			elements.buttons = $('<div class="qtip-buttonbar-buttons"></div>').appendTo(elements.buttonbar);
			$.each(buttons, function () {
				self.add(this);
			});
		}

		return this;
	}
});


PLUGINS.buttons = function (api) {
	return new ButtonsBar(api);
};

PLUGINS.buttons.initialize = 'render';

CHECKS.buttons = {
	'^content.buttons$': function () {
		this.init(this.qtip.options.content.buttons);
	}
};

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