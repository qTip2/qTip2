# qTip<sup>2</sup> - Global properties

This section covers qTips **global options**, which effect every qTip created on the page, both past and future.

<a name="version"></a>
## $.fn.qtip.version
Stores the version of qTip<sup>2</sup> library included on the page in the format "2.x.x".

<a name="defaults"></a>
## $.fn.qtip.defaults
Holds all the default qTip<sup>2</sup> values inherited by your .qtip() calls.

```js
$.fn.qtip.defaults = {
	prerender: false,
	id: false,
	overwrite: true,
	suppress: true,
	content: {
		text: true,
		attr: 'title',
		title: {
			text: false,
			button: false
		}
	},
	position: {
		my: 'top left',
		at: 'bottom right',
		target: false,
		container: false,
		viewport: false,
		adjust: {
			x: 0, y: 0,
			mouse: true,
			resize: true,
			method: 'flip flip'
		},
		effect: function(api, pos, viewport) {
			$(this).animate(pos, {
				duration: 200,
				queue: false
			});
		}
	},
	show: {
		target: false,
		event: 'mouseenter',
		effect: true,
		delay: 90,
		solo: false,
		ready: false,
		modal: {
			on: false,
			effect: true,
			blur: true,
			escape: true
		}
	},
	hide: {
		target: false,
		event: 'mouseleave',
		effect: true,
		delay: 0,
		fixed: false,
		inactive: false,
		leave: 'window',
		distance: false
	},
	style: {
		classes: '',
		widget: false,
		width: false,
		height: false,
		tip: {
			corner: true,
			mimic: false,
			width: 8,
			height: 8,
			border: true,
			offset: 0
		}
	},
	events: {
		render: null,
		move: null,
		show: null,
		hide: null,
		toggle: null,
		visible: null,
		focus: null,
		blur: null
	}
};
```

### Notes
* Take a look at the [Override defaults](http://craigsworks.com/projects/qtip2/tutorials/advanced#override) tutorial for details on how to edit this object properly.


<a name="nextid"></a>
## $.fn.qtip.nextid

### Overview
Determines the base numeric identifier assigned to future qTips. At document load this is set to *zero*, and is incremented for each successive qTip
created. This identifier is used to retrieve qTips by their corresponding 'id' attr in the form of &quot;ui-tooltip-*&lt;i&gt;*&quot;

### Examples
We can start our qTip ID at a higher number, such as 100:
```js
// Set the nextid global option
$.fn.qtip.nextid = 100;

/*
 * This qTip will have an ID of "ui-tooltip-100"
 * All qTips created after will have ID values greater than 100
 */
$('.selector').qtip({
	content: {
		text: 'My tooltip content'
	}
});
```

### See also
* [id option](./core.md#id)

### Notes
* This **MUST** be an *integer only!* If you want to assign a string as an identifier, check-out the individual [id option](./core.md#id).



<a name="inactiveEvents"></a>
## $.fn.qtip.inactiveEvents

### Value
["click", "dblclick", "mousedown", "mouseup", "mousemove", "mouseleave", "mouseenter"]

### Overview
An array of events which, when triggered on the qTip, cause it to become &quot;active&quot; i.e. no longer inactive, and reset the inactive timer
assigned to it (if any) by the defined [inactive](./hide.md#inactive) option.

### Examples
Let's create a tooltip which hides when it becomes inactive for 3 seconds, inactive in this case meaning when it isn't clicked.

```js
// Set tooltips to only become active when clicked
$.fn.qtip.inactiveEvents = ["click"];

// Create a tooltip that will hide after 3 seconds if it isn't clicked
$('.selector').qtip({
	content: {
		text: 'My tooltip content'
	},
	hide: {
		inactive: 3000
	}
});
```

### See also
* [hide.inactive](./hide.md#inactive)

### Notes
* This effects all qTips on the page, included those already created (but only if you happen to update a setting which cause the event handlers to be rebound).


<a name="zindex"></a>
## $.fn.qtip.zindex

### Values
Integer *(Default: 15000)*

### Overview
Determines the base z-index of all qTips on the page of which no qTip z-index will drop below.

### Examples
If you're using another plugin that happens to use a higher z-index than the qTip default, increase it a little:

```js
// Now your qTip's appear above the other plugin elements, yipeee!
$.fn.qtip.zindex = 20000;
```

### See also
* [modal.zindex](./plugins/modal.md#zindex)

### Notes
* Updating this option **after** you've already created some tooltips can have some pretty weird after-effects. Try to avoid it!