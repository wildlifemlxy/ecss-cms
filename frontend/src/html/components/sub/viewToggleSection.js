import React, { Component } from 'react';
import '../../../css/sub/viewToggle.css'; // Import CSS for styling

class ViewToggleSection extends Component {
    state = {
        inputValue: '', // State for the textbox input
        dropdownVisible: false, // Controls visibility of the dropdown
        options:  [] // Options for entries per page
    };

    handleViewChange = (mode) => {
        const total = this.props.getTotalNumber;
    
        if (mode === "paginated") {
            const array = this.calculateQuarterSegments(total);
            this.setState({ options: array });
        } else if (mode === "full") {
            this.setState({ inputValue: '', options: [], dropdownVisible: false }); // Reset textbox and options
        }
    
        this.props.onToggleView(mode);
    };
    

    handleInputChange = (event) => {
        const value = event.target.value;
        console.log("Input changed:", value); // Debugging line
        this.setState({ inputValue: value, dropdownVisible: true });
    };

    handleInputClick = () => {
        this.setState({ dropdownVisible: true });
    };

    handleOptionSelect = (value) => {
        this.setState({ inputValue: value, dropdownVisible: false });
        console.log(value);
        this.props.onEntriesPerPageChange(value); // Pass the selected value to the parent
    };

    handleBlur = (event) => {
        const isDropdownClicked = event.relatedTarget && event.relatedTarget.classList.contains('dropdown-list-toggle');
        if (!isDropdownClicked) {
            this.setState({ dropdownVisible: false }); // Hide dropdown only if not clicking on it
        }
    };

    handleMouseDown = (event) => {
        event.preventDefault(); // Prevent default to avoid blur
    };

    calculateQuarterSegments(total) {
        console.log("Total Number:", total);
        if (total == null) return []; // Return an empty array if total is undefined or null
    
        const segments = [
            total / 4,      // 1/4 of total
            (total / 4) * 2, // 2/4 of total (or 1/2)
            (total / 4) * 3, // 3/4 of total
            total           // 4/4 of total
        ];
        console.log("Segments:", segments);
    
        const dropdownList = segments.map(segment => {
            // Round based on the decimal value
            return (segment % 1 >= 0.4) ? Math.ceil(segment) : Math.floor(segment);
        }).map(segment => segment.toString()); // Convert to strings
    
        // Convert the dropdown list to a Set to ensure unique values
        const filteredList = dropdownList.filter(item => parseInt(item) > 0);
        const uniqueDropdownList = new Set(filteredList);
    
        // Return as an array
        return Array.from(uniqueDropdownList);
    }
    
    
    render() {
        const { viewMode } = this.props;
        const { inputValue, dropdownVisible, options } = this.state;

        return (
            <div className="view-toggle1">
                <div className="button-row">
                    <button
                        onClick={() => this.handleViewChange('full')}
                        className={viewMode === 'full' ? 'active' : ''}
                    >
                      {this.props.language !== "zh" ? "Full View" : "全视图"}
                    </button>
                    <button
                        onClick={() => this.handleViewChange('paginated')}
                        className={viewMode === 'paginated' ? 'active' : ''}
                    >
                         {this.props.language !== "zh" ? "Paginated View" : "分页视图"}
                    </button>
                </div>

                {/* Conditionally render the input and label based on view mode */}
                {viewMode === 'paginated' && (
                    <div className="items-per-page">
                        <label htmlFor="entries-per-page" className="per-page-label">Entries per page</label>
                        <input
                            id="entries-per-page"
                            type="text"
                            className="per-page-select"
                            value={inputValue}
                            onClick={this.handleInputClick}
                            onChange={this.handleInputChange}
                            onBlur={this.handleBlur} // Hide dropdown on blur
                            placeholder="Entries per page"
                            autoComplete="off"
                        />
                        {dropdownVisible && (
                            <ul className="dropdown-list-toggle">
                                {options
                                    .filter(option => option.toString().includes(inputValue)) // Filter options based on input
                                    .map(option => (
                                        <li
                                            key={option}
                                            onMouseDown={this.handleMouseDown} // Prevent blur
                                            onClick={() => this.handleOptionSelect(option)}
                                        >
                                            {option}
                                        </li>
                                    ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        );
    }
}

export default ViewToggleSection;
