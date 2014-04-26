'use strict';

module.exports = function(grunt) {
	return {
		options: {
			preserveComments: 'some',
			report: 'min',
			banner: '<%=meta.banners.minified%>',
			sourceMap: function(file) {
				return file.indexOf('imagesloaded') < 0 ? file.replace('.js', '.map') : null;
			},
			sourceMappingURL: function(file) {
				file = file.replace('dist/', '').replace('.js', '.map');

				return grunt.config('pkg.type') === 'stable' ?
					grunt.config.process('//cdn.jsdelivr.net/qtip2/<%=pkg.version%>/') + file :
					'//qtip2.com/v/nightly/' + file;
			}
		},
		dist: {
			files: {
				'<%=dirs.dist%>/jquery.qtip.min.js': ['<%=dirs.dist%>/jquery.qtip.js'],
				'<%=dirs.dist%>/imagesloaded.pkg.min.js': ['<%=dirs.libs%>/imagesloaded/imagesloaded.pkg.js']
			}
		}
	}
};