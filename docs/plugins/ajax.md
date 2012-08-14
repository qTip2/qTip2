# qTip<sup>2</sup> - Plugins - AJAX

The AJAX plugin extends your content options allowing you to use jQuery's built-in AJAX functionality to retrieve remote content.
This is especially useful in conjunction with the [Modal plugin](./modal.md) to create modal dialogues with minimal effort, such as login forms.

<a name="basics"></a>
## Basics
Let's start off with the basic [AJAX object](./#ajax), which is used by qTip for AJAX functionality:

```js
$('.selector').qtip({
	content: {
		text: 'Loading...', // The text to use whilst the AJAX request is loading
		ajax: {
			url: '/path/to/file', // URL to the local file
			type: 'GET', // POST or GET
			data: {} // Data to pass along with your request
		}
	}
});
```

What you see above is the very basic setup for an AJAX call using qTip. The AJAX object itself is simply an embedded version of the same object used
in the original [jQuery.ajax](http://api.jquery.com/jQuery.ajax) call.

qTip<sup>2</sup> will automatically take the response from the request and set the [content.text](../content.md#text) for you if you don't override the default success handler.
However, if you intend on using your own [success callback](http://api.jquery.com/jQuery.ajax), you'll need to set it yourself using the [set](../api.md#set) method i.e.

```js
$('.selector').qtip({
	content: {
		text: 'Loading...', // The text to use whilst the AJAX request is loading
		ajax: {
			url: '/path/to/file', // URL to the local file
			type: 'GET', // POST or GET
			data: {}, // Data to pass along with your request
			success: function(data, status) {
				// Process the data

				// Set the content manually (required!)
				this.set('content.text', data);
			}
		}
	}
});
```
**Note:** Access to the API inside $.ajax callbacks is achieved via the 'this' variable e.g. this.set(), as opposed to it being passed as an argument like in the API
[events](../events.md).

**Note:** If you wish to simply filter the returned content before it gets set as the content, use the [dataFilter](http://api.jquery.com/jQuery.ajax/) callback.

<a name="html"></a>
## HTML
Now that we know how to setup our basic AJAX call, let's look at the different types of data that can be returned, and how to deal with them. First up is the HTML content.
This is the simplest of the lot, since the HTML is simply appended to the tooltip contents.

All you have to do is supply the URL and request type, as well as any data you need to send along with the request, and the returned data automatically replaces the tooltip contents.
If an error occurs during the response, the tooltip contents are replaced with a description of the error that occurred.

<a name="json"></a>
## JSON
Nowadays the preferred method to return data from an AJAX request is via [JSON](http://www.json.org), or *J*ava*S*cript *O*bject *N*otation. This is
basically a fancy way of saying a JavaScript object.

Many popular server-side languages such as [Ruby](http://ruby-lang.org) and [PHP](http://php.net) provide ways of encoding their native data structures into JSON syntax.
Once you have your JSON being spat out correctly (example below), take a look at how to retrieve and use the JSON using qTip:

<div class="left">
```js
/* JSON string returned by the server */
{
	"person": {
		"firstName": "Craig",
		"lastName": "Thompson",
		"gender": "Male",
		"dob": "14/09/19??",
		"country": "United Kingdom"
	},
	"job": {
		"title": "Web Developer",
		"company": "craigsworks",
		"since": 2007
	},
	"specialities": [
		"JavaScript", "jQuery", "CSS",
		"(X)HTML", "PHP", "MySQL"
	]
}
```
</div>

<div class="right">
```js
/* qTip2 call below will grab this JSON and use the firstName as the content */
$('.selector').qtip({
	content: {
		text: 'Loading...', // Loading text...
		ajax: {
			url: '/path/to/file', // URL to the JSON script
			type: 'GET', // POST or GET
			data: { id: 3 }, // Data to pass along with your request
			dataType: 'json', // Tell it we're retrieving JSON
			success: function(data, status) {
				/* Process the retrieved JSON object
				 *    Retrieve a specific attribute from our parsed
				 *    JSON string and set the tooltip content.
				 */
				var content = 'My name is ' + data.person.firstName;

				// Now we set the content manually (required!)
				this.set('content.text', content);
			}
		}
	}
});
```
</div>

As you can see, processing the data is very simple. We take the parsed JSON string returned from the server, use its attributes to create the
new [content](../content.md#text) of the tooltip, and call the API's [set](../api.md#set) method to replace the tooltip contents with it. Easy peasy!

**Note:** Unfortunately, the [dataFilter](http://api.jquery.com/jQuery.ajax) callback cannot be used to filter the JSON **object** like in the [HTML](#html) example above, only the unparsed JSON **string**.

-------------------------

<a name="ajax"></a>
## content.ajax

### Values
{ Object }, false *(Default: false)*

### Overview
This option allows you specify a regular [jQuery.ajax](http://api.jquery.com/jQuery.ajax/) object. This object is used in the $.ajax method and the retrieved content is used for the tooltips content.

### Examples
Let's grab some simple HTML content from a file as our tooltip contents:

```js
$('.selector').qtip({
	content: {
		ajax: {
			url: 'tooltipContent.html'
		}
	}
});
```

We can also use the content.text to specify a loading image whilst we wait for the AJAX request to complete:

```js
$('.selector').qtip({
	content: {
		text: '<img src="images/loading.gif" alt="Loading..." />',
		ajax: {
			url: 'tooltipContent.html'
		}
	}
});
```

### See also
* [content.text](../content.md#text)

### Notes
* Before the AJAX content loads, regular content.text/attr options are used for the tooltip content.


<a name="once"></a>
## content.ajax.once

### Values
true, false *(Default: true)*

### Overview
Allows you specify whether or not the AJAX content is retrieved **each time the tooltip is shown** or just once when rendered.

### Examples
Perhaps we want to retrieve some frequently updated details about member each time the tooltip is shown:

```js
$('.selector').qtip({
	content: {
		ajax: {
			url: 'members.php',
			data: { id: 4 },
			once: false // Re-fetch the content each time I'm shown
		}
	}
});
```

### Notes
* This option an extension of the regular [jQuery.ajax](http://api.jquery.com/jQuery.ajax/) object and **is not** a core jQuery.ajax option. It will only work with qTip<sup>2</sup>!


<a name="loading"></a>
## content.ajax.loading

### Values
true, false *(Default: true)*

### Overview
This option allows you whether or not the tooltip will be shown whilst content is being loaded via AJAX i.e. whether or not it is visible **before the content is loaded**.

### Examples
To hide the tooltip whilst the initial content is loaded, set it to false

```js
$('.selector').qtip({
	content: {
		text: 'This text won\'t be shown!',
		ajax: {
			url: 'mycontent.html',
			loading: false
		}
	}
});
```

### See also
* [content.text](../content.md#text)

### Notes
* Even though the content.text will not be used, it must be set to something valid i.e. non-blank, so that the qTip will be considered valid and rendered.
* This option an extension of the regular [jQuery.ajax](http://api.jquery.com/jQuery.ajax/) object and **is not** a core jQuery.ajax option. It will only work with qTip<sup>2</sup>!