const activeCalls = new Map(); // Store active call sessions

const handleCallUser = (io, socket, data) => {
  console.log('📞 Call user event received:', {
    userToCall: data.userToCall,
    from: data.from,
    name: data.name,
    callType: data.callType
  });

  // Check if user is already in a call
  if (activeCalls.has(data.from) || activeCalls.has(data.userToCall)) {
    socket.emit('call failed', { 
      reason: 'User is already in a call',
      code: 'USER_BUSY' 
    });
    return;
  }

  // Create call session
  const callId = `${data.from}_${data.userToCall}_${Date.now()}`;
  activeCalls.set(callId, {
    caller: data.from,
    callee: data.userToCall,
    callType: data.callType,
    status: 'ringing',
    startTime: Date.now()
  });

  // Map users to call session
  activeCalls.set(data.from, callId);
  activeCalls.set(data.userToCall, callId);
  
  socket.to(data.userToCall).emit('call user', {
    signal: data.signalData,
    from: data.from,
    name: data.name,
    callType: data.callType,
    callId: callId
  });
  
  console.log('📤 Call user event sent to:', data.userToCall);
  
  // Set timeout for unanswered calls (30 seconds)
  setTimeout(() => {
    const callSession = activeCalls.get(callId);
    if (callSession && callSession.status === 'ringing') {
      // Call timed out
      io.to(data.from).emit('call timeout');
      io.to(data.userToCall).emit('call timeout');
      cleanupCall(callId);
    }
  }, 30000);
};

const handleAnswerCall = (io, socket, data) => {
  console.log('✅ Answer call event received:', {
    to: data.to,
    signal: data.signal
  });

  // Find and update call session
  const userCallId = activeCalls.get(socket.userId || socket.id);
  if (userCallId && typeof userCallId === 'string') {
    const callSession = activeCalls.get(userCallId);
    if (callSession) {
      callSession.status = 'active';
      callSession.answeredAt = Date.now();
    }
  }
  
  socket.to(data.to).emit('call answered', data.signal);
  
  console.log('📤 Call answered event sent to:', data.to);
};

const handleCallDeclined = (io, socket, data) => {
  console.log('❌ Call declined event received:', {
    to: data.to
  });

  // Find and cleanup call session
  const userCallId = activeCalls.get(socket.userId || socket.id);
  if (userCallId && typeof userCallId === 'string') {
    cleanupCall(userCallId);
  }
  
  socket.to(data.to).emit('call declined');
  
  console.log('📤 Call declined event sent to:', data.to);
};

const handleEndCall = (io, socket, data) => {
  console.log('🔚 End call event received:', {
    to: data.to
  });

  // Find and cleanup call session
  const userCallId = activeCalls.get(socket.userId || socket.id);
  if (userCallId && typeof userCallId === 'string') {
    const callSession = activeCalls.get(userCallId);
    if (callSession) {
      // Notify both participants
      io.to(callSession.caller).emit('call ended');
      io.to(callSession.callee).emit('call ended');
    }
    cleanupCall(userCallId);
  } else if (data.to) {
    // Fallback to direct notification
    socket.to(data.to).emit('call ended');
  }
  
  console.log('📤 Call ended event sent');
};

const handleIceCandidate = (io, socket, data) => {
  console.log('🧊 ICE candidate event received:', {
    to: data.to,
    candidate: data.candidate
  });
  
  socket.to(data.to).emit('ice candidate', data.candidate);
  
  console.log('📤 ICE candidate event sent to:', data.to);
};

const cleanupCall = (callId) => {
  console.log('🧹 Cleaning up call session:', callId);
  const callSession = activeCalls.get(callId);
  
  if (callSession) {
    // Remove user mappings
    activeCalls.delete(callSession.caller);
    activeCalls.delete(callSession.callee);
    // Remove call session
    activeCalls.delete(callId);
  }
};

const handleUserDisconnect = (io, socket) => {
  console.log('🔌 User disconnected, checking for active calls');
  const userId = socket.userId || socket.id;
  const userCallId = activeCalls.get(userId);
  
  if (userCallId && typeof userCallId === 'string') {
    const callSession = activeCalls.get(userCallId);
    if (callSession) {
      // Notify the other participant
      const otherUserId = callSession.caller === userId ? callSession.callee : callSession.caller;
      io.to(otherUserId).emit('call ended', { reason: 'User disconnected' });
      
      cleanupCall(userCallId);
    }
  }
};

const getActiveCallsCount = () => {
  let count = 0;
  for (const [key, value] of activeCalls.entries()) {
    if (typeof value === 'object' && value.status) {
      count++;
    }
  }
  return count;
};

module.exports = {
  handleCallUser,
  handleAnswerCall,
  handleCallDeclined,
  handleEndCall,
  handleIceCandidate,
  handleUserDisconnect,
  cleanupCall,
  getActiveCallsCount,
  activeCalls
};
