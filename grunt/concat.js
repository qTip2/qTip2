module.exports = {
	options: {
		stripBanners: true,
		separator: ';',
		banner: '<%=meta.banners.full%>'
	},
	js: {
		// See "init" task for src
		dest: '<%=dirs.dist%>/jquery.qtip.js'
	},
	css: {
		// See "init" task for src
		options: { separator: '\n\n' },
		dest: '<%=dirs.dist%>/jquery.qtip.css'
	}
};
