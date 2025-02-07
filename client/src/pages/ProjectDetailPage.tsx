import React from 'react';
import {
  Box,
  Container,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Heading,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import { ProjectProvider, useProject } from '../contexts/ProjectContext';
import ProjectAssignmentsPanel from '../components/projects/ProjectAssignmentsPanel';

// Tab panels
const ProjectOverview = () => {
  const { project } = useProject();
  return (
    <Box>
      <Heading size="md" mb={4}>Overview</Heading>
      <Box>
        <Box mb={4}>
          <Heading size="sm" mb={2}>Project Details</Heading>
          <Box>
            <strong>Project Number:</strong> {project?.project_number}
          </Box>
          <Box>
            <strong>Location:</strong> {project?.location}
          </Box>
          <Box>
            <strong>FTE Count:</strong> {project?.fte_count}
          </Box>
        </Box>
        <Box mb={4}>
          <Heading size="sm" mb={2}>Timeline</Heading>
          <Box>
            <strong>Start Date:</strong> {project?.start_date}
          </Box>
          <Box>
            <strong>End Date:</strong> {project?.end_date}
          </Box>
        </Box>
        <Box>
          <Heading size="sm" mb={2}>Documentation</Heading>
          {project?.documentation_links?.map((link, index) => (
            <Box key={index}>
              <a href={link} target="_blank" rel="noopener noreferrer">
                {link}
              </a>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

const ProjectRequirements = () => {
  return (
    <Box>
      <Heading size="md" mb={4}>Requirements</Heading>
      {/* Requirements content will be implemented later */}
    </Box>
  );
};

const ProjectReports = () => {
  return (
    <Box>
      <Heading size="md" mb={4}>Reports</Heading>
      {/* Reports content will be implemented later */}
    </Box>
  );
};

// Project header with basic info
const ProjectHeader = () => {
  const { project, isLoading, error } = useProject();

  if (isLoading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle>Error loading project</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  if (!project) {
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle>Project not found</AlertTitle>
      </Alert>
    );
  }

  return (
    <Box mb={6}>
      <Heading size="lg">{project.name}</Heading>
      <Box color="gray.600" mt={2}>
        Project Number: {project.project_number}
      </Box>
    </Box>
  );
};

// Main content with tabs
const ProjectContent = () => {
  const { isLoading } = useProject();

  if (isLoading) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Tabs>
      <TabList>
        <Tab>Overview</Tab>
        <Tab>Assignments</Tab>
        <Tab>Requirements</Tab>
        <Tab>Reports</Tab>
      </TabList>

      <TabPanels>
        <TabPanel>
          <ProjectOverview />
        </TabPanel>
        <TabPanel>
          <ProjectAssignmentsPanel />
        </TabPanel>
        <TabPanel>
          <ProjectRequirements />
        </TabPanel>
        <TabPanel>
          <ProjectReports />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};

// Main page component
const ProjectDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>();

  if (!projectId) {
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle>Missing project ID</AlertTitle>
      </Alert>
    );
  }

  return (
    <ProjectProvider projectId={parseInt(projectId, 10)}>
      <Container maxW="container.xl" py={8}>
        <ProjectHeader />
        <ProjectContent />
      </Container>
    </ProjectProvider>
  );
};

export default ProjectDetailPage;