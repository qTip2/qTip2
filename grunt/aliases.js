var BASIC = 'BASIC';

var defaultTasks = [
	'concat', 'uglify', 'cssmin', 'replace'
];

function alias(type) {
	var start = type === BASIC ? 1 : 0;

	return [type === BASIC ? 'init:basic' : 'init'].concat( 
		Array.prototype.slice.call(arguments, start)
	).concat(
		defaultTasks
	);
}

// Task aliases
module.exports =  {
	default: alias('clean'),
	basic: alias(BASIC, 'clean'),
	css: alias('clean', 'concat:css', 'cssmin', 'replace'),
	all: alias('clean').concat( alias(BASIC) ),
	lint: [ 'eslint', 'csslint' ],

	'watch_js': [ 'eslint', 'init', 'concat', 'uglify', 'replace' ],
	'watch_css': [ 'csslint', 'init', 'concat', 'cssmin', 'replace' ]
};
