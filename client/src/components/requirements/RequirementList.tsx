import React, { useEffect, useState } from 'react';
import {
  Requirement,
  RequirementFilters,
  RequirementStats
} from '../../types/requirement';
import requirementService from '../../services/requirementService';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Chip,
  Tooltip,
  TextField,
  MenuItem,
  Box,
  Typography
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Assignment as AssignmentIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';

interface RequirementListProps {
  projectId: number;
  onEdit: (requirement: Requirement) => void;
  onDelete: (requirement: Requirement) => void;
  onAssign: (requirement: Requirement) => void;
  onViewTimeline: (requirement: Requirement) => void;
}

const RequirementList: React.FC<RequirementListProps> = ({
  projectId,
  onEdit,
  onDelete,
  onAssign,
  onViewTimeline
}) => {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<RequirementStats | null>(null);
  const [filters, setFilters] = useState<RequirementFilters>({});
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Load requirements
  useEffect(() => {
    const loadRequirements = async () => {
      try {
        setLoading(true);
        const { requirements: data } = await requirementService.getFilteredRequirements(
          projectId,
          filters,
          page,
          pageSize
        );
        setRequirements(data);
        
        // Load stats
        const statsData = await requirementService.getRequirementStats(projectId);
        setStats(statsData);
        
        setError(null);
      } catch (err) {
        setError('Failed to load requirements');
        console.error('Error loading requirements:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRequirements();
  }, [projectId, filters, page, pageSize]);

  const handleFilterChange = (newFilters: Partial<RequirementFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1); // Reset to first page when filters change
  };

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

  if (loading) return <div>Loading requirements...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Box>
      {/* Stats Overview */}
      {stats && (
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <Paper sx={{ p: 2, flex: 1 }}>
            <Typography variant="h6">Total Requirements</Typography>
            <Typography variant="h4">{stats.total}</Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1 }}>
            <Typography variant="h6">Coverage</Typography>
            <Typography variant="h4">{stats.coverage_percentage}%</Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1 }}>
            <Typography variant="h6">Upcoming Gaps</Typography>
            <Typography variant="h4">{stats.upcoming_gaps}</Typography>
          </Paper>
        </Box>
      )}

      {/* Filters */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <TextField
          select
          label="Status"
          value={filters.status || []}
          onChange={(e) => handleFilterChange({ status: e.target.value as any })}
          sx={{ minWidth: 150 }}
          SelectProps={{ multiple: true }}
        >
          <MenuItem value="open">Open</MenuItem>
          <MenuItem value="partially_filled">Partially Filled</MenuItem>
          <MenuItem value="filled">Filled</MenuItem>
          <MenuItem value="needs_replacement">Needs Replacement</MenuItem>
        </TextField>

        <TextField
          select
          label="Priority"
          value={filters.priority || []}
          onChange={(e) => handleFilterChange({ priority: e.target.value as any })}
          sx={{ minWidth: 150 }}
          SelectProps={{ multiple: true }}
        >
          <MenuItem value="critical">Critical</MenuItem>
          <MenuItem value="high">High</MenuItem>
          <MenuItem value="medium">Medium</MenuItem>
          <MenuItem value="low">Low</MenuItem>
        </TextField>

        <TextField
          label="Search"
          value={filters.search || ''}
          onChange={(e) => handleFilterChange({ search: e.target.value })}
          sx={{ minWidth: 200 }}
        />
      </Box>

      {/* Requirements Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Role</TableCell>
              <TableCell>Seniority</TableCell>
              <TableCell>Period</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Current Assignment</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requirements.map((requirement) => (
              <TableRow key={requirement.id}>
                <TableCell>{requirement.role}</TableCell>
                <TableCell>{requirement.seniority_level}</TableCell>
                <TableCell>
                  {new Date(requirement.start_date).toLocaleDateString()} -{' '}
                  {new Date(requirement.end_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Chip
                    label={requirement.status}
                    color={getStatusColor(requirement.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={requirement.priority}
                    color={getPriorityColor(requirement.priority) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {requirement.current_employee_name || 'Unassigned'}
                </TableCell>
                <TableCell>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={() => onEdit(requirement)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Assign">
                    <IconButton
                      size="small"
                      onClick={() => onAssign(requirement)}
                    >
                      <AssignmentIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Timeline">
                    <IconButton
                      size="small"
                      onClick={() => onViewTimeline(requirement)}
                    >
                      <TimelineIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      onClick={() => onDelete(requirement)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default RequirementList;