# qTip<sup>2</sup> - Options - Position

The position object defines various attributes of the tooltip position, including the element it is positioned in relation to, and when the position is adjusted within defined viewports.

## Basics

qTip utilises a special positioning system using corners. The basic concept behind it is pretty simple, in fact it turns out to be plain English when read aloud! For example, let's say we want to position **my** tooltips top left corner **at** the bottom right of my **target**. Simple enough... let's see the code involved in this:

```js
$('.selector').qtip({
	content: 'I\'m positioned using corner values!',
	position: {
		my: 'top left',  // Position my top left...
		at: 'bottom right', // at the bottom right of...
		target: $('.selector') // my target
	}
});
```

Notice how reading down the object you begin to see a logical plain English pattern emerge. Much easier than using x and y coordinates! Here's a diagram of all valid corner values for use with [position.my](#my) and  [position.at](#at) options as well as the tips plugin [corner](./plugins/tips.md#corner) and [mimic](./plugins/tips.md#styletipmimic) options.

<div style="text-align: center;">
![Corner string types](http://media2.juggledesign.com/qtip2/images/corners.jpg "Corner string types")
</div>

### Notes
* This system is heavily based upon the [jQuery UI Position plugin](http://docs.jquery.com/UI/Position)

---------------------------

<a name="target"></a>
## position.target

### Values
jQuery([ ]), [x, y], "mouse", "event", false *(Default: false)*

### Overview
HTML element the tooltip will be positioned in relation to. Can also be set to 'mouse' or the 'event' (position at target that triggered the tooltip), or an array containing an absolute x/y position on the page.

If you also have [position.adjust.mouse](#adjustmouse) set to true, the qTip will follow the mouse until a [hide event](./hide.md#hideevent) is triggered on the [hide.target](./hide.md#hidetarget)

### Examples
Let's position our tooltip in relation to the last LI element of the first UL element in our document:

```js
$('.selector').qtip({
	content: {
		text: 'I\'m positioned in relation to a different element'
	},
	position: {
		target: $('ul:first li:last')
	}
});
```

We can also position the tooltip **in relation to the mouse**, so that the tooltip is given the x/y coordinates of the mouse on show

```js
$('.selector').qtip({
	content: {
		text: 'I\'m positioned in relation to the mouse'
	},
	position: {
		target: 'mouse'
	}
});
```

It's also possible to position the same tooltip in relation to multiple targets using several hide/show targets. This is handy for situations where you need to use similar tooltips for several elements on the page.

```js
$('.selector').qtip({
	content: {
		text: 'I position to whatever show target triggered me.'
	},
	position: {
		target: 'event'
	},
	show: {
		target: $('.selector, .selectorTwo')
	},
	hide: {
		target: $('.selector, .selectorTwo')
	}
});
```

And last but not least, absolute positioning via an x/y array e.g. a tooltip at 10px from left and top of the page:

```js
$('.selector').qtip({
	content: {
		text: 'I\'m absolutely positioned, but still work with the viewport property!'
	},
	position: {
		target: [10, 10]
	}
});
```
### Notes
* Setting this to false causes the tooltip is positioned in relation to the element .qtip() was called upon.
* When using absolute positioning ([x, y]) the [Viewport plugin](#viewport) adjustment still works as expected.

### See also
* [position.viewport](#viewport)



<a name="my"></a>
## position.my

### Values
["Corner"](#basics), false *(Default: "top left")*

### Overview
The corner of the tooltip to position in relation to the [position.at](#at). See the [Basics section](#basics) for all possible corner values.

### Examples
Let's create a tooltip that's positioned to the left center of our target:

```js
$('.selector').qtip({
	content: {
		text: 'My center left corner is positioned next to my target'
	},
	position: {
		my: 'left center'
	}
});
```

### Notes
* See the [Basics section](#basics) for all possible corner values.

### See Also
* [position.at](#at)
* [position.target](#target)



<a name="at"></a>
## position.at

### Values
["Corner"](#basics), false  *(Default: "bottom right")*

### Overview
The corner of the [position.target](#target) element to position the tooltips corner at. See the [Basics section](#basics) for all possible corner values.

### Examples
Let's create a tooltip thats positioned to the top left of our target:

```js
$('.selector').qtip({
	content: {
		text: 'I\'m positioned as the top left of my target'
	},
	position: {
		at: 'top left'
	}
});
```

### Notes
* See the [Basics section](#basics) for all possible corner values.

### See Also
* [position.at](#at)
* [position.target](#target)


<a name="container"></a>
## position.container

### Values
jQuery([ ]), false *(Default:  document.body)*

### Overview
Determines the HTML element which the tooltip is appended to e.g. it's containing element.

### Examples
Let's append our tooltip to a custom 'tooltips' container:

```js
$('.selector').qtip({
	content: {
		text: 'I\'m appended within a custom tooltips DIV'
	},
	position: {
		container: $('div.tooltips')
	}
});
```

### Notes
* By default all tooltips are appended to the *document.body element*
* If the containing element has overflow set to anything other than "visible" this will confine the qTip's visibility to the containers boundaries.


<a name="viewport"></a>
## position.viewport

### Overview
Allows the tooltip to adjust it's position to keep within a set viewport element. See the [plugin documentation](./plugins/viewport.md) for more information.


<a name="effect"></a>
## position.effect

### Values
Function, false *(Default: see below)*

### Overview
Determines the type of effect that takes place when animating a tooltips position. A custom method can also be used, which is passed the
new position as one of its parameters, and whose scope is the tooltip element.

The default animation callback is:

```js
function(api, pos) {
	$(this).animate(pos, { duration: 200, queue: FALSE });
}
```

### Examples
Let's create a tooltip that slides into its position on screen with linear easing

```js
$('.selector').qtip({
	content: {
		text: 'When my position is updated I slide into place. Nifty huh?'
	},
	position: {
		effect: function(api, pos, viewport) {
			// "this" refers to the tooltip
			$(this).animate(pos, {
				duration: 600,
				easing: 'linear',
				queue: false // Set this to false so it doesn't interfere with the show/hide animations
			});
		}
	}
});
```

We can also disable the **default slide animation** by passing false:

```js
$('.selector').qtip({
	content: {
		text: 'I don\'t slide like the rest of them...'
	},
	position: {
		effect: false
	}
});
```


### Notes
* By default a custom, slide animation takes place using the custom function listed above.
* The use of the animation "queue" option eliminates the problem of hiding/showing tips whilst repositioning. This could have other side-effects, so enable if you run into problems



<a name="adjustx"></a>
## position.adjust.x

### Values
Integer *(Default: 0)*

### Overview
A positive or negative pixel value by which to offset the tooltip in the horizontal plane e.g. the x-axis. Negative values cause a reduction in the value e.g. moves tooltip to the *left*.

### Examples
Let's fine tune our tooltips position by offsetting it 10 pixels to the right:
```js
$('.selector').qtip({
	content: {
		text: 'My position is adjusted by 10px on the horizontal'
	},
	position: {
		adjust: {
			x: 10
		}
	}
});
```

### Notes
* Currently this option only supports pixel values. All other unit values are ignored

### See also
* [position.adjust.y](#adjusty)


<a name="adjusty"></a>
## position.adjust.y

### Values
Integer *(Default: 0)*

### Overview
A positive or negative pixel value by which to offset the tooltip in the vertical plane e.g. the y-axis. Negative values cause a reduction in the value e.g. moves tooltip *upwards*.

### Examples
Let's fine tune our tooltips position by offsetting it 12 pixels upwards:
```js
$('.selector').qtip({
	content: {
		text: 'My position is adjusted by -12px on the vertical'
	},
	position: {
		adjust: {
			y: -12
		}
	}
});
```

### Notes
* Currently this option only supports pixel values. All other unit values are ignored

### See also
* [position.adjust.x](#adjustx)


<a name="adjustmouse"></a>
## position.adjust.mouse

### Values
true, false *(Default: true)*

### Overview
When the [position.target](#target) is set to **mouse**, this option determines whether the tooltip  follows the mouse when hovering over the [show.target](./show.md#showtarget).

### Examples
Let's make a tooltip which follows our mouse when visible

```js
$('.selector').qtip({
	content: {
		text: 'I follow the mouse whilst I\'m visible. Weeeeee!'
	},
	position: {
		target: 'mouse',
		adjust: {
			mouse: true  // Can be omitted (e.g. default behaviour)
		}
	}
});
```

Alternatively, we can set it to false and make the tooltip assume the position of the mouse when shown, but ***not* follow it**, similar to how a right-click or "context" menu is positioned.

```js
$('.selector').qtip({
	content: {
		text: 'I\'m positioned under the mouse when first visible, but I stay here... very boring!'
	},
	position: {
		target: 'mouse',
		adjust: {
			mouse: false
		}
	}
});
```

### Notes
* Only applies when the [position.target](#target) is set to **mouse**

### See also
* [position.target](#target)


<a name="adjustresize"></a>
## position.adjust.resize

### Values
true, false *(Default: true)*

### Overview
Determines if the tooltips position is adjusted when the window is resized.

### Examples
Set this option to true to adjust the tooltips position when the window is resized:

```js
$('.selector').qtip({
	content: {
		text: 'If you resize your window while I\'m visible, I\'ll adjust my position accordingly.'
	},
	position: {
		target: $(document),
		adjust: {
			resize: true // Can be ommited (e.g. default behaviour)
		}
	}
});
```

Alternatively, set it to false to prevent its position being updated:

```js
$('.selector').qtip({
	content: {
		text: 'Sadly... I don\'t respond to window resize :('
	},
	position: {
		target: $(document),
		adjust: {
			resize: false
		}
	}
});
```

### See also
* [position.target](#target)


<a name="adjustmethod"></a>
## position.adjust.method

### Overview
Determines the type of [viewport positioning](./plugins/viewport.md) used. See the [plugin documentation](./plugins/viewport.md) for more information.