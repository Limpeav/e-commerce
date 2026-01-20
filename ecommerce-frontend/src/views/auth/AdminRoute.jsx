import React from 'react'
import { Navigate } from 'react-router-dom'

// Admin Route - Only allows admin users
const AdminRoute = ({ children }) => {
  // Check for admin authentication
  const adminToken = localStorage.getItem("adminToken");
  const adminUser = JSON.parse(localStorage.getItem("adminUser") || "null");

  if (!adminToken || !adminUser || adminUser.role !== 'admin') {
    return <Navigate to="/admin/login" replace />
  }

  return children
}

export default AdminRoute
