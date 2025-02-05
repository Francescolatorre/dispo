import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Tooltip,
  Box,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Employee } from '../../types/employee';
import { employeeService } from '../../services/employeeService';

interface EmployeeListProps {
  onEdit: (employee: Employee) => void;
}

export const EmployeeList = ({ onEdit }: EmployeeListProps) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeeService.getAll();
      setEmployees(data);
      setError(null);
    } catch (err) {
      setError('Failed to load employees');
      console.error('Error loading employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) {
      return;
    }

    try {
      await employeeService.delete(id);
      await loadEmployees();
    } catch (err) {
      setError('Failed to delete employee');
      console.error('Error deleting employee:', err);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Seniorität</TableCell>
              <TableCell>Qualifikationen</TableCell>
              <TableCell>Arbeitszeitfaktor</TableCell>
              <TableCell>Vertragsende</TableCell>
              <TableCell>Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>{employee.name}</TableCell>
                <TableCell>{employee.seniority_level}</TableCell>
                <TableCell>
                  {employee.qualifications.map((qual) => (
                    <Chip
                      key={qual}
                      label={qual}
                      size="small"
                      style={{ margin: '2px' }}
                    />
                  ))}
                </TableCell>
                <TableCell>{Number(employee.work_time_factor).toFixed(2)}</TableCell>
                <TableCell>
                  {employee.contract_end_date
                    ? new Date(employee.contract_end_date).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })
                    : 'Unbefristet'}
                </TableCell>
                <TableCell>
                  <Tooltip title="Bearbeiten">
                  <IconButton 
                    onClick={() => onEdit(employee)} 
                    size="small"
                  >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Löschen">
                  <IconButton
                    onClick={() => handleDelete(employee.id)}
                    size="small"
                    color="error"
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
