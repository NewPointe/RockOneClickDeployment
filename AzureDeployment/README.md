# Azure Deployment

A collection of deployment stuff for Azure


## Deploy to Azure Button

```
[![Deploy to Azure](http://azuredeploy.net/deploybutton.png)](https://azuredeploy.net/)
```

[![Deploy to Azure](https://azuredeploy.net/deploybutton.png)](#)

### Button Image:
 - https://azuredeploy.net/deploybutton.png
 - https://azuredeploy.net/deploybutton.svg

### Button Link Option 1:
 - https://deploy.azure.com (Formerly https://azuredeploy.net)
 - Based on Github Repos
     - https://deploy.azure.com?repository=https://github.com/{user}/{repo}
     - Can automatically get the repo from http `Referer:`
 - Very nice/user-friendly interface
 - Some parameter cans have special handling
 - Needs `azuredeploy.json` at the root of repository
 - SEE: https://github.com/projectkudu/slingshot

### Button Link Option 2:
 - https://portal.azure.com
 - Links directly to a deployment file
    - https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fexample.com%2Fazuredeploy.json
 - Opens in Azure Portal
 - Not a very "noob-friendly" interface


 ## Visualize Deployment Button

```
[![Visualize](http://armviz.io/visualizebutton.png)](http://armviz.io/)
```

[![Deploy to Azure](http://armviz.io/visualizebutton.png)](#)

### Button Image:
 - http://armviz.io/visualizebutton.png

### Button Link:
 - http://armviz.io
 - Links directly to a deployment file
   - http://armviz.io/#/?load=https%3A%2F%2Fexample.com%2Fazuredeploy.json
 - Nice visualizer
 - No https
 - SEE: https://github.com/shenglol/arm-visualizer