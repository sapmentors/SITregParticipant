# install the MTA archive builder
WORKSPACE=`pwd`

# install neo command line client
mkdir -p ${WORKSPACE}/tmp/neo-java-web-sdk
cd ${WORKSPACE}/tmp/neo-java-web-sdk
wget -nv 'http://central.maven.org/maven2/com/sap/cloud/neo-java-web-sdk/3.85.13/neo-java-web-sdk-3.85.13.zip'
unzip -qq -o neo-java-web-sdk-3.85.13.zip
rm neo-java-web-sdk-3.85.13.zip

# extract artifact name
cd ${WORKSPACE}
wget -nv --output-document=jq https://github.com/stedolan/jq/releases/download/jq-1.6/jq-linux64
chmod +x ./jq
mtaName=`js-yaml mta.yaml | jq -r '.ID'`

# replace timestamp placeholder
sed -ie "s/\${timestamp}/`date +%Y%m%d%H%M%S`/g" mta.yaml

# execute MTA build
mkdir -p ${WORKSPACE}/dist
npm install
npm run build
cp nep-app.json ${WORKSPACE}/dist
java -jar ${WORKSPACE}/tmp/mta/mta.jar --mtar ${CIRCLE_PROJECT_REPONAME}.mtar --build-target=NEO build
mkdir -p ${WORKSPACE}/dist/mta
cp ${CIRCLE_PROJECT_REPONAME}.mtar dist/mta/${CIRCLE_PROJECT_REPONAME}-`date +%Y%m%d%H%M%S`.mtar
