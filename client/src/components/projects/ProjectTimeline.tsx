import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Tooltip } from '@mui/material';
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
      <Box sx={{ p: 2 }}>
        <Typography>No projects to display</Typography>
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
    <Box sx={{ p: 2 }}>
      {/* Month scale */}
      <Box sx={{ display: 'flex', mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        {timelineConfig.months.map((month, index) => (
          <Box
            key={month.getTime()}
            sx={{
              flex: 1,
              p: 1,
              textAlign: 'center',
              borderLeft: index === 0 ? 0 : 1,
              borderColor: 'divider',
            }}
          >
            <Typography variant="caption">
              {month.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Projects */}
      <Box sx={{ position: 'relative', minHeight: 200 }}>
        {projects.map((project, index) => {
          const position = getProjectPosition(project);
          return (
            <Tooltip
              key={project.id}
              title={
                <>
                  <Typography variant="subtitle2">{project.name}</Typography>
                  <Typography variant="body2">
                    {new Date(project.start_date).toLocaleDateString('de-DE')} -{' '}
                    {new Date(project.end_date).toLocaleDateString('de-DE')}
                  </Typography>
                  <Typography variant="body2">
                    Projektleiter: {project.project_manager_name || `ID: ${project.project_manager_id}`}
                  </Typography>
                </>
              }
            >
              <Paper
                elevation={3}
                sx={{
                  position: 'absolute',
                  height: 40,
                  top: index * 50,
                  backgroundColor: project.status === 'active' ? 'primary.main' : 'grey.500',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  px: 1,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  ...position,
                }}
              >
                <Typography variant="body2" noWrap>
                  {project.name}
                </Typography>
              </Paper>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
};

export default ProjectTimeline;
