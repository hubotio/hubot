---
permalink: /docs/deploying/azure/index.html
layout: docs
---

If you've been following along with [Getting Started](../README.md), it's time to deploy so you can use it beyond just your local machine.
[Azure](http://azure.microsoft.com/) is a way to deploy hubot as an alternative to [Heroku](/docs/deploying/heroku.md).

You will need to install the azure-cli via npm after you have follow the initial instructions for your hubot.

    % npm install -g azure-cli

Inside your new hubot directory, make sure you've created a git repository, and that your work is committed:

    % git init
    % git add .
    % git commit -m "Initial commit"

Then [create a GitHub repository](https://help.github.com/articles/create-a-repo/) for your hubot. This is where Azure will pull your code from instead of needing to deploy directly from your dev machine to Azure.

    % git remote add origin _your GitHub repo_
    % git push -u origin master

Once you have your GitHub repo, create an Azure website linked to your repo. In Azure, create a website and select integrated source control. When it asks "where is your source control" select GitHub and link this website to your git repo that you created in the previous step. If you have downloaded the Azure PowerShell modules, you can also do this via PowerShell.

    % $creds = Get-Credential
    % New-AzureWebsite mynewhubot -github -githubrepository yourgithubaccount/yourhubotreponame -githubcredentials $creds

Once you have done this, Azure will deploy your site any time you commit and push to GitHub. Your hubot won't run quite right yet, though. Next, you need to configure the deployment to tell Azure how to run hubot.

First, run the follow command to add `deploy.cmd` to your hubot directory. This is the file that Azure uses to know how to deploy your node application.

    % azure site deploymentscript --node

Then, edit this file and look for the sections that give you steps 1, 2 and 3. You're going to add a 4th step:

    :: 4. Create Hubot file with a coffee extension
    copy /Y “%DEPLOYMENT_TARGET%\node_modules\hubot\bin\hubot” “%DEPLOYMENT_TARGET%\node_modules\hubot\bin\hubot.coffee”

Now, create a new file in the base directory of hubot called `server.js` and put these two lines into it:

    require('coffee-script/register');
    module.exports = require('hubot/bin/hubot.coffee');

Save this file. Then open up `external-scripts.json` and remove the following two lines, as these two bits aren't compatible with Azure and then save the file.

    "hubot-heroku-keepalive",
    "hubot-redit-brain",

Finally you will need to add the environment variables to the website to make sure it runs properly. You can either do it through the GUI (under configuration) or you can use the Azure PowerShell command line, as follows (example is showing slack as an adapter and mynewhubot as the website name).

    % $settings = New-Object Hashtable
    % $settings["HUBOT_ADAPTER"] = "Slack"
    % $settings["HUBOT_SLACK_TOKEN"] = "yourslackapikey"
    % Set-AzureWebsite -AppSettings $settings mynewhubot

Commit your changes in git and push to GitHub and Azure will automatically pick up the changes and deploy them to your website.

    % git commit -m "Add Azure settings for hubot"
    % git push

Hubot now works just fine but doesn't have a brain. To add a brain that works with Azure, you will need to create an Azure storage account and account key. Then you can do the following in your base hubot directory.

    % npm install hubot-azure-scripts --save

Then add the following line in `external-scripts.json` in the list with the other external scripts

    "hubot-azure-scripts/brain/azure-blob-brain"

Finally, add two more environment variables to your website. You can do this either via the GUI or the following PowerShell commands.

    % $settings = New-Object Hashtable
    % $settings["HUBOT_BRAIN_AZURE_STORAGE_ACCOUNT"] = "your Azure storage account"
    % $settings["HUBOT_BRAIN_AZURE_STORAGE_ACCESS_KEY"] = "your Azure storage account key"
    % Set-AzureWebsite -AppSettings $settings mynewhubot

Now any scripts that require a brain will function. You should look up other scripts or write your own by looking at the [documentation](/docs/scripting.md). All of the normal scripts for hubot are compatible with hosting hubot on Azure.