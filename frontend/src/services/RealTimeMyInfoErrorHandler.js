/**
 * RealTimeMyInfoErrorHandler - Advanced error handling system for MyInfo
 * Provides real-time monitoring, proactive error detection, and intelligent retry mechanisms
 */

import MyInfoServiceMonitor from './MyInfoServiceMonitor';

class RealTimeMyInfoErrorHandler {
  constructor(options = {}) {
    this.options = {
      enableRealTimeMonitoring: true,
      enableProactiveChecking: true,
      enableAutoRetry: true,
      maxRetryAttempts: 3,
      retryDelay: 1000,
      healthCheckInterval: 30000,
      ...options
    };

    // Initialize service monitor
    this.serviceMonitor = new MyInfoServiceMonitor();
    
    // Error handling state
    this.errorHistory = [];
    this.isMonitoring = false;
    this.lastErrorTime = null;
    this.consecutiveErrors = 0;
    
    // Event handlers
    this.errorHandlers = [];
    this.statusChangeHandlers = [];
    this.retryHandlers = [];
    
    // Real-time monitoring
    if (this.options.enableRealTimeMonitoring) {
      this.initializeRealTimeMonitoring();
    }
  }

  /**
   * Initialize real-time monitoring
   */
  initializeRealTimeMonitoring() {
    this.isMonitoring = true;
    
    // Listen to network changes
    this.serviceMonitor.onNetworkStatusChange((event) => {
      this.handleNetworkStatusChange(event);
    });
    
    // Listen to service status changes
    this.serviceMonitor.onServiceStatusChange((event) => {
      this.handleServiceStatusChange(event);
    });
    
    console.log('🔍 Real-time MyInfo monitoring initialized');
  }

  /**
   * Handle network status changes
   */
  handleNetworkStatusChange(event) {
    const { status, timestamp } = event;
    
    console.log(`🌐 Network status changed to: ${status} at ${timestamp.toISOString()}`);
    
    if (status === 'offline') {
      this.notifyError({
        type: 'network_offline',
        message: 'Internet connection lost. Please check your network and try again.',
        severity: 'high',
        timestamp,
        category: 'network',
        suggestedAction: 'check_connection'
      });
    } else if (status === 'online') {
      console.log('🌐 Network connectivity restored - checking MyInfo service availability');
      this.checkServiceAvailability();
    }
    
    this.notifyStatusChange({ type: 'network', status, timestamp });
  }

  /**
   * Handle service status changes
   */
  handleServiceStatusChange(event) {
    const { status, error, responseTime, timestamp } = event;
    
    console.log(`🔧 MyInfo service status: ${status} (${responseTime}ms) at ${timestamp.toISOString()}`);
    
    if (status === 'unavailable') {
      this.consecutiveErrors++;
      this.notifyError({
        type: 'service_unavailable',
        message: 'MyInfo service is currently unavailable. You can continue with manual entry.',
        severity: 'high',
        timestamp,
        category: 'service',
        suggestedAction: 'manual_entry',
        technicalDetails: error
      });
    } else if (status === 'degraded') {
      this.notifyError({
        type: 'service_degraded',
        message: 'MyInfo service is experiencing slow response times. Please be patient or try again later.',
        severity: 'medium',
        timestamp,
        category: 'performance',
        suggestedAction: 'retry_later',
        responseTime
      });
    } else if (status === 'healthy') {
      this.consecutiveErrors = 0; // Reset error count
      console.log('✅ MyInfo service is healthy');
    }
    
    this.notifyStatusChange({ type: 'service', status, responseTime, timestamp });
  }

  /**
   * Proactively check service availability before authentication
   */
  async checkServiceAvailability() {
    if (!this.options.enableProactiveChecking) {
      return { available: true, status: 'unknown' };
    }

    try {
      console.log('🔍 Checking MyInfo service availability...');
      const availability = await this.serviceMonitor.isServiceAvailable();
      
      if (!availability.available) {
        const errorInfo = {
          type: 'preauth_check_failed',
          message: this.generateUserFriendlyMessage(availability.status),
          severity: availability.status === 'unavailable' ? 'high' : 'medium',
          timestamp: new Date(),
          category: 'service',
          suggestedAction: availability.status === 'unavailable' ? 'manual_entry' : 'retry_later',
          technicalDetails: availability
        };
        
        this.notifyError(errorInfo);
        return { available: false, error: errorInfo };
      }
      
      console.log('✅ MyInfo service is available');
      return { available: true, status: availability.status };
      
    } catch (error) {
      console.error('🚨 Error checking service availability:', error);
      
      const categorizedError = this.serviceMonitor.categorizeError(error);
      const errorInfo = {
        type: 'preauth_check_error',
        message: categorizedError.userMessage,
        severity: categorizedError.severity,
        timestamp: new Date(),
        category: categorizedError.category,
        suggestedAction: categorizedError.suggestedAction,
        technicalDetails: error.message
      };
      
      this.notifyError(errorInfo);
      return { available: false, error: errorInfo };
    }
  }

  /**
   * Handle authentication errors with intelligent retry
   */
  async handleAuthenticationError(error, authFunction) {
    const timestamp = new Date();
    this.lastErrorTime = timestamp;
    
    console.error('🚨 MyInfo authentication error:', error);
    
    // Categorize the error
    const categorizedError = this.serviceMonitor.categorizeError(error);
    
    // Create error info
    const errorInfo = {
      type: 'authentication_error',
      originalError: error,
      message: categorizedError.userMessage,
      severity: categorizedError.severity,
      timestamp,
      category: categorizedError.category,
      suggestedAction: categorizedError.suggestedAction,
      technicalDetails: categorizedError.technicalMessage
    };
    
    // Add to error history
    this.errorHistory.push(errorInfo);
    
    // Attempt auto-retry if enabled and appropriate
    if (this.options.enableAutoRetry && this.shouldRetry(categorizedError)) {
      try {
        console.log('🔄 Attempting auto-retry for MyInfo authentication...');
        this.notifyRetryAttempt({ attempt: 1, maxAttempts: this.options.maxRetryAttempts });
        
        const result = await this.serviceMonitor.attemptRetry(
          authFunction, 
          this.options.maxRetryAttempts
        );
        
        console.log('✅ Auto-retry succeeded');
        return { success: true, result };
        
      } catch (retryError) {
        console.error('❌ Auto-retry failed:', retryError);
        
        // Update error info with retry details
        errorInfo.retryAttempted = true;
        errorInfo.retryError = retryError.message;
        errorInfo.message = `${categorizedError.userMessage} Auto-retry also failed.`;
      }
    }
    
    // Notify error handlers
    this.notifyError(errorInfo);
    
    return { success: false, error: errorInfo };
  }

  /**
   * Determine if retry should be attempted
   */
  shouldRetry(categorizedError) {
    // Don't retry for network issues or maintenance
    if (categorizedError.category === 'network' || categorizedError.category === 'maintenance') {
      return false;
    }
    
    // Don't retry if too many consecutive errors
    if (this.consecutiveErrors >= this.options.maxRetryAttempts) {
      return false;
    }
    
    // Don't retry if recent error (within last 30 seconds)
    if (this.lastErrorTime && (Date.now() - this.lastErrorTime.getTime()) < 30000) {
      return false;
    }
    
    return true;
  }

  /**
   * Generate user-friendly message based on service status
   */
  generateUserFriendlyMessage(status) {
    switch (status) {
      case 'unavailable':
        return 'MyInfo service is currently unavailable. You can continue by filling out the form manually.';
      case 'degraded':
        return 'MyInfo service is experiencing slow response times. You may proceed manually or try again later.';
      case 'unknown':
        return 'Unable to verify MyInfo service status. You can continue with manual entry if needed.';
      default:
        return 'MyInfo service status is uncertain. You can proceed with manual entry if authentication fails.';
    }
  }

  /**
   * Get current system status
   */
  getSystemStatus() {
    const serviceStatus = this.serviceMonitor.getServiceStatus();
    
    return {
      isMonitoring: this.isMonitoring,
      network: {
        online: serviceStatus.isOnline
      },
      service: {
        status: serviceStatus.status,
        lastHealthCheck: serviceStatus.lastHealthCheck,
        retryAttempts: serviceStatus.retryAttempts
      },
      errors: {
        total: this.errorHistory.length,
        consecutive: this.consecutiveErrors,
        lastError: this.lastErrorTime,
        recent: this.errorHistory.slice(-5) // Last 5 errors
      }
    };
  }

  /**
   * Get error recommendations based on current status
   */
  getErrorRecommendations() {
    const systemStatus = this.getSystemStatus();
    const recommendations = [];
    
    if (!systemStatus.network.online) {
      recommendations.push({
        type: 'network',
        priority: 'high',
        action: 'Check your internet connection',
        description: 'Ensure you have a stable internet connection before proceeding.'
      });
    }
    
    if (systemStatus.service.status === 'unavailable') {
      recommendations.push({
        type: 'service',
        priority: 'high',
        action: 'Use manual entry',
        description: 'MyInfo is currently unavailable. Proceed with manual form completion.'
      });
    }
    
    if (systemStatus.service.status === 'degraded') {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        action: 'Wait and retry',
        description: 'MyInfo is slow. Wait a few minutes and try again, or proceed manually.'
      });
    }
    
    if (systemStatus.errors.consecutive > 2) {
      recommendations.push({
        type: 'recurring',
        priority: 'high',
        action: 'Manual entry recommended',
        description: 'Multiple errors detected. Manual entry is recommended at this time.'
      });
    }
    
    return recommendations;
  }

  /**
   * Subscribe to error notifications
   */
  onError(callback) {
    this.errorHandlers.push(callback);
    return () => {
      this.errorHandlers = this.errorHandlers.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe to status change notifications
   */
  onStatusChange(callback) {
    this.statusChangeHandlers.push(callback);
    return () => {
      this.statusChangeHandlers = this.statusChangeHandlers.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe to retry attempt notifications
   */
  onRetryAttempt(callback) {
    this.retryHandlers.push(callback);
    return () => {
      this.retryHandlers = this.retryHandlers.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify error handlers
   */
  notifyError(errorInfo) {
    this.errorHandlers.forEach(callback => {
      try {
        callback(errorInfo);
      } catch (error) {
        console.error('Error in error handler callback:', error);
      }
    });
  }

  /**
   * Notify status change handlers
   */
  notifyStatusChange(statusInfo) {
    this.statusChangeHandlers.forEach(callback => {
      try {
        callback(statusInfo);
      } catch (error) {
        console.error('Error in status change callback:', error);
      }
    });
  }

  /**
   * Notify retry handlers
   */
  notifyRetryAttempt(retryInfo) {
    this.retryHandlers.forEach(callback => {
      try {
        callback(retryInfo);
      } catch (error) {
        console.error('Error in retry handler callback:', error);
      }
    });
  }

  /**
   * Stop monitoring and clean up
   */
  destroy() {
    this.isMonitoring = false;
    
    if (this.serviceMonitor) {
      this.serviceMonitor.destroy();
    }
    
    this.errorHandlers = [];
    this.statusChangeHandlers = [];
    this.retryHandlers = [];
    
    console.log('🔍 Real-time MyInfo monitoring stopped');
  }
}

export default RealTimeMyInfoErrorHandler;
