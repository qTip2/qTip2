'use strict';

module.exports = {
	options: {
		jshintrc: true
	},
	beforeconcat: [
		'grunt.js', '<%=dirs.src%>/*/*.js',
		'!<%=dirs.src%>/*/intro.js', '!<%=dirs.src%>/*/outro.js' // Ignore intro/outro files
	]
};