


// client/src/components/AuthErrorBoundary.tsx
class AuthErrorBoundary extends React.Component {
    state = { hasError: false };
  
    static getDerivedStateFromError(error) {
      if (error.message.includes('401') || error.message.includes('auth')) {
        return { hasError: true };
      }
      return null;
    }
  
    componentDidCatch(error) {
      if (error.message.includes('401')) {
        authService.logout();
      }
    }
  
    render() {
      if (this.state.hasError) {
        return <Redirect to="/login" />;
      }
      return this.props.children;
    }
  }