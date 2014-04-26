'use strict';

var defaultTasks = ['concat', 'uglify', 'cssmin', 'replace'];
function alias(basic) {
	var start = (basic = basic === true) ? 1 : 0;
	
	return [basic ? 'init:basic' : 'init'].concat( 
		Array.prototype.slice.call(arguments, start)
	).concat(
		defaultTasks
	);
}

// Task aliases
module.exports =  {
	default: alias('clean'),
	basic: alias(true, 'clean'),
	dev: alias('clean', 'jshint', 'csslint'),
	all: alias('clean').concat( alias(true) ),
	css: alias('clean', 'csslint', 'concat:css', 'cssmin', 'replace'),

	watch_js: [ 'init', 'concat', 'uglify', 'replace' ],
	watch_css: [ 'init', 'concat', 'cssmin', 'replace' ]
};