<img src="https://github.com/redhat-developer/design-manual/blob/master/RHD%20Visual%20Elements/RHD%20Merging%20Branches/RHDP_social_images-Email_655x96_actual-size.png">
  
This tutorial guides you to a working knowledge of how to build functions using Node.js on the open source Function as a Service (FaaS) platform <a href="https://openwhisk.apache.org/">OpenWhisk</a>.

This tutorial will use Minishift to run an instance of OpenShift on your local PC in a Virtual Machine (VM). OpenWhisk is then installed and run inside of OpenShift.

<strong>Note:</strong> FaaS is also commonly referred to as "serverless computing" or simply "serverless".

## Prerequisites
You will need the following to execute this tutorial on your local PC.

### <a href="https://github.com/minishift/minishift">Minishift</a>
Minishift allows you to run OpenShift and the entire OpenWhisk environment inside a VM on your PC.

### <a href="https://www.docker.com/get-started">docker</a>
docker allows the Linux containers used by OpenWhisk to run.

### <a href="https://kubernetes.io/docs/tasks/tools/install-kubectl/">Kubernetes CLI (kubectl)</a>
kubectl allows you to run Kubernetes commands on your PC

### <a href="https://docs.openshift.com/container-platform/3.10/cli_reference/get_started_cli.html">OpenShift CL (oc)</a>
oc allows you to run OpenShift commands on your PC

### <a href="https://github.com/apache/incubator-openwhisk-cli/releases">OpenWhisk CLI (wsk)</a>
wsk allows you to run OpenWhisk commands on your PC

### <a href="https://git-scm.com/">Git CLI (git)</a>
git allows you to work with Github repositories (repos) on your PC

### <a href="https://www.npmjs.com/get-npm">npm</a>
npm allows you to manage Node.js packages on your PC

## Starting Minishift

*Don't foget to add the location of Minishift executable to your PATH*

Run the following commands, in sequence, to start the Minishift instance needed to support OpenWhisk:  
`minishift profile set faas-tutorial-nodejs`  
`minishift config set memory 8GB`  
`minishift config set cpus 3`  
`minishift config set image-caching true`  
`minishift addon enable admin-user`  
`minishift addon enable anyuid`  
`minishift start`  
`minishift ssh -- sudo ip link set docker0 promisc on`  

#### NOTE
You may need to use the following command if you are using VirtualBox:   
`minishift start --vm-driver virtualbox`

### Important

`minishift ssh -- sudo ip link set docker0 promisc on` command needs to be executed each time Minishift is restarted.

## Setting Up Your Environment

The following commands will ensure that your OpenShift and docker commands will use the OpenShift host:  
`eval $(minishift oc-env)`  
`eval $(minishift docker-env)`

## Setting Up OpenWhisk

The project <a href="https://github.com/projectodd/openwhisk-openshift">OpenWhisk on OpenShift</a> provides the OpenShift templates required to deploy Apache OpenWhisk.

Log in as the admin  
`oc login $(minishift ip):8443 -u admin -p admin`

It is always better to group related classes of applications. Create a new OpenShift project called "faas" to deploy all OpenWhisk applications.  
`oc new-project faas`

Deploy OpenWhisk applications to "faas" project in OpenShift.  
`oc process -f https://git.io/openwhisk-template | oc create -f -`

### Waiting for OpenWhisk to start...

It will take a few minutes until all of the required OpenWhisk pods are running and the FaaS is ready for some load. If your Mac has the utility 'watch' installed, you can watch the status using the command:  
`watch -n 5 'oc logs -f controller-0 -n faas | grep "invoker status changed"'`

Alternatively, you can run the following command until all the pods have a status of 'Running' or 'Completed':  
`oc get pods`

## Verifying The Deployment

You can start the OpenShift console in your default browser by using the following command:  
`minishift console`

When the console login appears in your browser window, log in using admin/admin as the username and password combination. Select the project "faas" and you will then see a screen like the following:  

<img src="./images/figure1.png"/>

#### At this point you have a working OpenWhisk FaaS environment running in OpenShift, using Minishift, in a VM on your local machine.

## Configuring The OpenWhisk CLI Tool, wsk

 Verify that the OpenWhisk CLI tool in your path by running the following command:  
`wsk --help`

The OpenWhisk CLI needs to be configured to know where the OpenWhisk instance is located and the authorization that is to be used to invoke `wsk` commands.  Run the following two commands to have that setup:  
`AUTH_SECRET=$(oc get secret whisk.auth -o yaml | grep "system:" | awk '{print $2}' | base64 --decode)`  
{% raw %}
    wsk property set --auth $AUTH_SECRET --apihost $(oc get route/openwhisk --template="{{.spec.host}}")
{% endraw %} 

Successful setup of wsk will show output like this:  
<img src="./images/figure2.png" />

In this case the OpenWhisk API Host is pointing to the local Minishift nip.io address `openwhisk-faas.192.168.99.100.nip.io`. To verify if wsk CLI is configured properly run `wsk -i action list`. This will list some actions which are installed as part of the OpenWhisk setup.

#### Note
The `nginx` in OpenWhisk deployment uses a self-signed certificate.  To avoid certificate errors when using `wsk`, you need to add `wsk -i` to each of your `wsk` commands. For convenience, you can add an alias to your profile with `alias wsk='wsk -i'`. 

## Setting Up The Development Environment

Clone the tutorial repo using the following command:  
`git clone https://github.com/redhat-developer-demos/faas-tutorial-nodejs.git`

For the rest of the tutorial, the directory into which this repo is placed will be referred to as $PROJECT_HOME.

## Your First OpenWhisk Action

### What is an Action?

**Actions** are stateless code snippets that run on the OpenWhisk platform. OpenWhisk actions are thread-safe meaning at a given point of time only one invocation happens.

For more details refer the <a href="https://openwhisk.apache.org/documentation.html">official documentation</a>.

Move into the ./solutions/hello-openwhisk directory and view the file hello-openwhisk.js:  
`cd solutions/hello-openwhisk`  
`cat hello-openwhisk.js`  

You will see the following Node.js code:
```javascript
function main() {
    return {payload: 'Welcome to OpenWhisk on OpenShift'};
}
```

This example illustrates that an OpenWhisk function will return a JSON document. In this case, it's hard-coded.  

Use the following command to create an OpenWhisk action by using the following command:  
`wsk --insecure action create hello-openwhisk hello-openwhisk.js`  

Some things to note:
1. The '--insecure' option is because we are operating in an insecure environment (a self-signed certificate). This option can be abbreviated as '-i'.
2. The action name will be 'hello-openwhisk'.
3. The name of the source code file -- in this case 'hello-openwhisk.js' does *not* need to match the name of the function. However, this is probably a Best Practice.

Given the success of the command, we now have an action named 'hello-openwhisk'. We can see this listed by using the following command:  
`wsk -i action list`  

The command will yield a result similar to the following (you should see 'hello-openwhisk' at or near the top of your list):  

<img src="./images/figure3.png">

Now we can invoke the action.  

Use the following command to invoke the OpenWhisk "hello-openwhisk" action:  
`wsk -i action invoke hello-openwhisk --result`  

You will see the following output:  

<img src="./images/figure4.png" />  

The results displayed are as expected. If you repeat the command multiple times, you will notice an improvement in performance over the first invocation. That's because OpenWhisk has started the action and is now keeping the Kubernetes pod available. This availability defaults to five minutes; if there is no activity for an action within five minutes, it "goes to sleep" until invoked again.  

Note the '--result' option of the command. This runs the action synchronously; that is, we will wait for the result before returning control to the caller -- in this case, the 'wsk' command line tool.  

An action can be called asynchronously, in which case control is immediately returned to the caller with an Activation ID. This Activation ID can then be used to get the results.

Use the following command to invoke the OpenWhisk "hello-openwhisk" action asynchronously, getting an Activation ID in return:  
`wsk -i action invoke hello-openwhisk`

Your result will be much like the following but with a different Activation ID:

![figure5](./images/figure5.png)

You can use that Activation ID to get the results.

Use the following command to retrieve the Activation associated with the action invocation, substituting your Activation ID:  
`wsk -i activation get {activation_id}`

Your result will be similar to the following. Note that, in this case, instead of simply the 'result' value, the entire JSON object is available:

![figure6](./images/figure6.png)

Hint: You can access the latest Activation by running `wsk -i activation get --last`

## Updating an existing action
Updating an existing action is as simple as a code change and one command.

Change the contents of 'hello-openwhisk,js' to return a different message, such as the following:

```javascript
function main() {
    return {payload: 'Welcome to OpenWhisk on OpenShift, version 2.0!'
};
```

With the code changed, updating the action is one command.

Use the following command to update the action 'hello-openwhisk':  
`wsk -i action update hello-openwhisk hello-openwhisk.js`

![figure7](./images/figure7.png)

Use the following command to invoke the action (Note: '--result' can be shortened to '-r')  
`wsk -i action invoke hello-openwhisk -r`

![figure8](./images/figure8.png)  
  
  
## Deleting an existing Action
Use the following command to delete the action:  
`wsk -i action delete hello-openwhisk`

 
### Recap
Up to this point, you've learned how to create, update, and delete a simple action that returns a hard-coded string. In the next section, you'll see how to handle input parameters to your action.  

---

## Handling action parameters

OpenWhisk actions receive JSON objects as input. In this example, the action 'splitter' will receive a JSON object with a comma-delimted string of words and will return a JSON object with an array of the words.

For example: An input of  

```JSON
{text: "cat,blurg,apple,toothbrush"} 
```
will return the following:
```JSON
{
    "result": [
        "cat",
        "blurg",
        "apple",
        "toothbrush"
    ]
}
```

Use the following command to move into the directory containing the 'splitter' code:  
`cd ../sequence-demo/splitter`

Optional: Examine the code for the function:  
`cat splitter.js`

Notice that the input JSON is expected to contain the property '.text', which will contain the string of comma-separated words.

Create the OpenWhisk action 'splitter' using the code in file 'splitter.js'.  
`wsk -i action create splitter splitter.js`

You can see the action's parameters by using the following command:  
`wsk -i action get splitter parameters`

Use the following command test invoke the action 'splitter' using the example, above:  
`wsk -i action invoke splitter -r --param text "cat,blurg,apple,toothbrush"`

You should see the following results:

![figure9](./images/figure9.png)

### Creating Default Parameter Values, i.e. Binding

You can bind parameter values to an action, which will set default values for the action.

Use the following command to bind the default parameter value to the action 'splitter':  
`wsk -i action update splitter --param text "cat,blurg,apple,toothbrush"`

![figure17](./images/figure17.png)

If you now run the action 'splitter' with no parameters, it will use these default values.

### <span style="color:white; background-color: maroon">&nbsp;Optional Exercise For The Reader&nbsp;</span>
Run the action "splitter" with a different string and get back *all* of the JSON associated with the action. Hint: You want to get an Activation.

## Chaining Actions together; Creating a Sequence

For this section, we have three actions that will be chained together. The first action, "splitter" was created in the previous section. The other two actions, "sorter" and "uppercase" will be created. Then, we'll 'stitch' them together to make a sequence. The sequence will look like the following:

input --> splitter --> uppercase --> sorter

The sequence will be called 'splitUpperSort' and will give the following results:

Given

    text: "cat,blurg,apple,toothbrush"

We will return
```JSON
    {
        "result": [
            "APPLE",
            "BLURG",
            "CAT",
            "TOOTHBRUSH"
        ]
    }
```

### Create and test action 'uppercase'

Move into the 'uppercase' directory:  
`cd ../uppercase`

Optional: View the source code  
`cat uppercase.js`

### Create the action 'uppercase'

** This is an exercise left to the reader **

### Test the action 'uppercase'
Invoke the action with the test data:  
`wsk -i action invoke -r uppercase --param result "[\"cat\",\"blurg\",\"apple\",\"toothbrush\"]"`

The results should be:

![figure10](./images/figure10.png)

### Create and test action 'sorter'

Move into the 'sorter' directory:  
`cd ../sorter`

Optional: View the source code:  
`cat sorter.js`

### Create the action 'sorter'

** This is an exercise left to the reader **

### Test the action 'sorter'
Invoke the action with the test data:  
`wsk -i action invoke -r sorter --param result "[\"cat\",\"blurg\",\"apple\",\"toothbrush\"]"`

The results should be:

![figure11](./images/figure11.png)

### Create the sequence  
OpenWhisk allows you to create a sequence of actions, where the output from one action becomes the input for the next. Now that we have the actions "splitter", "uppercase" and "sorter", we can create a sequence.

Use the following command to create the sequence called "splitUpperSort":  
`wsk -i action create splitUpperSort --sequence splitter,uppercase,sorter`

### Test the sequence 'splitUpperSort'
Invoke the sequence with the test data:  
`wsk -i action invoke -r splitUpperSort --param text "cat,blurg,apple,toothbrush"`

![figure12](./images/figure12.png)

The sequence is returning the expected results.

What happens if you invoke the sequence with no parameters? Why?

---
### <span style="color:white; background-color: maroon">&nbsp;Optional Exercise For The Reader&nbsp;</span>

This sequence has an annoying bug: leading and trailing spaces are not being removed. Observe the following:

![figure13](./images/figure13.png)

As an optional exercise, fix this defect. Hint: You need only change one of the actions in the sequence; the sequence will then exhibit the proper behavior. You *do not* need to update the sequence.

---

## Web Actions

Up to this point, we've been using the command line 'wsk' tool to invoke actions. While this is useful for developing and testing actions, eventually you'll most likely wish to invoke your actions as a RESTful service. In this section you'll learn how to create a web action and you'll use a simple web application, written in React, to invoke the action and display the results in a browser.

One of the benefits of using OpenWhisk to create RESTful web actions is that you do not need to include any special libraries or dependencies in your code to support HTTP; OpenWhisk will handle that for you.

### About hello-web
The simple action 'hello-web' will receive a string and simply echo it back to the caller. For example, the following:  
`wsk -i action invoke hello-web -r --param text "Hello web"`

Gives this response:
```JSON
{
    "response": {
        "text": "Hello web"
    }
}
```

### Create hello-web
Move into the hello-web directory:  
`cd ../hello-web`

To create a web action you use the '--web=true' command line option, as follows:  
`wsk -i action create hello-web hello-web.js --web=true`

Note that, even though this is now a web action, you can still test it using the command line:  
`wsk -i action invoke hello-web -r --param text "Hello web"`

You will see the following results:

![figure14](./images/figure14.png)

### Get WEB_URL
Use the '--url' option to get the URL for the web action:  
<code>WEB_URL=\`wsk -i action get hello-web --url | awk 'FNR==2{print $1".json"}'\` </code>  

View the URL:  
`echo $WEB_URL`

![figure16](./images/figure16.png)

**Copy the URL to your PC's clipboard, and then paste it into your default browser. You can then use the security-related warning to bypass the security check (which is being caused by a self-signed certificate in OpenShift). Without this step, the web app (below) will not be able to access this web action.**

### Run React web app
Move into the faas-web directory:  
`cd ../faas-web`

Make sure all of the dependencies are installed:  
`npm install --production`

Start the application, using the WEB_URL environment variable to locate the web action:  
`REACT_APP_WEB_URL=$WEB_URL npm start`

Your default browser should open to the web app. If it does not, use the value of the WEB_URL variable to browse to the app. Execute the app and see the results.

![figure15](./images/figure15.png)

---
### <span style="color:white; background-color: maroon">&nbsp;Optional Exercise For The Reader&nbsp;</span>

Remember the sequence demo, earlier, 'splitUpperSort'? Make that into a web action and modify the web app to access that web action.

---

## Including dependency libraries in your Action

There will be times when you need to include dependency libraries in your action. To this point, we've been using a single *.js file as the source for an action. But what if we have libraries (i.e. a node_modules directory) that needs to be included with the code?

In this example, we will create an action that reads from a MySQL database, using the 'mysql' library.

Move into the hellodb directory:  
`cd ../hellodb`

Optional: View the source code:  
`cat index.js`

This function relies on a MySQL database named 'mydb' on host 'mysql'. The login credentials will be:  

user: myuser  
password: myuser

### Create the MySQL database

We can take advantage of OpenShift to create a MySQL database using one line:  
`oc new-app -e MYSQL_USER=myuser -e MYSQL_PASSWORD=myuser -e MYSQL_DATABASE=mydb openshift/mysql-56-centos7 --name=mysql`
`oc get pods -w`

_What just happened?_  
We (automatically) pulled a MySQL image from docker hub, then used the OpenShift command line tool (oc) to create a new application in our OpenShift (running in Minishift) instance. Within a few seconds, we have a MySQL database up and running. For the purposes of this simple demo, all of the credentials have been hard-coded -- not a best practice in a production environment.

If you switch to your Minishift console in your browser, you can see the MySQL application:

![figure18](./images/figure18.png)

### IMPORTANT!
Running a MySQL database in an emphemeral pod is *not* something you should do in production _unless_ you are using the High Availability (HA) installation of MySQL. For demos and development, however, this is fine.  

### Where is MySQL running?
MySQL is running in a pod in OpenShift. You can see the pod name by using the following command:  
`oc get pods`

![figure19](./images/figure19.png)

Note that your pod name will be different. We can isolate the name of the pod, which we'll need to do for our following commands, using the following command:

<code>oc get pods --selector app=mysql --output name | awk -F/ '{print $NF}'</code> 

### Create the database table
The following command will run a MySQL command _inside_ the pod; it will create the database 'mydb':  
`oc exec $(oc get pods --selector app=mysql --output name | awk -F/ '{print $NF}') -- bash -c "mysql --user=root mydb -e 'use mydb; create table personal_greeting (first_name varchar(20) not null primary key, custom_greeting varchar(20));'"`

### Populate the new database table
This command will populate the database table:  
`oc exec $(oc get pods --selector app=mysql --output name | awk -F/ '{print $NF}') -- bash -c "mysql --user=root mydb -e 'use mydb; insert into personal_greeting (first_name,custom_greeting) values(\"Don\", \"Howdy\")';"`

### Prove the database contents
Use this command to prove that everything is up and running as inspected:  
`oc exec $(oc get pods --selector app=mysql --output name | awk -F/ '{print $NF}') -- bash -c "mysql --user=root mydb -e 'use mydb; select * from personal_greeting';"`  

#### Expected results
![figure20](./images/figure20.png)

At this point we have a database running in OpenShift with the table, 'personal_greeting', populated with one entry.

### Create the hellodb function
OpenWhisk allows *.zip files to be used a functions. This allows us to use Node.js with external dependencies; in this case, the MySQL client module. Our solution also uses the modules 'request-promise' and 'string-format'. This is apparent by viewing the package.json file content:

```json
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
```

### Install dependencies, create zip file, create action
`npm install --production`  
`zip -rq hellodb.zip * -x *.sh *.me`  
`wsk -i action create hellodb --kind nodejs:8 hellodb.zip`

Note that we must tell the 'action create' command what *kind* of function we are building; in this case, a nodejs:8 function.

### Run the function with different input
`wsk -i action invoke --result hellodb --param name Sally`  

```json
{
    "message": "Hello, Sally"
}
```

`wsk -i action invoke --result hellodb --param name Don`  

```json
{
    "message": "Howdy, Don"
}
```
---
### <span style="color:white; background-color: maroon">&nbsp;Optional Exercise For The Reader&nbsp;</span>

Create an OpenWhisk action that writes records to the database.

---

## Handling events in OpenWhisk

Triggers and Rules are combined to respond to Events. A trigger is a named channel that is associated with events via named rules.

When an event causes a trigger to fire, any rules associated with the trigger will create an action and return an activation ID. By itself, without any associated rules a trigger will not cause an activation. That is, a standalone trigger does nothing.

A trigger can fire one or more rules. The activation created by the trigger will return a result containing the input parameters to the trigger. The logs associated with the activation of a trigger will contain a JSON array of the rules invoked. Each invoked rule, in turn, has an associated activation ID.

The events that fire triggers can be either user-generated or from an external event source. An example of an external event source is a commit to a Git repository.

### Create a trigger

`wsk -i trigger create myTrigger`  

![figure21](./images/figure21.png)

### Create a rule associating the trigger with an action

`wsk -i rule create myRule myTrigger hello-openwhisk`

![figure22](./images/figure22.png)

### Fire trigger from the command line
`wsk -i trigger fire myTrigger`

![figure23](./images/figure23.png)

### Check results
`wsk -i activation get -l`

![figure24](./images/figure24.png)

### Get properties needed for curl command

A trigger can be fired via the HTTP Post command.

Run the command  
`wsk -i property get`  
and copy the "whisk auth" value to your computer clipboard. Also note the values of "whisk API host" and "whisk namespace" -- you will need them to build the URL needed to fire a trigger via an HTTP POST message.

![figure25](./images/figure25.png)

The URL follows this pattern:  
https://{whisk auth value}@{whisk API host}/api/v1/namespaces/{whisk namespace}/triggers/{trigger name}

For example:

`Https://789c46b1-71f6-4ed5-8c54-816aa4f8c502:XsDY2SjQCtXC7hgkBpMht28faPPaDK3FxN5KhUfCHCfUCrP66AFEIBAtk8t52BYk@openwhisk-faas.192.168.99.100.nip.io/api/v1/namespaces/_/triggers/myTrigger`

### Fire trigger via HTTP POST
You can fire a the trigger via HTTP; it will return an activation ID. The following `curl` command is an example:

`curl -k -X POST https://789c46b1-71f6-4ed5-8c54-816aa4f8c502:XsDY2SjQCtXC7hgkBpMht28faPPaDK3FxN5KhUfCHCfUCrP66AFEIBAtk8t52BYk@openwhisk-faas.192.168.99.100.nip.io/api/v1/namespaces/_/triggers/myTrigger`

![figure26](./images/figure26.png)

## OpenWhisk Packages

Packages allow you to group actions together inside of a namespace. Much like a software project may contain many files, a package may contain multiple actions.

### Create a new package
`wsk -i package create myPackage`

![figure27](./images/figure27.png)

### See a list of packages
`wsk -i package list`

![figure28](./images/figure28.png)

### Add an action to a package
[As noted earlier in this tutorial, $PROJECT_HOME is the directory into which you cloned this repo.]  

`cd $PROJECT_HOME/solutions/hello-openwhisk`  
`wsk -i action create myPackage/hello-openwhisk hello-openwhisk.js`

![figure29](./images/figure29.png)

### See what's inside of a package
`wsk -i package get myPackage`

![figure30](./images/figure30.png)

---
If you have completed the above tutorial, including the optional exercise, you are well on your way to successfully using OpenWhisk in a production setting.

### -- End Of Tutorial --