# qTip<sup>2</sup> - Options - Show

The show object defines what events trigger the tooltip to show on which elements, as well as the initial delay and several other properties.

<a name="target"></a>
## show.target

### Values
jQuery([]), false *(Default: false)*

### Overview
Defines the HTML element(s) which will trigger your specified (show.event(s))(#event). When set to false, the element the .qtip() method was called upon is used.

### Examples
This example will cause the first H1 element to show the tooltip when the [show.event](#event) is triggered (in this case mouseenter):

```js
$('.selector').qtip({
	content: {
		text: 'You moused over the first H1 element on the document.'
	},
	show: {
		target: $('h1:first')
	}
});
```

We can also cause the tooltip to open if multiple elements are moused over e.g. all header elements:

```js
$('.selector').qtip({
	content: {
		text: 'You moused over a header element'
	},
	show: {
		target: $('h1, h2, h3, h4')
	}
});
```

### See also
* [show.event](#event)

### Notes
* Setting a different show target **does not** effect the positioning, which is controlled via the [position.target](./position.md/#target) option.


<a name="event"></a>
## show.event

### Values
"String", false *(Default: "mouseenter")*

### Overview
Event(s) which will trigger the tooltip to be shown. All possible values are documented under jQuery's (Event bind())(http://docs.jquery.com/Events/bind#typedatafn) documentation.
Multiple, space separated events are supported.

### Examples
The below example will cause the tooltip to be shown when the target element is clicked:

```js
$('.selector').qtip({
	content: {
		text: 'I get shown on click'
	},
	show: {
		event: 'click'
	}
});
```

You can also specify multiple events using a space separated string. This example will make your tooltips appear when the [show.target](#target) is clicked or a mouseover occurs:

```js
$('.selector').qtip({
	content: {
		text: 'I get shown on click'
	},
	show: {
		event: 'click mouseenter'
	}
});
```

### See also
* [show.target](#target)

### Notes
* mouseenter is the non-bubbling version of mouseover, and is the preferred event to use.


<a name="delay"></a>
## show.delay

### Values
Integer *(Default: 90)*

### Overview
Time in milliseconds by which to delay showing of the tooltip when the [show.event](#event) is triggered on the [show.target](#target)

### Examples
This tooltip will only show after hovering the [show.target](#target) for 1000ms (1 second):

```js
$('.selector').qtip({
	content: {
		text: 'I have a longer delay then default qTips'
	},
	show: {
		delay: 1000
	}
});
```

### See also
* [show.target](#target)

### Notes
* This works much like the [hoverIntent plugin](http://cherne.net/brian/resources/jquery.hoverIntent.html) by Brian Cherne.*
* This property can cause problems on iOS devices such as the iPad and iPhone. [See here](http://craigsworks.com/projects/forums/thread-solved-ipad-show-delay-breaks-qtip-display) for a full discussion.



<a name="solo"></a>
## show.solo

### Values
jQuery([]), true, false *(Default: false)*

### Overview
Determines whether or not the tooltip will hide all others when the [show.event](#event) is triggered on the [show.target](#target). If a jQuery object is
used as its value, only tooltips found within that object will be hidden.

### Examples
Let's create a simple tooltip that hides all others when shown

```js
$('.selector').qtip({
	content: {
		text: 'You won\' see me with any other tooltips... I\'m too cool for that!'
	},
	show: {
		solo: true
	}
});
```

Or if for some reason we want to hide only a sub-set of the tooltips, we can define a parent common to them

```js
$('.selector').qtip({
	content: {
		text: 'I hide other tooltips when I\'m shown... booya!'
	},
	show: {
		solo: $('.qtips') // Hide tooltips within the .qtips element when shown
	}
});
```

### See also
* [show.target](#target)

### Notes
* In RC3 it was possible to specify which tooltips which should be hidden. This feature is slightly different in 2.0, allowing to specify only a common parent to those tooltips instead.


<a name="ready"></a>
## show.ready

### Values
true, false *(Default: false)*

### Overview
Determines whether or not the tooltip is shown as soon as it is bound to the element i.e. when the .qtip() call is fired. This is useful for tooltips
which are created inside event handlers, as without it they won't show up immediately.

### Examples
Create a tooltip that's shown on document load. This could be handy for things like step-by-step tutorials.

```js
$('.selector').qtip({
	content: {
		text: 'I\'m visible on page load'
	},
	show: {
		ready: true
	}
});
```

### See also
* [content.prerender](./content.md#prerender)
* [document.ready()](http://docs.jquery.com/Events/ready)

### Notes
* This option obeys your [show.delay](#delay) setting, so set it to zero if you want it to show instantly on page load!
* Enabling this option on multiple tooltips which are bound on document.ready or window.load, can slow down your page load times.


<a name="effect"></a>
## show.effect

### Values
function(){}, true, false *(Default: true)*

### Overview
Determines the type of effect that takes place when showing the tooltip. A custom method can also be used whose scope is the tooltip element when called. If set to false, no animation takes place.

### Examples
Let's create a tooltip that slides down when shown using a custom animation callback:

```js
$('.selector').qtip({
	content: {
		text: 'I slide in when shown, none of this fading business for me!'
	},
	show: {
		effect: function(offset) {
			$(this).slideDown(100); // "this" refers to the tooltip
		}
	}
});
```

### See also
* [hide.effect](./hide.md#effect)

### Notes
* By default a fadeIn animation takes place with a duration of 90ms.


<a name="modal"></a>
## show.modal

### Overview
Defines the tooltip's [modal](./plugins/modal.md) properties. See the [plugin documentation](./plugins/modal.md) for more information.