SRC_DIR = src
BUILD_DIR = build

PREFIX = .
DIST_DIR = ${PREFIX}/dist
IMG_DIR = ${PREFIX}/images

JS_FILES = ${SRC_DIR}/core.js\
	${SRC_DIR}/ajax.js\
	${SRC_DIR}/tips.js\
	${SRC_DIR}/imagemap.js\
	${SRC_DIR}/modal.js\
	${SRC_DIR}/ie6.js

JS_MODULES = ${SRC_DIR}/header.txt\
	${SRC_DIR}/intro.js\
	${JS_FILES}\
	${SRC_DIR}/outro.js

CSS_FILES = ${SRC_DIR}/core.css\
	${SRC_DIR}/tips.css\
	${SRC_DIR}/modal.css\
	${SRC_DIR}/extra.css

CSS_MODULES = ${SRC_DIR}/header.txt\
	${SRC_DIR}/core.css\
	${SRC_DIR}/extra.css

QTIP = ${DIST_DIR}/jquery.qtip.js
QTIP_MIN = ${DIST_DIR}/jquery.qtip.min.js
QTIP_CSS = ${DIST_DIR}/jquery.qtip.css
QTIP_IMG = ${DIST_DIR}/images

QTIP_VER = `cat version.txt`
VER = sed s/@VERSION/${QTIP_VER}/

RHINO = java -jar ${BUILD_DIR}/js.jar
COMPILER = java -jar ${BUILD_DIR}/google-compiler-20091218.jar
MINIFY = php ${BUILD_DIR}/minify.php

DATE=`bzr log -r-1 | grep timestamp: | sed 's/[^:]*: *//'`

all: qtip css images min lint
	@@echo "qTip build complete."

${DIST_DIR}:
	@@mkdir -p ${DIST_DIR}

qtip: ${DIST_DIR} ${QTIP}

${QTIP}: ${JS_MODULES}
	@@mkdir -p ${DIST_DIR}

	@@echo "Building" ${QTIP}
	@@cat ${JS_MODULES} | \
		sed 's/Date:./&'"${DATE}"'/' | \
		${VER} > ${QTIP};

css: ${DIST_DIR} ${CSS_MODULES}
	@@echo "Building" ${QTIP_CSS}
	@@cat ${CSS_MODULES} | \
		sed 's/Date:./&'"${DATE}"'/' | \
		${VER} > ${QTIP_CSS};


images: ${DIST_DIR}
	@@echo "Building " ${QTIP_IMG}
	@@mkdir ${QTIP_IMG}
	@@cp -R ${IMG_DIR}/*.png ${QTIP_IMG}


lint: ${QTIP}
	@@echo "Checking qTip against JSLint..."
	@@${RHINO} build/jslint-check.js


min: ${QTIP}
	@@echo "Building" ${QTIP_MIN}

	@@head -17 ${QTIP} > ${QTIP_MIN}
	@@${MINIFY} ${QTIP} ${QTIP_MIN}


clean:
	@@echo "Removing distribution directory:" ${DIST_DIR}
	@@rm -rf ${DIST_DIR}