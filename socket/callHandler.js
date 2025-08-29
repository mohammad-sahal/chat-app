const handleCallUser = (io, socket, data) => {
  console.log('📞 Call user event received:', {
    userToCall: data.userToCall,
    from: data.from,
    name: data.name,
    callType: data.callType
  });
  
  socket.to(data.userToCall).emit('call user', {
    signal: data.signalData,
    from: data.from,
    name: data.name,
    callType: data.callType // 'voice' or 'video'
  });
  
  console.log('📤 Call user event sent to:', data.userToCall);
};

const handleAnswerCall = (io, socket, data) => {
  console.log('✅ Answer call event received:', {
    to: data.to,
    signal: data.signal
  });
  
  socket.to(data.to).emit('call answered', data.signal);
  
  console.log('📤 Call answered event sent to:', data.to);
};

const handleCallDeclined = (io, socket, data) => {
  console.log('❌ Call declined event received:', {
    to: data.to
  });
  
  socket.to(data.to).emit('call declined');
  
  console.log('📤 Call declined event sent to:', data.to);
};

const handleEndCall = (io, socket, data) => {
  console.log('🔚 End call event received:', {
    to: data.to
  });
  
  socket.to(data.to).emit('call ended');
  
  console.log('📤 Call ended event sent to:', data.to);
};

const handleIceCandidate = (io, socket, data) => {
  console.log('🧊 ICE candidate event received:', {
    to: data.to,
    candidate: data.candidate
  });
  
  socket.to(data.to).emit('ice candidate', data.candidate);
  
  console.log('📤 ICE candidate event sent to:', data.to);
};

module.exports = {
  handleCallUser,
  handleAnswerCall,
  handleCallDeclined,
  handleEndCall,
  handleIceCandidate
};
