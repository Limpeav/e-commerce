import React from 'react'

const ErrorBoundary = ({ children }) => {
  return (
    <div className="error-boundary">
      {children}
    </div>
  )
}

export default ErrorBoundary
