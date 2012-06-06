# qTip<sup>2</sup> - Plugins - Tips

The speech bubble tips plugin allows you to add nifty callout pointers to your tooltips. A wide range of options are available to style the tips, including height and width,
colour and orientation/position on the tooltip. They even adjust with your tooltip when [viewport adjustment](../position.md#viewport) is enabled!

<a name="elements"></a>
## Elements
When the tip plugin is in use on a tooltip, a new element becomes available within the API elements object, which references the newly created tip:

```js
$('.selector').qtip({
	content: {
		text: 'Tips plugin element'
	},
	events: {
		render: function(event, api) {
			// Grab the tip element
			var elem = api.elements.tip;
		}
	}
})
```

<a name="styling"></a>
## Styling
Styling the tip's background and border colours is done via CSS, not the options below. These are detected from the styles set on the *ui-tooltip-tip* element listed above. If
no valid style can be found for the background or border colour properties, qTip will look for styles on specific elements, depending on what it's looking for:

<a name="bordercolor"></a>
#### border-color
* ui-tooltip-tip element
* ui-tooltip-titlebar element - If present and tip overlaps
* ui-tooltip-content element

<a name="bgcolor"></a>
#### background-color
* ui-tooltip-tip element
* ui-tooltip-titlebar element - If present and tip overlaps
* ui-tooltip-content element
* ui-tooltip element

If no valid style can be found on any of these elements, the initially detected style of the *ui-tooltip-tip* element will be used. A notable exception to the inheritance is the [border](#border)
property, which can be used to override the detected CSS border-width.

--------------------

<a name="000000"></a>
### #000000 = Invalid style!
Since, by default, most browsers default to using pure black (rgb(0,0,0), #000 etc.) as the default colour, if qTip<sup>2</sup> detects
this it will look elsewhere for the styles as listed above. If you need to use pure black, the best work around is to use something very close
to it visually, such as rgb(0,0,1) or #000001.

--------------------

<a name="corner"></a>
## style.tip.corner

### Values
true, [&quot;Corner&quot;](../position.md#basics), false *(Default: true)*

### Overview
Defines where in relation to the **tooltip** the speech bubble tip is applied. Check-out the [positioning docs](../position.md#basics) for a full set of corner strings.

### Examples
Let's create a regular qTip with a tip whose corner is inherited from the [position.my](../position.md#my) option:

```js
$('.selector').qtip({
	content: {
		text: 'I have a nice little callout pointer... nifty huh?'
	},
	style: {
		tip: {
			corner: true
		}
	}
});
```

We can also manually specify a different corner like so (if [viewport adjustment](../position.md#viewport) is enabled, the tip position *will not* be adjusted):

```js
$('.selector').qtip({
	content: {
		text: 'I have a nice little callout pointer... nifty huh?'
	},
	style: {
		tip: {
			corner: 'left center'
		}
	}
});
```

### See also
* [position.viewport](../position.md#viewport)
* [position.my](../position.md#my)

### Notes
* When set to true, the tip position will be inherited from the [position.my](../position.md#my) property and adjusted automatically if [viewport adjustment](../position.md#viewport) is enabled.
* The positioning values of 'center' and 'center center' are not valid positioning values in this plugin.


<a name="mimic"></a>
## style.tip.mimic

### Values
[&quot;Corner&quot;](../position.md#basics), false *(Default: false)*

### Overview
Used in conjunction with [style.tip.corner](#corner), this option overrides what corner type is rendered. Specifying a [corner string](../position.md#basics) here will
cause the tip to render as this corner type, regardless of its position in relation to the tooltip.

You can also specify a single corner property e.g. &quot;left&quot; or &quot;center&quot;, which will cause the tip to inherit it's other properties from the corner string. This is
primarily useful when using mimic with the [position.viewport](../position.md#viewport) functionality.

### Examples
Let's create a qTip with a similar tip style to <a href="http://plugins.learningjquery.com/cluetip/demo/" target="_blank">ClueTip</a>, whose tip arrow is equilateral and placed toward the top of the tooltip.

```js
$('.selector').qtip({
	content: {
		text: 'I look very similar to a ClueTip tooltip in terms of my callout pointer.'
	},
	style: {
		tip: {
			corner: 'right top',
			mimic: 'right center'
		}
	}
});
```

As mentioned above, we can also use mimic with a single value too, to make for example the tip mimic 'center' and comply with viewport adjustment changes:

```js
$('.selector').qtip({
	content: {
		text: 'My tip will mimic the center style regardless of position or viewport adjustment!'
	},
	position: {
		viewport: $(window) // Adjust position to keep within the window
	},
	style: {
		tip: {
			corner: 'right top',
			mimic: 'center' // Single 'center' value here
		}
	}
});
```

### See also
* [style.tip.corner](#corner)

### Notes
* This option overrides the **presentation** of the tip only. It does **not effect the tips position!**


<a name="border"></a>
## style.tip.border

### Values
true, Integer *(Default: true)*

### Overview
This option determines the width of the border that surrounds the tip element, much like the CSS border-width property of regular elements. If a boolean true is passed,
the border width will be detected automatically based on the border-width of the side the tip falls on. See the [styling section](#styling) for more information on this.

### Examples
Let's create a qTip with a style to [Google Maps tooltips](http://maps.google.com), whose arrow blends with the border of the tooltip:

```js
$('.selector').qtip({
	content: {
		text: 'I look very similar to a Google Maps tooltip!'
	},
	style: {
		classes: 'ui-tooltip-light',
		tip: {
			corner: 'bottom center',
			mimic: 'bottom left',
			border: 1,
			width: 88,
			height: 66
		}
	}
});
```

### Notes
* Unlike qTip1 the tip border follows the normal CSS property and applies the border **outside** the element, not inside.
* See the [styling section](#styling) for more information on border-width detection


<a name="width"></a>
## style.tip.width

### Values
Integer *(Default: 6)*

### Overview
Determines the width of the rendered tip in pixels, in relation to the side of the tooltip it lies upon i.e. when the tip position is on the left or right, this quantity actually refers to
the tips height in visual terms, and vice versa.
							
### Examples
Let's make a tooltip with an elongated tip width

```js
$('.selector').qtip({
	content: {
		text: 'My callout pointer looks a bit wackier than usual'
	},
	style: {
		tip: {
			corner: true,
			width: 24
		}
	}
});
```

### See also
* [style.tip.height](#height)

### Notes
* Make sure this is a **number only**, don't include any units e.g. 'px'!
* [Prior to the **26th April 2012 nightly**, this was an absolute value](http://blog.craigsworks.com/qtip2-tips-plugins-dimension-options-changed/) i.e. it determined the width of the tooltipin relation to the window.
This was changed and you should update your code if you relied on this fact.


<a name="height"></a>
## style.tip.height

### Values
Integer *(Default: 6)*

### Overview
Determines the height of the rendered tip in pixels, in relation to the side of the tooltip it lies upon i.e. when the tip position is on the left or right, this quantity actually refers to
the tips width in visual terms, and vice versa.

### Examples
Let's make a tooltip with an elongated tip height

```js
$('.selector').qtip({
	content: {
		text: 'My callout pointer looks a bit wackier than usual'
	},
	style: {
		tip: {
			corner: true,
			height: 24
		}
	}
});
```

### See also
* [style.tip.width](#width)

### Notes
* Make sure this is a **number only**, don't include any units e.g. 'px'!
* [Prior to the **26th April 2012 nightly**, this was an absolute value](http://blog.craigsworks.com/qtip2-tips-plugins-dimension-options-changed/) i.e. it determined the height of the tooltipin relation to the window.
This was changed and you should update your code if you relied on this fact.


<a name="offset"></a>
## style.tip.offset

### Values
Integer *(Default: 0)*

### Overview
Determines the offset of the tip in relation to its current corner position.

### Examples
Say your tooltip is positioned at the bottom left of your target, but you want the tip shifted slightly to left instead of flush with the side of the tooltip:

```js
$('.selector').qtip({
	content: {
		text: 'My callout pointer looks a bit wackier than usual'
	},
	style: {
		tip: {
			corner: true,
			offset: 5 // Give it 5px offset from the side of the tooltip
		}
	}
});
```

### See also
* [style.tip.width](#width)
* [style.tip.height](#height)

### Notes
* This value is relative i.e. depending on which corner the tooltip is set it will behave differently.
* If your value is too large positioning problems can occur. Don't exceed a value equal to the height/width of the tooltip if possible.
* Negative values will only be applied to 'center' positioned tooltips e.g. top center, left center.