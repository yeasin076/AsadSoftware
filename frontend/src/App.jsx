import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Expenses from './pages/Expenses';
import Investments from './pages/Investments';
import CashMemo from './pages/CashMemo';
import ManageAdmin from './pages/ManageAdmin';

function App() {
  const { loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          }
        />
        
        <Route
          path="/inventory"
          element={
            <PrivateRoute>
              <Layout>
                <Inventory />
              </Layout>
            </PrivateRoute>
          }
        />
        
        <Route
          path="/sales"
          element={
            <PrivateRoute>
              <Layout>
                <Sales />
              </Layout>
            </PrivateRoute>
          }
        />
        
        <Route
          path="/reports"
          element={
            <PrivateRoute>
              <Layout>
                <Reports />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/expenses"
          element={
            <PrivateRoute>
              <Layout>
                <Expenses />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/investments"
          element={
            <PrivateRoute>
              <Layout>
                <Investments />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/cashmemo"
          element={
            <PrivateRoute>
              <Layout>
                <CashMemo />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/manage-admin"
          element={
            <PrivateRoute>
              <Layout>
                <ManageAdmin />
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
