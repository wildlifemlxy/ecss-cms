import React, { Component } from "react";
import axios from 'axios';
import '../../../css/sub/dashboardSection.css';

class DashboardSection extends Component {
    constructor(props) {
        super(props);
        this.state = {
            registrationData: [],
            loading: true,
            error: null,
            currentQuarter: ''
        };
    }

    // Fetch registration and payment data from the API
    fetchRegistrationData = async () => {
        try {
            const baseUrl = window.location.hostname === "localhost" 
                ? "http://localhost:3001" 
                : "https://ecss-backend-node.azurewebsites.net";
            
            const response = await axios.post(`${baseUrl}/courseregistration`, {
                purpose: "retrieve"
            });

            if (response.data && response.data.result) {
                this.setState({
                    registrationData: response.data.result,
                    loading: false
                });
                console.log("Registration data loaded:", response.data.result.length, "records");
            } else {
                throw new Error("No data received from server");
            }
        } catch (error) {
            console.error('Error fetching registration data:', error);
            this.setState({ 
                error: 'Failed to load registration data. Please try again.',
                loading: false 
            });
        }
    };

    // Calculate the current quarter for display
    getCurrentQuarter = () => {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        
        let quarter;
        if (month >= 0 && month <= 2) {
            quarter = "Q1 January - March";
        } else if (month >= 3 && month <= 5) {
            quarter = "Q2 April - June";
        } else if (month >= 6 && month <= 8) {
            quarter = "Q3 July - September";
        } else {
            quarter = "Q4 October - December";
        }
        
        return `${quarter} ${year}`;
    };

    // Calculate all the key statistics we need to display
    calculateStatistics = () => {
        const { registrationData } = this.state;
        
        if (!registrationData || registrationData.length === 0) {
            return {
                totalRegistrations: 0,
                totalPaid: 0,
                totalNotPaid: 0,
                cashPayments: 0,
                paynowPayments: 0,
                skillsfuturePayments: 0,
                paymentCompletionRate: 0
            };
        }

        const totalRegistrations = registrationData.length;
        console.log("Processing", totalRegistrations, "registration records");
        
        // Sample first record for debugging
        if (registrationData.length > 0) {
            console.log("Sample registration record:", registrationData[0]);
        }
        
        // Count paid vs unpaid registrations based on MongoDB structure
        const paidCount = registrationData.filter(record => {
            // Check the status field from MongoDB document
            const status = (record.status || '').toString().toLowerCase();
            return status === 'paid' || status === 'completed';
        }).length;
        
        const unpaidCount = totalRegistrations - paidCount;
        
        // Count different payment methods based on course.payment field
        const cashCount = registrationData.filter(record => {
            const payment = record.course && record.course.payment ? 
                record.course.payment.toString().toLowerCase() : '';
            return payment.includes('cash');
        }).length;
        
        const paynowCount = registrationData.filter(record => {
            const payment = record.course && record.course.payment ? 
                record.course.payment.toString().toLowerCase() : '';
            return payment.includes('paynow') || payment.includes('pay now');
        }).length;
        
        const skillsfutureCount = registrationData.filter(record => {
            const payment = record.course && record.course.payment ? 
                record.course.payment.toString().toLowerCase() : '';
            return payment.includes('skillsfuture') || payment.includes('skills future') || payment.includes('sf');
        }).length;
        
        // Calculate payment completion rate
        const completionRate = totalRegistrations > 0 ? (paidCount / totalRegistrations) * 100 : 0;

        const stats = {
            totalRegistrations,
            totalPaid: paidCount,
            totalNotPaid: unpaidCount,
            cashPayments: cashCount,
            paynowPayments: paynowCount,
            skillsfuturePayments: skillsfutureCount,
            paymentCompletionRate: completionRate
        };
        
        console.log("Calculated statistics:", stats);
        return stats;
    };

    // Initialize the component when it mounts
    componentDidMount = async () => {
        // Show loading popup
        this.props.loadingPopup();
        
        try {
            // Fetch the data
            await this.fetchRegistrationData();
            
            // Set the current quarter
            const currentQuarter = this.getCurrentQuarter();
            this.setState({ currentQuarter });
            
        } catch (error) {
            console.error("Error during component initialization:", error);
            this.setState({ error: 'Failed to initialize dashboard' });
        } finally {
            // Hide loading popup
            this.props.closePopup1();
        }
    };

    render() {
        const { 
            registrationData, 
            loading, 
            error, 
            currentQuarter
        } = this.state;

        if (loading) {
            return (
                <div className="dashboard-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading dashboard data...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="dashboard-error">
                    <h3>⚠️ Error Loading Dashboard</h3>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>Retry</button>
                </div>
            );
        }

        // Calculate statistics
        const stats = this.calculateStatistics();

        return (
            <div className="dashboard-scroll-container">
                <div className="dashboard-header">
                    <h1>📊 Registration & Payment Dashboard</h1>
                    <div className="quarter-badge">
                        <span className="quarter-text">{currentQuarter}</span>
                    </div>
                </div>

                <div className="dashboard-container">
                    {/* Statistics Overview Cards */}
                    <div className="stats-grid">
                        <div className="stat-card total-registrations">
                            <div className="stat-icon">👥</div>
                            <div className="stat-content">
                                <h3>Total Registrations</h3>
                                <div className="stat-number">{stats.totalRegistrations.toLocaleString()}</div>
                                <div className="stat-subtitle">All registrations</div>
                            </div>
                        </div>
                        
                        <div className="stat-card total-paid">
                            <div className="stat-icon">✅</div>
                            <div className="stat-content">
                                <h3>Paid Registrations</h3>
                                <div className="stat-number">{stats.totalPaid.toLocaleString()}</div>
                                <div className="stat-subtitle">Payment completed</div>
                            </div>
                        </div>
                        
                        <div className="stat-card total-unpaid">
                            <div className="stat-icon">⏳</div>
                            <div className="stat-content">
                                <h3>Not Paid / Pending</h3>
                                <div className="stat-number">{stats.totalNotPaid.toLocaleString()}</div>
                                <div className="stat-subtitle">Payment pending</div>
                            </div>
                        </div>
                        
                        <div className="stat-card cash-payments">
                            <div className="stat-icon">💵</div>
                            <div className="stat-content">
                                <h3>Cash Payments</h3>
                                <div className="stat-number">{stats.cashPayments.toLocaleString()}</div>
                                <div className="stat-subtitle">Paid by cash</div>
                            </div>
                        </div>
                        
                        <div className="stat-card paynow-payments">
                            <div className="stat-icon">📱</div>
                            <div className="stat-content">
                                <h3>PayNow Payments</h3>
                                <div className="stat-number">{stats.paynowPayments.toLocaleString()}</div>
                                <div className="stat-subtitle">Paid via PayNow</div>
                            </div>
                        </div>
                        
                        <div className="stat-card skillsfuture-payments">
                            <div className="stat-icon">🎓</div>
                            <div className="stat-content">
                                <h3>SkillsFuture Payments</h3>
                                <div className="stat-number">{stats.skillsfuturePayments.toLocaleString()}</div>
                                <div className="stat-subtitle">Paid via SkillsFuture</div>
                            </div>
                        </div>
                    </div>

                    {/* Enhanced data summary with progress bar */}
                    <div className="data-summary">
                        <h3>📋 Dashboard Summary</h3>
                        <p>
                            Showing statistics for <strong>{registrationData.length}</strong> total registrations 
                            recorded in the system for <strong>{currentQuarter}</strong>.
                        </p>
                        
                        {stats.totalRegistrations > 0 && (
                            <div className="completion-stats">
                                <div className="completion-rate-section">
                                    <p>
                                        Payment completion rate: <strong>
                                            {stats.paymentCompletionRate.toFixed(1)}%
                                        </strong> ({stats.totalPaid} of {stats.totalRegistrations} paid)
                                    </p>
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill" 
                                            style={{ width: `${stats.paymentCompletionRate}%` }}
                                        ></div>
                                    </div>
                                </div>
                                
                                <div className="payment-breakdown">
                                    <h4>Payment Method Distribution:</h4>
                                    <ul>
                                        <li>💵 Cash: <strong>{stats.cashPayments}</strong> payments</li>
                                        <li>📱 PayNow: <strong>{stats.paynowPayments}</strong> payments</li>
                                        <li>🎓 SkillsFuture: <strong>{stats.skillsfuturePayments}</strong> payments</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                        
                        {stats.totalRegistrations === 0 && (
                            <p className="no-data-message">
                                ⚠️ No registration data available for the current period.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

export default DashboardSection;