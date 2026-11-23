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
  FormLabel,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { addDays, addWeeks, startOfISOWeek } from '../../domain/dates';
import { suggestProjectColor } from '../../domain/projectColors';
import { PROJECT_STATUSES, type ISODate, type Project, type ProjectInput, type ProjectUpdate } from '../../domain/types';
import type { ValidationIssue } from '../../domain/validation';
import { usePlanning } from '../../state';
import { DeleteConfirm, IssueList } from '../shared/components';
import { PROJECT_STATUS_LABELS, pluralize } from '../shared/format';
import { useDryRun } from '../shared/useDryRun';
import { useUndoToast } from '../shared/useUndoToast';
import { projectColorTokens } from '../../domain/projectColors';
import { ColorSwatchPicker } from './ColorSwatchPicker';

export interface ProjectDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Project to edit; `null` = create a new one. */
  project: Project | null;
  today: ISODate;
}

/** New projects default to: this Monday … Friday in 12 weeks, status "Geplant", first unused palette colour. */
function newProject(today: ISODate, usedColors: string[]): ProjectInput {
  const monday = startOfISOWeek(today);
  return {
    name: '',
    color: suggestProjectColor(usedColors),
    start: monday,
    end: addDays(addWeeks(monday, 12), 4),
    status: 'planned',
  };
}

function toForm(p: Project): ProjectInput {
  return { name: p.name, color: p.color, start: p.start, end: p.end, status: p.status };
}

function diff(before: Project, after: ProjectInput): ProjectUpdate {
  const patch: ProjectUpdate = {};
  (Object.keys(after) as Array<keyof ProjectInput>).forEach((k) => {
    if (after[k] !== before[k]) (patch as Record<string, unknown>)[k] = after[k];
  });
  return patch;
}

const fieldError = (errors: ValidationIssue[], field: string) => errors.find((e) => e.field === field)?.message;

export function ProjectDrawer({ isOpen, onClose, project, today }: ProjectDrawerProps) {
  const { actions, assignments, projects } = usePlanning();
  const toast = useToast();
  const showUndo = useUndoToast();
  const nameRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ProjectInput>(() => (project ? toForm(project) : newProject(today, [])));
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<ValidationIssue[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setForm(project ? toForm(project) : newProject(today, projects.map((p) => p.color)));
    setSubmitted(false);
    setSaving(false);
    setConfirmDelete(false);
    setSubmitErrors([]);
    // Reset only when the drawer opens or switches project, not on every data reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, project]);

  const normalized = useMemo<ProjectInput>(() => ({ ...form, name: form.name.trim() }), [form]);
  const patch = useMemo(() => (project ? diff(project, normalized) : null), [project, normalized]);
  const isDirty = project ? Object.keys(patch ?? {}).length > 0 : true;

  const dryRunRequest = useMemo(() => {
    if (!isOpen) return null;
    if (project) {
      const p = patch ?? {};
      return () => actions.updateProject(project.id, p, { dryRun: true });
    }
    return () => actions.createProject(normalized, { dryRun: true });
  }, [isOpen, project, patch, normalized, actions]);
  const dryRun = useDryRun(dryRunRequest);

  const errors = submitted ? (submitErrors.length > 0 ? submitErrors : dryRun.errors) : [];
  const own = project ? assignments.filter((a) => a.projectId === project.id) : [];
  const ownPeople = new Set(own.map((a) => a.employeeId)).size;

  const set = useCallback(<K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSubmitErrors([]);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (project && !isDirty) {
      onClose();
      return;
    }
    setSaving(true);
    const result = project ? await actions.updateProject(project.id, patch ?? {}) : await actions.createProject(normalized);
    setSaving(false);
    if (!result.ok) {
      setSubmitErrors(result.errors);
      return;
    }
    toast({
      status: 'success',
      title: project ? 'Projekt gespeichert' : 'Projekt angelegt',
      description: result.result.name,
      duration: 3000,
      position: 'bottom',
    });
    onClose();
  }

  async function handleDelete() {
    if (!project) return;
    setSaving(true);
    const result = await actions.deleteProject(project.id);
    setSaving(false);
    if (!result.ok) {
      setSubmitErrors(result.errors);
      setConfirmDelete(false);
      return;
    }
    onClose();
    showUndo({
      title: 'Projekt gelöscht',
      description: own.length > 0 ? `${project.name} · ${pluralize(own.length, 'Einsatz', 'Einsätze')} entfernt` : project.name,
      undoLabel: 'Projekt löschen',
    });
  }

  const title = project ? 'Projekt bearbeiten' : 'Neues Projekt';

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="sm" initialFocusRef={nameRef}>
      <DrawerOverlay />
      <DrawerContent borderTopWidth="4px" borderTopColor={projectColorTokens(form.color).edge}>
        <Flex as="form" direction="column" h="full" onSubmit={handleSubmit} noValidate>
        <DrawerCloseButton aria-label="Schließen" />
        <DrawerHeader>
          {title}
        </DrawerHeader>

        <DrawerBody>
          <Stack spacing={5}>
            {project && (
              <Text fontSize="sm" color="gray.500" mt={-2}>
                {pluralize(ownPeople, 'Person', 'Personen')} · {pluralize(own.length, 'Einsatz', 'Einsätze')}
              </Text>
            )}
            <FormControl isRequired isInvalid={Boolean(fieldError(errors, 'name'))}>
              <FormLabel>Name</FormLabel>
              <Input ref={nameRef} value={form.name} onChange={(e) => set('name', e.target.value)} autoComplete="off" />
              <FormErrorMessage>{fieldError(errors, 'name')}</FormErrorMessage>
            </FormControl>

            <FormControl as="fieldset" isInvalid={Boolean(fieldError(errors, 'color'))}>
              <FormLabel as="legend" id="project-color-label">
                Farbe
              </FormLabel>
              <ColorSwatchPicker value={form.color} onChange={(c) => set('color', c)} labelId="project-color-label" />
              <FormErrorMessage>{fieldError(errors, 'color')}</FormErrorMessage>
            </FormControl>

            <SimpleGrid columns={2} spacing={3}>
              <FormControl isRequired isInvalid={Boolean(fieldError(errors, 'start'))}>
                <FormLabel>Start</FormLabel>
                <Input type="date" value={form.start} onChange={(e) => set('start', e.target.value)} />
                <FormErrorMessage>{fieldError(errors, 'start')}</FormErrorMessage>
              </FormControl>
              <FormControl isRequired isInvalid={Boolean(fieldError(errors, 'end'))}>
                <FormLabel>Ende</FormLabel>
                <Input type="date" value={form.end} onChange={(e) => set('end', e.target.value)} />
                <FormErrorMessage>{fieldError(errors, 'end')}</FormErrorMessage>
              </FormControl>
            </SimpleGrid>

            <FormControl>
              <FormLabel>Status</FormLabel>
              <Select value={form.status} onChange={(e) => set('status', e.target.value as ProjectInput['status'])}>
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {PROJECT_STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </FormControl>

            <IssueList
              errors={errors.filter((e) => !e.field)}
              // The colour hint is already shown under the picker.
              warnings={dryRun.warnings.filter((w) => w.code !== 'COLOR_NOT_IN_PALETTE')}
            />
          </Stack>
        </DrawerBody>

        <DrawerFooter flexDirection="column" gap={3}>
          {confirmDelete && project ? (
            <DeleteConfirm
              title={`${project.name} löschen?`}
              text={
                own.length > 0
                  ? `${pluralize(own.length, 'Einsatz', 'Einsätze')} von ${pluralize(ownPeople, 'Person', 'Personen')} ${own.length === 1 ? 'wird' : 'werden'} ebenfalls entfernt. Du kannst das direkt danach rückgängig machen.`
                  : 'Das Projekt hat keine Einsätze. Du kannst das direkt danach rückgängig machen.'
              }
              onCancel={() => setConfirmDelete(false)}
              onConfirm={() => void handleDelete()}
              isLoading={saving}
            />
          ) : (
            <HStack w="full">
              {project && (
                <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                  Löschen
                </Button>
              )}
              <HStack ml="auto">
                <Button variant="outline" onClick={onClose}>
                  Abbrechen
                </Button>
                <Button type="submit" isLoading={saving}>
                  {project ? 'Speichern' : 'Anlegen'}
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
