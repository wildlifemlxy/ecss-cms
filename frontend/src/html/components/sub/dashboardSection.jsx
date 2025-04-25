// DashboardApp.jsx
import React, { Component } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Tabs, Tab } from 'react-bootstrap';
import { LineChart, BarChart, PieChart, ResponsiveContainer, Line, Bar, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import '../../../css/sub/dashboardSection.css';
import axios from 'axios';
// Import icons from a library like react-icons or feather-icons
import { FiDollarSign, FiBook, FiMapPin, FiUsers } from 'react-icons/fi';

// StatCard component for displaying statistics
const StatCard = ({ title, value, change, icon }) => {
  const isPositive = change >= 0;
  
  // Map icon string to actual icon component
  const renderIcon = () => {
    switch(icon) {
      case 'dollar-sign': return <FiDollarSign size={24} />;
      case 'book': return <FiBook size={24} />;
      case 'map-pin': return <FiMapPin size={24} />;
      case 'users': return <FiUsers size={24} />;
      default: return null;
    }
  };
  
  return (
    <Card className="stat-card h-100">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="text-muted">{title}</h6>
            <h4 className="mb-0">{value}</h4>
          </div>
          <div className="icon-container">
            {renderIcon()}
          </div>
        </div>
        <div className={`change-indicator mt-2 ${isPositive ? 'text-success' : 'text-danger'}`}>
          {isPositive ? '↑' : '↓'} {Math.abs(change)}% from last quarter
        </div>
      </Card.Body>
    </Card>
  );
};

class DashboardSection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      //loading: true,
      showPopup2: false,
      error: null,
      courseReport: [], // This will store course data 
      stockReport: [], // This will store stock data
      selectedLocation: 'all',
      selectedQuarter: 'Q2 (April To June) 2025',
      activeTab: 'overview'
    };
  }

  componentDidMount = async() => 
  {
    this.props.loadingPopup()
    // For development/testing, you can use sample data
    if (process.env.NODE_ENV === 'development') {
      this.loadSampleData();
    } else {
      this.fetchDashboardData();
    }
  }

  // Sample data loader for development
  loadSampleData = () => {
    // Sample stock data
    const sampleStockData = [
      { name: "Smartphone Photography | Tampines 253 Centre", stock: 23 },
      { name: "Smartphone Photography | Pasir Ris West Wellness Centre", stock: 19 },
      { name: "Smartphone Photography | CT Hub", stock: 21 },
      { name: "Healthy Minds, Healthy Lives – Mandarin | Pasir Ris West Wellness Centre", stock: 38 },
      { name: "Healthy Minds, Healthy Lives – Mandarin | Tampines 253 Centre", stock: 31 },
      { name: "TCM – Don't be a friend of Chronic Diseases | CT Hub", stock: 11 },
      { name: "Nagomi Pastel Art Basic | CT Hub", stock: 18 },
      { name: "Therapeutic Watercolour Painting for Beginners | CT Hub", stock: 6 },
      { name: "Chinese Calligraphy Intermediate | CT Hub", stock: 6 },
      { name: "Chinese Calligraphy Basic | CT Hub", stock: 14 },
      { name: "Therapeutic Basic Line Work | Tampines 253 Centre", stock: 7 },
      { name: "Nagomi Pastel Art Appreciation | CT Hub", stock: 10 },
      { name: "Community Ukulele – Mandarin | CT Hub", stock: 28 },
      { name: "Art of Positive Communication builds happy homes | Pasir Ris West Wellness Centre", stock: 34 },
      { name: "Community Singing – Mandarin | Pasir Ris West Wellness Centre", stock: 9 },
      { name: "Community Singing – Mandarin | CT Hub", stock: 8 },
      { name: "Self-Care TCM Wellness – Mandarin | Tampines 253 Centre", stock: 6 },
      { name: "Self-Care TCM Wellness – Mandarin | CT Hub", stock: 12 },
      { name: "Hanyu Pinyin for Beginners | CT Hub", stock: 6 }
    ];


    // Sample course data
    const sampleCourseData = [
      {
        courseEngName: "Smartphone Photography",
        locations: [
          {
            courseLocation: "Tampines 253 Centre",
            quarters: [{ totalPrice: 1200 }]
          },
          {
            courseLocation: "Pasir Ris West Wellness Centre",
            quarters: [{ totalPrice: 1100 }]
          },
          {
            courseLocation: "CT Hub",
            quarters: [{ totalPrice: 1300 }]
          }
        ]
      },
      {
        courseEngName: "Healthy Minds, Healthy Lives – Mandarin",
        locations: [
          {
            courseLocation: "Pasir Ris West Wellness Centre",
            quarters: [{ totalPrice: 900 }]
          },
          {
            courseLocation: "Tampines 253 Centre",
            quarters: [{ totalPrice: 950 }]
          }
        ]
      },
      {
        courseEngName: "TCM – Don't be a friend of Chronic Diseases",
        locations: [
          {
            courseLocation: "CT Hub",
            quarters: [{ totalPrice: 1500 }]
          }
        ]
      },
      {
        courseEngName: "Nagomi Pastel Art Basic",
        locations: [
          {
            courseLocation: "CT Hub",
            quarters: [{ totalPrice: 800 }]
          }
        ]
      },
      {
        courseEngName: "Chinese Calligraphy Basic",
        locations: [
          {
            courseLocation: "CT Hub",
            quarters: [{ totalPrice: 700 }]
          }
        ]
      },
    ];

    this.setState({
      stockReport: sampleStockData,
      courseReport: sampleCourseData,
      //loading: false
    });
    this.props.closePopup1();
  };

  getBaseUrl = () => {
    return window.location.hostname === "localhost" 
      ? "http://localhost:3002" 
      : "https://ecss-backend-django.azurewebsites.net";
  };

  fetchDashboardData = async () => {
    try {
      //this.setState({ loading: true });
      
      // Course report API call
      const courseReportResponse = await axios.post(`${this.getBaseUrl()}/course_report/`);
      console.log("Course Report:", courseReportResponse);
      
      // Sales/Stock report API call
      const stockReportResponse = await axios.post(`${this.getBaseUrl()}/sales_report/`);
      console.log("Stock Report:", stockReportResponse);
      
      this.setState({
        courseReport: courseReportResponse.data.product_data,
        stockReport: stockReportResponse.data.aggregated_data,
      });
    } catch (error) {
      this.setState({ 
        error: 'Failed to load dashboard data', 
      });
      console.error('Dashboard data fetch error:', error);
    }
  };

  // Helper function to calculate total revenue
  calculateTotalRevenue = () => {
    let total = 0;
    this.state.courseReport.forEach(course => {
      course.locations.forEach(location => {
        location.quarters.forEach(quarter => {
          total += quarter.totalPrice;
        });
      });
    });
    return total;
  };

  // Helper function to get all unique locations
  getLocations = () => {
    const locations = new Set();
    this.state.courseReport.forEach(course => {
      course.locations.forEach(location => {
        locations.add(location.courseLocation);
      });
    });
    return ['all', ...Array.from(locations)];
  };

  // Helper function to get revenue by location
  getRevenueByLocation = () => {
    const revenueByLocation = {};
    
    this.state.courseReport.forEach(course => {
      course.locations.forEach(location => {
        if (!revenueByLocation[location.courseLocation]) {
          revenueByLocation[location.courseLocation] = 0;
        }
        
        location.quarters.forEach(quarter => {
          revenueByLocation[location.courseLocation] += quarter.totalPrice;
        });
      });
    });
    
    return Object.keys(revenueByLocation).map(location => ({
      location: location,
      revenue: revenueByLocation[location]
    }));
  };

  // Helper function to get top courses by revenue
  getTopCoursesByRevenue = () => {
    const courseRevenue = {};
    
    this.state.courseReport.forEach(course => {
      courseRevenue[course.courseEngName] = 0;
      
      course.locations.forEach(location => {
        location.quarters.forEach(quarter => {
          courseRevenue[course.courseEngName] += quarter.totalPrice;
        });
      });
    });
    
    return Object.keys(courseRevenue)
      .map(course => ({ name: course, revenue: courseRevenue[course] }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  // Helper function to get stock by location
  getStockByLocation = () => {
    const stockByLocation = {};
    const { selectedLocation } = this.state;
    
    this.state.stockReport.forEach(item => {
      const nameParts = item.name.split(' | ');
      const courseName = nameParts[0];
      const location = nameParts[1];
      
      if (selectedLocation === 'all' || location === selectedLocation) {
        if (!stockByLocation[location]) {
          stockByLocation[location] = { location, totalStock: 0 };
        }
        stockByLocation[location].totalStock += item.stock;
      }
    });
    
    return Object.values(stockByLocation);
  };

  // Helper function to format stock data for pie chart
  getStockDistribution = () => {
    const { stockReport } = this.state;
    const courseStock = {};
    
    stockReport.forEach(item => {
      const nameParts = item.name.split(' | ');
      const courseName = nameParts[0];
      
      if (!courseStock[courseName]) {
        courseStock[courseName] = 0;
      }
      courseStock[courseName] += item.stock;
    });
    
    return Object.keys(courseStock)
      .map(course => ({ name: course, value: courseStock[course] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  };

  handleLocationChange = (e) => {
    this.setState({ selectedLocation: e.target.value });
  };

  handleTabChange = (key) => {
    this.setState({ activeTab: key });
  };

  render() {
    const { loading, error, courseReport, stockReport, selectedLocation, activeTab } = this.state;
    
    if (loading) {
      return <div className="loading-container"><div className="spinner"></div></div>;
    }
    
    if (error) {
      return <div className="error-container">{error}</div>;
    }

    // Ensure we have data before calculations
    if (!courseReport.length || !stockReport.length) {
      return <div className="error-container">No data available</div>;
    }

    const totalRevenue = this.calculateTotalRevenue();
    const totalCourses = courseReport.length;
    const totalLocations = this.getLocations().length - 1; // Subtract 'all'
    
    // Calculate total stock/seats
    let totalStock = 0;
    stockReport.forEach(item => {
      totalStock += item.stock;
    });
    
    const revenueByLocation = this.getRevenueByLocation();
    const topCourses = this.getTopCoursesByRevenue();
    const stockByLocation = this.getStockByLocation();
    const stockDistribution = this.getStockDistribution();
    
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

    return (
      <div className="dashboard-container">
        <div className="dashboard-content">
          <main className="main-content">
            <Container fluid>
              <Row className="mb-4">
                <Col>
                  <h1 className="dashboard-title">Course Management Dashboard</h1>
                  <p className="dashboard-subtitle">Q2 2025 Overview</p>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Filter by Location</Form.Label>
                    <Form.Select 
                      value={selectedLocation} 
                      onChange={this.handleLocationChange}
                    >
                      {this.getLocations().map(location => (
                        <option key={location} value={location}>
                          {location === 'all' ? 'All Locations' : location}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              {/* Stats Summary - Above tabs */}
              <Row className="mb-4">
                <Col md={3}>
                  <StatCard 
                    title="Total Revenue" 
                    value={`$${totalRevenue.toLocaleString()}`} 
                    change={5.2} 
                    icon="dollar-sign"
                  />
                </Col>
                <Col md={3}>
                  <StatCard 
                    title="Total Courses" 
                    value={totalCourses} 
                    change={2.8} 
                    icon="book"
                  />
                </Col>
                <Col md={3}>
                  <StatCard 
                    title="Total Locations" 
                    value={totalLocations} 
                    change={0} 
                    icon="map-pin"
                  />
                </Col>
                <Col md={3}>
                  <StatCard 
                    title="Available Seats" 
                    value={totalStock} 
                    change={-3.5} 
                    icon="users"
                  />
                </Col>
              </Row>

              {/* Tabs */}
              <Tabs 
                activeKey={activeTab} 
                onSelect={this.handleTabChange} 
                className="mb-4"
                fill
              >
                {/* Overview Tab */}
                <Tab eventKey="overview" title="Overview">
                  <Row className="mb-4">
                    <Col lg={8}>
                      <Card className="dashboard-card">
                        <Card.Header>
                          <h5 className="card-title">Revenue by Location</h5>
                        </Card.Header>
                        <Card.Body>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={revenueByLocation} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="location" />
                              <YAxis />
                              <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                              <Legend />
                              <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                            </BarChart>
                          </ResponsiveContainer>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col lg={4}>
                      <Card className="dashboard-card">
                        <Card.Header>
                          <h5 className="card-title">Course Availability</h5>
                        </Card.Header>
                        <Card.Body>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={stockDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({name, value}) => `${name.substring(0, 10)}...: ${value}`}
                              >
                                {stockDistribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Tab>

                {/* Revenue Tab */}
                <Tab eventKey="revenue" title="Revenue Analysis">
                  <Row>
                    <Col md={12}>
                      <Card className="dashboard-card">
                        <Card.Header>
                          <h5 className="card-title">Top Courses by Revenue</h5>
                        </Card.Header>
                        <Card.Body>
                          <ResponsiveContainer width="100%" height={400}>
                            <BarChart 
                              data={topCourses} 
                              layout="vertical" 
                              margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis 
                                type="category" 
                                dataKey="name" 
                                width={150}
                                tickFormatter={(value) => value.length > 20 ? `${value.substring(0, 20)}...` : value}
                              />
                              <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                              <Legend />
                              <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
                            </BarChart>
                          </ResponsiveContainer>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                  <Row className="mt-4">
                    <Col md={12}>
                      <Card className="dashboard-card">
                        <Card.Header>
                          <h5 className="card-title">Revenue by Location</h5>
                        </Card.Header>
                        <Card.Body>
                          <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={revenueByLocation} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="location" />
                              <YAxis />
                              <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                              <Legend />
                              <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                            </BarChart>
                          </ResponsiveContainer>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Tab>

                {/* Inventory Tab */}
                <Tab eventKey="inventory" title="Inventory">
                  <Row>
                    <Col md={6}>
                      <Card className="dashboard-card">
                        <Card.Header>
                          <h5 className="card-title">Seats Available by Location</h5>
                        </Card.Header>
                        <Card.Body>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stockByLocation} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="location" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="totalStock" fill="#ffc658" name="Available Seats" />
                            </BarChart>
                          </ResponsiveContainer>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card className="dashboard-card">
                        <Card.Header>
                          <h5 className="card-title">Course Availability</h5>
                        </Card.Header>
                        <Card.Body>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={stockDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({name, value}) => `${name.substring(0, 10)}...: ${value}`}
                              >
                                {stockDistribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Tab>

                {/* Courses Tab */}
                <Tab eventKey="courses" title="Course Management">
                  <Row>
                    <Col>
                      <Card className="dashboard-card">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                          <h5 className="card-title mb-0">Course Inventory</h5>
                          <div>
                            <Button variant="outline-primary" size="sm" className="me-2">Export to CSV</Button>
                            <Button variant="primary" size="sm">Add New Course</Button>
                          </div>
                        </Card.Header>
                        <Card.Body>
                          <Table responsive hover>
                            <thead>
                              <tr>
                                <th>Course Name</th>
                                <th>Location</th>
                                <th>Price</th>
                                <th>Available Seats</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {stockReport.map((item, index) => {
                                const nameParts = item.name.split(' | ');
                                const courseName = nameParts[0];
                                const location = nameParts[1];
                                
                                // Find price from course report
                                let price = 0;
                                courseReport.forEach(course => {
                                  if (course.courseEngName === courseName) {
                                    course.locations.forEach(loc => {
                                      if (loc.courseLocation === location) {
                                        loc.quarters.forEach(quarter => {
                                          price = quarter.totalPrice;
                                        });
                                      }
                                    });
                                  }
                                });
                                
                                return (
                                  <tr key={index}>
                                    <td>{courseName}</td>
                                    <td>{location}</td>
                                    <td>${price}</td>
                                    <td>{item.stock}</td>
                                    <td>
                                      <Button variant="outline-primary" size="sm" className="me-2">Edit</Button>
                                      <Button variant="outline-danger" size="sm">Delete</Button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </Table>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Tab>

                {/* Settings Tab */}
                <Tab eventKey="settings" title="Settings">
                  <Row>
                    <Col md={6}>
                      <Card className="dashboard-card">
                        <Card.Header>
                          <h5 className="card-title">Dashboard Settings</h5>
                        </Card.Header>
                        <Card.Body>
                          <Form>
                            <Form.Group className="mb-3">
                              <Form.Label>Default Quarter</Form.Label>
                              <Form.Select>
                                <option>Q1 (January To March) 2025</option>
                                <option selected>Q2 (April To June) 2025</option>
                                <option>Q3 (July To September) 2025</option>
                                <option>Q4 (October To December) 2025</option>
                              </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label>Default Location</Form.Label>
                              <Form.Select>
                                <option value="all">All Locations</option>
                                {this.getLocations().slice(1).map(location => (
                                  <option key={location} value={location}>{location}</option>
                                ))}
                              </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Check 
                                type="checkbox" 
                                label="Show change indicators" 
                                checked
                              />
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Check 
                                type="checkbox" 
                                label="Enable data auto-refresh" 
                                checked
                              />
                            </Form.Group>
                            <Button variant="primary">Save Settings</Button>
                          </Form>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card className="dashboard-card">
                        <Card.Header>
                          <h5 className="card-title">Export Options</h5>
                        </Card.Header>
                        <Card.Body>
                          <Form>
                            <Form.Group className="mb-3">
                              <Form.Label>Export Format</Form.Label>
                              <Form.Select>
                                <option>CSV</option>
                                <option>Excel</option>
                                <option>PDF</option>
                              </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label>Data to Export</Form.Label>
                              <div>
                                <Form.Check 
                                  type="checkbox" 
                                  label="Course Inventory" 
                                  checked
                                  className="mb-2"
                                />
                                <Form.Check 
                                  type="checkbox" 
                                  label="Revenue Data" 
                                  checked
                                  className="mb-2"
                                />
                                <Form.Check 
                                  type="checkbox" 
                                  label="Availability Data" 
                                  checked
                                  className="mb-2"
                                />
                                <Form.Check 
                                  type="checkbox" 
                                  label="Location Data" 
                                  checked
                                  className="mb-2"
                                />
                              </div>
                            </Form.Group>
                            <Button variant="success">Export Data</Button>
                          </Form>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Tab>
              </Tabs>
            </Container>
          </main>
        </div>
      </div>
    );
  }
}

export default DashboardSection;