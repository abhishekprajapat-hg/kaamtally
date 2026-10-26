import React from 'react';
import { View } from 'react-native';
import StatusScreen from './StatusScreen';

// Without this, a crash in any screen leaves a blank white page on a real phone.
export default class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('[Kaamtally] crash:', error, info?.componentStack); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={{ flex: 1, backgroundColor: this.props.background }}>
        <StatusScreen
          icon="warning" tone="danger"
          title="Something went wrong"
          body="The app hit a problem and had to stop. Your saved hisab is safe — nothing has been lost."
          hint={String(this.state.error?.message || '').slice(0, 120) || undefined}
          action={{ label: 'Try again', icon: 'arrow-right', on: () => this.setState({ error: null }) }}
        />
      </View>
    );
  }
}
