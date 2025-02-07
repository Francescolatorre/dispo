import { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
  FormControl,
  FormLabel,
  Select,
  Box,
  Tag,
  TagLabel,
  TagCloseButton,
  IconButton,
  InputGroup,
  InputRightElement,
  FormErrorMessage,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { Project, NewProject, PROJECT_STATUSES, ProjectStatus } from '../../types/project';

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: NewProject) => Promise<void>;
  project?: Project;
}

export const ProjectForm = ({
  isOpen,
  onClose,
  onSave,
  project,
}: ProjectFormProps) => {
  const [formData, setFormData] = useState<NewProject>({
    name: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    project_manager_id: 0,
    project_manager: '',
    documentation_links: [],
    status: 'active',
  });

  const [newLink, setNewLink] = useState('');

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        start_date: project.start_date.split('T')[0],
        end_date: project.end_date.split('T')[0],
        project_manager: project.project_manager_id.toString(),
        project_manager_id: project.project_manager_id,
        documentation_links: project.documentation_links,
        status: project.status,
      });
    } else {
      setFormData({
        name: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        project_manager: '',
        project_manager_id: 0,
        documentation_links: [],
        status: 'active',
      });
    }
  }, [project]);

  const [endDateError, setEndDateError] = useState<string>('');

  const validateDates = () => {
    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      setEndDateError('End date must be after start date');
      return false;
    }
    setEndDateError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateDates()) {
      return;
    }

    // Convert project_manager to project_manager_id if needed
    const projectData: NewProject = {
      ...formData,
      project_manager_id: parseInt(formData.project_manager) || formData.project_manager_id,
    };

    await onSave(projectData);
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'project_manager' ? { project_manager_id: parseInt(value) || 0 } : {}),
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddLink = () => {
    if (newLink && !formData.documentation_links.includes(newLink)) {
      setFormData({
        ...formData,
        documentation_links: [...formData.documentation_links, newLink],
      });
      setNewLink('');
    }
  };

  const handleRemoveLink = (linkToRemove: string) => {
    setFormData({
      ...formData,
      documentation_links: formData.documentation_links.filter(
        (link) => link !== linkToRemove
      ),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      aria-labelledby="project-form-title"
      aria-describedby="project-form-description"
    >
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader id="project-form-title">
            {project ? 'Projekt bearbeiten' : 'Neues Projekt'}
          </ModalHeader>
          <ModalBody id="project-form-description">
            <Box display="flex" flexDirection="column" gap={4}>
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Projektleiter</FormLabel>
                <Input
                  name="project_manager"
                  value={formData.project_manager}
                  onChange={handleInputChange}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Start-Datum</FormLabel>
                <Input
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                />
              </FormControl>

              <FormControl isRequired isInvalid={!!endDateError}>
                <FormLabel>End-Datum</FormLabel>
                <Input
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => {
                    handleInputChange(e);
                    setEndDateError('');
                  }}
                />
                {endDateError && <FormErrorMessage>{endDateError}</FormErrorMessage>}
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Status</FormLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleSelectChange}
                >
                  {PROJECT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status === 'active' ? 'Aktiv' : 'Archiviert'}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Dokumentation Link</FormLabel>
                <InputGroup>
                  <Input
                    name="documentation_link"
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    placeholder="Enter documentation link"
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label="Add link"
                      icon={<AddIcon />}
                      onClick={handleAddLink}
                      isDisabled={!newLink}
                      size="sm"
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <Box display="flex" flexWrap="wrap" gap={2}>
                {formData.documentation_links.map((link, index) => (
                  <Tag
                    key={index}
                    size="lg"
                    variant="subtle"
                    colorScheme="blue"
                    cursor="pointer"
                    as="a"
                    href={link}
                    target="_blank"
                  >
                    <TagLabel>{`Link ${index + 1}`}</TagLabel>
                    <TagCloseButton
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemoveLink(link);
                      }}
                      data-testid="DeleteIcon"
                    />
                  </Tag>
                ))}
              </Box>
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" colorScheme="blue">
              Speichern
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};
