import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './AppRoutes';
import { routerFuture } from './routerFuture';
import { PlanningProvider } from './state';
import theme from './theme';

const App = () => (
  <ChakraProvider theme={theme}>
    <PlanningProvider>
      <BrowserRouter future={routerFuture}>
        <AppRoutes />
      </BrowserRouter>
    </PlanningProvider>
  </ChakraProvider>
);

export default App;
