import React from 'react';

const Loading = ({ fullPage = false }) => {
  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #eef0f3',
        borderTop: '4px solid #6c5ce7',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }}></div>
      <p style={{ color: '#a0a7b5', fontSize: '14px' }}>Loading...</p>
    </div>
  );

  if (fullPage) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: '#f5f6fa'
      }}>
        <div style={{ 
          background: 'white', 
          padding: '48px', 
          borderRadius: '16px', 
          textAlign: 'center',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧠</div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>DocMind</h2>
          <p style={{ color: '#a0a7b5', marginTop: '4px' }}>AI Intelligence</p>
          <div style={{ marginTop: '24px' }}>{content}</div>
        </div>
      </div>
    );
  }

  return content;
};

export default Loading;
