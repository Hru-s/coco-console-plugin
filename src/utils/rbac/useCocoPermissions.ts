import { useAccessReview } from '@openshift-console/dynamic-plugin-sdk';
import {
  ConfigMapModel,
  KataConfigModel,
  MachineConfigModel,
  NodeFeatureRuleModel,
  JobModel,
  PodModel,
  DeploymentModel,
  OSC_NAMESPACE,
} from '../../k8s/resources';
import { asAccessReview } from './asAccessReview';

export const useCanPatchFeatureGates = () =>
  useAccessReview({ ...asAccessReview(ConfigMapModel, 'patch', OSC_NAMESPACE) });

export const useCanCreateKataConfig = () =>
  useAccessReview({ ...asAccessReview(KataConfigModel, 'create') });

export const useCanCreateMachineConfig = () =>
  useAccessReview({ ...asAccessReview(MachineConfigModel, 'create') });

export const useCanCreateNodeFeatureRule = () =>
  useAccessReview({ ...asAccessReview(NodeFeatureRuleModel, 'create', 'openshift-nfd') });

export const useCanCreateJob = (namespace: string) =>
  useAccessReview({ ...asAccessReview(JobModel, 'create', namespace) });

export const useCanCreatePod = (namespace: string) =>
  useAccessReview({ ...asAccessReview(PodModel, 'create', namespace) });

export const useCanCreateDeployment = (namespace: string) =>
  useAccessReview({ ...asAccessReview(DeploymentModel, 'create', namespace) });

export const useCanDeletePod = (namespace: string) =>
  useAccessReview({ ...asAccessReview(PodModel, 'delete', namespace) });

export const useCanDeleteDeployment = (namespace: string) =>
  useAccessReview({ ...asAccessReview(DeploymentModel, 'delete', namespace) });

export const useCanCreateSubscription = (namespace: string) =>
  useAccessReview({
    group: 'operators.coreos.com',
    resource: 'subscriptions',
    namespace,
    verb: 'create',
  });
