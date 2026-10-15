import {
  buildCpuQuery,
  buildMemoryQuery,
  buildNetworkReceiveQuery,
  buildNetworkTransmitQuery,
  buildFilesystemReadQuery,
  buildFilesystemWriteQuery,
} from '../utils/workloadMetricsQueries';

describe('WorkloadMetrics', () => {
  describe('Query builders', () => {
    it('buildCpuQuery constructs correct PromQL', () => {
      const query = buildCpuQuery('default', 'test-pod');
      expect(query).toContain('sum(rate(container_cpu_usage_seconds_total');
      expect(query).toContain('namespace="default"');
      expect(query).toContain('pod="test-pod"');
      expect(query).toContain('[5m]');
    });

    it('buildMemoryQuery constructs correct PromQL', () => {
      const query = buildMemoryQuery('default', 'test-pod');
      expect(query).toContain('sum(container_memory_working_set_bytes');
      expect(query).toContain('namespace="default"');
      expect(query).toContain('pod="test-pod"');
    });

    it('buildNetworkReceiveQuery constructs correct PromQL', () => {
      const query = buildNetworkReceiveQuery('default', 'test-pod');
      expect(query).toContain('sum(rate(container_network_receive_bytes_total');
      expect(query).toContain('[5m]');
    });

    it('buildNetworkTransmitQuery constructs correct PromQL', () => {
      const query = buildNetworkTransmitQuery('default', 'test-pod');
      expect(query).toContain('sum(rate(container_network_transmit_bytes_total');
      expect(query).toContain('[5m]');
    });

    it('buildFilesystemReadQuery constructs correct PromQL', () => {
      const query = buildFilesystemReadQuery('default', 'test-pod');
      expect(query).toContain('sum(rate(container_fs_reads_bytes_total');
      expect(query).toContain('[5m]');
    });

    it('buildFilesystemWriteQuery constructs correct PromQL', () => {
      const query = buildFilesystemWriteQuery('default', 'test-pod');
      expect(query).toContain('sum(rate(container_fs_writes_bytes_total');
      expect(query).toContain('[5m]');
    });

    it('all queries use sum() aggregation', () => {
      const queries = [
        buildCpuQuery('ns', 'pod'),
        buildMemoryQuery('ns', 'pod'),
        buildNetworkReceiveQuery('ns', 'pod'),
        buildNetworkTransmitQuery('ns', 'pod'),
        buildFilesystemReadQuery('ns', 'pod'),
        buildFilesystemWriteQuery('ns', 'pod'),
      ];

      queries.forEach((query) => {
        expect(query).toMatch(/^sum\(/);
      });
    });

    it('excludes POD system container from aggregation', () => {
      const queries = [
        buildCpuQuery('ns', 'pod'),
        buildMemoryQuery('ns', 'pod'),
        buildFilesystemReadQuery('ns', 'pod'),
        buildFilesystemWriteQuery('ns', 'pod'),
      ];

      queries.forEach((query) => {
        expect(query).toContain('container!="POD"');
      });
    });
  });
});
