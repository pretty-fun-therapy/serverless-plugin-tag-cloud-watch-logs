export type TagsType = { [key: string] : string };

type ResourceStatusType =
  string &
  'CREATE_IN_PROGRESS' |
  'CREATE_FAILED' |
  'CREATE_COMPLETE' |
  'DELETE_IN_PROGRESS' |
  'DELETE_FAILED' |
  'DELETE_COMPLETE' |
  'DELETE_SKIPPED' |
  'UPDATE_IN_PROGRESS' |
  'UPDATE_FAILED' |
  'UPDATE_COMPLETE';

export interface TagLogGroupsParams {
  logGroupName: string;
  tags: TagsType;
}

export interface FetchResourcesParams {
  data: any[];
  nextToken: string;
}

export interface StackResources {
  StackResourceSummaries: StackResourceSummary[];
  NextToken: string;
}

export interface StackResourceSummary {
  LogicalResourceId: string;
  PhysicalResourceId?: string;
  ResourceType: string;
  LastUpdatedTimestamp: string;
  ResourceStatus: ResourceStatusType;
  ResourceStatusReason?: string;
  DriftInformation?: any;
}
