import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter } from 'react-router-dom';
import theme from '../theme';
import { routerFuture } from '../routerFuture';

interface Options {
  route?: string;
}

/** Single render helper for component tests: Chakra theme + in-memory router. */
export function renderWithProviders(ui: ReactElement, { route = '/' }: Options = {}) {
  return render(
    <ChakraProvider theme={theme}>
      <MemoryRouter initialEntries={[route]} future={routerFuture}>{ui}</MemoryRouter>
    </ChakraProvider>,
  );
}
