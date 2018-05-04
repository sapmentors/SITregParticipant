# install the MTA archive builder
WORKSPACE=`pwd`
mkdir -p ${WORKSPACE}/tmp/mta
cd ${WORKSPACE}/tmp/mta
wget -nv --output-document=mta.jar $MTA_BUILDER_URL

# install neo command line client
mkdir -p ${WORKSPACE}/tmp/neo-java-web-sdk
cd ${WORKSPACE}/tmp/neo-java-web-sdk
wget -nv 'http://central.maven.org/maven2/com/sap/cloud/neo-java-web-sdk/3.52.15/neo-java-web-sdk-3.52.15.zip'
unzip -qq -o neo-java-web-sdk-3.52.15.zip
rm neo-java-web-sdk-3.52.15.zip

# extract artifact name
cd ${WORKSPACE}
wget -nv --output-document=jq https://github.com/stedolan/jq/releases/download/jq-1.5/jq-linux64
chmod +x ./jq
mtaName=`js-yaml mta.yaml | jq '.ID'`

# replace timestamp placeholder
sed -ie "s/\${timestamp}/`date +%Y%m%d%H%M%S`/g" mta.yaml

# execute MTA build
java -jar ${WORKSPACE}/tmp/mta/mta.jar --mtar ${mtaName}.mtar --build-target=NEO build

# deploy to SAP Cloud Platform
${WORKSPACE}/tmp/neo-java-web-sdk/tools/neo.sh deploy-mta --user ${CI_DEPLOY_USER} --host ${DEPLOY_HOST} --source ${mtaName}.mtar --account ${CI_DEPLOY_ACCOUNT} --password ${CI_DEPLOY_PASSWORD} --synchronous
