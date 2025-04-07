import React, { Component } from "react";
import axios from 'axios';
import Plot from 'react-plotly.js';
import '../../../css/sub/dashboardSection.css';  // Ensure the CSS file is imported

class DashboardSection extends Component {
    constructor(props) {
        super(props);
        this.state = {
            productData: [], // Stores fetched data for products
            salesData: [],
            showPopup: false, // Tracks popup visibility
            selectedLocation: '', // Tracks selected location for the main chart
            popupLocation: '', // Tracks location specifically for the popup
            selectedLocation1: '', // Tracks selected location for the main chart
            popupLocation1: '', // Tracks location specifically for the popup
            popupQuarter: '', // Tracks location specifically for the popup
            showPopup2: false, // Controls visibility of Popup 2
            popupContent2: null,
            showPopup3: false, // Controls visibility of Popup 2
            popupContent3: null,
            selectedLocation2: '', // Tracks selected location for the main chart
            popupLocation2: '', // Tracks location specifically for the popup
            popupCourse: '', // Tracks location specifically for the popup
            selectedCourse: '', // Tracks selected location for the main chart
            currentQuarter: ''
        };
    }

    // Fetch product stock data when the component is mounted
    fetchCourseReportVisualization = async () => {
        try {
            //const response = await axios.post('http://localhost:3002/course_report/');
            const response = await axios.post('https://ecss-backend-django.azurewebsites.net/course_report/');
            const data = response.data;
            console.log("Fetch Course Report:", response);

            // Set the state with the fetched data
            this.setState({
                productData: data.product_data,
            });
        } catch (error) {
            console.error('Error fetching product stock data:', error);
        }
    };


    // Fetch product stock data when the component is mounted
    fetchSalesReportVisualization = async () => 
    {
        try 
        {
            const response = await axios.post(`${window.location.hostname === "localhost" ? "http://localhost:3002" : "https://ecss-backend-django.azurewebsites.net"}/sales_report/`);
            const data = response.data;
            console.log(data.aggregated_data)

            // Set the state with the fetched data
            this.setState({
                salesData: data.aggregated_data
            });
        } catch (error) {
            console.error('Error fetching product stock data:', error);
        }
    };

    getCurrentQuarter(currentDate) 
    {
        const month = currentDate.getMonth(); // 0-indexed month (0 = January, 11 = December)
        const year = currentDate.getFullYear(); // 0-indexed month (0 = January, 11 = December)
      
        let quarter;
      
        if (month >= 0 && month <= 2) {
          quarter = "Q1 January - March";
        } else if (month >= 3 && month <= 5) {
          quarter = "Q2 April -June ";
        } else if (month >= 6 && month <= 8) {
          quarter = "Q3 July - September";
        } else {
          quarter = "Q4 Octocber - December";
        }
      
        return `${quarter} ${year}`;
    }

    componentDidMount = async () => {
        this.props.loadingPopup();
        var dashboard = document.getElementById("data-visualization-section1");
        dashboard.style.display = "none";
        
        try {
            // Fetch and update course report visualization
            await this.fetchCourseReportVisualization();
            
            // Calculate the current quarter based on the current date
            var currentDate = new Date();
            var currentQuarter = this.getCurrentQuarter(currentDate);
            
            // Update the state with the current quarter
            this.setState(prevState => {
                if (prevState.currentQuarter !== currentQuarter) {
                    return { currentQuarter: currentQuarter };
                }
            });
            
            // Fetch and update the sales report visualization
            await this.fetchSalesReportVisualization();
        } catch (error) {
            console.error("Error during component mount:", error);
        }finally {
            // Show the dashboard after data is fetched
            dashboard.style.display = "grid";
            this.props.closePopup1();
        }
    };
    
    // Function to open the popup with the larger graph
    openPopup = () => {
        document.body.style.overflow = 'hidden'; // Disable body scrolling
        this.setState({
            showPopup: true,  // Open the popup
            popupLocation: this.state.selectedLocation// Keep track of the selected location in the popup
        });
    };

    // Function to close the popup
    closePopup = () => {
        document.body.style.overflow = 'auto'; // Enable body scrolling
        this.setState({
            showPopup: false,  // Close the popup
        });
    };
    
    // Handlers for Popup 2
    openPopup2 = () => {
        document.body.style.overflow = 'hidden'; // Disable body scrolling
        this.setState({
            showPopup2: true,
            popupQuarter: this.state.selectedQuarter// Keep track of the selected location in the popup
        });
    };

    closePopup2 = () => {
        document.body.style.overflow = 'auto'; // Enable body scrolling
        this.setState({
            showPopup2: false,
        });
    };

    // Handlers for Popup 2
    openPopup3 = () => {
        document.body.style.overflow = 'hidden'; // Disable body scrolling
        this.setState({
            showPopup3: true,
            popupQuarter: this.state.selectedQuarter// Keep track of the selected location in the popup
        });
    };

    closePopup3 = () => {
        document.body.style.overflow = 'auto'; // Enable body scrolling
        this.setState({
            showPopup3: false,
        });
    };
    
    handleLocationChange = (event) => {
        const value = event.target.value;
        this.setState({ selectedLocation: value, popupLocation: value }, () => {
            // Update the chart data here if needed
            console.log('Chart Data Updated for Location:', this.getChartData(value));
        });
    };

    handleLocationChange1 = (event) => {
        const value = event.target.value;
        this.setState({ selectedLocation1: value, popupLocation1: value }, () => {
            // Update the chart data here if needed
            console.log('Chart Data Updated for Location:', this.getChartData(value));
        });
    };
    
    
    handleQuarterChange = (event) => {
        const value = event.target.value;
        this.setState({ selectedQuarter: value, popupQuarter: value, selectedLocation1: "", popupLocation1: "" }, () => {
            // Update the chart data here if needed
            console.log('Chart Data Updated for Quarter:', this.getChartData1(value));
        });
    };

    handleLocationChange2 = (event) => {
        const value = event.target.value;
        console.log("Location 2:", value);
        console.log(this.state);
        this.setState({ selectedLocation2: value, popupLocation2: value }, () => {
            // Update the chart data here if needed
            console.log('Chart Data Updated for Location:', this.getChartData(value));
        });
    };

    handleCourseChange = (event) => {
        const value = event.target.value;
        this.setState({ selectedCourse: value, popupCourse: value, selectedLocation2: "", popupLocation2: "" }, () => {
            // Update the chart data here if needed
            console.log('Chart Data Updated for Quarter:', this.getChartData1(value));
        });
    };

    getChartData = (location) => {
        const { productData } = this.state;
    
        // Filter data based on selected location for the main graph
        const filteredData = location
            ? productData.filter((product) => product.name.split("|")[1].trim() === location)
            : productData;
    
        const productNames = filteredData.map((product) => product.name.replace(/\s?\|\s?/g, ' '));
        const stockQuantities = filteredData.map((product) => product.stock);
    
        const maxStock = Math.min(...stockQuantities);
        const minStock = Math.max(...stockQuantities);
        const mostPopularProductIndex = stockQuantities.indexOf(maxStock);
        const leastPopularProductIndex = stockQuantities.indexOf(minStock);
    
        const colors = stockQuantities.map((stock, index) => {
            if (index === mostPopularProductIndex) {
                return 'green'; // Most popular product color
            } else if (index === leastPopularProductIndex) {
                return 'red'; // Least popular product color
            } else {
                return 'blue'; // Default color for others
            }
        });
    
        // Create hovertext with course name and vacancies
        const hoverText = filteredData.map(product => 
            `Course Name: ${product.name.replace(/\s?\|\s?/g, ' ')}<br>Vacancies: ${product.stock}`
        );
    
        return {
            data: [
                {
                    x: productNames,
                    y: stockQuantities,
                    type: 'bar',
                    name: 'Stock Level',
                    marker: { color: colors }, // Apply colors to the bars
                    hovertext: hoverText, // Custom hover text with course name and vacancies
                    hoverinfo: 'text', // Show hover text
                }
            ],
            layout: {
                title: '',
                xaxis: {
                    title: 'Courses',
                    tickangle: 55,
                    tickfont: {
                        size: 7, // Decrease font size to fit the labels
                    },
                    tickmode: 'array',
                    tickvals: productNames, // Ensure all labels are visible
                },
                yaxis: {
                    title: 'Vacancies',
                },
                barmode: 'group',
                hovermode: 'closest', // Hover over a specific bar
                margin: { t: 60, b: 250, l: 60, r: 100 }, // Adjust margins to fit axis titles
                autosize: false, // Disable auto-sizing of the graph
            },
            config: {
                displayModeBar: false, // Hide all graph buttons
                displaylogo: false, // Remove the Plotly logo
                responsive: false, // Disable responsiveness
            }
        };
    };

    getChartData1 = (quarters, locations) => {
        const { salesData } = this.state;
    
        // Filter the sales data based on selected quarter and location(s)
        const filteredData1 = salesData.filter((product) =>
            product.locations.some((location) =>
                location.quarters.some((quarter) =>
                    (quarters ? quarter.courseQuarter === quarters : true) &&
                    (locations ? locations === location.courseLocation : true)
                )
            )
        );
    
        // Get course names, locations, and totalPrice for the filtered data
        const productNamesAndLocations = filteredData1.map((product) =>
            product.locations.flatMap((location) =>
                location.quarters.map((quarter) => ({
                    courseName: product.courseEngName,
                    location: location.courseLocation,
                    totalPrice: quarter.totalPrice
                }))
            )
        ).flat(); // Flatten to a single array
    
        // Prepare the chart data
        const productNames1 = productNamesAndLocations.map((item) => item.courseName);
        const courseTotalPrice = productNamesAndLocations.map((item) => parseFloat(item.totalPrice.toFixed(2)));
    
        return {
            data: [
                {
                    x: productNames1,
                    y: courseTotalPrice,
                    type: 'bar',
                    name: 'Total Price by Course and Location',
                    marker: { color: 'blue' }, // Bar color
                }
            ],
            layout: {
                title: ``, // Dynamic title using quarters and locations
                xaxis: {
                    title: 'Courses',
                    tickangle: 55,
                    tickfont: {
                        size: 7, // Font size for x-axis labels
                    },
                },
                yaxis: {
                    title: 'Total Price ($)',
                    tickformat: '.2f', // Format y-axis with 2 decimal places
                },
                barmode: 'group',
                hovermode: 'closest',
                margin: { t: 60, b: 250, l: 60, r: 100 },
                autosize: false,
            },
            config: {
                displayModeBar: false,
                displaylogo: false,
                responsive: false,
            }
        };
        
    };

    getChartData3 = (courses, locations) => {
        const { salesData } = this.state;
    
        // Filter the sales data based on selected quarter and location(s)
        const filteredData1 = salesData.filter((product) =>
            product.locations.some((location) =>
                location.quarters.some((quarter) =>
                    (courses ? courses === product.courseEngName : true) &&
                    (locations ? locations === location.courseLocation : true)
                )
            )
        );
    
        const productNamesAndLocations = filteredData1.map((product) =>
            product.locations.flatMap((location) =>
                location.quarters.map((quarter) => ({
                    courseQuarter: quarter.courseQuarter, // Now using courseQuarter
                    location: location.courseLocation,
                    totalPrice: quarter.totalPrice
                }))
            )
        ).flat(); // Flatten to a single array
        
    
        // Prepare the chart data
        const courseQuarters = productNamesAndLocations.map((item) => item.courseQuarter);
        const courseTotalPrice = productNamesAndLocations.map((item) => parseFloat(item.totalPrice.toFixed(2)));
    
        return {
            data: [
                {
                    x: courseQuarters,
                    y: courseTotalPrice,
                    type: 'line',
                    name: 'Total Price by Course and Location',
                    marker: { color: 'blue' }, // Bar color
                }
            ],
            layout: {
                title: ``, // Dynamic title using quarters and locations
                xaxis: {
                    title: 'Quarters',
                    tickangle: 55,
                    tickfont: {
                        size: 7, // Font size for x-axis labels
                    },
                },
                yaxis: {
                    title: 'Total Price ($)',
                    tickformat: '.2f', // Format y-axis with 2 decimal places
                },
                barmode: 'group',
                hovermode: 'closest',
                margin: { t: 60, b: 250, l: 60, r: 100 },
                autosize: false,
            },
            config: {
                displayModeBar: false,
                displaylogo: false,
                responsive: false,
            }
        };
        
    };

    getChartData2 = (quarters, locations) => {
        const { salesData } = this.state;
    
        // Filter the sales data based on selected quarter and location(s)
        const filteredData1 = salesData.filter((product) =>
            product.locations.some((location) =>
                location.quarters.some((quarter) =>
                    (quarters ? quarter.courseQuarter === quarters : true) &&
                    (locations ? locations === location.courseLocation : true)
                )
            )
        );
    
        // Get course names, locations, and totalPrice for the filtered data
        const productNamesAndLocations = filteredData1.map((product) =>
            product.locations.flatMap((location) =>
                location.quarters.map((quarter) => ({
                    courseName: product.courseEngName,
                    location: location.courseLocation,
                    totalPrice: quarter.totalPrice,
                    quarter: quarter.courseQuarter // Add quarter information here
                }))
            )
        ).flat(); // Flatten to a single array
    
        // Prepare the chart data
        const productNames1 = productNamesAndLocations.map((item) => item.courseName);
        const courseTotalPrice = productNamesAndLocations.map((item) => parseFloat(item.totalPrice.toFixed(2)));
        const totalPriceSum = courseTotalPrice.reduce((acc, price) => acc + price, 0);
    
        // Calculate total price for the selected quarter
        const selectedQuarterData = filteredData1.flatMap((product) =>
            product.locations.flatMap((location) =>
                location.quarters.filter((quarter) => quarters ? quarter.courseQuarter === quarters : true)
            )
        );
        
        const selectedQuarterPrice = selectedQuarterData.reduce((acc, quarter) => acc + parseFloat(quarter.totalPrice.toFixed(2)), 0);
    
        // Create the title and subtitle
        let gtitle = "";
        let subtitle = "";
    
        if (quarters === undefined && locations === "") {
            gtitle = "";
            subtitle = "";  // No specific data
        } else {
            gtitle = `${quarters} - ${locations}`;
            subtitle = `Total Price for this Quarter: $${selectedQuarterPrice.toFixed(2)}`;
        }
    
        // Position the subtitle slightly above or below the main title
        const subtitlePosition = 1.15; // Adjust this value to move subtitle further up or down (1.15 for more space)
    
        return {
            data: [
                {
                    x: productNames1,
                    y: courseTotalPrice,
                    type: 'bar',
                    name: 'Total Price by Course and Location',
                    marker: { color: 'blue' }, // Bar color
                }
            ],
            layout: {
                title: gtitle, // Dynamic title using quarters and locations
                xaxis: {
                    title: 'Course',
                    tickangle: 55,
                    tickfont: {
                        size: 7, // Font size for x-axis labels
                    },
                },
                yaxis: {
                    title: 'Total Price ($)',
                    tickformat: '$.2f', // Format y-axis with 2 decimal places
                },
                barmode: 'group',
                hovermode: 'closest',
                margin: { t: 100, b: 250, l: 150, r: 200 }, // Increase top margin to accommodate title and subtitle
                autosize: false,
                annotations: [
                    {
                        x: 0.5, // Position of the subtitle (adjust as needed)
                        y: subtitlePosition, // Position slightly above (1.15) the title to create space
                        xref: 'paper',
                        yref: 'paper',
                        text: subtitle, // Subtitle text
                        showarrow: false,
                        font: {
                            size: 12,
                            color: 'black'
                        },
                        align: 'center'
                    }
                ]
            },
            config: {
                displayModeBar: false,
                displaylogo: false,
                responsive: false,
            }
        };
    };
    
    getChartData4 = (courses, locations) => {
        const { salesData } = this.state;
    
        // Filter the sales data based on selected quarter and location(s)
        const filteredData1 = salesData.filter((product) =>
            product.locations.some((location) =>
                location.quarters.some((quarter) =>
                    (courses ? courses === product.courseEngName : true) &&
                    (locations ? locations === location.courseLocation : true)
                )
            )
        );
    
        const productNamesAndLocations = filteredData1.map((product) =>
            product.locations.flatMap((location) =>
                location.quarters.map((quarter) => ({
                    courseQuarter: quarter.courseQuarter, // Now using courseQuarter
                    location: location.courseLocation,
                    totalPrice: quarter.totalPrice
                }))
            )
        ).flat(); // Flatten to a single array
        
    
        // Prepare the chart data
        const courseQuarters = productNamesAndLocations.map((item) => item.courseQuarter);
        const courseTotalPrice = productNamesAndLocations.map((item) => parseFloat(item.totalPrice.toFixed(2)));
    
        return {
            data: [
                {
                    x: courseQuarters,
                    y: courseTotalPrice,
                    type: 'line',
                    name: 'Total Price by Course and Location',
                    marker: { color: 'blue' }, // Bar color
                }
            ],
            layout: {
                title: ``, // Dynamic title using quarters and locations
                xaxis: {
                    title: 'Course',
                    tickangle: 55,
                    tickfont: {
                        size: 7, // Font size for x-axis labels
                    },
                },
                yaxis: {
                    title: 'Total Price ($)',
                    tickformat: '.2f', // Format y-axis with 2 decimal places
                },
                barmode: 'group',
                hovermode: 'closest',
                margin: { t: 60, b: 250, l: 60, r: 100 },
                autosize: false,
            },
            config: {
                displayModeBar: false,
                displaylogo: false,
                responsive: false,
            }
        };
        
    };

    render() {
        const { productData, salesData, showPopup, selectedLocation, popupLocation, popupCourse, selectedLocation1, popupLocation1, popupLocation2, selectedQuarter, popupQuarter, showPopup2, showPopup3, selectedCourse, selectedLocation2, currentQuarter} = this.state;

        // Get unique locations for the dropdown
        const productLocation = new Set(productData.map((product) => product.name.split("|")[1].trim()));

        // Get chart data for the main chart (using selectedLocation)
        const mainChartData = this.getChartData("");
        const mainChartData1 = this.getChartData1("");
        const mainChartData2 = this.getChartData3("");

        // Get chart data for the popup (using popupLocation)
        const popupChartData = this.getChartData(popupLocation);
        const popupChartData1 = this.getChartData2(popupQuarter, popupLocation1);
        const popupChartData2 = this.getChartData4(popupCourse, popupLocation2);

        // Get the most and least popular courses from the filtered data for the main chart
        const filteredData = selectedLocation
            ? productData.filter((product) => product.name.split("|")[1].trim() === selectedLocation)
            : productData;

        const productNames = filteredData.map((product) => product.name.replace(/\s?\|\s?/g, ' '));
        const stockQuantities = filteredData.map((product) => product.stock);

        const maxStock = Math.min(...stockQuantities);
        const minStock = Math.max(...stockQuantities);
        const mostPopularProductIndex = stockQuantities.indexOf(maxStock);
        const leastPopularProductIndex = stockQuantities.indexOf(minStock);


        return (
            <>
            <h1>Dashboard</h1>
            <div id="data-visualization-section1" className="data-visualization-section">
            <div className="graph-item">
                <div
                    onClick={this.openPopup} // Click on graph to open the popup
                    style={{
                        cursor: 'pointer',
                        width: '100%',
                        height: '100%',
                        marginBottom: '20px',
                    }}
                >
                    <Plot {...mainChartData} />
                </div>
                <h3>Course Vacancies For {currentQuarter}</h3>
            </div>
            <div className="graph-item">
            <div
                    onClick={this.openPopup2} // Click on graph to open the popup
                    style={{
                        cursor: 'pointer',
                        width: '100%',
                        height: '100%',
                        marginBottom: '20px',
                    }}
                >
                    <Plot {...mainChartData1} />
                </div>
                <h3>Sales Report By Location</h3>
            </div>
            <div className="graph-item">
                <div
                    onClick={this.openPopup3} // Click on graph to open the popup
                    style={{
                        cursor: 'pointer',
                        width: '100%',
                        height: '100%',
                        marginBottom: '20px',
                    }}
                >
                    <Plot {...mainChartData2} />
                </div>
                <h3>Sales Report By Quarter</h3>
            </div>
            </div>
                {showPopup && (
                    <div className="popup-overlay5">
                        <div className="popup-container">
                            <div className="popup-header">
                                <button onClick={this.closePopup} className="popup-close-btn5">&times;</button>
                            </div>
                            <div className="popup-body">
                                <h1>Course Report</h1>
                                <br/>
                                <label htmlFor="locationSelect">Select Location:</label>
                                <select id="locationSelect" value={selectedLocation} onChange={this.handleLocationChange}>
                                    <option value="">All Locations</option>
                                    {Array.from(productLocation).map((location, index) => (
                                        <option key={index} value={location}>
                                            {location}
                                        </option>
                                    ))}
                                </select>
                                
                                {/* Plot component - your updated chart for the popup */}
                                <Plot {...popupChartData} />
                            </div>
                            <div className="popup-footer">
                                <h4>Details Summary</h4>
                                <p>Most popular course: {productNames[mostPopularProductIndex]}</p>
                                <p>Least popular course: {productNames[leastPopularProductIndex]}</p>
                            </div>
                        </div>
                    </div>
                )}
                {showPopup2 && (
                    <div className="popup-overlay5">
                        <div className="popup-container">
                        <div className="popup-header">
                            <button onClick={this.closePopup2} className="popup-close-btn5">&times;</button>
                        </div>
                        <div className="popup-body">
                            <h1>Sales Report</h1>
                            <br />
                            <label htmlFor="quarterSelect">Select Quarter:</label>
                            <select 
                            id="quarterSelect" 
                            value={selectedQuarter} 
                            onChange={this.handleQuarterChange}
                            >
                            <option value="">All Quarters</option>
                            {
                                    // Iterate over salesData to extract course names and quarters
                                    salesData.flatMap((product) =>
                                        product.locations.flatMap((location) =>
                                            location.quarters.map((quarter) => ({
                                                courseEngName: product.courseEngName,
                                                courseQuarter: quarter.courseQuarter
                                            }))
                                        )
                                    )
                                    // Remove duplicate courseQuarter values, keeping the courseEngName with it
                                    .map((item, index, self) =>
                                        self.findIndex((t) => t.courseQuarter === item.courseQuarter) === index ? item : null
                                    )
                                    .filter(Boolean)
                                    .map((item) => (
                                        <option key={item.courseQuarter} value={item.courseQuarter}>
                                            {`${item.courseQuarter}`}
                                        </option>
                                    ))
                                }
                            </select>
                            <label htmlFor="locationSelect">Select Location:</label>
                            <select 
                            id="locationSelect" 
                            value={selectedLocation1} 
                            onChange={this.handleLocationChange1}
                            >
                            <option value="">All Locations</option>
                            {Array.from(
                                new Set(
                                salesData.flatMap((product) =>
                                    product.locations.flatMap((location) =>
                                    location.quarters.flatMap((quarter) =>
                                        quarter.courseQuarter === selectedQuarter 
                                        ? [location.courseLocation] 
                                        : [] 
                                    )
                                    )
                                )
                                )
                            ).map((courseLocation) => (
                                <option key={courseLocation} value={courseLocation}>
                                {courseLocation === 'SpecificLocation' ? 'Special Label' : courseLocation}
                                </option>
                            ))}
                        </select>
                    <Plot {...popupChartData1} />
                    </div>
                    {/* Detail Summary Section */}
                    {(selectedQuarter === "" || selectedLocation1 === "") ? (
                            (() => {
                                // Gather all sales data
                                const allData = salesData
                                    .flatMap((product) =>
                                        product.locations.flatMap((location) =>
                                            location.quarters.map((quarter) => ({
                                                product: product.courseEngName,
                                                totalSales: quarter.totalPrice,
                                            }))
                                        )
                                    );

                                if (allData.length === 0) {
                                    return <p>No sales data available.</p>;
                                }

                                const highestSales = Math.max(...allData.map((data) => data.totalSales));
                                const lowestSales = Math.min(...allData.map((data) => data.totalSales));

                                const highestSalesProduct = allData.find((data) => data.totalSales === highestSales);
                                const lowestSalesProduct = allData.find((data) => data.totalSales === lowestSales);

                                return (
                                    <div className="popup-footer">
                                        <p><strong>Highest Sales:</strong> {highestSalesProduct.product} ${parseFloat(highestSales).toFixed(2)}</p>
                                        <p><strong>Lowest Sales:</strong> {lowestSalesProduct.product} ${parseFloat(lowestSales).toFixed(2)}</p>
                                    </div>
                                );
                            })()
                        ) : (
                            (() => {
                                // Filtering data based on selected quarter and location
                                const filteredData = salesData
                                    .flatMap((product) =>
                                        product.locations
                                            .filter((location) =>
                                                location.courseLocation === selectedLocation1 &&
                                                location.quarters.some(
                                                    (quarter) => quarter.courseQuarter === selectedQuarter
                                                )
                                            )
                                            .map((location) =>
                                                location.quarters
                                                    .filter((quarter) => quarter.courseQuarter === selectedQuarter)
                                                    .map((quarter) => ({
                                                        product: product.courseEngName,
                                                        totalSales: quarter.totalPrice,
                                                    }))
                                            )
                                    )
                                    .flat();


                                if (filteredData.length === 0) {
                                    return <p>No sales data available for the selected quarter and location.</p>;
                                }

                                const highestSales = Math.max(...filteredData.map((data) => data.totalSales));
                                const lowestSales = Math.min(...filteredData.map((data) => data.totalSales));

                                const highestSalesProduct = filteredData.find((data) => data.totalSales === highestSales);
                                const lowestSalesProduct = filteredData.find((data) => data.totalSales === lowestSales);

                                return (
                                    <div className="popup-footer">
                                        <p><strong>Highest Sales:</strong> {highestSalesProduct.product} ${parseFloat(highestSales).toFixed(2)}</p>
                                        <p><strong>Lowest Sales:</strong> {lowestSalesProduct.product} ${parseFloat(lowestSales).toFixed(2)}</p>
                                    </div>
                                );
                            })()
                        )}
                    </div>
                </div>
            )}
            {showPopup3 && (
                    <div className="popup-overlay5">
                        <div className="popup-container">
                        <div className="popup-header">
                            <button onClick={this.closePopup3} className="popup-close-btn5">&times;</button>
                        </div>
                        <div className="popup-body">
                            <h1>Sales Quarter Report</h1>
                            <br />
                            <label htmlFor="quarterSelect">Select Course:</label>
                            <select 
                            id="courseSelect" 
                            value={selectedCourse} 
                            onChange={this.handleCourseChange}
                            >
                            <option value="">All Courses</option>
                            {
                                Array.from(
                                    new Set(salesData.flatMap((product) => product.courseEngName))
                                ).map((courseName) => (
                                    <option key={courseName} value={courseName}>
                                        {courseName}
                                    </option>
                                    ))
                            }
                            </select>

                            <label htmlFor="locationSelect">Select Location:</label>
                            <select 
                            id="locationSelect" 
                            value={selectedLocation2} 
                            onChange={this.handleLocationChange2}
                            >
                            <option value="">All Locations</option>
                            {Array.from(
                                new Set(
                                salesData.flatMap((product) =>
                                    product.locations.flatMap((location) =>
                                    location.quarters.flatMap((quarter) =>
                                        product.courseEngName === selectedCourse 
                                        ? [location.courseLocation] 
                                        : [] 
                                    )
                                    )
                                )
                                )
                            ).map((courseLocation) => (
                                <option key={courseLocation} value={courseLocation}>
                                {courseLocation === 'SpecificLocation' ? 'Special Label' : courseLocation}
                                </option>
                            ))}
                        </select>
                    <Plot {...popupChartData2} />
                    </div>
                    {/* Detail Summary Section */}
                    {(selectedCourse === "" || selectedLocation2 === "") ? (
                            (() => {
                                // Gather all sales data
                                const allData = salesData
                                    .flatMap((product) =>
                                        product.locations.flatMap((location) =>
                                            location.quarters.map((quarter) => ({
                                               quarter: quarter.courseQuarter,
                                                totalSales: quarter.totalPrice,
                                            }))
                                        )
                                    );

                                if (allData.length === 0) {
                                    return <p>No sales data available.</p>;
                                }

                                const highestSales = Math.max(...allData.map((data) => data.totalSales));
                                const lowestSales = Math.min(...allData.map((data) => data.totalSales));

                                const highestSalesProduct = allData.find((data) => data.totalSales === highestSales);
                                const lowestSalesProduct = allData.find((data) => data.totalSales === lowestSales);

                                return (
                                    <div className="popup-footer">
                                        <p><strong>Highest Sales:</strong> {highestSalesProduct.quarter} ${parseFloat(highestSales).toFixed(2)}</p>
                                        <p><strong>Lowest Sales:</strong> {lowestSalesProduct.quarter} ${parseFloat(lowestSales).toFixed(2)}</p>
                                    </div>
                                );
                            })()
                        ) : (
                            (() => {
                                const filteredData = salesData
                                    .filter((product) => product.courseEngName === selectedCourse) // Check product.courseEngName
                                    .flatMap((product) =>
                                        product.locations
                                        .filter((location) => location.courseLocation === selectedLocation2) // Check location
                                        .flatMap((location) =>
                                            location.quarters.map((quarter) => ({
                                            quarter: quarter.courseQuarter,
                                            totalSales: quarter.totalPrice,
                                            }))
                                        )
                                    );

                              // Check if data is available
                              if (filteredData.length === 0) {
                                return <p>No sales data available for the selected quarter and location.</p>;
                              }
                              
                              // Extract highest and lowest sales
                              const highestSales = Math.max(...filteredData.map((data) => data.totalSales));
                              const lowestSales = Math.min(...filteredData.map((data) => data.totalSales));
                              
                              // Find products with highest and lowest sales
                              const highestSalesProduct = filteredData.find(
                                (data) => data.totalSales === highestSales
                              );
                              const lowestSalesProduct = filteredData.find(
                                (data) => data.totalSales === lowestSales
                              );
                              
                              // Render the results
                              return (
                                <div className="popup-footer">
                                  <p>
                                    <strong>Highest Sales:</strong> {highestSalesProduct.quarter} ${highestSales.toFixed(2)}
                                  </p>
                                  <p>
                                    <strong>Lowest Sales:</strong> {lowestSalesProduct.quarter} ${lowestSales.toFixed(2)}
                                  </p>
                                </div>
                              );
                            })()
                        )}
                    </div>
                </div>
            )}
            </>
        );
    }
}

export default DashboardSection;
