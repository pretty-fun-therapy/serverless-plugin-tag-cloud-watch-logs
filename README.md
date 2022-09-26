# serverless-plugin-tag-cloud-watch-logs
Serverless plugin to tag CloudWatchLogs

## :warning: THIS PROJECT IS DEPRECATED

As an alternative with similar features, we suggest using [serverless-tag-cloud-watch-logs](https://github.com/gfragoso/serverless-tag-cloud-watch-logs).

## Installation
Install the plugin via <a href="https://docs.npmjs.com/cli/install">NPM</a>

```
npm install --save-dev @pretty-fun-therapy/serverless-plugin-tag-cloud-watch-logs
```

## Usage
In your serverless template :

```yaml
custom:
  cloudWatchLogsTags:
    TagName1: TagValue1
    TagName2: TagValue2

plugins:
  - '@pretty-fun-therapy/serverless-plugin-tag-cloud-watch-logs'
```

Or if you if you already have tags for your stack in another place :

```yaml
custom:
  cloudWatchLogsTags:${self:provider.<your_tags>}

plugins:
  - @pretty-fun-therapy/serverless-plugin-tag-cloud-watch-logs
```

This plugin also allow you to add tags retrieved from your lambda resources.  
To do so, you just have to add these lines into your serverless template :

```yaml
custom:
  addLambdaTagsOnLogGroups: true
  customTagsFromLambda:
    - "first_tag"
    - "second_tag"
    ...
```
