module.exports = {
	options: {
		keepSpecialComments: 0,
		banner: '<%=meta.banners.minified%>',
		report: 'min'
	},
	js: {
		files: {
			'<%=dirs.dist%>/jquery.qtip.min.css': '<%=dirs.dist%>/jquery.qtip.css'
		}
	}
};