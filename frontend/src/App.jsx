import React, { Component } from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import LoginPage from './html/components/loginPage';
import NewCustomersPage from './html/components/newCustomers';
import HomePage from './html/components/homePage';
import FormPage from './html/components/formPage';
import MassImportPage from './html/components/massImportPage';
import CourseSelectionPage from './html/components/courseSelectionPage';
import SingpassPage from './html/components/singpassPage';
import MyInfoRedirectPage from './html/components/MyInfoRedirectPage';
import MyInfoResultsPage from './html/components/MyInfoResultsPage';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { AuthProvider  } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import ErrorPage from './html/components/errorPage';

class App extends Component
{
  render() 
  {
    return (
      <AuthProvider>  
      <Router>
        <Switch>
          <Route exact path="/" component={LoginPage} />
          <ProtectedRoute path="/home" component={HomePage} />
          <Route path="/form" component={FormPage} />
          <Route path="/new" component={NewCustomersPage} />
          <Route path="/mass" component={MassImportPage} />
          <Route path="/coursesSelection" component={CourseSelectionPage}/>
          <Route exact path="/singpass" component={SingpassPage} />
          <Route path="/myinfo-redirect" component={MyInfoRedirectPage} />
          <Route path="/myinfo-results" component={MyInfoResultsPage} />
          <Route component={ErrorPage} />
        </Switch>
      </Router>
      </AuthProvider>
    );
  }
}

export default App;
