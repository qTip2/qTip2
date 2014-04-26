'use strict';

module.exports = {
	options: {
		stripBanners: true,
		separator: ';',
		banner: '<%=meta.banners.full%>'
	},
	dist: {
		// See "init" task for src
		dest: '<%=dirs.dist%>/jquery.qtip.js'
	},
	css: {
		// See "init" task for src
		options: { separator: '\n\n' },
		dest: '<%=dirs.dist%>/jquery.qtip.css'
	},
	libs: {
		options: {
			stripBanners: false,
			separator: '\n\n',
			banner: ''
		},
		files: {
			'<%=dirs.libs%>/imagesloaded/imagesloaded.pkg.js': [
				'<%=dirs.libs%>/imagesloaded/bower_components/eventEmitter/EventEmitter.js',
				'<%=dirs.libs%>/imagesloaded/bower_components/eventie/eventie.js',
				'<%=dirs.libs%>/imagesloaded/imagesloaded.js'
			]
		}
	}
};