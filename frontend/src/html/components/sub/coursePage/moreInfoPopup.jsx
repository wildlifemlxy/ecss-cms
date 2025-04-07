import React, { Component } from "react";
import "../../../../css/sub/coursePage/moreInfoPopup.css"; // Import the CartPopup CSS styles here


class MoreInfoPopup extends Component 
{    
    render() {
        const { selectedCourse, renderCourseName2, renderDescription, renderCourseDetails, handleClose, handleAddToCart } = this.props;

        if (!selectedCourse) return null;
        console.log("Selected Course:", selectedCourse);

        return (
        <div className="course-popup">
            <div className="popup-overlay1" onClick={this.closePopup}></div>
            <div className="popup-content1">
            <div className="course-details">
                <div className="course-header1">
                <img
                    src={selectedCourse.images[0].src || "https://via.placeholder.com/150"}
                    className="popup-course-image"
                />
                <div className="course-info">
                   {renderCourseName2(selectedCourse.name)}
                </div>
                </div>
                <p className="course-description">{renderDescription(selectedCourse.description)}</p>
                <div className="course-details-section">
                <h3>Course Details</h3>
                <p style={{ display: 'flex' }}><strong style={{ marginRight: '1rem' }}>Contact Number:</strong> {renderCourseDetails(selectedCourse.short_description).contactNumber}</p>
                <p style={{ display: 'flex' }}><strong style={{ marginRight: '1rem' }}>Language: </strong> {renderCourseDetails(selectedCourse.short_description).language}</p>
                <p style={{ display: 'flex' }}><strong style={{ marginRight: '1rem' }}>Location: </strong> {renderCourseDetails(selectedCourse.short_description).location}</p>
                <p style={{ display: 'flex' }}>
                    <strong style={{ marginRight: '1rem' }}>Fee/Lesson/Vacancy:</strong>
                    {renderCourseDetails(selectedCourse.short_description).feeLessonVacancy}
                </p>
                <p style={{ display: 'flex' }}>
                    <strong style={{ marginRight: '1rem' }}>Lesson Schedule:</strong>
                    {renderCourseDetails(selectedCourse.short_description).lessonSchedule}
                </p>
                <p style={{ display: 'flex' }}>
                    <strong style={{ marginRight: '1rem' }}>Course Duration:</strong>
                    {renderCourseDetails(selectedCourse.short_description).courseDateRange}
                </p>
                </div>
                <div className="course-reviews">
                    <div className="button-container">
                    <button onClick={handleClose}>Close</button>
                    <button onClick={()  => handleAddToCart(selectedCourse)}>Add to Cart</button>
                    </div>
                </div>
            </div>
            </div>
        </div>
        );
    }
}

export default MoreInfoPopup;
