import React, { Component } from "react";

class CoursesList extends Component {
  render() {
    const { courses, addToCart, showMoreInfo, renderCourseName } = this.props;

    return (
      <div className="course-selection-container">
        <h1>Course Selection</h1>
        <ul className="course-list">
          {courses.map((course) => (
            <li key={course.id} className="course-item">
              {/* Course Name Rendering */}
              <div className="course-header">
                <img
                  src={course.images[0].src || "https://via.placeholder.com/150"}
                  alt={course.name}
                  className="course-image"
                />
              </div>

              {/* Course body with price */}
              <div className="course-body">
                {renderCourseName(course.name)}
                <p className="course-price">
                  {course.price ? `$${course.price}` : "Price not available"}
                </p>
              </div>

              {/* Footer with buttons */}
              <div className="course-footer">
                {/*<button
                    onClick={() => showMoreInfo(course)}
                    className="more-info-btn"
                  >
                  More Info
                </button>*/}
                <button
                  onClick={() => addToCart(course)}
                  className="add-to-cart-btn"
                >
                  Add to Cart
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

export default CoursesList;
