      import React, { Component } from 'react';
      import '../../../css/sub/search.css'; // Ensure you have this CSS file for styling

      const languageTranslations = {
        "English": '英语',
        "Mandarin": '中文',
        "English and Mandarin": '英文和中文',
        "All Languages": '所有语言',
        "All Locations": '所有地点'
      }

      class SearchSection extends Component {
        constructor(props) {
          super(props);
          this.state = {
            searchQuery: '',
            centreLocation: '',
            language: '',
            status: '',
            courseType: '',
            course: '',
            locations: [], // Default to props if available
            languages: [], // Default to props if available
            statuses: [], // Default to props if available
            types: [], // Default to props if available
            roles: [],
            coursesName: [],
            filteredLocations: [],
            filteredLanguages: [],
            filteredStatuses: [],
            filteredTypes: [],
            filteredRoles: [],
            filteredCoursesName: [],
            showLocationDropdown: false,
            showLanguageDropdown: false,
            showTypeDropdown: false,
            showCourseDropdown: false,
            showAccountTypeDropdown: false,
            role: '',
            staffName: ''
          };
          this.locationDropdownRef = React.createRef();
          this.languageDropdownRef = React.createRef();
          this.accountTypeDropdownRef = React.createRef();
          this.typeDropdownRef = React.createRef();
          this.courseDropdownRef = React.createRef();
        }


        // Translate languages to Chinese if the selected language is 'zh'
        translateLanguages = (languages) => {
          if (this.props.language === 'zh') {
            return languages.map(lang => languageTranslations[lang] || lang);
          }
          return languages;
        };

        handleChange = (event) => {
          const { name, value } = event.target;
          console.log("handleChange", name,event)
          this.setState({ [name]: value }, () => {
            if (name === 'centreLocation') {
              this.setState({
                filteredLocations: this.state.locations.filter(location =>
                  location.toLowerCase().includes(value.toLowerCase())
                ),
                centrelocation: value
              });
            } else if (name === 'language') {
              this.setState({
                filteredLanguages: this.state.languages.filter(lang =>
                  lang.toLowerCase().includes(value.toLowerCase())
                ),
                language: value
              });
            }  else if (name === 'courseType') {
              console.log("Course Types:", value);
              this.setState({
                filteredTypes: this.state.types.filter(type =>
                  type.toLowerCase().includes(value.toLowerCase())
                ),
                courseType: value
              });
            } 
            else if (name === 'courseName') {
              console.log("Selected Course Name:", value);
              this.setState({
                courses: this.state.coursesName.filter(courseName =>
                  courseName.toLowerCase().includes(value.toLowerCase())
                ),
                course: value
              });
            }
            else if (name === 'accountType') {
              console.log(name, value);
              this.setState({
                filteredRoles: this.state.roles.filter(role =>
                 role.toLowerCase().includes(value.toLowerCase())
                ),
               role: value
              });
            }else if (name === 'searchQuery') {
              console.log(name, value);
              this.props.passSearchedValueToParent(value);
            }
          });
        };

        handleDropdownToggle = (dropdown) =>
        {
          console.log("Dropdown:", dropdown);
          if(dropdown === 'showLocationDropdown')
          {
            this.setState({
              showLocationDropdown: true,
              showLanguageDropdown: false,
              showTypeDropdown: false,
              showCourseDropdown: false,
              showAccountTypeDropdown: false
            });
          }
          else if(dropdown === 'showLanguageDropdown')
            {
              this.setState({
                showLocationDropdown: false,
                showLanguageDropdown: true,
                showTypeDropdown: false,
                showCourseDropdown: false,
                showAccountTypeDropdown: false
              });
            }
            else if(dropdown === 'showTypeDropdown')
            {
                this.setState({
                  showLocationDropdown: false,
                  showLanguageDropdown: false,
                  showTypeDropdown: true,
                  showCourseDropdown: false,
                  showAccountTypeDropdown: false
                });
            }
            else if(dropdown === 'showCourseDropdown')
            {
                console.log("Show");
                this.setState({
                  showLocationDropdown: false,
                  showLanguageDropdown: false,
                  showTypeDropdown: false,
                  showCourseDropdown: true,
                  showAccountTypeDropdown: false
                });
            }
            else if(dropdown === 'showAccountTypeDropdown')
              {
                this.setState({
                  showLocationDropdown: false,
                  showLanguageDropdown: false,
                  showTypeDropdown: false,
                  showCourseDropdown: false,
                  showAccountTypeDropdown: true
                });
            }
        }

        handleOptionSelect = (value, dropdown) => {
          console.log("Selected value:", value);
          const isMandarin = this.props.language === "zh"; 
          let updatedState = {};

            // Update state based on dropdown type
            if (dropdown === 'showLocationDropdown') {
              updatedState = {
                centreLocation: value,
                showLocationDropdown: false, // Close the location dropdown
                showLanguageDropdown: false,
                showTypeDropdown: false,
                showCourseDropdown: false,
                showAccountTypeDropdown: false
              };
            } else if (dropdown === 'showLanguageDropdown') {
              updatedState = {
                language: value,
                showLocationDropdown: false,
                showLanguageDropdown: false, // Close the language dropdown
                showTypeDropdown: false,
                showCourseDropdown: false,
                showAccountTypeDropdown: false
              };
            } else if (dropdown === 'showTypeDropdown') {
              updatedState = {
                courseType: value,
                showLocationDropdown: false,
                showLanguageDropdown: false,
                showTypeDropdown: false,
                showCourseDropdown: false,
                showAccountTypeDropdown: false // Close the type dropdown
              };
            }
            else if (dropdown === 'showAccountTypeDropdown') {
              console.log(value);
              updatedState = {
                role: value,
                showLocationDropdown: false,
                showLanguageDropdown: false,
                showTypeDropdown: false,
                showAccountTypeDropdown: false,
                showCourseDropdown: false
              };
            }
             else if(dropdown === 'showCourseDropdown')
            {
              updatedState =({
                  course: value,
                  showLocationDropdown: false,
                  showLanguageDropdown: false,
                  showTypeDropdown: false,
                  showCourseDropdown: false,
                  showAccountTypeDropdown: false
                });
            }
        
        
            this.setState(updatedState, () => {
              console.log("Updated States:", updatedState, dropdown);
              // Notify parent with the updated state
              this.props.passSelectedValueToParent(updatedState, dropdown);
            });
        }

        handleClickOutside = (event) => {
          if (
            this.locationDropdownRef.current &&
            !this.locationDropdownRef.current.contains(event.target) &&
            this.languageDropdownRef.current &&
            !this.languageDropdownRef.current.contains(event.target) &&  
            this.typeDropdownRef.current &&
            !this.typeDropdownRef.current.contains(event.target) &&
            this.courseDropdownRef.current &&
            !this.courseDropdownRef.current.contains(event.target) &&
            this.accountTypeDropdownRef.current &&
            !this.accountTypeDropdownRef.current.contains(event.target)
          ) {
            this.setState({
              showLocationDropdown: false,
              showLanguageDropdown: false,
              showTypeDropdown: false,
              showCourseDropdown: false,
              showAccountTypeDropdown: false,
            });
          }
        };

        componentDidMount() {
          document.addEventListener('mousedown', this.handleClickOutside);
          this.updateUniqueLocationsLanguagesRolesTypes(this.props);
        }

          componentDidUpdate(prevProps) {
            console.log(this.props);  
            if ((this.props.resetSearch && prevProps.resetSearch !== this.props.resetSearch)) {
              this.setState({
                searchQuery: '',
                centreLocation: '',
                language: '',
                role: '',
                courseName: '',
                showLocationDropdown: false,
                showLanguageDropdown: false,
                showTypeDropdown: false,
                showCourseDropdown: false,
                showAccountTypeDropdown: false
              });
            }
          
            if (this.props.locations !== prevProps.locations) {
              const uniqueLocations = ["All Locations", ...new Set(this.props.locations)];
              this.setState({
                locations: uniqueLocations,
                filteredLocations: uniqueLocations
              });
            }
          
            if (this.props.languages !== prevProps.languages) {
              const uniqueLanguages = ["All Languages", ...new Set(this.props.languages)];
              this.setState({
                languages: uniqueLanguages,
                filteredLanguages: uniqueLanguages
              }); 
            }  

                     
            if (this.props.types !== prevProps.types) {
              const uniqueTypes = ["All Courses Types", ...new Set(this.props.types)];
              this.setState({
                types: uniqueTypes,
                filteredTypes: uniqueTypes
              }); 
            }  

            if (this.props.courses !== prevProps.courses) {
              const uniqueCoursesName = ["All Courses Name", ...new Set(this.props.courses)];
              this.setState({
                coursesName: uniqueCoursesName,
                filteredCoursesName: uniqueCoursesName
              }); 
            }  

                      
            if (this.props.roles !== prevProps.roles) {
              const uniqueRoles = ["All Roles", ...new Set(this.props.roles)];
              this.setState({
                roles: uniqueRoles,
                filteredRoles: uniqueRoles
              }); 
            }  
          }
          
          // Method to handle updating locations and languages
        updateUniqueLocationsLanguagesRolesTypes(props) {
          const uniqueRoles = ["All Roles", ...new Set(props.roles)];
          const uniqueLocations = ["All Locations", ...new Set(props.locations)];
          const uniqueLanguages = ["All Languages", ...new Set(props.languages)];
          const uniqueTypes = ["All Courses Type", ...new Set(props.types)];
          const uniqueCoursesName = ["All Courses Name", ...new Set(props.courses)];
          console.log("Props:", props);
          console.log("Unique: ", uniqueCoursesName); 

          this.setState({
            locations: uniqueLocations,
            filteredLocations: uniqueLocations,
            languages: this.translateLanguages(uniqueLanguages), // Translate if necessary
            filteredLanguages: this.translateLanguages(uniqueLanguages), // Translate if necessary
            types: uniqueTypes, // Translate if necessary
            filteredTypes: uniqueTypes, // Translate if 
            roles: uniqueRoles, 
            filteredRoles: uniqueRoles,
            coursesName: uniqueCoursesName,
            filteredCoursesName: this.translateLanguages(uniqueCoursesName), // Translate if necessary
          });
        } 

        componentWillUnmount() {
          document.removeEventListener('mousedown', this.handleClickOutside);
        }

        
  render() 
  {
    const { showNameDropdown, typename, filteredName, staffName, searchQuery, centreLocation, language, filteredLocations, filteredLanguages, filteredTypes, showLocationDropdown, showLanguageDropdown, showTypeDropdown, courseType, showAccountTypeDropdown, role, roles, filteredRoles, coursesName, showCourseDropdown, filteredCoursesName, course} = this.state;
    const { section } = this.props; // Destructure section from props

    console.log("Course Name List:", this.state);
    return (
      <div className="filter-section"> {/* Same class name for both sections */}
        <div className="form-group-row" >
          {section === "accounts" && ( // Content for "registration"
            <>
            <div className="form-group">
                <label htmlFor="accountType">{this.props.language === 'zh' ? '' : 'Account Type'}</label>
                <div
                  className={`dropdown-container ${showAccountTypeDropdown ? 'open' : ''}`}
                  ref={this.accountTypeDropdownRef}
                >
                  <input
                    type="text"
                    id="accountType"
                    name="accountType"
                    value={role}
                    onChange={this.handleChange}
                    onClick={() => this.handleDropdownToggle('showAccountTypeDropdown')}
                    placeholder={this.props.language === 'zh' ? '' : 'Filter by account type'}
                    autoComplete="off"
                  />
                  {showAccountTypeDropdown && (
                    <ul className="dropdown-list">
                      {filteredRoles.map((role, index) => (
                        <li
                          key={index}
                          onClick={() => this.handleOptionSelect(role, 'showAccountTypeDropdown')}
                        >
                          {role}
                        </li>
                      ))}
                    </ul>
                  )}
                  <i className="fas fa-angle-down dropdown-icon"></i>
                </div>
              </div>
                <div className="form-group">
                <label htmlFor="searchQuery">{this.props.language === 'zh' ? '搜寻' : 'Search'}</label>
                <div className="search-container">
                  <input
                    type="text"
                    id="searchQuery"
                    name="searchQuery"
                    value={searchQuery}
                    onChange={this.handleChange}
                    placeholder={this.props.language === 'zh' ? '搜索' : 'Search'}
                    autoComplete="off"
                  />
                  <i className="fas fa-search search-icon"></i>
                </div>
              </div>
            </>            
          )}

          {section === "courses" && ( // Content for "courses"
            <>
              <div className="form-group">
                <label htmlFor="centreLocation">{this.props.language === 'zh' ? '中心位置' : 'Locations'}</label>
                <div
                  className={`dropdown-container ${showLocationDropdown ? 'open' : ''}`}
                  ref={this.locationDropdownRef}
                >
                  <input
                    type="text"
                    id="centreLocation"
                    name="centreLocation"
                    value={centreLocation}
                    onChange={this.handleChange}
                    onClick={() => this.handleDropdownToggle('showLocationDropdown')}
                    placeholder={this.props.language === 'zh' ? '按地点筛选' : 'Filter by location'}
                    autoComplete="off"
                  />
                  {showLocationDropdown && (
                    <ul className="dropdown-list">
                      {filteredLocations.map((location, index) => (
                        <li
                          key={index}
                          onClick={() => this.handleOptionSelect(location, 'showLocationDropdown')}
                        >
                          {location}
                        </li>
                      ))}
                    </ul>
                  )}
                  <i className="fas fa-angle-down dropdown-icon"></i>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="searchQuery">{this.props.language === 'zh' ? '搜寻' : 'Search'}</label>
                <div className="search-container">
                  <input
                    type="text"
                    id="searchQuery"
                    name="searchQuery"
                    value={searchQuery}
                    onChange={this.handleChange}
                    placeholder={this.props.language === 'zh' ? '搜索' : 'Search'}
                    autoComplete="off"
                  />
                  <i className="fas fa-search search-icon"></i>
                </div>
              </div>
            </>
          )}
          
          {section === "registration" && this.props.item !== "Receipt Table" &&  ( // Content for "registration"
            <>
            <div className="form-group">
                <label htmlFor="centreLocation">{this.props.language === 'zh' ? '中心位置' : 'Locations'}</label>
                <div
                  className={`dropdown-container ${showLocationDropdown ? 'open' : ''}`}
                  ref={this.locationDropdownRef}
                >
                  <input
                    type="text"
                    id="centreLocation"
                    name="centreLocation"
                    value={centreLocation}
                    onChange={this.handleChange}
                    onClick={() => this.handleDropdownToggle('showLocationDropdown')}
                    placeholder={this.props.language === 'zh' ? '按地点筛选' : 'Filter by location'}
                    autoComplete="off"
                  />
                  {showLocationDropdown && (
                    <ul className="dropdown-list">
                      {filteredLocations.map((location, index) => (
                        <li
                          key={index}
                          onClick={() => this.handleOptionSelect(location, 'showLocationDropdown')}
                        >
                          {location}
                        </li>
                      ))}
                    </ul>
                  )}
                  <i className="fas fa-angle-down dropdown-icon"></i>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="courseType">{this.props.language === 'zh' ? '' : 'Type'}</label>
                <div
                  className={`dropdown-container ${showTypeDropdown ? 'open' : ''}`}
                  ref={this.typeDropdownRef}
                >
                  <input
                    type="text"
                    id="courseType"
                    name="courseType"
                    value={courseType}
                    onChange={this.handleChange}
                    onClick={() => this.handleDropdownToggle('showTypeDropdown')}
                    placeholder={this.props.language === 'zh' ? '' : 'Filter by type'}
                    autoComplete="off"
                  />
                  {showTypeDropdown && (
                    <ul className="dropdown-list">
                      {filteredTypes.map((type, index) => (
                        <li
                          key={index}
                          onClick={() => this.handleOptionSelect(type, 'showTypeDropdown')}
                        >
                          {type}
                        </li>
                      ))}
                    </ul>
                  )}
                  <i className="fas fa-angle-down dropdown-icon"></i>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="course">{this.props.language === 'zh' ? '': 'Course'}</label>
                <div
                  className={`dropdown-container ${showCourseDropdown ? 'open' : ''}`}
                  ref={this.courseDropdownRef}
                >
                <input
                  type="text"
                  id="courseName"
                  name="courseName"
                  value={course} // Show only the first selected course or empty string
                  onChange={this.handleChange}
                  onClick={() => this.handleDropdownToggle('showCourseDropdown')}
                  placeholder={this.props.language === 'zh' ? '' : 'Filter by course'}
                  autoComplete="off"
                />


                  {showCourseDropdown && (
                    <ul className="dropdown-list">
                      {coursesName.map((courseName, index) => (
                        <li
                          key={index}
                          onClick={() => this.handleOptionSelect(courseName, 'showCourseDropdown')}
                        >
                          {courseName}
                        </li>
                      ))}
                    </ul>
                  )}
                  <i className="fas fa-angle-down dropdown-icon"></i>
                </div>
                </div>
                <div className="form-group">
                <label htmlFor="searchQuery">{this.props.language === 'zh' ? '搜寻' : 'Search'}</label>
                <div className="search-container">
                  <input
                    type="text"
                    id="searchQuery"
                    name="searchQuery"
                    value={searchQuery}
                    onChange={this.handleChange}
                    placeholder={this.props.language === 'zh' ? '搜索' : 'Search'}
                    autoComplete="off"
                  />
                  <i className="fas fa-search search-icon"></i>
                </div>
              </div>
            </>            
          )}
          {section === "registration" && this.props.item === "Receipt Table" &&  ( // Content for "registration"
            <>
            <div className="form-group">
                <label htmlFor="centreLocation">{this.props.language === 'zh' ? '中心位置' : 'Locations'}</label>
                <div
                  className={`dropdown-container ${showLocationDropdown ? 'open' : ''}`}
                  ref={this.locationDropdownRef}
                >
                  <input
                    type="text"
                    id="centreLocation"
                    name="centreLocation"
                    value={centreLocation}
                    onChange={this.handleChange}
                    onClick={() => this.handleDropdownToggle('showLocationDropdown')}
                    placeholder={this.props.language === 'zh' ? '按地点筛选' : 'Filter by location'}
                    autoComplete="off"
                  />
                  {showLocationDropdown && (
                    <ul className="dropdown-list">
                      {filteredLocations.map((location, index) => (
                        <li
                          key={index}
                          onClick={() => this.handleOptionSelect(location, 'showLocationDropdown')}
                        >
                          {location}
                        </li>
                      ))}
                    </ul>
                  )}
                  <i className="fas fa-angle-down dropdown-icon"></i>
                </div>
              </div>
                <div className="form-group">
                <label htmlFor="searchQuery">{this.props.language === 'zh' ? '搜寻' : 'Search'}</label>
                <div className="search-container">
                  <input
                    type="text"
                    id="searchQuery"
                    name="searchQuery"
                    value={searchQuery}
                    onChange={this.handleChange}
                    placeholder={this.props.language === 'zh' ? '搜索' : 'Search'}
                    autoComplete="off"
                  />
                  <i className="fas fa-search search-icon"></i>
                </div>
              </div>
            </>            
          )}
        </div>
      </div>
      );
  }
}
export default SearchSection;
