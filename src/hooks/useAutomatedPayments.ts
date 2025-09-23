/**
 * Automated Payments Hook
 * Automatically handles payment monitoring and processing
 */

import { useEffect } from 'react';
import automatedPaymentMonitor from '../services/payment/automatedPaymentMonitor';
import webhookProcessor from '../services/webhook/webhookProcessor';

export const useAutomatedPayments = (enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;
    
    // Start monitoring when component mounts
    automatedPaymentMonitor.startMonitoring(30000); // Check every 30 seconds
    
    // Process any existing completed payments on startup
    setTimeout(() => {
      automatedPaymentMonitor.processExistingCompletedPayments();
    }, 2000); // Wait 2 seconds after app start
    
    // Cleanup when component unmounts
    return () => {
      automatedPaymentMonitor.stopMonitoring();
    };
  }, [enabled]);
  
  // Helper functions for manual testing
  const simulatePayment = async (orderId: string) => {
    await automatedPaymentMonitor.simulateWebhookForOrder(orderId);
  };
  
  const checkPayments = async () => {
    await automatedPaymentMonitor.checkAndProcessPendingPayments();
  };
  
  const processExisting = async () => {
    await automatedPaymentMonitor.processExistingCompletedPayments();
  };
  
  return {
    simulatePayment,
    checkPayments,
    processExisting,
    isMonitoring: automatedPaymentMonitor.getMonitoringStatus().isMonitoring,
  };
};