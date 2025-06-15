// context/WebSocketProvider.tsx
import React, { createContext, ReactNode, useContext } from "react";
import { useWebSocket } from "../hooks/useWebSocket";

interface WebSocketContextType {
  messages: string[];
  isConnected: boolean;
  sendMessage: (msg: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { messages, isConnected, sendMessage } = useWebSocket("ws://cinnamocloud.onrender.com");

  return (
    <WebSocketContext.Provider value={{ messages, isConnected, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocketContext must be used within WebSocketProvider");
  }
  return context;
}
