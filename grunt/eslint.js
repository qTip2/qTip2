'use strict';

module.exports = {
	beforeconcat: [
		'grunt.js', '<%=dirs.src%>/*/*.js',
		'!<%=dirs.src%>/*/intro.js', '!<%=dirs.src%>/*/outro.js' // Ignore intro/outro files
	]
};