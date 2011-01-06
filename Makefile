SRC_DIR = src
BUILD_DIR = build

PREFIX = .
DIST_DIR = ${PREFIX}/dist

PLUGINS = ${SRC_DIR}/ajax.js\
	${SRC_DIR}/tips.js\
	${SRC_DIR}/imagemap.js\
	${SRC_DIR}/modal.js\
	${SRC_DIR}/bgiframe.js

JS_MODULES = ${SRC_DIR}/header.txt\
	${SRC_DIR}/intro.js\
	${SRC_DIR}/core.js\
	${PLUGINS}\
	${SRC_DIR}/outro.js

CSS_MODULES = ${SRC_DIR}/header.txt\
	${SRC_DIR}/core.css\
	${SRC_DIR}/tips.css\
	${SRC_DIR}/modal.css\
	${SRC_DIR}/extra.css

QTIP = ${DIST_DIR}/jquery.qtip.js
QTIP_MIN = ${DIST_DIR}/jquery.qtip.min.js
QTIP_PACK = ${DIST_DIR}/jquery.qtip.pack.js
QTIP_CSS = ${DIST_DIR}/jquery.qtip.css
QTIP_CSS_MIN = ${DIST_DIR}/jquery.qtip.min.css

QTIP_VER = `cat version.txt`
VER = sed s/@VERSION/${QTIP_VER}/

RHINO = java -jar ${BUILD_DIR}/js.jar
COMPILER = java -jar ${BUILD_DIR}/compiler.jar --warning_level=QUIET
MINIFIER = java -Xmx96m -jar ${BUILD_DIR}/yuicompressor.jar
PACKER = java -jar ${BUILD_DIR}/js.jar ${BUILD_DIR}/packer.js

DATE=`git log --pretty=format:'%ad' -1`

all: clean qtip lint css min pack
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

min: ${QTIP_MIN}

${QTIP_MIN}: ${QTIP} ${QTIP_CSS}
	@@echo "Building" ${QTIP_MIN}

	@@head -18 ${QTIP} > ${QTIP_MIN}
	@@${COMPILER} --js=${QTIP} >> ${QTIP_MIN}

	@@echo "Building" ${QTIP_CSS_MIN}
	@@${MINIFIER} ${QTIP_CSS} --type css -o ${QTIP_CSS_MIN} 

pack: ${QTIP_MIN}
	@@echo "Building" ${QTIP_PACK}

	@@head -18 ${QTIP} > ${QTIP_PACK}
	@@${PACKER} ${QTIP_MIN} ${QTIP_PACK}.tmp
	@@cat ${QTIP_PACK}.tmp >> ${QTIP_PACK} && rm ${QTIP_PACK}.tmp

css: ${QTIP_CSS}

${QTIP_CSS}: ${DIST_DIR} ${CSS_MODULES}
	@@echo "Building" ${QTIP_CSS}
	@@cat ${CSS_MODULES} | \
		sed 's/Date:./&'"${DATE}"'/' | \
		${VER} > ${QTIP_CSS};

lint: ${QTIP}
	@@echo "Checking qTip against JSLint..."
	@@${RHINO} build/jslint-check.js

clean:
	@@echo "Removing distribution directory:" ${DIST_DIR}
	@@rm -rf ${DIST_DIR}