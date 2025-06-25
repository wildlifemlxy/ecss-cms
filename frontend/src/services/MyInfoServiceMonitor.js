/**
 * MyInfoServiceMonitor - Real-time service monitoring for MyInfo
 * Provides proactive service health checking, network monitoring, and error categorization
 */

class MyInfoServiceMonitor {
  constructor() {
    this.isOnline = navigator.onLine;
    this.serviceStatus = 'unknown'; // 'healthy', 'degraded', 'unavailable', 'unknown'
    this.lastHealthCheck = null;
    this.healthCheckInterval = null;
    this.retryAttempts = 0;
    this.maxRetryAttempts = 3;
    this.healthCheckIntervalMs = 30000; // 30 seconds
    this.timeoutMs = 10000; // 10 seconds
    
    // Event listeners for real-time monitoring
    this.networkListeners = [];
    this.serviceListeners = [];
    
    // Initialize monitoring
    this.initializeNetworkMonitoring();
    this.startHealthMonitoring();
  }

  /**
   * Initialize network connectivity monitoring
   */
  initializeNetworkMonitoring() {
    const handleOnline = () => {
      console.log('🌐 Network connectivity restored');
      this.isOnline = true;
      this.notifyNetworkStatusChange('online');
      this.performHealthCheck(); // Check services when network comes back
    };

    const handleOffline = () => {
      console.log('🌐 Network connectivity lost');
      this.isOnline = false;
      this.serviceStatus = 'unavailable';
      this.notifyNetworkStatusChange('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Store references for cleanup
    this.networkCleanup = () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  /**
   * Start periodic health monitoring
   */
  startHealthMonitoring() {
    // Perform initial health check
    this.performHealthCheck();
    
    // Set up periodic monitoring
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.healthCheckIntervalMs);
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    if (this.networkCleanup) {
      this.networkCleanup();
    }
  }

  /**
   * Perform health check on MyInfo service endpoints
   */
  async performHealthCheck() {
    if (!this.isOnline) {
      this.serviceStatus = 'unavailable';
      return { status: 'unavailable', reason: 'No network connectivity' };
    }

    const startTime = Date.now();
    
    try {
      // Check SingPass authorization endpoint
      //const authEndpoint = "https://stg-id.singpass.gov.sg";
      const authEndpoint = "https://id.singpass.gov.sg";
      const healthCheckPromise = this.checkEndpoint(authEndpoint);
      
      const result = await Promise.race([
        healthCheckPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), this.timeoutMs)
        )
      ]);

      const responseTime = Date.now() - startTime;
      
      if (result.ok) {
        this.serviceStatus = responseTime > 5000 ? 'degraded' : 'healthy';
        this.retryAttempts = 0; // Reset retry count on success
        this.lastHealthCheck = new Date();
        
        const healthInfo = {
          status: this.serviceStatus,
          responseTime,
          timestamp: this.lastHealthCheck
        };
        
        this.notifyServiceStatusChange(healthInfo);
        return healthInfo;
      } else {
        throw new Error(`HTTP ${result.status}: ${result.statusText}`);
      }
      
    } catch (error) {
      console.warn('🔍 MyInfo health check failed:', error.message);
      
      this.retryAttempts++;
      this.serviceStatus = this.retryAttempts >= this.maxRetryAttempts ? 'unavailable' : 'degraded';
      
      const healthInfo = {
        status: this.serviceStatus,
        error: error.message,
        retryAttempts: this.retryAttempts,
        timestamp: new Date()
      };
      
      this.notifyServiceStatusChange(healthInfo);
      return healthInfo;
    }
  }

  /**
   * Check specific endpoint availability
   */
  async checkEndpoint(url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      // Use a simple HEAD request or CORS-friendly approach
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors', // Avoid CORS issues for health checks
        signal: controller.signal,
        cache: 'no-cache'
      });
      
      clearTimeout(timeoutId);
      return { ok: true, status: response.status, statusText: response.statusText };
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle AbortError specifically
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      // For no-cors mode, we might not get detailed error info
      // Try alternative check methods
      return this.fallbackConnectivityCheck();
    }
  }

  /**
   * Fallback connectivity check using image loading
   */
  async fallbackConnectivityCheck() {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        reject(new Error('Connectivity check timeout'));
      }, this.timeoutMs);

      img.onload = () => {
        clearTimeout(timeout);
        resolve({ ok: true, status: 200, statusText: 'OK' });
      };

      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Connectivity check failed'));
      };

      // Use a small, fast-loading image for connectivity test
      img.src = 'https://www.google.com/favicon.ico?' + Date.now();
    });
  }

  /**
   * Check if MyInfo service is available before authentication
   */
  async isServiceAvailable() {
    const currentStatus = this.getServiceStatus();
    
    // If we don't have recent data, perform a fresh check
    if (!this.lastHealthCheck || 
        (Date.now() - this.lastHealthCheck.getTime()) > this.healthCheckIntervalMs) {
      await this.performHealthCheck();
    }
    
    return {
      available: this.serviceStatus === 'healthy' || this.serviceStatus === 'degraded',
      status: this.serviceStatus,
      lastCheck: this.lastHealthCheck,
      networkOnline: this.isOnline
    };
  }

  /**
   * Get current service status
   */
  getServiceStatus() {
    return {
      status: this.serviceStatus,
      isOnline: this.isOnline,
      lastHealthCheck: this.lastHealthCheck,
      retryAttempts: this.retryAttempts
    };
  }

  /**
   * Categorize error types for better user experience
   */
  categorizeError(error) {
    const errorMessage = error.message || error.toString();
    
    if (!this.isOnline || errorMessage.includes('network') || errorMessage.includes('connectivity')) {
      return {
        category: 'network',
        severity: 'high',
        userMessage: 'Please check your internet connection and try again.',
        technicalMessage: errorMessage,
        suggestedAction: 'check_connection'
      };
    }
    
    if (errorMessage.includes('timeout') || errorMessage.includes('slow')) {
      return {
        category: 'performance',
        severity: 'medium',
        userMessage: 'MyInfo service is responding slowly. Please wait a moment and try again.',
        technicalMessage: errorMessage,
        suggestedAction: 'retry_later'
      };
    }
    
    if (errorMessage.includes('maintenance') || errorMessage.includes('scheduled')) {
      return {
        category: 'maintenance',
        severity: 'high',
        userMessage: 'MyInfo is currently undergoing maintenance. Please try again later.',
        technicalMessage: errorMessage,
        suggestedAction: 'manual_entry'
      };
    }
    
    if (errorMessage.includes('unavailable') || errorMessage.includes('service')) {
      return {
        category: 'service_unavailable',
        severity: 'high',
        userMessage: 'MyInfo service is temporarily unavailable. You can continue with manual entry.',
        technicalMessage: errorMessage,
        suggestedAction: 'manual_entry'
      };
    }
    
    // Default categorization
    return {
      category: 'unknown',
      severity: 'medium',
      userMessage: 'There was an issue connecting to MyInfo. You can proceed with manual entry.',
      technicalMessage: errorMessage,
      suggestedAction: 'manual_entry'
    };
  }

  /**
   * Attempt auto-retry with intelligent backoff
   */
  async attemptRetry(operation, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Retry attempt ${attempt}/${maxRetries}`);
        
        // Check if service is available before retry
        const availability = await this.isServiceAvailable();
        if (!availability.available && availability.status === 'unavailable') {
          throw new Error('Service is unavailable, skipping retry');
        }
        
        const result = await operation();
        console.log(`✅ Retry attempt ${attempt} succeeded`);
        return result;
        
      } catch (error) {
        lastError = error;
        console.warn(`❌ Retry attempt ${attempt} failed:`, error.message);
        
        // Don't retry if it's a network issue or user cancelled
        if (error.message.includes('network') || error.message.includes('cancelled')) {
          break;
        }
        
        // Progressive backoff: 1s, 2s, 4s
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          console.log(`⏳ Waiting ${delay}ms before next retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Subscribe to network status changes
   */
  onNetworkStatusChange(callback) {
    this.networkListeners.push(callback);
    return () => {
      this.networkListeners = this.networkListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe to service status changes
   */
  onServiceStatusChange(callback) {
    this.serviceListeners.push(callback);
    return () => {
      this.serviceListeners = this.serviceListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify network status change
   */
  notifyNetworkStatusChange(status) {
    this.networkListeners.forEach(callback => {
      try {
        callback({ type: 'network', status, timestamp: new Date() });
      } catch (error) {
        console.error('Error in network status callback:', error);
      }
    });
  }

  /**
   * Notify service status change
   */
  notifyServiceStatusChange(statusInfo) {
    this.serviceListeners.forEach(callback => {
      try {
        callback({ type: 'service', ...statusInfo });
      } catch (error) {
        console.error('Error in service status callback:', error);
      }
    });
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stopHealthMonitoring();
    this.networkListeners = [];
    this.serviceListeners = [];
  }
}

export default MyInfoServiceMonitor;
