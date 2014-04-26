'use strict';

module.exports = {
	options: {
		livereload: true
	},

	js: {
		files: 'src/**/*js',
		tasks: 'watch_js'
	},

	css: {
		files: 'src/**/*.css',
		tasks: 'watch_css'
	}
};