let localStream;
let remoteStream;
let peerConnection;
const appID = '41afd2cc4bd64954b7b31d60d0eebb50';
const token = null;
let uid = String(Math.floor(Math.random() * 1000000));
let client;
let channel;
let roomID;
let iceCandidates = [];
const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.1.google.com:19302', 'stun:stun2.1.google.com:19302']
    }
  ]
};

let init = async () => {
  client = await AgoraRTM.createInstance(appID);
  await client.login({ uid, token });
  // needs to be dynamic
  roomID = 'main';
  channel = client.createChannel(roomID);
  await channel.join();

  channel.on('MemberJoined', handleUserJoined);

  client.on('MessageFromPeer', handleMessageFromPeer);

  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false
  });

  document.getElementById('localVideo').srcObject = localStream;
};

let handleUserJoined = async (memberId) => {
  console.log('User Joined:', memberId);
  createOffer(memberId);
};

let handleMessageFromPeer = async (message, memberId) => {
  message = JSON.parse(message.text);
  if (message.type === 'offer') {
    createAnswer(memberId, message.offer);
  }
  if (message.type === 'answer') {
    addAnswer(memberId, message.answer);
  }
  if (message.type === 'candidate') {
    if (peerConnection) {
    await peerConnection.addIceCandidate(message.candidate);
    }
  }
  console.log('Received Message:', message);
};

let createPeerConnection = async (MemberId) => {
  peerConnection = new RTCPeerConnection(servers);

  remoteStream = new MediaStream();
  document.getElementById('remoteVideo').srcObject = remoteStream;
  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });
    document.getElementById('localVideo').srcObject = localStream;
  }
  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  }
  );
  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      client.sendMessageToPeer({ text: JSON.stringify( {'type': 'candidate', 'candidate': event.candidate}) }, MemberId);
    }
  };

};

let createOffer = async (MemberId) => {
  await createPeerConnection(MemberId);
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  client.sendMessageToPeer({ text: JSON.stringify({ 'type': 'offer', 'offer': offer }) }, MemberId);
};

let createAnswer = async (MemberId, offer) => {
  await createPeerConnection(MemberId);
  await peerConnection.setRemoteDescription(offer);

  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  client.sendMessageToPeer({ text: JSON.stringify({ 'type': 'answer', 'answer': answer }) }, MemberId);
};

let addAnswer = async (MemberId, answer) => {
  if (!peerConnection) {
    await createPeerConnection(MemberId);
  }
  if (!peerConnection.currentRemoteDescription) {
    await peerConnection.setRemoteDescription(answer);
  }
  if (iceCandidates.length > 0) {
    for (let candidate of iceCandidates) {
      await peerConnection.addIceCandidate(candidate);
    }
    iceCandidates = []; // Clear the ICE candidates array after adding them
  }
};

// on document load
document.addEventListener('DOMContentLoaded', init);
