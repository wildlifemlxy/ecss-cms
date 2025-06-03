import React, { Component } from 'react';
import './MyInfoStatusIndicator.css';

/**
 * MyInfoStatusIndicator - Real-time status indicator for MyInfo service
 * Shows current service status, network connectivity, and provides user feedback
 */
class MyInfoStatusIndicator extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      serviceStatus: 'unknown', // 'healthy', 'degraded', 'unavailable', 'unknown'
      networkOnline: navigator.onLine,
      lastCheck: null,
      isVisible: true,
      showDetails: false,
      errorCount: 0,
      recommendations: []
    };
  }

  componentDidMount() {
    // Listen to props changes for status updates
    this.updateStatus();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.errorHandler !== this.props.errorHandler) {
      this.updateStatus();
    }
  }

  updateStatus = () => {
    const { errorHandler } = this.props;
    
    if (errorHandler) {
      const systemStatus = errorHandler.getSystemStatus();
      const recommendations = errorHandler.getErrorRecommendations();
      
      this.setState({
        serviceStatus: systemStatus.service.status,
        networkOnline: systemStatus.network.online,
        lastCheck: systemStatus.service.lastHealthCheck,
        errorCount: systemStatus.errors.consecutive,
        recommendations
      });
    }
  };

  getStatusConfig = () => {
    const { serviceStatus, networkOnline } = this.state;
    
    if (!networkOnline) {
      return {
        status: 'offline',
        color: '#e74c3c',
        icon: '🌐',
        label: 'Offline',
        message: 'No internet connection'
      };
    }
    
    switch (serviceStatus) {
      case 'healthy':
        return {
          status: 'healthy',
          color: '#27ae60',
          icon: '✅',
          label: 'Online',
          message: 'MyInfo service is working normally'
        };
      case 'degraded':
        return {
          status: 'degraded',
          color: '#f39c12',
          icon: '⚠️',
          label: 'Slow',
          message: 'MyInfo service is responding slowly'
        };
      case 'unavailable':
        return {
          status: 'unavailable',
          color: '#e74c3c',
          icon: '❌',
          label: 'Unavailable',
          message: 'MyInfo service is currently unavailable'
        };
      default:
        return {
          status: 'unknown',
          color: '#95a5a6',
          icon: '❓',
          label: 'Unknown',
          message: 'Checking MyInfo service status...'
        };
    }
  };

  toggleDetails = () => {
    this.setState(prevState => ({ showDetails: !prevState.showDetails }));
  };

  handleRefresh = () => {
    const { errorHandler } = this.props;
    if (errorHandler) {
      errorHandler.serviceMonitor.performHealthCheck();
    }
  };

  formatTime = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleTimeString();
  };

  render() {
    const { showCompact = false, showDetails: propShowDetails = false } = this.props;
    const { showDetails, lastCheck, errorCount, recommendations } = this.state;
    const config = this.getStatusConfig();
    
    const shouldShowDetails = propShowDetails || showDetails;

    if (showCompact) {
      return (
        <div className="myinfo-status-compact" style={{ borderColor: config.color }}>
          <span className="status-icon">{config.icon}</span>
          <span className="status-label" style={{ color: config.color }}>
            {config.label}
          </span>
        </div>
      );
    }

    return (
      <div>
      </div>
    );
  }
}

export default MyInfoStatusIndicator;
