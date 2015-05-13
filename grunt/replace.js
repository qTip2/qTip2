'use strict';

// Replacement variables are set up in `init` task
module.exports = function(grunt) {
	return {
		dist: {
			options: {
				patterns: []
			},
			files: [
				 { expand: true, flatten: true, src: ['<%=dirs.dist%>/**/*'], dest: '<%=dirs.dist%>/' }
			]
		}
	}
};