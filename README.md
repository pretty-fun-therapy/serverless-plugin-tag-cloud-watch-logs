# serverless-plugin-tag-cloud-watch-logs
Serverless plugin to tag CloudWatchLogs

## Installation

Install the plugin via <a href="https://docs.npmjs.com/cli/install">NPM</a>

```
npm install --save-dev serverless-plugin-tag-cloud-watch-logs
```

## Usage

In your serverless template:

```
custom:
  cloudWatchLogsTags:
    TagName1: TagValue1
    TagName2: TagValue2

plugins:
  - serverless-plugin-tag-cloud-watch-logs
```

Or if you if you already have tags for your stack in another place :

```
custom:
  cloudWatchLogsTags:${self:provider.<your_tags>}

plugins:
  - serverless-plugin-tag-cloud-watch-logs
```
