import { ChakraProvider } from '@chakra-ui/react';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LocalRepository } from '../../data/localRepository';
import type { DataSource } from '../../data/dataSource';
import { routerFuture } from '../../routerFuture';
import { PlanningProvider } from '../../state';
import theme from '../../theme';
import { Navigation } from './Navigation';

const renderNav = (dataSource?: DataSource) =>
  render(
    <ChakraProvider theme={theme}>
      <PlanningProvider repository={new LocalRepository({ storage: null })} dataSource={dataSource}>
        <MemoryRouter future={routerFuture}>
          <Navigation />
        </MemoryRouter>
      </PlanningProvider>
    </ChakraProvider>,
  );

describe('Navigation data-source indicator', () => {
  it('shows the browser source', async () => {
    renderNav();
    await act(async () => {});
    expect(screen.getByTestId('data-source')).toHaveAccessibleName('Datenquelle: Lokale Daten');
  });

  it('shows the server source', async () => {
    renderNav('api');
    await act(async () => {});
    expect(screen.getByTestId('data-source')).toHaveAccessibleName('Datenquelle: Server');
  });

  it('shows nothing while the source is still being chosen', async () => {
    render(
      <ChakraProvider theme={theme}>
        <PlanningProvider resolveDataSource={() => new Promise(() => {})}>
          <MemoryRouter future={routerFuture}>
            <Navigation />
          </MemoryRouter>
        </PlanningProvider>
      </ChakraProvider>,
    );
    expect(screen.getByRole('navigation', { name: 'Hauptnavigation' })).toBeInTheDocument();
    expect(screen.queryByTestId('data-source')).toBeNull();
  });
});
