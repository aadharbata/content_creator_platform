// test-connection.js - Simple test to verify livestream server connection
const io = require('socket.io-client');

const socket = io('http://localhost:4000');

socket.on('connect', () => {
  console.log('✅ Connected to livestream server:', socket.id);
  
  // Test getting router capabilities
  socket.emit('getRouterRtpCapabilities', (capabilities) => {
    console.log('✅ Received router RTP capabilities');
    console.log('  - Codecs:', capabilities.codecs?.length || 0);
    console.log('  - Header extensions:', capabilities.headerExtensions?.length || 0);
    
    // Test getting active streams
    socket.emit('getActiveStreams', (streams) => {
      console.log('✅ Received active streams:', streams.length);
      streams.forEach(stream => {
        console.log(`  - Stream: ${stream.title} (${stream.viewerCount} viewers)`);
        
        // Get debug info for each stream
        socket.emit('getStreamDebugInfo', { streamId: stream.id }, (debugInfo) => {
          if (debugInfo.error) {
            console.log(`    ❌ Debug info error: ${debugInfo.error}`);
          } else {
            console.log(`    📊 Debug info for ${stream.title}:`);
            console.log(`       - Active: ${debugInfo.isActive}`);
            console.log(`       - Producers: ${debugInfo.producerCount}`);
            debugInfo.producers.forEach(p => {
              console.log(`         * ${p.kind} producer ${p.id} (paused: ${p.paused}, closed: ${p.closed})`);
            });
          }
        });
      });
      
      // Disconnect after tests
      setTimeout(() => {
        console.log('🔌 Disconnecting...');
        socket.disconnect();
      }, 2000);
    });
  });
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from livestream server');
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});

console.log('🔄 Attempting to connect to livestream server...');
