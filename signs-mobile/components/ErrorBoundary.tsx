import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

interface Props {
  children: React.ReactNode;
  navigation?: any;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView style={styles.scrollView}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.errorTitle}>Error:</Text>
            <Text style={styles.errorText}>{this.state.error?.toString()}</Text>
            
            {this.state.errorInfo && (
              <>
                <Text style={styles.errorTitle}>Stack Trace:</Text>
                <Text style={styles.stackText}>
                  {this.state.errorInfo.componentStack}
                </Text>
              </>
            )}
            
            {this.props.navigation && (
              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                  this.props.navigation.navigate('Map');
                }}
              >
                <Text style={styles.buttonText}>Back to Map</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    backgroundColor: '#fee',
    padding: 10,
    borderRadius: 5,
    fontFamily: 'monospace',
  },
  stackText: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
    fontFamily: 'monospace',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#4f46e5',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
