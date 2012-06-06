# qTip<sup>2</sup> - Options - Hide

The hide object defines what events trigger the tooltip to hide on which elements, as well as the initial delay and several other properties.

## Special events
qTip<sup>2</sup> implements some custom hide and show events for you so you don't have to code the manually. At the moment there's only one: **unfocus**. This event allows you to hide the
tooltip when anything other then the tooltip is clicked.

```js
$('.selector').qtip({
	content: {
		text: 'I\'ll hide when you click anywhere else on the document',
	},
	hide: {
		event: 'unfocus'
	}
});
```

**Note:** This is a qTip only event, *it will not work with any normal jQuery bind/live/delegate calls*.

--------------

<a name="target"></a>
## hide.target

### Values
jQuery([]), false *(Default: false)*

### Overview
Defines the HTML element(s) which will trigger your specified [hide.event](#event). When set to false, the element the .qtip() method was called upon is used.

### Examples
This example will cause the first H1 element to hide the tooltip when the [hide.event](#event) is triggered (in this case mouseleave):

```js
$('.selector').qtip({
	content: {
		text: 'You hovered over the first H1 element on the document. Well done you!',
	},
	hide: {
		target: $('h1:first')
	}
});
```

We can also cause the tooltip to close if multiple elements are moused over e.g. all header elements:

```js
$('.selector').qtip({
	content: {
		text: 'If you mouse over a header element, I\'ll hide!',
	},
	show: {
		ready: true
	},
	hide: {
		target: $('h1, h2, h3, h4')
	}
});
```

### See also
* [hide.event](#event)

### Notes
* Setting a different hide target **does not** effect the positioning, which is controlled via the [position.target](./position.md/#target) option.


<a name="event"></a>
## hide.event

### Values
"String", false *(Default: "mouseleave")*

### Overview
Event(s) which will trigger the tooltip to be hidden. All possible values are documented under jQuery's (Event bind())(http://docs.jquery.com/Events/bind#typedatafn) documentation.
Multiple, space separated events are supported.

### Examples
The below example will cause the tooltip to be hidden when the target element is clicked:

```js
$('.selector').qtip({
	content: {
		text: 'I get hidden on click',
	},
	hide: {
		event: 'click'
	}
});
```

You can also specify multiple events using a space separated string. This example will make your tooltips appear when the [hide.target](#target) is clicked or a mouseout occurs:

```js
$('.selector').qtip({
	content: {
		text: 'I get hidden on click or when you mouseout my hide.target',
	},
	hide: {
		event: 'click mouseleave'
	}
});
```

### See also
* [hide.target](#target)

### Notes
* *mouseleave* is the non-bubbling version of mouseout, and is the preferred event to use.


<a name="delay"></a>
## hide.delay

### Values
Integer *(Default: 0)*

### Overview
Time in milliseconds by which to delay hiding of the tooltip when the [hide.event](#event) is triggered on the [hide.target](#target)

### Examples
This tooltip will only hide after hovering the [hide.target](#target) for 1000ms (1 second):

```js
$('.selector').qtip({
	content: {
		text: 'I have a longer delay then default qTips',
	},
	hide: {
		delay: 1000
	}
});
```


<a name="inactive"></a>
## hide.inactive

### Values
Integer, false *(Default: false)*

### Overview
Time in milliseconds in which the tooltip should be hidden if it remains inactive e.g. isn't interacted with. If set to false, tooltip will not hide when inactive.

### Examples
Let's create a tooltip that shows on click, but hides only when inactive for 3 seconds:

```js
$('.selector').qtip({
	content: {
		text: 'I\'ll disappear after three seconds of inactivity... :(',
	},
	show: 'click',
	hide: {
		event: false,
		inactive: 3000
	}
});
```

### See also
* [inactiveEvents](./global.md#inactiveEvents)
* [hide.event](#event)

### Notes
* Inactivity is judged by the absense of any of the defined [inactive events](./global.md#inactiveEvents), which are a global property.
* In 1.0 the inactive event was applied via the [hide.event](#event) option and used the [hide.delay](#delay) to define the duration of inactivity needed.


<a name="fixed"></a>
## hide.fixed

### Values
true, false *(Default: false)*

### Overview
When set to **true**, the tooltip will not hide if moused over, allowing the contents to be clicked and interacted with.

### Examples
Create a tooltip with a link inside that can be moused over without hiding:

```js
$('.selector').qtip({
	content: {
		text: $['(Visit Google](http://google.com)'),
	},
	hide: {
		fixed: true
	}
});
```

### See also
* [hide.event](#event)

### Notes
* Adding a [hide delay](#delay) is generally done when this is enabled to give the user time to mouseover the tooltip before hiding
* Primarily for use in conjunction with mouseout and similar mouse-orientated hide events.


<a name="leave"></a>
## hide.leave

### Values
"window", false *(Default: "window")*

### Overview
Additional hide setting that allows you to specify whether the tooltip will hide when leaving the window it's contained within. This option
requires you to be using either mouseout or mouseleave as (one of) your hide events.

### Examples
This tooltip will not hide when you mouse out of the window e.g. tab to another window/tab or click a link that opens a new window.

```js
$('.selector').qtip({
	content: {
		text: 'I will not hide when you click the link I target (.selector)',
	},
	hide: {
		leave: false
	}
});
```

### See also
* [hide.event](#event)

### Notes
* **This only applies when using mouseout or mouseleave as (one of) your hide event(s)**


<a name="distance"></a>
## hide.distance

### Values
Integer, false *(Default: false)*

### Overview
This setting allows you to determine the distance after which the tooltip hides when the mouse is moved from the point it triggered the tooltip. This is what the
regular browser tooltips behave like.

### Examples
Let's mimic the regular browser tooltips by using the distance option and mouse settings:

```js
$('.selector').qtip({
	content: {
		text: 'I behave exactly like a regular browser tooltip',
	},
	position: {
		target: 'mouse', // Position at the mouse...
		adjust: { mouse: false } // ...but don't follow it!
	}
	hide: {
		distance: 15 // Hide it after we move 15 pixels away from the origin
	}
});
```

### See also
* [hide.event](#event)
* [show.target](./show.md#target)
* [position.target](./position.md#target)

### Notes
* The event itself is classed as a hide option, but the initial position of the mouse on the [show.target](./show.md#target) is what determines the coordinates used
to calculate the distance.


<a name="effect"></a>
## hide.effect

### Values
Function, true, false *(Default: true)*

### Overview
Determines the type of effect that takes place when hiding the tooltip. A custom method can also be used whose scope is the tooltip element when called. If set to false, no animation takes place.

### Examples
Let's create a tooltip that slides down when hidden using a custom animation callback:

```js
$('.selector').qtip({
	content: {
		text: 'I slide in when hidden, none of this fading business for me!'
	}
	hide: {
		effect: function(offset) {
			$(this).slideDown(100); // "this" refers to the tooltip
		}
	}
});
```

### See also
* [show.effect](./show.md#effect)

### Notes
* By default a fadeOut animation takes place with a duration of 90ms.