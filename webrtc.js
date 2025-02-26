// webrtc.js - Implements a basic WebRTC connection for peer-to-peer game communication.
class WebRTCConnection {
  constructor() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });
    this.dataChannel = this.peerConnection.createDataChannel("gameData");

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({ candidate: event.candidate });
      }
    };

    this.peerConnection.ondatachannel = (event) => {
      this.dataChannel = event.channel;
      this.setupDataChannel();
    };

    this.setupDataChannel();
  }

  setupDataChannel() {
    this.dataChannel.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
    this.dataChannel.onopen = () => console.log("Data channel opened");
    this.dataChannel.onclose = () => console.log("Data channel closed");
  }

  sendSignalingMessage(message) {
    // Implement signaling server communication here via a WebSocket.
    if (this.sendSignalingMessageCallback) {
      this.sendSignalingMessageCallback(message);
    }
  }

  async createOffer() {
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    this.sendSignalingMessage({ offer });
  }

  async handleSignalingMessage(message) {
    if (message.offer) {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      this.sendSignalingMessage({ answer });
    } else if (message.answer) {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
    } else if (message.candidate) {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
    }
  }

  sendMessage(message) {
    this.dataChannel.send(JSON.stringify(message));
  }

  handleMessage(message) {
    console.log("Received a message:", message);
    // This function is meant to be overridden by the implementing game.
  }
}

export default WebRTCConnection;