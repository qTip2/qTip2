# qTip<sup>2</sup> - Plugins - Modal

The modal plugin allows you to create tooltips which 'dim' the rest of the page when shown, drawing users attention. This is quite useful as a  simple replacement for plugins such as
[ThickBox](http://jquery.com/demo/thickbox/) and [jQuery UI Dialog](http://jqueryui.com/demos/dialog/)

<a name="elements"></a>
## Elements
When the modal plugin is in use on a tooltip, a new element becomes available within the API elements object, which references the overlay element used to dim the page:
	
```js
$('.selector').qtip({
	content: {
		text: 'Modal plugin element'
	},
	events: {
		render: function(event, api) {
			// Grab the overlay element
			var elem = api.elements.overlay;
		}
	}
})
```

<a name="z-index"></a>
## z-index property
When a qTip utilises the modal plugin (by setting [show.modal.on](#on) to **true**) a separate z-index is applied from that of normal, non-modal qTips to prevent
overlapping issues. The default z-index of modal qTips is simply 200 less than that of regular non-modals:

```js
$.fn.qtip.zindex = 15000; // Non-modal z-index
$.fn.qtip.plugins.modal.zindex = 14800; // Modal-specific z-index
```

When overriding the normal z-index property, be sure to change the modal-specific one too, but keep in mind you'll need to set it to a value **lower than the non-modal property!**
Otherwise you'll run into funny problems with overlapping when using several different tooltips.


<a name="css"></a>
## CSS
To dim the page, the modal plugin uses fullscreen div element. You can modify the colour and other attributes of the overlay in your jquery.qtip.css CSS file.
Here's the default settings for the 'overlay' element:

```css
#qtip-overlay{
	position: fixed;
	left: -10000em;
	top: -10000em;
}

	/* Applied to modals with show.modal.blur set to true */
	#qtip-overlay.blurs{ cursor: pointer; }

	/* Change opacity of overlay here */
	#qtip-overlay div{
		position: absolute;
		left: 0; top: 0;
		width: 100%; height: 100%;

		background-color: black;

		opacity: 0.7;
		filter:alpha(opacity=70);
		-ms-filter:"progid:DXImageTransform.Microsoft.Alpha(Opacity=70)";
	}
```

If this isn't already present in your CSS file you'll need to add it manually.

**Note:** If you need to adjust the **opacity** of the overlay, change the inner div's properties, *not the #qtip-overlay element*.

----------------------

## Global properties

<a name="modal-zindex"></a>
### $.fn.qtip.plugins.modal.zindex

#### Value
14800

#### Overview
Determines the base z-index of all modal qTips on the page of which no modal qTip z-index will drop below.

#### Examples
If you're using another plugin that happens to use a higher z-index than the default, increase it a little:
```js
// Now your qTip's appear above the other plugin elements, yipeee!
$.fn.qtip.plugins.modal.zindex = 20000;
```

#### See also
* [$.fn.qtip.zindex](../global.md#zindex)

#### Notes
* Try to make sure this value stays below that of the [$.fn.qtip.zindex](../global.md#zindex) property to prevent rendering issues.
* Updating this option **after** you've already created some tooltips can have some pretty weird after-effects!


<br />
<a name="modal-focusable"></a>
### $.fn.qtip.plugins.modal.focusable

#### Value
['a[href]', 'area[href]', 'input', 'select', 'textarea', 'button', 'iframe', 'object', 'embed', '[tabindex]', '[contenteditable]']

#### Overview
An array of selectors used to determine which elements are considered "focusable" within the tooltip, for use with the [stealfocus](#stealfocus) option.

#### See also
* [modal.stealfocus](#stealfocus)

----------------------

<a name="on"></a>
## show.modal.on

### Values
true, false *(Default: false)*

### Overview
Determines whether or not the tooltip is 'modal' e.g. dims the rest of the page when shown.

### Examples
Let's make a really quick login form that dims the rest of our page and is centered on screen

```js
$('.selector').qtip({
	content: {
		text: $('#LoginForm')
	},
	position: {
		my: 'center',
		at: 'center',
		target: $(document.body)
	}
	show: {
		modal: {
			on: true
		}
	}
});
```

We can also use some [shorthand notation](http://craigsworks.com/projects/qtip2/tutorials/#shorthand) instead:

```js
$('.selector').qtip({
	content: {
		text: $('#LoginForm')
	},
	position: {
		my: 'center',
		at: 'center',
		target: $(document.body)
	}
	show: {
		modal: true // Omit the object and set ti to true as short-hand
	}
});
```

### See also
* [Blanket CSS properties](#css)

### Notes
* To dim the page a fullscreen translucent div is used, so all controls with a z-index lower than that of the blanket, as defined in your CSS file,
will appear below and will be un-interactable whilst the blanket is visible.


## show.modal.blur

### Values
true, false *(Default: true)*

### Overview
Determines whether or not clicking on the dimmed background of the page hides the tooltip and removes the dim. When enabled the overlay element has a 'blurs' class applied to it.

### Examples
Let's modify our login tooltip so you can only hide the tooltip by clicking the title button or hitting escape:

```js
$('.selector').qtip({
	content: {
		text: $('#LoginForm'),
		title: {
			text: 'Login',
			button: true
		}
	},
	position: {
		my: 'center',
		at: 'center',
		target: $(document.body)
	}
	show: {
		modal: {
			on: true,
			blur: false
		}
	}
});
```

### See also
* [Blanket CSS properties](#css)

### Notes
* When enabled the [overlay element](#element) has a 'blurs' class applied to it. See [CSS](#css) section for more details.
* To dim the page a fullscreen translucent div is used, so all controls with a z-index lower than that of the blanket, as defined in your CSS file,
will appear below and will be un-interactable whilst the blanket is visible.


<a name="escape"></a>
## show.modal.escape

### Values
true, false *(Default: true)*

### Overview
Determines whether or not hitting the escape key will hide the tooltip.

### Examples
Let's modify our login tooltip so you can only hide it by clicking the title button:

```js
$('.selector').qtip({
	content: {
		text: $('#LoginForm'),
		title: {
			text: 'Login',
			button: true
		}
	},
	position: {
		my: 'center',
		at: 'center',
		target: $(document.body)
	}
	show: {
		modal: {
			on: true,
			blur: false,
			escape: false
		}
	}
});
```

### See also
* [Blanket CSS properties](#css)

### Notes
* You must have the window focused for the keyboard event to be detected properly


## show.modal.stealfocus

### Values
true, false *(Default: true)*

### Overview
Determines whether or not users can focus inputs and elements outside of the tooltip when visible. Elements that gain focus outside the tooltip
when this is enabled will be immediately blured and focus restored to the first focusable element within the tooltip.

Elements within the tooltip that are considered "focusable" are determined by the array of selectors in the [$.fn.qtip.modal.focusable](#focusable) property.

### See also
* [$.fn.qtip.modal.focusable](#focusable)


## show.modal.effect

### Values
function() {}, true, false *(Default: true)*

### Overview
Determines the type of effect that takes place when showing and hiding the modal overlay. A custom method can also be used whose scope is the overlay element when called.
If set to false, no animation takes place. If set to true, a default a fadeIn animation takes place with a duration of 90ms.

### Examples
Let's create a modal tooltip whos overlay fades in to a custom opacity

```js
$('.selector').qtip({
	content: {
		text: 'I\'m a model tooltip with a custom overlay opacity'
	}
	show: {
		modal {
			on: true,
			effect: function(state) {
				/*
					"state" determines if its hiding/showing
					"this" refers to the overlay
					0.4 and 0 are the show and hide opacities respectively.
				*/
				$(this).fadeTo(90, state ? 0.4 : 0, function() {
					if(!state) { $(this).hide(); }
				});
			}
		}
	}
});
```

### Notes
* By default a fadeIn animation takes place with a duration of 90ms.