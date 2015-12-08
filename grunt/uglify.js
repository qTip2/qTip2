'use strict';

module.exports = function(grunt) {
	return {
		options: {
			preserveComments: 'some',
			report: 'min',
			banner: '<%=meta.banners.minified%>',
			sourceMap: true,
			sourceMapName: function(name) {
				return name.replace('.js', '.map');
			}
		},
		dist: {
			files: {
				'<%=dirs.dist%>/jquery.qtip.min.js': ['<%=dirs.dist%>/jquery.qtip.js']
			}
		}
	}
};