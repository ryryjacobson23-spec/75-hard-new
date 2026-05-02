import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-6">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full">
            <div className="text-red-400 font-semibold mb-2">Something went wrong</div>
            <div className="text-muted text-sm font-mono break-all">
              {this.state.error.message}
            </div>
            <button
              onClick={() => this.setState({ error: null })}
              className="mt-4 bg-accent text-bg font-semibold px-4 py-2 rounded-xl text-sm w-full"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
