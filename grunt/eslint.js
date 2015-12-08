module.exports = {
	js: {
		src: [
			'Gruntfile.js',
			'<%=dirs.src%>/*/*.js',

			// Ignore intro/outro files
			'!<%=dirs.src%>/core/intro.js', 
			'!<%=dirs.src%>/core/outro.js' 
		]
	}
};
