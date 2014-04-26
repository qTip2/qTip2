var defaultTasks = ['concat', 'uglify', 'cssmin', 'replace'];
function alias() {
	return Array.prototype.slice.call(arguments, 0).concat(defaultTasks)
}

// Task aliases
module.exports =  {
	basic: alias('init:basic', 'clean'),
	default: alias('init', 'clean'),
	dev: alias('init', 'clean', 'jshint', 'csslint'),
	css: alias('init', 'clean', 'csslint', 'concat:css', 'cssmin', 'replace'),
	all: alias('init', 'clean').concat( alias('init:basic') )
}