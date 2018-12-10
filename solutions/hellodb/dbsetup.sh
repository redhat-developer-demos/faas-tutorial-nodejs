mysql -uroot


create database mydb;
use mydb;
create table personal_greeting (first_name varchar(20) not null primary key, custom_greeting varchar(20));
insert into personal_greeting (first_name,custom_greeting) values('Don','Howdy');

quit