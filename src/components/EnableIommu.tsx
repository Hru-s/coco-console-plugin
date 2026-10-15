import {
  k8sCreate,
  useK8sWatchResource,
  type K8sResourceCommon,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  Alert,
  Button,
  CodeBlock,
  CodeBlockCode,
  ExpandableSection,
  Form,
  FormGroup,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Radio,
  TextInput,
} from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons';
import type { FC } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MachineConfigGVK, MachineConfigModel } from '../k8s/resources';
import { useCanCreateMachineConfig } from '../utils/rbac/useCocoPermissions';
import { PermissionHint } from '../utils/rbac/PermissionHint';
import {
  buildIommuMachineConfig,
  isIommuConfiguredForRole,
  IOMMU_AMD_KERNEL_ARG,
  IOMMU_INTEL_KERNEL_ARG,
  IOMMU_PASSTHROUGH_ARG,
} from '../utils/machineConfig';
import './coco.css';

type MachineConfigKind = K8sResourceCommon & {
  spec?: { kernelArguments?: string[] };
};

export const EnableIommu: FC = () => {
  const { t } = useTranslation('plugin__coco-openshift-console-plugin');
  const [canCreateMc, mcRbacLoading] = useCanCreateMachineConfig();

  const [mcs, mcsLoaded] = useK8sWatchResource<MachineConfigKind[]>({
    groupVersionKind: MachineConfigGVK,
    isList: true,
  });

  const [vendor, setVendor] = useState<'intel' | 'amd'>('intel');
  const [role, setRole] = useState('worker');

  // Check if IOMMU is already configured for the selected role and vendor
  const applied = isIommuConfiguredForRole(mcs ?? [], role, vendor);

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const toCreate = buildIommuMachineConfig(role, vendor);
  const kernelArgs =
    vendor === 'intel'
      ? `${IOMMU_INTEL_KERNEL_ARG}  ${IOMMU_PASSTHROUGH_ARG}`
      : `${IOMMU_AMD_KERNEL_ARG}  ${IOMMU_PASSTHROUGH_ARG}`;

  const onCreate = async () => {
    // Guard against invalid form and duplicate submission
    if (!role.trim() || !canCreateMc || busy) {
      return;
    }

    setBusy(true);
    setError(undefined);
    try {
      await k8sCreate({ model: MachineConfigModel, data: toCreate });
      setOpen(false);
    } catch (e) {
      // Only suppress 409 if the configuration already exists; otherwise, show the error
      const msg = e instanceof Error ? e.message : String(e);
      if (/409|already exists|alreadyexists|conflict/i.test(msg)) {
        // Verify that the existing config actually has the desired setup
        const existing = (mcs ?? []).find(
          (mc) =>
            mc.metadata?.name === toCreate.metadata?.name ||
            (mc.metadata?.labels?.['machineconfiguration.openshift.io/role'] === role &&
              mc.spec?.kernelArguments?.some(
                (arg) =>
                  (vendor === 'intel' && arg === IOMMU_INTEL_KERNEL_ARG) ||
                  (vendor === 'amd' && arg === IOMMU_AMD_KERNEL_ARG),
              )),
        );
        if (!existing) {
          setError(
            t(
              'A conflicting IOMMU MachineConfig already exists for this role. Remove it and try again.',
            ),
          );
        } else {
          setOpen(false);
        }
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  if (applied) {
    return (
      <Label color="green" icon={<CheckCircleIcon />}>
        {t('IOMMU enabled')}
      </Label>
    );
  }

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => {
          setOpen(true);
        }}
        isDisabled={!mcsLoaded}
      >
        {t('Enable IOMMU')}
      </Button>
      {open && (
        <Modal
          isOpen
          variant="medium"
          onClose={() => {
            setOpen(false);
          }}
        >
          <ModalHeader title={t('Enable IOMMU for confidential GPU')} />
          <ModalBody>
            <p className="coco-openshift-console-plugin__mb">
              {t(
                'Confidential GPU workloads (kata-cc-nvidia-gpu) require IOMMU passthrough for the GPU device. This creates a MachineConfig that adds the required kernel arguments to the target MachineConfigPool.',
              )}
            </p>
            <Alert
              variant="info"
              isInline
              title={t('Tech Preview')}
              className="coco-openshift-console-plugin__mb"
            >
              {t(
                'Confidential GPU support is a Tech Preview feature. It requires NVIDIA H100 GPUs on bare metal with the NVIDIA GPU Operator configured for confidential computing.',
              )}
            </Alert>
            <Form>
              <FormGroup label={t('CPU vendor')} fieldId="iommu-vendor" role="radiogroup">
                <Radio
                  id="iommu-vendor-intel"
                  name="iommu-vendor"
                  label={t('Intel (intel_iommu=on)')}
                  isChecked={vendor === 'intel'}
                  onChange={() => {
                    setVendor('intel');
                  }}
                />
                <Radio
                  id="iommu-vendor-amd"
                  name="iommu-vendor"
                  label={t('AMD (amd_iommu=on)')}
                  isChecked={vendor === 'amd'}
                  onChange={() => {
                    setVendor('amd');
                  }}
                />
              </FormGroup>
              <FormGroup label={t('MachineConfigPool role')} fieldId="iommu-role">
                <TextInput
                  id="iommu-role"
                  value={role}
                  onChange={(_e, v) => {
                    setRole(v);
                  }}
                />
              </FormGroup>
              <FormGroup label={t('Kernel arguments')} fieldId="iommu-args">
                <span className="coco-openshift-console-plugin__mono">{kernelArgs}</span>
              </FormGroup>
            </Form>

            <Alert
              variant="warning"
              isInline
              title={t('Nodes will reboot')}
              className="coco-openshift-console-plugin__mt"
            >
              {t(
                'Applying this MachineConfig rolls out a reboot to every node in the "{{role}}" pool, one at a time.',
                { role },
              )}
            </Alert>

            <ExpandableSection
              toggleText={t('Resource to create')}
              className="coco-openshift-console-plugin__mt"
            >
              <CodeBlock>
                <CodeBlockCode>{JSON.stringify(toCreate, null, 2)}</CodeBlockCode>
              </CodeBlock>
            </ExpandableSection>
            {error && (
              <Alert
                variant="danger"
                isInline
                title={t('Could not enable IOMMU')}
                className="coco-openshift-console-plugin__mt"
              >
                {error}
              </Alert>
            )}
            <PermissionHint allowed={canCreateMc} loading={mcRbacLoading || !mcsLoaded} />
          </ModalBody>
          <ModalFooter>
            <Button
              variant="primary"
              onClick={() => void onCreate()}
              isLoading={busy}
              isDisabled={
                busy || role.trim() === '' || applied || mcRbacLoading || !mcsLoaded || !canCreateMc
              }
            >
              {t('Enable and reboot')}
            </Button>
            <Button
              variant="link"
              onClick={() => {
                setOpen(false);
              }}
              isDisabled={busy}
            >
              {t('Cancel')}
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </>
  );
};

export default EnableIommu;
