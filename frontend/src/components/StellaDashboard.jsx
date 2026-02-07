useEffect(() => {
  connectWebSocket();  // Connect on mount
}, []);

const connectWebSocket = () => {
  ws = new WebSocket('ws://localhost:8000/ws');
  ws.onmessage = handleWebSocketMessage;  // Process updates
};

const handleWebSocketMessage = (data) => {
  setProgress(data.progress);
  setCurrentData(data.data);
  // UI updates automatically
};
