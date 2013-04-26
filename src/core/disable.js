PROTOTYPE.disable = function(state) {
	if(this.destroyed) { return this; }

	if('boolean' !== typeof state) {
		state = !(this.tooltip.hasClass(CLASS_DISABLED) || this.disabled);
	}

	if(this.rendered) {
		this.tooltip.toggleClass(CLASS_DISABLED, state)
			.attr('aria-disabled', state);
	}

	this.disabled = !!state;

	return this;
};

PROTOTYPE.enable = function() { return this.disable(FALSE); };

