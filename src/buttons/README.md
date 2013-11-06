# qTip2 ButtonBar Plugin #

## Usage  ##
	var modal = $('<div/>').qtip({
		content: {
			text: $('form'),
			title: 'Modal Test',
			button: true,
			buttons: [
				{
					text: 'Ok',
					action: 'close'
				}
			]
		},
		position: {
			my: 'center',
			at: 'center',
			target: $(document.body)
		},
		show: {
			modal: {
				on: true
			}
		},
		hide: false
	}).data('qtip');
	modal.show()

## content.buttons (object) ##
    qTipApi.set('content.buttons', true); // Show button bar (no buttons)
    qTipApi.set('content.buttons', false); // Remove button bar 
    
    qTipApi.set('content.buttons', [
     {
     	text: 'Close',
		action: 'hide'
     },
     $('<button>Custom Button</button>')
    ]); // Show button bar with content

## Button Proprietes ##
`text`: `(string)` Button text

`action`: `(function|string)`. Function called with 2 arguments `[event, qTipApi]`. Or action behaviors:

- `close|hide` - hide tooltip
- `cancel|destroy` - destroy tooltip
- `submit` - submit first form in tooltip content
- `reset` - reset first form in tooltip content

`classes`: `(string)` The list of classes that will be added to the button (separated by spaces)

`attr`: `(object)` The list of attributes that will be added to the button (example: `{name: 'button_name'}`)

`prop`: `(object)` The list of properties that will be applied to a button (example: `{disabled: true}`)

`def`: `(bool)` By setting FALSE - ignores the default classes

## style.buttons.classes ##
Classes are added to all buttons. Deafult: `btn`

    $('.selector').qtip({
    	content: {
    		text: 'Content'
    	},
    	style: {
    		buttons: {
    		classes: 'button button-default'
    		}
    	}
    });

## Full Example ##
    <form>
    	<p>test</p>
    	Test: <input><br>
    	Check: <input type="checkbox">
    
    	<p style="display:none">
    		<button type="submit">Submit</button>
    	</p>
    </form>
    
    <script>
    	var modal = $('<div/>').qtip({
    		content: {
    			text: $('form'),
    			title: 'Modal Test',
    			button: true,
    			buttons: [
    				{
    					text: 'Send',
    					action: 'submit'
    				},
    				{
    					text: 'Reset',
    					action: 'reset'
    				},
    				{
    					text: 'Alert',
    					action: function (e, api) {
    						alert(api.get('content.title'))
    					}
    				},
    				{
    					text: 'Cancel',
    					action: 'destroy'
    				}
    			]
    		},
    		position: {
    			my: 'center',
    			at: 'center',
    			target: $(document.body)
    		},
    		show: {
    			modal: {
    				on: true
    			}
    		},
    		hide: false
    	}).data('qtip');
    	modal.show()
    </script>

