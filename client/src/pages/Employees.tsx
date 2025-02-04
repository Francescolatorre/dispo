import { useState } from 'react';
import { Typography, Button, Box, Alert, Snackbar } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { EmployeeList } from '../components/employees/EmployeeList';
import { EmployeeForm } from '../components/employees/EmployeeForm';
import { Employee, NewEmployee } from '../types/employee';
import { employeeService } from '../services/employeeService';

export const Employees = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleCreateClick = () => {
    setSelectedEmployee(undefined);
    setIsFormOpen(true);
  };

  const handleEditClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedEmployee(undefined);
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleSave = async (employeeData: NewEmployee) => {
    try {
      if (selectedEmployee) {
        await employeeService.update(selectedEmployee.id, employeeData);
        showSnackbar('Mitarbeiter erfolgreich aktualisiert', 'success');
      } else {
        await employeeService.create(employeeData);
        showSnackbar('Mitarbeiter erfolgreich erstellt', 'success');
      }
      handleFormClose();
    } catch (error) {
      console.error('Error saving employee:', error);
      showSnackbar(
        'Fehler beim Speichern des Mitarbeiters',
        'error'
      );
    }
  };

  return (
    <>
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h4" gutterBottom>
            Mitarbeiter
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateClick}
          >
            Neuer Mitarbeiter
          </Button>
        </Box>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Verwalten Sie hier Ihre Mitarbeiter, deren Qualifikationen und
          Verfügbarkeiten.
        </Typography>
      </Box>

      <EmployeeList onEdit={handleEditClick} />

      <EmployeeForm
        open={isFormOpen}
        onClose={handleFormClose}
        onSave={handleSave}
        employee={selectedEmployee}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};
