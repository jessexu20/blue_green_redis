# Workshop: Deployments and Deflighting

In this workshop, we'll cover the basics of setting up a barebone deployment pipeline, in support of a green-blue deployment strategy.  We will be able to build upon this exercise in the upcoming homework and DEPLOYMENT milestone.

### Initializing our endpoints.

We'll create two endpoints for our deployment, a "green" endpoint for our baseline, and a "blue" endpoint for our test commits.  We will be using git repositories to help with *copying over bits*.  [See guide](http://toroid.org/ams/git-website-howto) for more details.

Create a folder structure as follows:

* deploy/
  * blue.git/
  * blue-www/
  * green.git/
  * green-www/

To ensure we have a git repo that will always have files that reflect the most current state of the repo, we will use a "bare" repository, which will not have a working tree.  Using a hook script, the changes will then be checked out to public directory.

    cd deploy/green.git
    git init --bare
    cd ..
    cd blue.git
    git init --bare

##### Post-Receive Hook

Inside `$ROOT/deploy/green.git/hooks/` inside a `post-receive` file, place the following:

    GIT_WORK_TREE=$ROOT/deflight/deploy/green-www/ git checkout -f

You must create the *-www folder manually.
You may have to add executable permissions using in *nix systems `chmod +x post-receive`.

Repeat for blue.

### Deploying Commits and Copying Bits

Clone the [app repo](https://github.com/CSC-DevOps/App), and set the following remotes.

    git remote add blue file://$ROOT/deploy/blue.git
    git remote add green file://$ROOT/deploy/green.git

You can now push changes in the following manner.

    git push green master
    git push blue master

You may have to create a simple commit before pushing.

### Testing deployment

Install a node process supervisor, globally, as needed by the demo, run:

    npm install -g forever

Then bring up the infrastructure:

    node infrastructure

You should be able to visit localhost:8080 and access the green slice!
In expanding on this concept, we could do the same exact steps, but on a different AWS instances, droplets, etc.

### Deploy a change.

Change the message to report, "Hello Blue".  

Push the change.

Test the blue server directly, using port 5060.

Notice, it hasn't updated yet...

You will need to modify how "forever" is run, by including a "--watch" flag which will restart the process if the file it is running changes.

Push another change, "Hello Blue 2".  Now see if you can observe on the blue server.

### Add auto-switch over.

Have the default TARGET to be BLUE now.

Modify the app repo, to explicitly fail with : `res.status(500).send('Something broke!');`

Have a heartbeat that checks every 30 second for a http 500, and if so, will switch the proxy over to the green environment.

This idea can be generalized to be triggered by any other monitoring/alerts/automated testing (during staging). E.g., See how to use [toobusy](https://hacks.mozilla.org/2013/01/building-a-node-js-server-that-wont-melt-a-node-js-holiday-season-part-5/).
