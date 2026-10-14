import { PrometheusEndpoint, usePrometheusPoll } from '@openshift-console/dynamic-plugin-sdk';
import {
  Alert,
  Card,
  CardBody,
  CardTitle,
  Flex,
  FlexItem,
  Skeleton,
} from '@patternfly/react-core';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import './coco.css';

interface Props {
  namespace: string;
  podName: string;
}

const DURATION = '[5m]';

const MetricChart: FC<{ title: string; query: string; unit?: string }> = ({
  title,
  query,
  unit,
}) => {
  const { t } = useTranslation('plugin__coco-openshift-console-plugin');
  const [result, , loading] = usePrometheusPoll({ query, endpoint: PrometheusEndpoint.QUERY });
  const value = (result as { data?: { result?: { value?: [number, string] }[] } })?.data
    ?.result?.[0]?.value?.[1];

  return (
    <Card isCompact>
      <CardTitle>{title}</CardTitle>
      <CardBody>
        {loading ? (
          <Skeleton width="5rem" height="2rem" />
        ) : value !== undefined ? (
          <span className="coco-openshift-console-plugin__stat-value">
            {typeof value === 'string' ? parseFloat(value).toFixed(2) : value}
            {unit ? ` ${unit}` : ''}
          </span>
        ) : (
          <span className="coco-openshift-console-plugin__muted">{t('No data')}</span>
        )}
      </CardBody>
    </Card>
  );
};

export const WorkloadMetrics: FC<Props> = ({ namespace, podName }) => {
  const { t } = useTranslation('plugin__coco-openshift-console-plugin');
  const cpuQuery = `rate(container_cpu_usage_seconds_total{namespace="${namespace}",pod="${podName}",container!="POD",container!=""}${DURATION})`;
  const memQuery = `container_memory_working_set_bytes{namespace="${namespace}",pod="${podName}",container!="POD",container!=""}`;
  const netRxQuery = `rate(container_network_receive_bytes_total{namespace="${namespace}",pod="${podName}"}${DURATION})`;
  const netTxQuery = `rate(container_network_transmit_bytes_total{namespace="${namespace}",pod="${podName}"}${DURATION})`;
  const fsReadQuery = `rate(container_fs_reads_bytes_total{namespace="${namespace}",pod="${podName}",container!="POD",container!=""}${DURATION})`;
  const fsWriteQuery = `rate(container_fs_writes_bytes_total{namespace="${namespace}",pod="${podName}",container!="POD",container!=""}${DURATION})`;

  return (
    <div>
      <Alert
        variant="info"
        isInline
        title={t('Metrics for confidential workloads')}
        className="coco-openshift-console-plugin__mb"
      >
        {t(
          'Some metrics may be unavailable for kata-cc workloads because cadvisor cannot see inside the confidential guest VM. Network and filesystem metrics from the hypervisor layer may still report.',
        )}
      </Alert>
      <Flex gap={{ default: 'gapMd' }} flexWrap={{ default: 'wrap' }}>
        <FlexItem grow={{ default: 'grow' }}>
          <MetricChart title={t('CPU usage (cores)')} query={cpuQuery} unit={t('cores')} />
        </FlexItem>
        <FlexItem grow={{ default: 'grow' }}>
          <MetricChart title={t('Memory working set')} query={memQuery} unit="bytes" />
        </FlexItem>
        <FlexItem grow={{ default: 'grow' }}>
          <MetricChart title={t('Network receive')} query={netRxQuery} unit="B/s" />
        </FlexItem>
        <FlexItem grow={{ default: 'grow' }}>
          <MetricChart title={t('Network transmit')} query={netTxQuery} unit="B/s" />
        </FlexItem>
        <FlexItem grow={{ default: 'grow' }}>
          <MetricChart title={t('Filesystem reads')} query={fsReadQuery} unit="B/s" />
        </FlexItem>
        <FlexItem grow={{ default: 'grow' }}>
          <MetricChart title={t('Filesystem writes')} query={fsWriteQuery} unit="B/s" />
        </FlexItem>
      </Flex>
    </div>
  );
};

export default WorkloadMetrics;
