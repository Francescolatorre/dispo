import { useState } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Tooltip,
  Tag,
  Link,
  useColorModeValue,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, ViewOffIcon } from '@chakra-ui/icons';
import { Project } from '../../types/project';

interface ProjectListProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (id: number) => void;
  onArchive: (id: number) => void;
}

export const ProjectList = ({ projects, onEdit, onDelete, onArchive }: ProjectListProps) => {
  const tableBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box overflowX="auto">
      <Table variant="simple" bg={tableBg} borderWidth="1px" borderColor={borderColor}>
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Projektleiter</Th>
            <Th>Zeitraum</Th>
            <Th>Status</Th>
            <Th>Dokumentation</Th>
            <Th>Aktionen</Th>
          </Tr>
        </Thead>
        <Tbody>
          {projects.length === 0 ? (
            <Tr>
              <Td colSpan={6} textAlign="center">No projects found</Td>
            </Tr>
          ) : projects.map((project) => (
            <Tr key={project.id}>
              <Td>{project.name}</Td>
              <Td>{project.project_manager}</Td>
              <Td>
                {new Date(project.start_date).toLocaleDateString()} -{' '}
                {new Date(project.end_date).toLocaleDateString()}
              </Td>
              <Td>
                <Tag
                  colorScheme={project.status === 'active' ? 'green' : 'gray'}
                  size="sm"
                >
                  {project.status === 'active' ? 'Aktiv' : 'Archiviert'}
                </Tag>
              </Td>
              <Td>
                {project.documentation_links.map((link, index) => (
                  <Tag
                    key={index}
                    as={Link}
                    href={link}
                    target="_blank"
                    size="sm"
                    colorScheme="blue"
                    mr={2}
                    mb={1}
                    _hover={{ textDecoration: 'none' }}
                  >
                    Link {index + 1}
                  </Tag>
                ))}
              </Td>
              <Td>
                <Tooltip label="Bearbeiten">
                  <IconButton
                    icon={<EditIcon />}
                    onClick={() => onEdit(project)}
                    aria-label="Bearbeiten"
                    size="sm"
                    mr={2}
                  />
                </Tooltip>
                {project.status === 'active' && (
                  <>
                    <Tooltip label="Archivieren">
                      <IconButton
                        icon={<ViewOffIcon />}
                        onClick={() => onArchive(project.id)}
                        aria-label="Archivieren"
                        size="sm"
                        mr={2}
                      />
                    </Tooltip>
                    <Tooltip label="Löschen">
                      <IconButton
                        icon={<DeleteIcon />}
                        onClick={() => onDelete(project.id)}
                        aria-label="Löschen"
                        size="sm"
                        colorScheme="red"
                      />
                    </Tooltip>
                  </>
                )}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};