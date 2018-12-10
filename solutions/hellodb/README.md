brew install mariadb
brew services start mariadb

docker pull registry.access.redhat.com/openshift3/mysql-55-rhel7

oc get pods -- to get pod id
oc rsh <pod-id>

mysql -uroot


create database mydb;
use mydb;
create table personal_greeting (first_name varchar(20) not null primary key, custom_greeting varchar(20));
insert into personal_greeting (first_name,custom_greeting) values('Don','Howdy');

Python Packages in OpenWhisk
http://jamesthom.as/blog/2017/04/27/python-packages-in-openwhisk/



### Create build/nodejs
`git clone https://github.com/pritidesai/incubator-openwhisk-package-build`
`cd incubator-openwhisk-package-build`
`./install.sh $AUTH_SECRET openwhisk-openwhisk.192.168.99.100.nip.io openwhisk-openwhisk.192.168.99.100.nip.io`




## Reading from a MySQL database using a Node.js function
This section will create a MySQL database with one table in it. We will read from the table using a Node.js function. If the user name is found in the table, a custom greeting is returned. If the user name is not found in the database, the default greeting ("Hello") will be used.

 The code is in the directory "hellodb".

 `cd /hellodb`

 
### Create the MySQL service
`docker pull openshift/mysql-56-centos7`
`oc new-app -e MYSQL_USER=myuser -e MYSQL_PASSWORD=myuser -e MYSQL_DATABASE=mydb openshift/mysql-56-centos7 --name=mysql`
`oc get pods -w` until the pod is Ready. Note: You will initially see two pods: One is the pod that orchestrates the deployment; The other pod, which takes a few seconds longer to be created, is the pod that will contain the MySQL instance.

OR

`./create_mysql.sh`

### Create the database table
`oc exec $(oc get pods --selector app=mysql --output name | awk -F/ '{print $NF}') -- bash -c "mysql --user=root mydb -e 'use mydb; create table personal_greeting (first_name varchar(20) not null primary key, custom_greeting varchar(20));'"`

### Populate the new database table
`oc exec $(oc get pods --selector app=mysql --output name | awk -F/ '{print $NF}') -- bash -c "mysql --user=root mydb -e 'use mydb; insert into personal_greeting (first_name,custom_greeting) values(\"Don\", \"Howdy\")';"`

### Prove the database contents
`oc exec $(oc get pods --selector app=mysql --output name | awk -F/ '{print $NF}') -- bash -c "mysql --user=root mydb -e 'use mydb; select * from personal_greeting';"`  

#### Expected results
`first_name	custom_greeting`
`Don	Howdy`

The database is now built and populated. The next step is to create a Node.js function to read from the database.

### Create the hellodb function
OpenWhisk allows *.zip files to be used a functions. This allows us to use Node.js with external dependencies; in this case, the MySQL client module. Our solution also uses the modules 'request-promise' and 'string-format'. This is apparent by viewing the package.json file content:

{
  "name": "getgreeting",
  "version": "1.0.0",
  "description": "Get custom greeting from database",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "ISC",
  "dependencies": {
    "mysql": "^2.16.0",
    "request-promise": "^4.2.2",
    "string-format": "^2.0.0"
  }
}

### Install dependencies, create zip file, create action
`npm install --production`
`zip -rq hellodb.zip * -x *.sh *.me`
`wsk -i action create hellodb --kind nodejs:8 hellodb.zip`

### Run the function
`wsk -i action invoke --result hellodb --param name Sally`
`{
    "message": "Hello, Sally"
}`

`wsk -i action invoke --result hellodb --param name Don`
`{
    "message": "Howdy, Don"
}`

The next step would be to create an OpenWhisk action that writes records to the database.

