// PaginationSection.jsx
import React, { Component } from 'react';
import '../../../css/sub/pagination.css'; // Ensure this path is correct

class PaginationSection extends Component {
  handlePageChange = (page) => {
    const { currentPage, totalPages, onPageChange } = this.props;
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  renderPageNumbers() {
    const { currentPage, totalPages } = this.props;
    console.log("Render page Number:", this.props)
    const pageNumbers = [];
    const range = 5; // Number of page numbers to show on each side of the current page

    // Calculate start and end page numbers
    let startPage = Math.max(1, currentPage - range);
    let endPage = Math.min(totalPages, currentPage + range);

    if (endPage - startPage + 1 < 2 * range + 1) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + 2 * range);
      } else {
        startPage = Math.max(1, endPage - 2 * range);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers.map(number => (
      <button
        key={number}
        onClick={() => this.handlePageChange(number)}
        className={`page-number ${number === currentPage ? 'active' : ''}`}
        style={{ opacity: number === currentPage ? '1' : '0.6' }}
      >
        {number}
      </button>
    ));
  }

  render() {
    const { currentPage, totalPages, viewMode } = this.props;

    // Conditionally render based on viewMode
    if (viewMode === 'full') {
      return null; // Return nothing if viewMode is 'full'
    }

    return (
      <div className="pagination">
        <button 
          onClick={() => this.handlePageChange(1)} 
          disabled={currentPage === 1}
          className="pagination-button"
        >
          &laquo; {/* Double left angle quotation mark */}
        </button>
        {this.renderPageNumbers()}
        <button 
          onClick={() => this.handlePageChange(totalPages)} 
          disabled={currentPage === totalPages}
          className="pagination-button"
        >
          &raquo;{/* Double right angle quotation mark */}
        </button>
      </div>
    );
  }
}

export default PaginationSection;
