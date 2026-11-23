import { useCallback, useState } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './AppRoutes';
import { WebMCPBridge, WebMCPStatusContext } from './features/webmcp';
import type { RegistrationResult } from './features/webmcp/modelContext';
import { routerFuture } from './routerFuture';
import { PlanningProvider } from './state';
import theme from './theme';

const App = () => {
  const [webmcpTools, setWebmcpTools] = useState(0);
  const onRegistered = useCallback((r: RegistrationResult) => setWebmcpTools(r.registered.length), []);
  return (
    <ChakraProvider theme={theme}>
      <PlanningProvider>
        <WebMCPBridge onRegistered={onRegistered} />
        <WebMCPStatusContext.Provider value={webmcpTools}>
          <BrowserRouter future={routerFuture}>
            <AppRoutes />
          </BrowserRouter>
        </WebMCPStatusContext.Provider>
      </PlanningProvider>
    </ChakraProvider>
  );
};

export default App;
