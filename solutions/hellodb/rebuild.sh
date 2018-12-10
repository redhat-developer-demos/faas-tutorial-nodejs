wsk -i action delete hellodb
zip -rq hellodb.zip * -x *.sh *.me
wsk -i action create hellodb --kind nodejs:8 hellodb.zip

