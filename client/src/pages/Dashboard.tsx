import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Button,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Dashboard: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box 
      bg={bgColor} 
      minH="calc(100vh - 64px)" 
      py={10}
      data-testid="dashboard-page"
    >
      <Container maxW="container.lg">
        <VStack spacing={8} align="stretch">
          <Box
            bg={cardBgColor}
            p={8}
            borderRadius="lg"
            boxShadow="sm"
            border="1px"
            borderColor={borderColor}
            data-testid="welcome-card"
          >
            <VStack spacing={4} align="stretch">
              <Heading size="lg" data-testid="dashboard-title">
                Welcome to Resource Planning
              </Heading>
              
              {isAuthenticated ? (
                <>
                  <Text fontSize="lg" data-testid="user-greeting">
                    Hello, {user?.email}! You are logged in.
                  </Text>
                  <Text color="gray.600" data-testid="features-message">
                    More features will be available soon. Stay tuned!
                  </Text>
                </>
              ) : (
                <>
                  <Text fontSize="lg" data-testid="login-prompt">
                    Please log in to access the full features of the application.
                  </Text>
                  <Button
                    as={RouterLink}
                    to="/login"
                    colorScheme="blue"
                    size="lg"
                    width="fit-content"
                    data-testid="dashboard-login-button"
                  >
                    Login
                  </Button>
                </>
              )}
            </VStack>
          </Box>

          <Box
            bg={cardBgColor}
            p={8}
            borderRadius="lg"
            boxShadow="sm"
            border="1px"
            borderColor={borderColor}
            data-testid="coming-soon-card"
          >
            <VStack spacing={4} align="stretch">
              <Heading size="md" data-testid="coming-soon-title">
                Coming Soon
              </Heading>
              <Text color="gray.600" data-testid="coming-soon-description">
                We're working on exciting features:
              </Text>
              <VStack align="stretch" pl={4} data-testid="feature-list">
                <Text>• Project Management</Text>
                <Text>• Employee Directory</Text>
                <Text>• Resource Timeline</Text>
                <Text>• Workload Analysis</Text>
              </VStack>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};
