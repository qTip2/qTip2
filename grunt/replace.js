'use strict';

// Replacement variables are set up in `init` task
module.exports = function(grunt) {
	return {
		dist: {
			files: [
				 { expand: true, flatten: true, src: ['<%=dirs.dist%>/**/*'], dest: '<%=dirs.dist%>/' }
			]
		},

		// Fix sourceMaps on remote CDNJS/jsDelivr services by removing dist/ in source map
		sourcemap: {
			files: [
				 { expand: true, flatten: true, src: ['<%=dirs.dist%>/**/*.map'], dest: '<%=dirs.dist%>/' }
			],
			options: {
				patterns: [
					{
						match: /dist\//g,
						replacement: function() {
							return grunt.config('pkg.type') === 'stable' ? '' : 'dist/';
						}
					}
				]
			}
		}
	}
};