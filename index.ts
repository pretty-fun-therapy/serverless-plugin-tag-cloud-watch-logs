'use strict';

import * as _ from 'lodash';
import * as Serverless from "serverless";

interface FetchResourcesParams {
  data: any[];
  nextToken: string;
}

class ServerlessCloudWatchLogsTagPlugin {

  public serverless: Serverless;
  public options: Serverless.Options;
  public hooks: object;

  public cloudFormationService: any;
  public cloudWatchLogsService: any;
  public lambdaService: any;
  public awsService: any;

  constructor(serverless, options) {

    this.serverless = serverless;
    this.options = options;
    this.awsService = this.serverless.getProvider('aws');

    this.cloudFormationService = new this.awsService.sdk.CloudFormation({region: this.options.region});
    this.cloudWatchLogsService = new this.awsService.sdk.CloudWatchLogs({region: this.options.region});
    this.lambdaService = new this.awsService.sdk.Lambda({region: this.options.region});

    this.hooks = {
      'after:deploy:deploy': this.execute.bind(this),
    };
  }

  private get stackName(): string {
    return `${this.serverless.service['service']}-${this.options.stage}`;
  };

  execute(): Promise<any[]> {
    return this.getStackResources()
      .then(data => this.tagCloudWatchLogGroups(data))
      .then(data => data.map(item => this.serverless.cli.log(`Tagged LogGroup ${item.logGroupName} with the following tags: ${JSON.stringify(item.tags)}`)))
      .catch(err => this.serverless.cli.log(JSON.stringify(err, null, 2)));
  }

  getStackResources(): Promise<any> {
    const stackName = this.stackName;
    const self = this;

    return (async function fetchResources({data = [], nextToken}: FetchResourcesParams) {
      const batch = await self.cloudFormationService.listStackResources({ StackName: stackName, NextToken: nextToken }).promise();
      if (batch.NextToken) {
        return fetchResources({data: [...data, ...batch.StackResourceSummaries], nextToken: batch.NextToken})
      } else {
        return [...data, ...batch.StackResourceSummaries];
      }
    })({} as FetchResourcesParams);
  };

  tagCloudWatchLogGroups(data): Promise<any[]> {
    const cloudWatchResources = _.filter(data, {ResourceType: 'AWS::Logs::LogGroup'});

    const promises = _.map(cloudWatchResources, item => {
      return new Promise((resolve, reject) => {
        const lambdaName =
          (_.startsWith(item.PhysicalResourceId, '/aws/lambda/'))
            ? _.replace(item.PhysicalResourceId, '/aws/lambda/', '')
            : undefined;
        return this.lambdaService.getFunction({FunctionName: lambdaName}, (_, data) => {
          const {Tags} = data;
          const params = {
            logGroupName: item.PhysicalResourceId,
            tags: this.serverless.service.custom.cloudWatchLogsTags
          };
          if (Tags['pft:service:domain']) params.tags['pft:service:domain'] = Tags['pft:service:domain'];
          return this.cloudWatchLogsService.tagLogGroup(params, (err) => {
            if (err) return reject(err);
            return resolve(params);
          });
        });
      });
    });

    return Promise.all(promises);
  }
}

export = ServerlessCloudWatchLogsTagPlugin;
