import React, { useEffect, useState } from 'react';
import {
  Requirement,
  RequirementCoverage,
  EmployeeMatch
} from '../../types/requirement';
import requirementService from '../../services/requirementService';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  Alert
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/lab';
import {
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';

interface RequirementDetailProps {
  requirement: Requirement;
  onAssign: (employee: EmployeeMatch) => void;
  onEdit: () => void;
}

const RequirementDetail: React.FC<RequirementDetailProps> = ({
  requirement,
  onAssign,
  onEdit
}) => {
  const [coverage, setCoverage] = useState<RequirementCoverage | null>(null);
  const [matchingEmployees, setMatchingEmployees] = useState<EmployeeMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [coverageData, matchesData] = await Promise.all([
          requirementService.getRequirementCoverage(requirement.id),
          requirementService.findMatchingEmployees(requirement.id)
        ]);
        setCoverage(coverageData);
        setMatchingEmployees(matchesData);
        setError(null);
      } catch (err) {
        setError('Failed to load requirement details');
        console.error('Error loading requirement details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [requirement.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'error';
      case 'partially_filled':
        return 'warning';
      case 'filled':
        return 'success';
      case 'needs_replacement':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) return <div>Loading requirement details...</div>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5" component="h1">
            {requirement.role}
          </Typography>
          <Button variant="outlined" onClick={onEdit}>
            Edit Requirement
          </Button>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Status
            </Typography>
            <Chip
              label={requirement.status}
              color={getStatusColor(requirement.status) as any}
              sx={{ mt: 0.5 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Priority
            </Typography>
            <Chip
              label={requirement.priority}
              color={getPriorityColor(requirement.priority) as any}
              sx={{ mt: 0.5 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Period
            </Typography>
            <Typography>
              {dayjs(requirement.start_date).format('MMM D, YYYY')} -{' '}
              {dayjs(requirement.end_date).format('MMM D, YYYY')}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Seniority Level
            </Typography>
            <Typography>{requirement.seniority_level}</Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Required Qualifications
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              {requirement.required_qualifications.map(qual => (
                <Chip
                  key={qual}
                  label={qual}
                  size="small"
                  sx={{ mr: 0.5, mb: 0.5 }}
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Coverage Timeline */}
      {coverage && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Coverage Timeline
          </Typography>
          <Timeline>
            {coverage.periods.map((period, index) => (
              <TimelineItem key={index}>
                <TimelineSeparator>
                  <TimelineDot color={period.type === 'gap' ? 'error' : 'success'}>
                    {period.type === 'gap' ? <WarningIcon /> : <CheckCircleIcon />}
                  </TimelineDot>
                  {index < coverage.periods.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant="subtitle2">
                    {period.type === 'gap' ? 'Coverage Gap' : 'Covered Period'}
                  </Typography>
                  <Typography color="text.secondary">
                    {dayjs(period.start_date).format('MMM D, YYYY')} -{' '}
                    {dayjs(period.end_date).format('MMM D, YYYY')}
                  </Typography>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </Paper>
      )}

      {/* Matching Employees */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Matching Employees
        </Typography>
        {matchingEmployees.length === 0 ? (
          <Alert severity="info">No matching employees found</Alert>
        ) : (
          <List>
            {matchingEmployees.map(employee => (
              <React.Fragment key={employee.id}>
                <ListItem
                  secondaryAction={
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => onAssign(employee)}
                    >
                      Assign
                    </Button>
                  }
                >
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={employee.name}
                    secondary={
                      <>
                        <Typography component="span" variant="body2">
                          {employee.seniority_level}
                        </Typography>
                        <br />
                        <Typography component="span" variant="body2" color="text.secondary">
                          Current Assignments: {employee.current_assignments}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default RequirementDetail;