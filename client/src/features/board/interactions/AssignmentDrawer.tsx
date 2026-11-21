/**
 * Create/edit drawer of an assignment with a live impact preview (planningActions dry-run).
 * Blocking errors are shown inline and disable "Speichern"; warnings (overbooking) are shown
 * but never block. Delete applies immediately and offers "Rückgängig" in the toast.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import type { ActionResult } from '../../../domain/planningActions';
import type { Assignment, AssignmentInput, AssignmentUpdate, ISODate } from '../../../domain/types';
import { ALLOCATION_MAX, ALLOCATION_MIN, ALLOCATION_STEP } from '../../../domain/validation';
import { usePlanning } from '../../../state';
import { formatPercent } from '../boardModel';
import { DEFAULT_CREATE_ALLOCATION, weekNumber } from './dragMath';
import { useActionFeedback } from './useActionFeedback';

export type EditorState =
  | { mode: 'create'; initial: Partial<AssignmentInput> }
  | { mode: 'edit'; assignment: Assignment };

interface FormState {
  employeeId: string;
  projectId: string;
  start: ISODate;
  end: ISODate;
  allocation: number;
  role: string;
}

const ALLOCATIONS = Array.from(
  { length: (ALLOCATION_MAX - ALLOCATION_MIN) / ALLOCATION_STEP + 1 },
  (_, i) => ALLOCATION_MIN + i * ALLOCATION_STEP,
);

function initialForm(editor: EditorState): FormState {
  const src = editor.mode === 'edit' ? editor.assignment : editor.initial;
  return {
    employeeId: src.employeeId ?? '',
    projectId: src.projectId ?? '',
    start: src.start ?? '',
    end: src.end ?? '',
    allocation: src.allocation ?? DEFAULT_CREATE_ALLOCATION,
    role: src.role ?? '',
  };
}

const toInput = (f: FormState): AssignmentInput => ({
  employeeId: f.employeeId,
  projectId: f.projectId,
  start: f.start,
  end: f.end,
  allocation: f.allocation,
  ...(f.role.trim() ? { role: f.role.trim() } : {}),
});

const toPatch = (f: FormState): AssignmentUpdate => ({
  employeeId: f.employeeId,
  projectId: f.projectId,
  start: f.start,
  end: f.end,
  allocation: f.allocation,
  role: f.role.trim() ? f.role.trim() : null,
});

export interface AssignmentDrawerProps {
  editor: EditorState;
  onClose: () => void;
}

export function AssignmentDrawer({ editor, onClose }: AssignmentDrawerProps) {
  const { employees, projects, actions } = usePlanning();
  const { report } = useActionFeedback();
  const [form, setForm] = useState<FormState>(() => initialForm(editor));
  const [check, setCheck] = useState<ActionResult<Assignment> | null>(null);
  const [busy, setBusy] = useState(false);
  const isEdit = editor.mode === 'edit';
  const editId = isEdit ? editor.assignment.id : null;
  const complete = Boolean(form.employeeId && form.projectId);

  // Live dry-run (debounced): blocking errors, warnings and the utilization impact.
  useEffect(() => {
    if (!complete) {
      setCheck(null);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const run = editId
        ? actions.updateAssignment(editId, toPatch(form), { dryRun: true })
        : actions.createAssignment(toInput(form), { dryRun: true });
      void run.then((r) => {
        if (!cancelled) setCheck(r);
      });
    }, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [form, complete, editId, actions]);

  const names = useMemo(() => new Map(employees.map((e) => [e.id, e.name])), [employees]);
  const employeeOptions = useMemo(
    () =>
      employees
        .filter((e) => e.active || e.id === form.employeeId)
        .sort((a, b) => a.name.localeCompare(b.name, 'de')),
    [employees, form.employeeId],
  );
  const projectOptions = useMemo(() => [...projects].sort((a, b) => a.name.localeCompare(b.name, 'de')), [projects]);

  const errors = check && !check.ok ? check.errors : [];
  const warnings = check?.warnings ?? [];
  const impact = check?.ok ? [...check.impact].sort((a, b) => a.weekStart.localeCompare(b.weekStart) || a.employeeId.localeCompare(b.employeeId)) : [];
  const fieldError = (field: string) => errors.find((e) => e.field === field)?.message;
  const generalErrors = errors.filter((e) => !e.field || !['employeeId', 'projectId', 'start', 'end', 'allocation'].includes(e.field));

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    setBusy(true);
    try {
      const result = editId ? await actions.updateAssignment(editId, toPatch(form)) : await actions.createAssignment(toInput(form));
      if (!result.ok) {
        setCheck(result);
        return;
      }
      report(result, editId ? 'Einsatz gespeichert' : 'Einsatz angelegt');
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!editId) return;
    setBusy(true);
    try {
      const result = await actions.deleteAssignment(editId);
      if (report(result, 'Einsatz gelöscht')) onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer isOpen placement="right" size="md" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent data-testid="assignment-drawer">
        <DrawerCloseButton aria-label="Schließen" />
        <DrawerHeader borderBottomWidth="1px">{isEdit ? 'Einsatz bearbeiten' : 'Einsatz anlegen'}</DrawerHeader>
        <DrawerBody>
          <Stack
            as="form"
            id="assignment-form"
            spacing={4}
            py={2}
            onSubmit={(e) => {
              e.preventDefault();
              if (complete && errors.length === 0 && !busy) void save();
            }}
          >
            <FormControl isRequired isInvalid={Boolean(fieldError('employeeId'))}>
              <FormLabel>Person</FormLabel>
              <Select placeholder="Person wählen" value={form.employeeId} onChange={(e) => set('employeeId', e.target.value)}>
                {employeeOptions.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} · {e.role}
                  </option>
                ))}
              </Select>
              <FormErrorMessage>{fieldError('employeeId')}</FormErrorMessage>
            </FormControl>

            <FormControl isRequired isInvalid={Boolean(fieldError('projectId'))}>
              <FormLabel>Projekt</FormLabel>
              <Select placeholder="Projekt wählen" value={form.projectId} onChange={(e) => set('projectId', e.target.value)}>
                {projectOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
              <FormErrorMessage>{fieldError('projectId')}</FormErrorMessage>
            </FormControl>

            <SimpleGrid columns={2} spacing={3}>
              <FormControl isRequired isInvalid={Boolean(fieldError('start'))}>
                <FormLabel>Start</FormLabel>
                <Input type="date" value={form.start} onChange={(e) => set('start', e.target.value)} />
                <FormErrorMessage>{fieldError('start')}</FormErrorMessage>
              </FormControl>
              <FormControl isRequired isInvalid={Boolean(fieldError('end'))}>
                <FormLabel>Ende</FormLabel>
                <Input type="date" value={form.end} onChange={(e) => set('end', e.target.value)} />
                <FormErrorMessage>{fieldError('end')}</FormErrorMessage>
              </FormControl>
            </SimpleGrid>

            <SimpleGrid columns={2} spacing={3}>
              <FormControl isRequired isInvalid={Boolean(fieldError('allocation'))}>
                <FormLabel>Allokation</FormLabel>
                <Select value={String(form.allocation)} onChange={(e) => set('allocation', Number(e.target.value))}>
                  {ALLOCATIONS.map((a) => (
                    <option key={a} value={a}>
                      {a} %
                    </option>
                  ))}
                </Select>
                <FormErrorMessage>{fieldError('allocation')}</FormErrorMessage>
              </FormControl>
              <FormControl>
                <FormLabel>Rolle (optional)</FormLabel>
                <Input value={form.role} placeholder="z. B. Tech Lead" onChange={(e) => set('role', e.target.value)} />
              </FormControl>
            </SimpleGrid>

            {generalErrors.map((e) => (
              <Alert key={e.message} status="error" borderRadius="md" fontSize="sm">
                <AlertIcon />
                <AlertDescription>{e.message}</AlertDescription>
              </Alert>
            ))}
            {warnings.map((w) => (
              <Alert key={w.message} status="warning" borderRadius="md" fontSize="sm">
                <AlertIcon />
                <AlertDescription>{w.message}</AlertDescription>
              </Alert>
            ))}

            <Box>
              <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={2}>
                Auswirkung auf die Auslastung
              </Text>
              {!complete ? (
                <Text fontSize="sm" color="gray.500">
                  Person und Projekt wählen, um die Auswirkung zu sehen.
                </Text>
              ) : check?.ok && impact.length === 0 ? (
                <Text fontSize="sm" color="gray.500">
                  Keine Änderung der Auslastung.
                </Text>
              ) : impact.length > 0 ? (
                <Box maxH="260px" overflowY="auto" borderWidth="1px" borderColor="gray.100" borderRadius="md">
                  <Table size="sm" data-testid="impact-table">
                    <Thead position="sticky" top={0} bg="white">
                      <Tr>
                        <Th>KW</Th>
                        <Th>Person</Th>
                        <Th isNumeric>Vorher</Th>
                        <Th isNumeric>Nachher</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {impact.map((i) => (
                        <Tr key={`${i.employeeId}-${i.weekKey}`} data-status={i.afterStatus}>
                          <Td>KW {weekNumber(i.weekKey)}</Td>
                          <Td>{names.get(i.employeeId) ?? i.employeeId}</Td>
                          <Td isNumeric>
                            <StatusBadge status={i.beforeStatus} value={i.before} />
                          </Td>
                          <Td isNumeric>
                            <StatusBadge status={i.afterStatus} value={i.after} />
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              ) : null}
            </Box>
          </Stack>
        </DrawerBody>
        <DrawerFooter borderTopWidth="1px" gap={2}>
          {isEdit && (
            <Button colorScheme="red" variant="ghost" mr="auto" onClick={() => void remove()} isDisabled={busy}>
              Löschen
            </Button>
          )}
          <Button variant="outline" colorScheme="gray" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" form="assignment-form" isDisabled={!complete || errors.length > 0} isLoading={busy}>
            Speichern
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function StatusBadge({ status, value }: { status: string; value: number }) {
  return (
    <Badge bg={`load.${status}.bg`} color={`load.${status}.fg`} borderWidth="1px" borderColor={`load.${status}.swatch`} fontSize="xs" sx={{ fontVariantNumeric: 'tabular-nums' }}>
      {formatPercent(value)}
    </Badge>
  );
}
