import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './AppRoutes';
import { routerFuture } from './routerFuture';
import theme from './theme';

const App = () => (
  <ChakraProvider theme={theme}>
    <BrowserRouter future={routerFuture}>
      <AppRoutes />
    </BrowserRouter>
  </ChakraProvider>
);

export default App;
