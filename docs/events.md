# qTip<sup>2</sup> - Events

The events object determines the initial event handlers which are bound to the tooltip.

<a name="binding"></a>
## Binding
The API triggers several special events (detailed below) that allow you to bind multiple event handlers to a single qTip and react to certain events. For example,
we can bind an event handler that will detect when the tooltip is moved, and update a div element with the tooltip coordinates:

```js
$('.selector').qtip({
	content: 'When I move I update coordinates on the page!',
	events: {
		move: function(event, api) {
			$('#coords').text( event.pageX + '/' + event.pageY );
		}
	}
});
```

That's great! Simple and easy to integrate. However, what if we need want to not only to update the coordinates, but integrate say, another plugin with the qTip? One
that might be in a different file and hard to call within our existing move callback?

```js
$('.selector').qtip({
	content: 'When I move I update coordinates on the page!',
	events: {
		/*
		 * Since your qTip will likely have prerender set to false, we'll bind within the render event
		 * so we're certain the tooltip is actually rendered before binding our handlers.
		 */
		render: function(event, api) {
			// Grab the tooltip element from the API elements object
			var tooltip = api.elements.tooltip;

			// Notice the 'tooltip' prefix of the event name!
			tooltip.bind('tooltipmove', function(event, api) {
				anotherPlugin.update(event); // Update our other plugin and pass our event object
			});

		},
		// Regular old move option still applies
		move: function(event, api) {
			$('#coords').text( event.pageX + '/' + event.pageY );
		}
	}
});
```

Awesome! Binding multiple events is just as simple, and can be used on all the events listed below. Just make sure to **prepend your event name with *tooltip***
when binding events manually.


<a name="preventDefault"></a>
## event.preventDefault()

As is the case with regular events in JavaScript, you can use the event.preventDefault(); to prevent the default event from occurring. For example, within
a show event it will stop the tooltip from showing:

```js
$('.selector').qtip({
	content: 'I won\'t show because one of my show event handlers returns false!',
	show: 'mousedown',
	events: {
		show: function(event, api) {
			event.preventDefault(); // Stop it!
		}
	}
});
```

This can be handy if you need some conditional logic that determines if the tooltip should show or not. Also be aware that
**any of the event handlers can stop the default action**, not just the first one bound.


<a name="originalEvent"></a>
## event.originalEvent

All of the events below are passed an event object as their first argument. Within this event object is another object
called originalEvent. This contains the event that triggered the callback, and can be used for special event detection, such as right-clicks:

```js
$('.selector').qtip({
	content: 'Right-click to open me!',
	show: 'mousedown',
	events: {
		show: function(event, api) {
			// Only show the tooltip if it was a right-click
			if(event.originalEvent.button !== 2) {
				event.preventDefault();
			}
		}
	}
});
```

-----------

<a name="render"></a>
## events.render

### Overview
Fired when the tooltip is rendered

```js
$('.selector').qtip({
	content: {
		text: 'My tooltip content'
	},
	events: {
		render: function(event, api) {
			$('.cartTotal').triggerHandler('update');
		}
	}
});
```

### Examples
Update another element e.g. a cart total, when this tooltip is rendered

### See also
* [prerender](./core.md#prerender)
* [show.ready](./show.md#ready)

### Notes
* The rendering process cannot be interrupted using the [event.preventDefault()](#preventDefault) described above.
* This event is triggered only once during the lifetime of a single qTip.



<a name="show"></a>
## events.show

### Overview
Fired when the tooltip is shown either by the library itself, or by the user calling the appropriate [toggle](./api.mdmethods/#toggle) or [show](./api.mdmethods/#show) API methods.

### Examples
Lets hide another element whenever this tooltip is shown

```js
$('.selector').qtip({
	content: {
		text: 'I hide another element when shown...'
	},
	events: {
		show: function(event, api) {
			$('.hideMe').hide();
		}
	}
});
```

### See also
* [Show options](./show.md)

### Notes
* Using [event.preventDefault()](#preventDefault) described above, will prevent the tooltip from showing.



<a name="hide"></a>
## events.hide

### Overview
Fired when the tooltip is hidden either by the library itself, or by the user calling the appropriate [toggle](./api.mdmethods/#toggle) or [hide](./api.mdmethods/#hide) API methods.

### Examples
Lets show another element whenever this tooltip is hidden

```js
$('.selector').qtip({
	content: {
		text: 'I cause another element to show when I\'m hidden...'
	},
	events: {
		hide: function(event, api) {
			$('.showMe').show();
		}
	}
});
```

### See also
* [Hide options](./hide.md)

### Notes
* Using [event.preventDefault()](#preventDefault) described above, will prevent the tooltip from hiding.




<a name="toggle"></a>
## events.toggle

### Overview
Fired when the tooltip is toggled i.e. shown or hidden, by the user calling the appropriate [toggle](./api/methods.md#toggle) or [hide](./api/methods.md#hide) API methods.
This is a shortcut method for binding to both [tooltipshow](#show) and [tooltiphide](#hide) events above.

### Examples
We can utilise this hide &amp; show shortcut to implement addition/removal of particular properties like classes without duplicating code:

```js
$('.selector').qtip({
	content: {
		text: 'I toggle a class on my target element when shown or hidden!'
	},
	events: {
		toggle: function(event, api) {
			api.elements.target.toggleClass(event.type === 'tooltipshow');
		}
	}
});
```

### See also
* [Show options](./show.md)
* [Hide options](./hide.md)

### Notes
* **There is no tooltiptoggle event**! This is a shortcut for binding to both [tooltipshow](#show) and [tooltiphide](#hide).
* Using [event.preventDefault()](#preventDefault) described above, will prevent the tooltip from showing/hiding, depending on the event type being triggered.



<a name="visible"></a>
## events.visible

### Overview
Fired when the tooltip becomes visible i.e. immediately after the [show.effect](./show.md#effect) has finished and the qTip is visible and has dimensions. This
is most useful for plugins and code which requires the tooltip to have layout, that is to be visible and have dimensions, if it is to function correctly.

Because this event is fired **after** the tooltip is already shown, the [event.preventDefault()](#preventDefault) call will do nothing within this event, since it
is already shown when this event is triggered.

### Examples
Let's output the dimensions of tooltip once it becomes visible:

```js
$('.selector').qtip({
	content: {
		text: 'I hide another element when shown...'
	},
	events: {
		visible: function(event, api) {
			$('.selector').hide();
		}
	}
});
```

### See also
* [Show event](#show)
* [Show options](./show.md)

### Notes
* This is distinct from the [show event](#show) since it is fired *after* the show animation is complete, not before.
* Because of the above, the [event.preventDefault()](#preventDefault) call will do nothing within this event, since it is already shown when this event is triggered


<a name="hidden"></a>
## events.hidden

### Overview
Fired when the tooltip becomes hidden i.e. immediately after the [hide.effect](./hide.md#effect) has finished, the qTip is hidden (display:none). This
is most useful for plugins and code which requires the tooltip to be completely hidden, if it is to function correctly.

Because this event is fired **after** the tooltip is already hidden, the [event.preventDefault()](#preventDefault) call will do nothing within this event, since it
is already hidden when this event is triggered.

### Examples
Let's output the dimensions of tooltip once it becomes hidden:

```js
$('.selector').qtip({
	content: {
		text: 'I show another element when hidden...'
	},
	events: {
		hidden: function(event, api) {
			$('.selector').show();
		}
	}
});
```

### See also
* [Hide event](#hide)
* [Hide options](./hide.md)

### Notse
* This is distinct from the [hide event](#hide) since it is fired *after* the hide animation is complete, not before.
* Because of the above, the [event.preventDefault()](#preventDefault) call will do nothing within this event, since it is already shown when this event is triggered.


<a name="move"></a>
## events.move

### Overview
Fired when the tooltip is repositioned, either by the library itself, or when the user calls the [reposition](./api/methods.md#reposition) API method.

### Examples
Let's update another qTips position, whose position target is actually inside this tooltip.

```js
$('.selector').qtip({
	content: {
		text: 'When I move, I update all qTips who are positioned in relation to me!'
	},
	events: {
		move: function(event, api) {
			// For more information on the API object, check-out the API documentation
			api.elements.content.find('.hasTooltip').qtip('update');
		}
	}
});
```

### See also
* [Position options](./position.md)

### Notes
* Using [event.preventDefault()](#preventDefault) described above, will prevent the tooltips position from being updated.


<a name="focus"></a>
## events.focus

### Overview
Fired when the tooltip is focused i.e. most recently displayed or moused over, either by the library itself or the [focus](./api/methods.md#focus) API method.

### Examples
Lets create a qTip whose colour is changed when focused.

```js
$('.selector').qtip({
	content: {
		text: 'When I gain focus over the other qTips, my colour changes!'
	},
	events: {
		focus: function(event, api) {
			// For more information on the API object, check-out the API documentation
			api.elements.tooltip.toggleClass('ui-tooltip-blue ui-tooltip-cream');
		}
	}
});
```

### See also
* [Blur event](#blur)

### Notes
* Using [event.preventDefault()](#preventDefault) described above, will prevent the tooltip from becoming focused.


<a name="blur"></a>
## events.blur

### Overview
Fired when the tooltip loses focus i.e. another tooltip becomes focused (see above) by the library itself or the [focus](./api/methods.md#focus) API method.

### Examples
	Lets create another qTip whose colour is changed when it loses focus, similar to the example above.
	
```js
$('.selector').qtip({
	content: {
		text: 'When I lose focus to another qTip, my colour changes!'
	},
	events: {
		blur: function(event, api) {
			// For more information on the API object, check-out the API documentation
			api.elements.tooltip.toggleClass('ui-tooltip-blue ui-tooltip-cream');
		}
	}
});
```

### See also
* [Focus event](#focus)

### Notes
* The blurring process cannot be prevented using the [event.preventDefault()](#preventDefault) described above.