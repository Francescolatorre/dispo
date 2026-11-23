import { createContext, useContext } from 'react';

/**
 * Number of WebMCP tools the browser accepted (0 = WebMCP unavailable or not yet registered).
 * Provided by `App` from `WebMCPBridge`'s `onRegistered`; read by the sidebar status line.
 */
export const WebMCPStatusContext = createContext(0);

export const useWebMCPToolCount = () => useContext(WebMCPStatusContext);
