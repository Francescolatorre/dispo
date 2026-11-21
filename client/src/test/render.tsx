import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter } from 'react-router-dom';
import theme from '../theme';
import { routerFuture } from '../routerFuture';
import { LocalRepository } from '../data/localRepository';
import type { Repository } from '../data/repository';
import { PlanningProvider } from '../state';

interface Options {
  route?: string;
  /** Data source; defaults to a fresh memory-only LocalRepository with seed data. */
  repository?: Repository;
}

/** Single render helper for component tests: Chakra theme + planning data + in-memory router. */
export function renderWithProviders(ui: ReactElement, { route = '/', repository }: Options = {}) {
  const repo = repository ?? new LocalRepository({ storage: null });
  return {
    repository: repo,
    ...render(
      <ChakraProvider theme={theme}>
        <PlanningProvider repository={repo}>
          <MemoryRouter initialEntries={[route]} future={routerFuture}>
            {ui}
          </MemoryRouter>
        </PlanningProvider>
      </ChakraProvider>,
    ),
  };
}
