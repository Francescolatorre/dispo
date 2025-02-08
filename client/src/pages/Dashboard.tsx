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
    <Box bg={bgColor} minH="calc(100vh - 64px)" py={10}>
      <Container maxW="container.lg">
        <VStack spacing={8} align="stretch">
          <Box
            bg={cardBgColor}
            p={8}
            borderRadius="lg"
            boxShadow="sm"
            border="1px"
            borderColor={borderColor}
          >
            <VStack spacing={4} align="stretch">
              <Heading size="lg">
                Welcome to Resource Planning
              </Heading>
              
              {isAuthenticated ? (
                <>
                  <Text fontSize="lg">
                    Hello, {user?.email}! You are logged in.
                  </Text>
                  <Text color="gray.600">
                    More features will be available soon. Stay tuned!
                  </Text>
                </>
              ) : (
                <>
                  <Text fontSize="lg">
                    Please log in to access the full features of the application.
                  </Text>
                  <Button
                    as={RouterLink}
                    to="/login"
                    colorScheme="blue"
                    size="lg"
                    width="fit-content"
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
          >
            <VStack spacing={4} align="stretch">
              <Heading size="md">Coming Soon</Heading>
              <Text color="gray.600">
                We're working on exciting features:
              </Text>
              <VStack align="stretch" pl={4}>
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
