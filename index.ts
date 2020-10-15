import * as Serverless from 'serverless';
import { StackResourceSummary, FetchResourcesParams, StackResources, TagLogGroupsParams } from './types';

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

    const region = this.awsService.getRegion();
    this.cloudFormationService = new this.awsService.sdk.CloudFormation({ region });
    this.cloudWatchLogsService = new this.awsService.sdk.CloudWatchLogs({ region });
    this.lambdaService = new this.awsService.sdk.Lambda({ region });

    this.hooks = {
      'after:deploy:deploy': this.execute.bind(this),
    };
  }

  private get stackName(): string {
    return this.awsService.naming.getStackName();
  }

  execute(): Promise<any[]> {
    try {
      return this.getStackResources()
        .then(stackResources => this.tagCloudWatchLogGroups(stackResources))
        .then(data => data.map(item => this.serverless.cli.log(`Tagged LogGroup ${item.logGroupName} with the following tags: ${JSON.stringify(item.tags)}`)))
        .catch(err => this.serverless.cli.log(JSON.stringify(err, null, 2)));
    } catch (error) {
      console.log(`Error while trying to tag log groups: ${JSON.stringify(error, null, 2)}`);
    }
  }

  getStackResources(): Promise<StackResourceSummary[]> {
    const stackName = this.stackName;
    // tslint:disable-next-line:no-this-assignment
    const self = this;
    return (async function fetchResources({ data = [], nextToken }: FetchResourcesParams) {
      const batch: StackResources = await self.cloudFormationService.listStackResources({ StackName: stackName, NextToken: nextToken }).promise();
      if (batch.NextToken) {
        return fetchResources({ data: [...data, ...batch.StackResourceSummaries], nextToken: batch.NextToken });
      }
      return [...data, ...batch.StackResourceSummaries];
    })({} as FetchResourcesParams);
  }

  tagCloudWatchLogGroups(stackResources: StackResourceSummary[]): Promise<any[]> {
    const cloudWatchResources: StackResourceSummary[] = stackResources.filter(resource => resource.ResourceType === 'AWS::Logs::LogGroup');
    const { custom } = this.serverless.service;
    const promises = cloudWatchResources.map((resource: StackResourceSummary) => {
      return new Promise(async (resolve, _) => {
        const params = {
          logGroupName: resource.PhysicalResourceId,
          tags: custom.cloudWatchLogsTags,
        } as TagLogGroupsParams;
        if (custom.addLambdaTagsOnLogGroups && custom.customTagsFromLambda) {
          await this.handleTagsFromLambda(resource, custom.customTagsFromLambda, params);
        }
        await this.cloudWatchLogsService.tagLogGroup(params).promise();
        return resolve(params);
      });
    });
    return Promise.all(promises);
  }

  async handleTagsFromLambda(resource: StackResourceSummary, customTagsFromLambda: string[], params: TagLogGroupsParams): Promise<void> {
    if (resource.PhysicalResourceId.startsWith('/aws/lambda/')) {
      const lambdaName = resource.PhysicalResourceId.replace('/aws/lambda/', '');
      const lambdaResource = await this.lambdaService.getFunction({ FunctionName: lambdaName }).promise();
      if (customTagsFromLambda) {
        customTagsFromLambda.forEach(tag => lambdaResource.Tags[tag] && (params.tags[tag] = lambdaResource.Tags[tag]));
      }
    }
  }
}

export = ServerlessCloudWatchLogsTagPlugin;
