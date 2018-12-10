### Create the MySQL service
docker pull openshift/mysql-56-centos7
oc new-app -e MYSQL_USER=myuser -e MYSQL_PASSWORD=myuser -e MYSQL_DATABASE=mydb openshift/mysql-56-centos7 --name=mysql
