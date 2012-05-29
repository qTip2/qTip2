# Content

## content.text

### Values
function(), jQuery([ ]), "String", true *(Default: true)*

### Overview
Text/HTML which will appear inside the tooltip initially. If set to *true* the title attribute of the target will be used, if available. Can also specify
an anonymous function that returns the content, and whose scope is the target element.


### Examples
This will create a default tooltip with the content 'My tooltip content'

```js
$('.selector').qtip({
	content: {
		text: 'My tooltip content'
	}
});
```

We can also use another jQuery element as the tooltip content:

```js
$('.selector').qtip({
	content: {
		text: $('.selector2') // Add .clone() if you don't want the matched elements to be removed, but simply copied
	}
});
```

We can also use a custom function to retrieve special attributes from the target element:

```js
$('.selector').qtip({
	content: {
		text: function(api) {
			// Retrieve content from custom attribute of the $('.selector') elements.
			return $(this).attr('qtip-content');
		}
	}
});
```

### Notes
* If no valid content can be detected in both this and the below [content.attr](#contentattr) option, no tooltip will be rendered.
* Custom functions that return no valid content **will still cause the tooltip to be created**! Replace these with an [each()](http://api.jquery.com/each/) loop if this is not the desired behaviour.

### See also
* [content.title.text](#contenttitletext)


## content.attr

### Values
"String" *(Default: "title")*

### Overview
Attribute of the target element to use for content if none is provided with the above [content.text](#contenttext) option, or no valid content can be found.


### Examples
Let's create qTip's on all images whose content is provided by the elements ALT attribute

```js
$('img[alt]').qtip({
	content: {
		attr: 'alt'
	}
});
```

This is useful for image galleries and other image-oriented sites that need to provide nice visual cues of their context.

### Notes
* If no valid content is found within the elements attribute, and [content.text](#contenttext) is not defined, no tooltip will be rendered.

### See also
* [content.text](#contenttext)


## content.title.text

### Values
function(), jQuery([ ]), "String", false *(Default: false)*

### Overview
Text/HTML which will appear inside the title element of the content. If set to false, no title will be created. An anonymous function can also be used to return
the title text, whose scope is the target element.

### Examples
Create an "About me" tooltip with a title to indicate what the contents are about:

```js
$('.selector').qtip({
	content: {
		text: 'I really like owls!',
		title: {
			text: 'About me'
		}
	}
});
```

We can also use another jQuery element as the tooltip title:

```js
$('.selector').qtip({
	content: {
		title: {
			text: $('.selector2') // Add .clone() if you don't want the matched elements to be removed, but simply copied
		}
	}
});
```

We can also use a custom function to return the title text:

```js
$('.selector').qtip({
	content: {
		text: 'Custom title text functions... hoorah!',
		title: {
			text: function(api) {
				// Retrieve content from ALT attribute of the $('.selector') element
				return $(this).attr('alt');
			}
		}
	}
});
```

### Notes
* If no valid content is provided, the title will not be created.
* Custom functions that return no valid content **will still cause the tooltip to be created**! Replace these with an [each()](http://api.jquery.com/each/) loop if this is not the desired behaviour.

### See Also
* [content.text](#contenttext)



## content.title.button

### Values
jQuery([ ]), "String", true *(Default: false)*

### Overview
Text/HTML which will appear inside the title's button element (e.g. close link) located to the right of the title content. The button will close the tooltip when clicked.

### Examples
Create another "About me" tooltip which opens on click and only hides when the title button is clicked

```js
$('.selector').qtip({
	content: {
		text: 'I really like owls!',
		title: {
			text: 'About me',
			button: 'Close'
		}
	},
	hide: {
		event: false
	}
});
```

### Notes
* Button only appears if a title is present e.g. [title.text](#contenttitletext) is defined and valid.
* If no valid content is provided, the button will not be created.


## content.ajax

### Overview
Defines the tooltip's [AJAX](./plugins/ajax.md) content properties. See the [plugin documentation](./plugins/ajax.md) for more information.