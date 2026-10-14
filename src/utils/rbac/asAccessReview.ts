import type { AccessReviewResourceAttributes, K8sModel } from '@openshift-console/dynamic-plugin-sdk';

export const asAccessReview = (
  model: K8sModel,
  verb: AccessReviewResourceAttributes['verb'],
  namespace?: string,
): AccessReviewResourceAttributes => ({
  group: model.apiGroup ?? '',
  resource: model.plural,
  verb,
  ...(namespace ? { namespace } : {}),
});
