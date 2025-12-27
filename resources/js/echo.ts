// Mock Echo implementation to prevent Pusher initialization errors
// This provides a compatible API without actually connecting to Pusher
// Broadcasting is disabled (BROADCAST_CONNECTION=log) so we use polling instead

interface MockChannel {
  listen: (event: string, callback: any) => MockChannel;
  stopListening: (event: string) => MockChannel;
}

class MockEcho {
  channel(channelName: string): MockChannel {
    return {
      listen: (event: string, callback: any) => this.channel(channelName),
      stopListening: (event: string) => this.channel(channelName),
    };
  }

  leaveChannel(channelName: string): void {
    // Mock implementation - does nothing
  }
}

export default new MockEcho();
