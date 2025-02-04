  
  import { ThemeProvider } from '@mui/material/styles';
import { AppBar, Box, Container, CssBaseline, Toolbar, Typography } from '@mui/material';
import { theme } from './styles/theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              DispoMVP
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Willkommen bei DispoMVP
          </Typography>
          <Typography variant="body1">
            Ressourcen- und Projektplanung leicht gemacht
          </Typography>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
