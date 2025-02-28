import React, { Component } from 'react';
import { DatePicker } from "@heroui/date-picker";
import '../../../css/sub/personalInfo.css'; // Custom styles
import { DayPicker, dayPickerContext } from 'react-day-picker';
import 'react-day-picker/style.css'; // Import default styles

// Custom input for the DayPicker component
const CustomInput = React.forwardRef(({ value, onClick }, ref) => (
  <input
    className="personal-info-input"
    value={value}
    onClick={onClick}
    ref={ref}
    placeholder="dd/mm/yyyy"
  />
));

class PersonalInfo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showCalendar: false, // Initialize the showCalendar state
      selectedDate: new Date(new Date().getFullYear() - 89, 0, 1), // Store the selected date
      manualDate: '', // Store the manual input for backspace handling
    };
  }

  // Handle text input change
  handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`${name}: ${value}`);
    this.props.onChange({ [name]: value});
  };

  handleChange1 = (e, field) => {
    if (field === "DOB") {
      const { name, value } = e.target;
  
      console.log(`${name}: ${value}`);
  
      // Update state immediately with user input (even if invalid)
      this.setState({ manualDate: value });
  
      // Regular expression to match "dd/mm/yyyy" format
      const datePattern = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
  
      if (datePattern.test(value)) {
        console.log(`Valid Date Entered: ${value}`);
        this.props.onChange({ [name]: value }); // Pass to parent only if valid
        this.setState({ selectedDate: new Date(value)});
  
      } else {
        console.warn("Invalid date format. Please use dd/mm/yyyy.");
      }
    }
  };
  
  

  // Handle backspace dynamically
  handleBackspace = (event) => {
    if (event.key === "Backspace") {
      const inputDate = this.state.manualDate;
      const newLength = inputDate.length - 1;

      if (newLength <= 0) {
        this.setState({ manualDate: '' });
        this.props.onChange({ dOB: { formattedDate: '', chineseDate: '' } });
      } else {
        this.setState({ manualDate: inputDate.substring(0, newLength) });
      }
    }
  };

  handleDateChange = (date) => {
    const formattedDate = date.toLocaleDateString("en-GB"); // "dd/mm/yyyy"
    console.log("Handle Date Change:", date);
    console.log("Current Selected Date:", this.state.selectedDate)
    console.log("Year:", date.getFullYear());
  
   if (formattedDate) {
      // Format the date as dd/mm/yyyy
      const formattedDate1 = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  
      // Format the date as yyyy年mm月dd日 for Chinese format
      //const chineseDate = `${date.getFullYear()}年${(date.getMonth() + 1)}月${date.getDate()}日`;
  
      // Update the state with the selected date and formatted dates
      this.setState({ selectedDate: date, manualDate: formattedDate1 });
  
      // Optionally, pass the formatted date back to parent (if needed)
      this.props.onChange({ dOB: { formattedDate1} });
    } else {
      // If no date is selected, clear the date
      this.setState({ selectedDate: null, manualDate: '' });
  
      // Optionally, pass empty values to parent
      this.props.onChange({ dOB: { formattedDate: ''} });
     }
  };

  // Toggle the calendar visibility
  toggleCalendar = (e) => {
    this.setState((prevState) => ({ showCalendar: !prevState.showCalendar }));
  };

  // Close the calendar
  closeCalendar = () => {
    this.setState({ showCalendar: false });
  };

  // Handle month change
  handleMonthChange = (event) => {
    const { selectedDate, manualDate } = this.state;
    const newMonth = parseInt(event, 10); // Get selected month (0-based)
    const newDate = new Date(selectedDate.getFullYear(), newMonth, selectedDate.getDate());
  
    // Format the date as dd/mm/yyyy
    const formattedDate = `${newDate.getDate().toString().padStart(2, '0')}/${(newDate.getMonth() + 1).toString().padStart(2, '0')}/${newDate.getFullYear()}`;
    const chineseDate = `${newDate.getFullYear()}年${(newDate.getMonth() + 1)}月${newDate.getDate()}日`;
  
    // Update local state to reflect the new selected date
    this.setState({ selectedDate: newDate, manualDate: formattedDate});
  
    // Update the parent component with the new formatted date and chinese date
    this.props.onChange({ dOB: { formattedDate, chineseDate } });
    this.setState({ showCalendar: false }); // Close calendar after selecting a date
  };

  handleYearChange = (event) => {
    const { selectedDate, manualDate } = this.state;
    console.log(event);
    console.log( selectedDate, manualDate);
    const newYear = parseInt(event, 10); // Get selected year
    const newDate = new Date(newYear, selectedDate.getMonth(), selectedDate.getDate());

    // Format the date as dd/mm/yyyy
    const formattedDate = `${newDate.getDate().toString().padStart(2, '0')}/${(newDate.getMonth() + 1).toString().padStart(2, '0')}/${newDate.getFullYear()}`;
    const chineseDate = `${newDate.getFullYear()}年${(newDate.getMonth() + 1)}月${newDate.getDate()}日`;
    console.log(formattedDate); 
  
    // Update local state to reflect the new selected date
    this.setState({ selectedDate: newDate, manualDate: formattedDate });
  
    // Update the parent component with the new formatted date and chinese date
    this.props.onChange({ dOB: { formattedDate, chineseDate } });
    this.setState({ showCalendar: false }); // Close calendar after selecting a date*/
  };

  render() {
    const { data = {}, errors } = this.props; // Default value for data is an empty object

    // Define the sections and their respective fields
    const sections = [
      { name: 'pName', label: 'Name 姓名', placeholder: 'Name 姓名 (As in NRIC 与身份证相符)', isSelect: false, isRadio: false },
      { name: 'nRIC', label: 'NRIC Number 身份证号码', placeholder: 'NRIC Number 身份证号码', isSelect: false, isRadio: false },
      { name: 'rESIDENTIALSTATUS', label: 'Residential Status 居民身份', placeholder: 'Residential Status 居民身份', isSelect: true, isRadio: true },
      { name: 'rACE', label: 'Race 种族', placeholder: 'Race 种族', isSelect: true, isRadio: true },
      { name: 'gENDER', label: 'Gender 性别', placeholder: 'Gender 性别', isSelect: true, isRadio: true },
      { name: 'dOB', label: 'Date of Birth 出生日期', placeholder: 'Date of Birth 出生日期', isSelect: true, isDate: true },
      { name: 'cNO', label: 'Contact No. 联络号码', placeholder: 'Contact No. 联络号码', isSelect: false, isRadio: false },
      { name: 'eMAIL', label: 'Email 电子邮件', placeholder: 'Enter "N/A" if no email 如果没有电子邮件，请输入“N/A”', isSelect: false, isRadio: false },
      { name: 'postalCode', label: 'Postal Code 邮区', placeholder: 'Postal Code 邮区', isSelect: false, isRadio: false },
      { name: 'eDUCATION', label: 'Education Level 最高教育水平', placeholder: 'Education Level 最高教育水平', isSelect: true, isRadio: true },
      { name: 'wORKING', label: 'Work Status 工作状态', placeholder: 'Work Status 工作状态', isSelect: true, isRadio: true }
    ];

      // Define additional options for radio buttons
      const residentalStatusOptions = ['SC 新加坡公民', 'PR 永久居民'];
      const genderOptions = ['M 男', 'F 女'];
      const educationOptions = [
        'Primary 小学',
        'Secondary 中学',
        'Post-Secondary (Junior College/ITE) 专上教育',
        'Diploma 文凭',
        "Bachelor's Degree 学士学位",
        "Master's Degree 硕士",
        'Others 其它',
      ];
      const workingStatusOptions = [
        'Retired 退休',
        'Employed full-time 全职工作',
        'Self-employed 自雇人',
        'Part-time 兼职',
        'Unemployed 失业',
      ];
      const raceOptions = ['Chinese 华', 'Indian 印', 'Malay 马', 'Others 其他'];
  
      // Map section names to respective radio button options
      const optionMappings = {
        gENDER: genderOptions,
        eDUCATION: educationOptions,
        rACE: raceOptions,
        wORKING: workingStatusOptions,
        rESIDENTIALSTATUS: residentalStatusOptions,
      };
  
      // Get all months and years for selection
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      const currentYear = new Date().getFullYear();
      const latestYear = currentYear - 50; // 50 years before the current year
    
      // Assume earliestYear comes from an external source, such as input, settings, etc.
      let earliestYear = 1934; // You can make this dynamic
  
      // Generate the years in ascending order, from earliestYear to latestYear
      const years = Array.from({ length: latestYear - earliestYear + 1 }, (_, i) => earliestYear + i);
  
      const maxDate = new Date();
      console.log("Last Year:", maxDate.getFullYear()-50);
      maxDate.setFullYear(maxDate.getFullYear() - 50);

    return (
      <div>
        {sections.map((section) => (
          <div key={section.name} className="input-group1">
            <label htmlFor={section.name}>{section.label}</label>
            {section.isRadio ? (
              <div className="radio-group1">
                {optionMappings[section.name]?.map((option) => (
                  <label key={option} className="radio-option1">
                    <input
                      type="radio"
                      name={section.name}
                      value={option}
                      checked={data[section.name] === option}
                      onChange={this.handleChange} // 
                      onClick={this.closeCalendar}
                    />
                    {option}
                  </label>
                ))}
              </div>
            ) : section.isSelect && section.isDate ? (
              <>
                <input
                  id={section.name}
                  name={section.name}
                  type="text"
                  className="personal-info-input"
                  //value={data[section.name] || ''}
                  value={this.state.manualDate || ''}
                  placeholder="dd/mm/yyyy"
                  //placeholder={this.state.placeholder}
                  onChange={(e) => { e.stopPropagation(); this.handleChange1(e, "DOB")}} // Ensure onChange is set
                  onBlur={this.closeCalendar}
                  autoComplete='off'
                />
                <i class="fa fa-calendar custom-icon" aria-hidden="true" onClick={(e) => { e.stopPropagation(); this.toggleCalendar(e); }}/>
                 {this.state.showCalendar && (
                    <div className="calendar-popup">
                       {/* Month and Year Select Dropdowns */}
                       <div className="month-year-selection">
                        <select
                          value={new Date(this.state.manualDate).getMonth()}
                          onChange={(e) => { e.stopPropagation(); this.handleMonthChange(e.target.value)}}
                        >
                          {months.map((month, index) => (
                            <option key={index} value={index}>
                              {month}
                            </option>
                          ))}
                        </select>
                        <select
                          value={new Date(this.state.manualDate).getFullYear()}
                          onChange={(e) => { e.stopPropagation(); this.handleYearChange(e.target.value)}}
                        >
                          {years.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                      <DayPicker
                          selected={this.state.selectedDate || new Date(new Date().getFullYear() - 50, 0, 1)}
                          onDayClick={this.handleDateChange}
                          month={this.state.selectedDate}
                          minDate={new Date(new Date().getFullYear() - 100, 0, 1)}
                          maxDate={new Date(new Date().getFullYear() - 50, 0, 1)}
                          disabled={(date) => date.toDateString() === new Date().toDateString()}
                        />
                        <button type="button" onClick={this.closeCalendar}>Close</button>
                    </div>
                  )}
                  <br />
              </>
            ) : (  
              <input
                type="text"
                id={section.name}
                name={section.name}
                placeholder={section.placeholder}
                value={data[section.name] || ''} // Ensure we use empty string as fallback
                onChange={this.handleChange} // Ensure onChange is set
                className="personal-info-input1"
                onClick={this.closeCalendar}
              />
            )}
            {errors[section.name] && <span className="error-message3">{errors[section.name]}</span>}
          </div>
        ))}
      </div>
    );
  }
}

export default PersonalInfo;
