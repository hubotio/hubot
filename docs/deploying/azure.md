---
permalink: /docs/deploying/azure/index.html
layout: docs
---

If you've been following along with [Getting Started](../README.md), it's time to deploy so you can use it beyond just your local machine.
[Azure](http://http://azure.microsoft.com/) is a somewhat easy and probably unsupported way to deploy hubot.

You will need to install the azure-cli via npm after you have follow the initial instructions for your hubot.

    % npm install -g azure-cli

Inside your new hubot directory, make sure you've created a git repository, and that your work is committed:

    % git init
    % git add .
    % git commit -m "Initial commit"

Then create a github repository for your hubot. This is where zzure will pull your code from instead of needing to deploy directly from your dev machine to azure.

    % git remote add origin _your github repo_
	% git push -u origin master
	
Create a linked azure website. In azure, create a website and select integrated source control. When it asks "where is your source control" select GitHub and link this website to your git repo that you created in the previous step. If you have downloaded the azure powershell modules, you can also do this via powershell.

    % $creds = Get-Credential
	% new-azurewebsite mynewhubot -github -hithubrepository yourgithubaccount/yourhubotreponame -githubcredentials $creds
	
Once you have done this, azure will deploy your site on the next commit and push you do to github. Your hubot won't run quite right yet, though. Next, you need to configure the deployment to tell azure how to run hubot.
	
First, run the follow command to add _deploy.cmd_ to your hubot directory. This is the file that azure uses to know how to deploy your node application.

    % azure site deploymentscript --node
	
Then, edit this file and look for the sections that give you steps 1, 2 and 3. You're going to add a 4th step:

    :: 4. Create Hubot file with a coffee extension
    copy /Y “%DEPLOYMENT_TARGET%\node_modules\hubot\bin\hubot” “%DEPLOYMENT_TARGET%\node_modules\hubot\bin\hubot.coffee”

Now, create a new file in the base directory of Hubot called "server.js" and put these two lines into it:

    require('coffee-script/register');
	module.exports = require('hubot/bin/hubot.coffee');
	
Save this file. Then open up external-scripts.json and remove the following two lines, as these two bits aren't compatible with azure.

    "hubot-heroku-keepalive",
	"hubot-redit-brain",
	
Save this file then install coffee-script as a requirement to your local hubot. Azure requires this to run hubot properly.

    % npm install coffee-script --save

Finally you will need to add the environment variables to the website to make sure it runs properly. You can either do it through the GUI, under configuration or you can use the azure powershell command line, as follows (example is showing slack as an adapter and mynewhubot as the website name).

    % $settings = New-Object Hashtable
	% $settings["HUBOT_ADAPTER"] = "Slack"
	% $settings["HUBOT_SLACK_TOKEN"] = "yourslackapikey"
	% Set-AzureWebsite -AppSettings $settings mynewhubot
	
Commit your changes in git and push to github and azure will automatically pick up the changes and deploy them to your website.

    % git commit -m "Add azure settings for hubot"
	% git push
	
Hubot now works just fine but doesn't have a brain. To add a brain that works with azure, you will need to create an azure storage account and account key. Then you can do the following in your base hubot directory.

    % npm install hubot-azure-scripts --save

Then add the following line in external-scripts.json in the list with the other external scripts

    "hubot-azure-scripts/brain/azure-blob-brain"
	
Finally, add two more environment variables to your website. You can do this either via the gui or powershell commands.

    % $settings = New-Object Hashtable
	% $settings["HUBOT_BRAIN_AZURE_STORAGE_ACCOUNT"] = "your azure storage account"
	% $settings["HUBOT_BRAIN_AZURE_STORAGE_ACCESS_KEY"] = "your azure storage account key"
	% Set-AzureWebsite -AppSettings $settings mynewhubot
	
Now any scripts that require a brain will function. You should look up other scripts or write your own by looking at the [documentation](https://hubot.github.com/docs/scripting/). All of the normal scripts for hubot are compatible with hosting hubot on azure.