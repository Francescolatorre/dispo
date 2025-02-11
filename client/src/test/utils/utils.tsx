import { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChakraProvider, createStandaloneToast } from '@chakra-ui/react';
import theme from '../theme';

const { ToastContainer } = createStandaloneToast();

export function renderWithProviders(ui: ReactElement, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ChakraProvider theme={theme}>
        {ui}
        <ToastContainer />
      </ChakraProvider>
    </MemoryRouter>
  );
}

// Re-export everything
export * from '@testing-library/react';
