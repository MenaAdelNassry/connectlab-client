import * as signalR from "@microsoft/signalr";

class SignalRService {
  constructor() {
    this.connection = null;
  }

  startConnection(hubUrl = "https://46d3-102-189-178-125.ngrok-free.app/roomHub") {
    if (
      this.connection &&
      this.connection.state === signalR.HubConnectionState.Connected
    ) {
      return Promise.resolve();
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .build();

    return this.connection
      .start()
      .then(() => console.log("🟢 SignalR Connected successfully!"))
      .catch((err) => console.error("🔴 SignalR Connection Error: ", err));
  }

  joinRoom(roomId) {
    return this.connection.invoke("JoinRoom", roomId);
  }

  sendOffer(roomId, offer) {
    return this.connection.invoke("SendOffer", roomId, offer);
  }

  sendAnswer(roomId, answer) {
    return this.connection.invoke("SendAnswer", roomId, answer);
  }

  sendIceCandidate(roomId, candidate) {
    return this.connection.invoke("SendIceCandidate", roomId, candidate);
  }

  // --- (Event Listeners) ---

  onUserJoined(callback) {
    this.connection.on("UserJoined", callback);
  }

  onReceiveOffer(callback) {
    this.connection.on("ReceiveOffer", callback);
  }

  onReceiveAnswer(callback) {
    this.connection.on("ReceiveAnswer", callback);
  }

  onReceiveIceCandidate(callback) {
    this.connection.on("ReceiveIceCandidate", callback);
  }

  onUserLeft(callback) {
    this.connection.on("UserLeft", callback);
  }

  stopConnection() {
    if (this.connection) {
      return this.connection.stop();
    }
  }
}

export default new SignalRService();
