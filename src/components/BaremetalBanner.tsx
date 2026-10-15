import { Alert } from '@patternfly/react-core';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useCvmPeerPods, useInfrastructurePlatform } from '../k8s/hooks';

/**
 * shouldShowBaremetalBanner — pure function that determines whether to show the banner.
 * Returns true only when:
 * - platform detection is complete
 * - platform is known (not undefined)
 * - platform is neither 'BareMetal' nor 'None'
 * - confidential VM peer pods are not enabled
 */
export const shouldShowBaremetalBanner = (
  platform: string | undefined,
  loaded: boolean,
  cvmPeerPods: boolean,
): boolean => {
  // Must have completed platform detection
  if (!loaded) return false;
  // Platform must be known
  if (platform === undefined) return false;
  // Must not be bare-metal (where on-node TEE is available)
  if (platform === 'BareMetal') return false;
  // Must not be None
  if (platform === 'None') return false;
  // Must not have CVM peer pods as an alternative
  if (cvmPeerPods) return false;
  // All checks passed: show the banner
  return true;
};

const BaremetalBanner: FC = () => {
  const { t } = useTranslation('plugin__coco-openshift-console-plugin');
  const [platform, loaded] = useInfrastructurePlatform();
  const cvmPeerPods = useCvmPeerPods();

  if (!shouldShowBaremetalBanner(platform, loaded, cvmPeerPods)) {
    return null;
  }

  return (
    <Alert
      variant="warning"
      isInline
      title={t('Unsupported infrastructure')}
      className="coco-openshift-console-plugin__mb"
    >
      {t(
        'Confidential containers with on-node TEE require bare-metal infrastructure. This cluster reports platform "{{platform}}". The setup steps below apply to bare-metal only; on this infrastructure consider using peer pods with Confidential VMs (kata-remote) instead.',
        { platform },
      )}
    </Alert>
  );
};

export default BaremetalBanner;
