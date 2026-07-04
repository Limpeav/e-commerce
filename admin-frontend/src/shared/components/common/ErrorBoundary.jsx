import React from "react";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
        this.handleReload = this.handleReload.bind(this);
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error("[ErrorBoundary] Caught error:", error, info);
    }

    handleReload() {
        window.location.reload();
    }

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        return (
            <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gray-50 p-6">
                <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-2xl">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-8 w-8 text-red-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                            />
                        </svg>
                    </div>

                    <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">
                        Something went wrong
                    </h1>
                    <p className="mb-8 text-sm leading-relaxed text-gray-500">
                        An unexpected error occurred. Please reload the page — your data is safe.
                    </p>

                    {this.state.error?.message && (
                        <p className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 font-mono text-xs text-red-600">
                            {this.state.error.message}
                        </p>
                    )}

                    <button
                        type="button"
                        onClick={this.handleReload}
                        className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-700 active:scale-95"
                    >
                        Reload Page
                    </button>
                </div>
            </div>
        );
    }
}

export default ErrorBoundary;
