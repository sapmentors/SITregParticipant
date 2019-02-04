# install the MTA archive builder
WORKSPACE=`pwd`

# install neo command line client
mkdir -p ${WORKSPACE}/tmp/neo-java-web-sdk
cd ${WORKSPACE}/tmp/neo-java-web-sdk
wget -nv 'http://central.maven.org/maven2/com/sap/cloud/neo-java-web-sdk/3.73.18.1/neo-java-web-sdk-3.73.18.1.zip'
unzip -qq -o neo-java-web-sdk-3.73.18.1.zip
rm neo-java-web-sdk-3.73.18.1.zip

# extract artifact name
cd ${WORKSPACE}
wget -nv --output-document=jq https://github.com/stedolan/jq/releases/download/jq-1.5/jq-linux64
chmod +x ./jq
mtaName=`js-yaml mta.yaml | jq -r '.ID'`

# replace timestamp placeholder
sed -ie "s/\${timestamp}/`date +%Y%m%d%H%M%S`/g" mta.yaml

# execute MTA build
java -jar ${WORKSPACE}/tmp/mta/mta.jar --mtar ${CIRCLE_PROJECT_REPONAME}.mtar --build-target=NEO build
mkdir -p ${WORKSPACE}/dist/mta
cp ${CIRCLE_PROJECT_REPONAME}.mtar dist/mta/${CIRCLE_PROJECT_REPONAME}-`date +%Y%m%d%H%M%S`.mtar
