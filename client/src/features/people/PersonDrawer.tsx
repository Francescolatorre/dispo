import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  Select,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Stack,
  Switch,
  Text,
  useToast,
} from '@chakra-ui/react';
import { SENIORITIES, type Employee, type EmployeeInput, type EmployeeUpdate } from '../../domain/types';
import type { ValidationIssue } from '../../domain/validation';
import { usePlanning } from '../../state';
import { DeleteConfirm, IssueList } from '../shared/components';
import { formatCapacity, pluralize, SENIORITY_LABELS } from '../shared/format';
import { useDryRun } from '../shared/useDryRun';
import { useUndoToast } from '../shared/useUndoToast';

export interface PersonDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Person to edit; `null` = create a new one. */
  employee: Employee | null;
  roles: string[];
}

const NEW_PERSON: EmployeeInput = { name: '', role: '', seniority: 'mid', capacity: 1, active: true };

function toForm(e: Employee | null): EmployeeInput {
  if (!e) return NEW_PERSON;
  return { name: e.name, role: e.role, seniority: e.seniority, capacity: e.capacity, active: e.active };
}

/** Normalizes user input (trimmed text, capacity rounded to 10 % steps). */
function normalize(form: EmployeeInput): EmployeeInput {
  return { ...form, name: form.name.trim(), role: form.role.trim(), capacity: Math.round(form.capacity * 10) / 10 };
}

function diff(before: Employee, after: EmployeeInput): EmployeeUpdate {
  const patch: EmployeeUpdate = {};
  (Object.keys(after) as Array<keyof EmployeeInput>).forEach((k) => {
    if (after[k] !== before[k]) (patch as Record<string, unknown>)[k] = after[k];
  });
  return patch;
}

const fieldError = (errors: ValidationIssue[], field: string) => errors.find((e) => e.field === field)?.message;

export function PersonDrawer({ isOpen, onClose, employee, roles }: PersonDrawerProps) {
  const { actions, assignments } = usePlanning();
  const toast = useToast();
  const showUndo = useUndoToast();
  const nameRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<EmployeeInput>(() => toForm(employee));
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<ValidationIssue[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setForm(toForm(employee));
    setSubmitted(false);
    setSaving(false);
    setConfirmDelete(false);
    setSubmitErrors([]);
  }, [isOpen, employee]);

  const normalized = useMemo(() => normalize(form), [form]);
  const patch = useMemo(() => (employee ? diff(employee, normalized) : null), [employee, normalized]);
  const isDirty = employee ? Object.keys(patch ?? {}).length > 0 : true;

  const dryRunRequest = useMemo(() => {
    if (!isOpen) return null;
    if (employee) {
      const p = patch ?? {};
      return () => actions.updateEmployee(employee.id, p, { dryRun: true });
    }
    return () => actions.createEmployee(normalized, { dryRun: true });
  }, [isOpen, employee, patch, normalized, actions]);
  const dryRun = useDryRun(dryRunRequest);

  // Blocking errors only after the first save attempt (no red fields while typing a new person).
  const errors = submitted ? (submitErrors.length > 0 ? submitErrors : dryRun.errors) : [];
  const ownAssignments = employee ? assignments.filter((a) => a.employeeId === employee.id).length : 0;

  const set = useCallback(<K extends keyof EmployeeInput>(key: K, value: EmployeeInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSubmitErrors([]);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (employee && !isDirty) {
      onClose();
      return;
    }
    setSaving(true);
    const result = employee
      ? await actions.updateEmployee(employee.id, patch ?? {})
      : await actions.createEmployee(normalized);
    setSaving(false);
    if (!result.ok) {
      setSubmitErrors(result.errors);
      return;
    }
    toast({
      status: 'success',
      title: employee ? 'Person gespeichert' : 'Person angelegt',
      description: result.result.name,
      duration: 3000,
      position: 'bottom',
    });
    onClose();
  }

  async function handleDelete() {
    if (!employee) return;
    setSaving(true);
    const result = await actions.deleteEmployee(employee.id);
    setSaving(false);
    if (!result.ok) {
      setSubmitErrors(result.errors);
      setConfirmDelete(false);
      return;
    }
    onClose();
    showUndo({
      title: 'Person gelöscht',
      description:
        ownAssignments > 0
          ? `${employee.name} · ${pluralize(ownAssignments, 'Einsatz', 'Einsätze')} entfernt`
          : employee.name,
      undoLabel: 'Person löschen',
    });
  }

  const title = employee ? 'Person bearbeiten' : 'Neue Person';

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="sm" initialFocusRef={nameRef}>
      <DrawerOverlay />
      <DrawerContent>
        <Flex as="form" direction="column" h="full" onSubmit={handleSubmit} noValidate>
        <DrawerCloseButton aria-label="Schließen" />
        <DrawerHeader>
          {title}
        </DrawerHeader>

        <DrawerBody>
          <Stack spacing={5}>
            {employee && (
              <Text fontSize="sm" color="gray.500" mt={-2}>
                {pluralize(ownAssignments, 'Einsatz', 'Einsätze')} im Plan
              </Text>
            )}
            <FormControl isRequired isInvalid={Boolean(fieldError(errors, 'name'))}>
              <FormLabel>Name</FormLabel>
              <Input ref={nameRef} value={form.name} onChange={(e) => set('name', e.target.value)} autoComplete="off" />
              <FormErrorMessage>{fieldError(errors, 'name')}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={Boolean(fieldError(errors, 'role'))}>
              <FormLabel>Rolle</FormLabel>
              <Input
                value={form.role}
                onChange={(e) => set('role', e.target.value)}
                list="person-role-options"
                autoComplete="off"
                placeholder="z. B. Frontend"
              />
              <datalist id="person-role-options">
                {roles.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
              {fieldError(errors, 'role') ? (
                <FormErrorMessage>{fieldError(errors, 'role')}</FormErrorMessage>
              ) : (
                <FormHelperText>Vorschlag wählen oder neue Rolle eingeben.</FormHelperText>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>Seniorität</FormLabel>
              <Select value={form.seniority} onChange={(e) => set('seniority', e.target.value as EmployeeInput['seniority'])}>
                {SENIORITIES.map((s) => (
                  <option key={s} value={s}>
                    {SENIORITY_LABELS[s]}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl isInvalid={Boolean(fieldError(errors, 'capacity'))}>
              <HStack justify="space-between" align="baseline">
                <FormLabel id="person-capacity-label" mb={1}>
                  Kapazität
                </FormLabel>
                <Text fontSize="sm" fontWeight="semibold" color="gray.700" data-testid="capacity-value">
                  {formatCapacity(form.capacity)}
                </Text>
              </HStack>
              <Slider
                aria-labelledby="person-capacity-label"
                getAriaValueText={(v) => `${v} %`}
                min={10}
                max={100}
                step={10}
                value={Math.round(form.capacity * 100)}
                onChange={(v) => set('capacity', v / 100)}
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
              <FormHelperText>100 % = Vollzeit. Teilzeit verringert die verfügbare Kapazität pro Woche.</FormHelperText>
              <FormErrorMessage>{fieldError(errors, 'capacity')}</FormErrorMessage>
            </FormControl>

            <FormControl display="flex" alignItems="center">
              <Switch id="person-active" isChecked={form.active} onChange={(e) => set('active', e.target.checked)} />
              <FormLabel htmlFor="person-active" mb={0} ml={3}>
                Aktiv
              </FormLabel>
            </FormControl>

            <IssueList errors={errors.filter((e) => !e.field)} warnings={dryRun.warnings} />
          </Stack>
        </DrawerBody>

        <DrawerFooter flexDirection="column" gap={3}>
          {confirmDelete && employee ? (
            <DeleteConfirm
              title={`${employee.name} löschen?`}
              text={
                ownAssignments > 0
                  ? `${pluralize(ownAssignments, 'Einsatz wird', 'Einsätze werden')} ebenfalls entfernt. Du kannst das direkt danach rückgängig machen.`
                  : 'Die Person hat keine Einsätze. Du kannst das direkt danach rückgängig machen.'
              }
              onCancel={() => setConfirmDelete(false)}
              onConfirm={() => void handleDelete()}
              isLoading={saving}
            />
          ) : (
            <HStack w="full">
              {employee && (
                <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                  Löschen
                </Button>
              )}
              <HStack ml="auto">
                <Button variant="outline" onClick={onClose}>
                  Abbrechen
                </Button>
                <Button type="submit" isLoading={saving}>
                  {employee ? 'Speichern' : 'Anlegen'}
                </Button>
              </HStack>
            </HStack>
          )}
        </DrawerFooter>
        </Flex>
      </DrawerContent>
    </Drawer>
  );
}
