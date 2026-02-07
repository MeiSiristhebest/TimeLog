/**
 * Network Quality Service
 * 
 * Monitors network quality using lightweight probes to Supabase Edge Function.
 * Provides real-time quality assessment for AI dialog decisions.
 * 
 * Quality Metrics:
 * - RTT (Round Trip Time)
 * - Packet Loss (via probe success rate)
 * - Jitter (RTT variance)
 * 
 * Quality Levels:
 * - EXCELLENT: RTT < 100ms, packet loss < 1%
 * - GOOD: RTT < 300ms, packet loss < 3%
 * - FAIR: RTT < 500ms, packet loss < 5%
 * - POOR: RTT >= 500ms or packet loss >= 5%
 */

import { supabase } from '@/lib/supabase';

export type NetworkQuality = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'OFFLINE';

export interface NetworkMetrics {
  rtt: number; // Round trip time in ms
  packetLoss: number; // Packet loss percentage (0-100)
  jitter: number; // RTT variance in ms
  quality: NetworkQuality;
  timestamp: number;
}

const PROBE_INTERVAL_MS = 5000; // Probe every 5 seconds
const PROBE_TIMEOUT_MS = 3000; // 3 second timeout
const RTT_HISTORY_SIZE = 10; // Keep last 10 RTT measurements for jitter calculation

export class NetworkQualityService {
  private probeInterval: ReturnType<typeof setInterval> | null = null;
  private rttHistory: number[] = [];
  private probeSuccessCount = 0;
  private probeTotalCount = 0;
  private currentMetrics: NetworkMetrics | null = null;
  private listeners: Set<(metrics: NetworkMetrics) => void> = new Set();

  /**
   * Start probing network quality
   */
  start(): void {
    if (this.probeInterval) {
      return; // Already running
    }

    // Initial probe
    void this.probe();

    // Start periodic probing
    this.probeInterval = setInterval(() => {
      void this.probe();
    }, PROBE_INTERVAL_MS);
  }

  /**
   * Stop probing
   */
  stop(): void {
    if (this.probeInterval) {
      clearInterval(this.probeInterval);
      this.probeInterval = null;
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): NetworkMetrics | null {
    return this.currentMetrics;
  }

  /**
   * Subscribe to quality changes
   */
  onQualityChange(callback: (metrics: NetworkMetrics) => void): () => void {
    this.listeners.add(callback);
    
    // Send current metrics immediately
    if (this.currentMetrics) {
      callback(this.currentMetrics);
    }
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Perform network probe
   */
  private async probe(): Promise<void> {
    const startTime = Date.now();
    this.probeTotalCount++;

    try {
      // Lightweight probe to Supabase Edge Function
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

      await supabase.functions.invoke('network-probe', {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const rtt = Date.now() - startTime;
      this.probeSuccessCount++;

      // Update RTT history
      this.rttHistory.push(rtt);
      if (this.rttHistory.length > RTT_HISTORY_SIZE) {
        this.rttHistory.shift();
      }

      // Calculate metrics
      this.updateMetrics(rtt);
    } catch {
      // Probe failed - consider as offline or very poor quality
      this.updateMetrics(null);
    }
  }

  /**
   * Update metrics based on probe result
   */
  private updateMetrics(rtt: number | null): void {
    if (rtt === null) {
      // Probe failed
      this.currentMetrics = {
        rtt: -1,
        packetLoss: 100,
        jitter: 0,
        quality: 'OFFLINE',
        timestamp: Date.now(),
      };
    } else {
      // Calculate packet loss
      const packetLoss = this.probeTotalCount > 0
        ? ((this.probeTotalCount - this.probeSuccessCount) / this.probeTotalCount) * 100
        : 0;

      // Calculate jitter (RTT variance)
      const jitter = this.calculateJitter();

      // Determine quality level
      const quality = this.determineQuality(rtt, packetLoss, jitter);

      this.currentMetrics = {
        rtt,
        packetLoss,
        jitter,
        quality,
        timestamp: Date.now(),
      };
    }

    // Notify listeners
    this.listeners.forEach((listener) => {
      listener(this.currentMetrics!);
    });
  }

  /**
   * Calculate jitter (RTT variance)
   */
  private calculateJitter(): number {
    if (this.rttHistory.length < 2) {
      return 0;
    }

    const mean = this.rttHistory.reduce((sum, rtt) => sum + rtt, 0) / this.rttHistory.length;
    const variance = this.rttHistory.reduce((sum, rtt) => sum + Math.pow(rtt - mean, 2), 0) / this.rttHistory.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Determine quality level based on metrics
   */
  private determineQuality(rtt: number, packetLoss: number, jitter: number): NetworkQuality {
    // EXCELLENT: RTT < 100ms, packet loss < 1%, jitter < 20ms
    if (rtt < 100 && packetLoss < 1 && jitter < 20) {
      return 'EXCELLENT';
    }

    // GOOD: RTT < 300ms, packet loss < 3%, jitter < 50ms
    if (rtt < 300 && packetLoss < 3 && jitter < 50) {
      return 'GOOD';
    }

    // FAIR: RTT < 500ms, packet loss < 5%, jitter < 100ms
    if (rtt < 500 && packetLoss < 5 && jitter < 100) {
      return 'FAIR';
    }

    // POOR: Everything else
    return 'POOR';
  }

  /**
   * Reset counters (e.g., for new session)
   */
  reset(): void {
    this.rttHistory = [];
    this.probeSuccessCount = 0;
    this.probeTotalCount = 0;
    this.currentMetrics = null;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stop();
    this.listeners.clear();
    this.reset();
  }
}
