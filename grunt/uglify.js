module.exports = {
	options: {
		preserveComments: false,
		report: 'min',
		banner: '<%=meta.banners.minified%>',
		sourceMap: true,
		sourceMapName: function(name) {
			return name.replace('.js', '.map');
		}
	},
	js: {
		files: {
			'<%=dirs.dist%>/jquery.qtip.min.js': ['<%=dirs.dist%>/jquery.qtip.js']
		}
	}
};
