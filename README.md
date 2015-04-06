#Homework4
## Deployments with Blue & Green Redis


### Set up Environment

You can download this repo and using your own redis server by setting up two redis instances. As in this project, infrastructure.js will connect two redis server, act as two real server.
		
		src/redis-server --port 6379
		src/redis-server --port 6380
		
You need cd into deploy folder and run:
		 
		npm install -g forever
		npm install redis
		npm install

Also you need to cd into <u>blue-www</u> folder and <u>green-www</u> folder and run 
		
		npm install redis
		npm install multer
		npm install
		
At here you would be able to run the infrastructure.js,by run

		node infrastructure.js
		

### Homework Checkpoint		
In this homework, I have implemented the following task:

	-Complete git/hook setup
	-Create blue/green infrastructure
	-Demonstrate /switch route
	-Demonstrate migration of data on switch
	-Demonstrate mirroring
	
#### Git/hook setup

I have finished the content in the workshop, you can check the file in the green.git and blue.git folders about the post-receive features. When you do a git push in the App folder to blue master or green master, the blue-www and green-www will update. But as the green-www and blue-www are different due to the switch features. You'd better not try to push into the green master. Just test to push into the blue master.


I have also implemented the pre-push feature. You should put the following in your .git/hooks/pre-push file
	
		#!/bin/sh
		node deployments/infrastructure.js
		
After that, you should 
	
		chmod +x pre-push
		
And you would be able to see the following when you do a push, it will automatically run the infrastructure.js.

		Jesses-MacBook-Air:deploy_redis jessexu$ git add -A
		Jesses-MacBook-Air:deploy_redis jessexu$ git commit -m "move readme"
		[master 7bf27ad] move readme
		 1 file changed, 0 insertions(+), 0 deletions(-)
		 rename deployments/README.md => README.md (100%)
		Jesses-MacBook-Air:deploy_redis jessexu$ git push origin master
		blue slice
		green slice
	
#### Switch Route and Migration

Please make sure that the mirror switch is turned off(set false).
When you are running the infrastructure.js, you are able to visit the web page http://localhost:8181, which shows the index of the blue server.(as default the traffic will be routed to the blue server port:9090).

By visit the http://localhost:8181/switch, you will be redirected to the http://localhost:8181 page. However, at this time, the server is connected to the green server(port 5060). You will need to <b>refresh</b> the page to see the change of the content on index page. You will also get a notice in your console when the switch is triggered. When you trigger the server switch, in the backend blue redis server(port 6379) will copy the existing data into the green redis server (port 6380). 

		switch to green http://127.0.0.1:5060
		Migrating to Green Begin!! Copying 1 data
		switch to blue http://127.0.0.1:9090
		Migrating to Blue Begin!! Copying 1 data

#### Mirror Flag

If you want to use the mirror feature, you have to edit the infrastructure.js file to enable it. 
		
		vim infrastructure.js
		
You will be able to find that there is a mirror flag. Once you enable this flag, everything you upload to either server will have a same copy to the other. 

		var mirror=true;
		
You can test this feature by uploading a pic. Before running the following, make sure that you have an img folder and morning.jpg in it. Check it by <b>ls</b>

		curl -F "image=@./img/morning.jpg" localhost:8181/upload
		
By default, you are routed to the blue server(port 9090). So, if you check the green host http://localhost:5060, you would see the same pic and vice versa.

Please Notice, when you enable the mirror feature, please do not the switch server as it won't do the migration of the two redis server, as it make no sense to do that.

