import React from 'react';
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';
import Home from './components/Home';
import Admin from './components/Admin';
import Dashboard from './components/Dashboard';
import SPConfiguration from './components/SPConfiguration';

function App() {
  return (
    <Router>
      <div style={{ padding: '20px' }}>
        <nav style={{ marginBottom: '20px' }}>
          <Link to="/">Home</Link> | <Link to="/admin">Admin</Link> | <Link to="/dashboard">Dashboard</Link> | <Link to="/SPConfiguration">SPConfiguration</Link>
        </nav>
        <Switch>
          <Route exact path="/" component={Home} />
          <Route path="/admin" component={Admin} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/SPConfiguration" component={SPConfiguration} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;