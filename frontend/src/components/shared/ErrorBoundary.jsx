import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service here
    console.error("Caught by Error Boundary:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-red-100 max-w-lg w-full">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Oops! Something went wrong.</h1>
            <p className="text-slate-600 mb-8">
              We encountered an unexpected error. Don't worry, your data is safe. Try refreshing the page to fix this issue.
            </p>
            
            <button 
              onClick={() => window.location.reload()} 
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-lg flex justify-center items-center gap-3 mb-4"
            >
              <RefreshCw className="w-5 h-5" /> Reload Page
            </button>

            {/* Optional: Show technical details for developers */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 text-left">
                <details className="text-xs text-slate-500 bg-slate-100 p-4 rounded-lg overflow-auto">
                  <summary className="font-bold cursor-pointer text-red-500 mb-2">Show Technical Details</summary>
                  <p className="font-mono mt-2 text-red-600">{this.state.error && this.state.error.toString()}</p>
                  <pre className="mt-2 whitespace-pre-wrap">{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
                </details>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;