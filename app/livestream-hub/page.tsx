"use client";
import React from 'react';
import Link from 'next/link';

const LivestreamHub: React.FC = () => {
  return (
    <div style={{ 
      padding: '40px 20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '900px',
      margin: '0 auto',
      textAlign: 'center'
    }}>
      <h1 style={{ 
        fontSize: '3rem', 
        marginBottom: '20px',
        background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        🎬 Multi-User Live Streaming Platform
      </h1>
      
      <p style={{ 
        fontSize: '1.2rem', 
        color: '#666', 
        marginBottom: '40px',
        lineHeight: '1.6'
      }}>
        Create your own live streams or join multiple concurrent streams from different broadcasters
      </p>

      <div style={{ 
        display: 'flex', 
        gap: '30px', 
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginBottom: '40px'
      }}>
        {/* Broadcaster Card */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          padding: '30px',
          width: '300px',
          color: 'white',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          transform: 'translateY(0)',
          transition: 'transform 0.3s ease'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🎥</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', margin: 0 }}>
            Start Broadcasting
          </h2>
          <p style={{ 
            fontSize: '1rem', 
            marginBottom: '25px', 
            opacity: 0.9,
            lineHeight: '1.5'
          }}>
            Create your own live stream with custom title and name. Interact with viewers through real-time chat. Multiple users can broadcast simultaneously.
          </p>
          <Link 
            href="/livestream-broadcaster"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              border: '2px solid rgba(255,255,255,0.3)',
              transition: 'all 0.3s ease'
            }}
          >
            🚀 Start Broadcasting
          </Link>
        </div>

        {/* Viewer Card */}
        <div style={{
          background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
          borderRadius: '16px',
          padding: '30px',
          width: '300px',
          color: '#333',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          transform: 'translateY(0)',
          transition: 'transform 0.3s ease'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>👁️</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', margin: 0 }}>
            Watch Live Streams
          </h2>
          <p style={{ 
            fontSize: '1rem', 
            marginBottom: '25px', 
            opacity: 0.8,
            lineHeight: '1.5'
          }}>
            Browse and join any of the active live streams from different broadcasters. Chat with other viewers and the streamer in real-time. Switch between streams anytime.
          </p>
          <Link 
            href="/livestream-viewer"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: 'rgba(0,0,0,0.1)',
              color: '#333',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              border: '2px solid rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease'
            }}
          >
            👁️ Watch Streams
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div style={{
        marginTop: '50px',
        padding: '30px',
        backgroundColor: '#f8f9fa',
        borderRadius: '16px',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{ fontSize: '2rem', marginBottom: '30px', color: '#333' }}>
          ✨ Platform Features
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          textAlign: 'left'
        }}>
          <div style={{ padding: '20px' }}>
            <h4 style={{ color: '#4CAF50', marginBottom: '10px' }}>🔴 Multiple Concurrent Streams</h4>
            <p style={{ color: '#666', margin: 0 }}>
              Multiple users can broadcast simultaneously while viewers can choose which stream to watch
            </p>
          </div>
          
          <div style={{ padding: '20px' }}>
            <h4 style={{ color: '#2196F3', marginBottom: '10px' }}>🎯 Stream Discovery</h4>
            <p style={{ color: '#666', margin: 0 }}>
              Browse available streams with titles, broadcaster names, and real-time viewer counts
            </p>
          </div>
          
          <div style={{ padding: '20px' }}>
            <h4 style={{ color: '#FF9800', marginBottom: '10px' }}>📱 Real-time Updates</h4>
            <p style={{ color: '#666', margin: 0 }}>
              Automatic updates when new streams start or end, with live viewer count tracking
            </p>
          </div>
          
          <div style={{ padding: '20px' }}>
            <h4 style={{ color: '#E91E63', marginBottom: '10px' }}>💬 Live Chat</h4>
            <p style={{ color: '#666', margin: 0 }}>
              Interactive real-time chat for each stream with typing indicators, user management, and moderator controls
            </p>
          </div>
          
          <div style={{ padding: '20px' }}>
            <h4 style={{ color: '#9C27B0', marginBottom: '10px' }}>🎛️ Easy Stream Management</h4>
            <p style={{ color: '#666', margin: 0 }}>
              Simple interface to create titled streams, manage broadcasts, and switch between viewing streams
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '12px',
        border: '2px solid #2196F3'
      }}>
        <h3 style={{ color: '#1976D2', marginBottom: '15px' }}>🚀 Getting Started</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '20px',
          textAlign: 'left'
        }}>
          <div>
            <h4 style={{ color: '#1976D2', marginBottom: '10px' }}>For Broadcasters:</h4>
            <ol style={{ color: '#666', paddingLeft: '20px' }}>
              <li>Click "Start Broadcasting"</li>
              <li>Enter your stream title and name</li>
              <li>Click "Create Stream" to set up your stream</li>
              <li>Allow camera and microphone access</li>
              <li>Click "Start Broadcasting" to go live</li>
              <li>Share the viewer page with your audience</li>
            </ol>
          </div>
          
          <div>
            <h4 style={{ color: '#1976D2', marginBottom: '10px' }}>For Viewers:</h4>
            <ol style={{ color: '#666', paddingLeft: '20px' }}>
              <li>Click "Watch Streams"</li>
              <li>Browse the list of available live streams</li>
              <li>Click "Join Stream" on any stream you want to watch</li>
              <li>Enjoy the live content and see other viewers</li>
              <li>Switch between different streams anytime</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        marginTop: '40px', 
        padding: '20px',
        borderTop: '2px solid #eee',
        color: '#666'
      }}>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>
          Powered by WebRTC and MediaSoup for high-quality, low-latency streaming
        </p>
      </div>
    </div>
  );
};

export default LivestreamHub;
