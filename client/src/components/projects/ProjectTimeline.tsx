import { useState, useEffect } from 'react';
import { Box, Text, Tooltip } from '@chakra-ui/react';
import { Project } from '../../types/project';

interface ProjectTimelineProps {
  projects: Project[];
}

interface TimelineConfig {
  startDate: Date;
  endDate: Date;
  months: Date[];
}

const ProjectTimeline = ({ projects }: ProjectTimelineProps) => {
  const [timelineConfig, setTimelineConfig] = useState<TimelineConfig | null>(null);

  // Calculate timeline configuration based on project dates
  useEffect(() => {
    if (projects.length === 0) return;

    // Find earliest start date and latest end date
    const startDates = projects.map(p => new Date(p.start_date));
    const endDates = projects.map(p => new Date(p.end_date));
    const minDate = new Date(Math.min(...startDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...endDates.map(d => d.getTime())));

    // Set to first day of the month for start date
    minDate.setDate(1);
    // Set to last day of the month for end date
    maxDate.setMonth(maxDate.getMonth() + 1, 0);

    // Generate array of months between start and end date
    const months: Date[] = [];
    const currentDate = new Date(minDate);
    while (currentDate <= maxDate) {
      months.push(new Date(currentDate));
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    setTimelineConfig({
      startDate: minDate,
      endDate: maxDate,
      months,
    });
  }, [projects]);

  if (!timelineConfig || projects.length === 0) {
    return (
      <Box p={2}>
        <Text>No projects to display</Text>
      </Box>
    );
  }

  const getProjectPosition = (project: Project) => {
    const totalDays = (timelineConfig.endDate.getTime() - timelineConfig.startDate.getTime()) / (1000 * 60 * 60 * 24);
    const projectStart = new Date(project.start_date);
    const projectEnd = new Date(project.end_date);
    
    const startOffset = (projectStart.getTime() - timelineConfig.startDate.getTime()) / (1000 * 60 * 60 * 24);
    const duration = (projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24);
    
    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`,
    };
  };

  return (
    <Box p={2}>
      {/* Month scale */}
      <Box display="flex" mb={2} borderBottomWidth="1px" borderColor="gray.200">
        {timelineConfig.months.map((month, index) => (
          <Box
            key={month.getTime()}
            flex={1}
            p={1}
            textAlign="center"
            borderLeftWidth={index === 0 ? 0 : "1px"}
            borderColor="gray.200"
          >
            <Text fontSize="sm" color="gray.600">
              {month.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })}
            </Text>
          </Box>
        ))}
      </Box>

      {/* Projects */}
      <Box position="relative" minHeight="200px">
        {projects.map((project, index) => {
          const position = getProjectPosition(project);
          return (
            <Tooltip
              key={project.id}
              label={
                <Box p={2}>
                  <Text fontWeight="bold">{project.name}</Text>
                  <Text fontSize="sm">
                    {new Date(project.start_date).toLocaleDateString('de-DE')} -{' '}
                    {new Date(project.end_date).toLocaleDateString('de-DE')}
                  </Text>
                  <Text fontSize="sm">
                    Projektleiter: {project.project_manager_id}
                  </Text>
                </Box>
              }
              hasArrow
            >
              <Box
                position="absolute"
                height="40px"
                top={`${index * 50}px`}
                bg={project.status === 'active' ? 'primary.500' : 'gray.500'}
                color="white"
                display="flex"
                alignItems="center"
                px={2}
                cursor="pointer"
                overflow="hidden"
                whiteSpace="nowrap"
                boxShadow="md"
                borderRadius="sm"
                left={position.left}
                width={position.width}
              >
                <Text fontSize="sm" noOfLines={1}>
                  {project.name}
                </Text>
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
};

export default ProjectTimeline;
