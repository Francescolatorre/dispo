import {
  Button,
  ButtonGroup,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Switch,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import type { WeekRef } from '../../domain/dates';
import type { Project } from '../../domain/types';
import { formatDate, hasActiveFilters, MIN_FREE_PERCENT, NAV_STEP_WEEKS, type BoardFilters } from './boardModel';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, RedoIcon, SearchIcon, UndoIcon } from './icons';
import { COLUMN_WIDTHS, type ColumnWidth } from './layout';

const ZOOM_LABELS: Record<ColumnWidth, string> = { 64: 'Kompakt', 96: 'Normal', 140: 'Weit' };

export interface BoardToolbarProps {
  weeks: readonly WeekRef[];
  isCurrentRange: boolean;
  onShift: (weeks: number) => void;
  onToday: () => void;
  columnWidth: ColumnWidth;
  onColumnWidthChange: (width: ColumnWidth) => void;
  filters: BoardFilters;
  onFiltersChange: (patch: Partial<BoardFilters>) => void;
  onResetFilters: () => void;
  roles: readonly string[];
  projects: readonly Project[];
  visibleCount: number;
  totalCount: number;
  /** Opens the create dialog ("+ Einsatz"). */
  onCreate?: () => void;
  history?: {
    canUndo: boolean;
    canRedo: boolean;
    undoLabel?: string;
    redoLabel?: string;
    onUndo: () => void;
    onRedo: () => void;
  };
}

export function BoardToolbar({
  weeks,
  isCurrentRange,
  onShift,
  onToday,
  columnWidth,
  onColumnWidthChange,
  filters,
  onFiltersChange,
  onResetFilters,
  roles,
  projects,
  visibleCount,
  totalCount,
  onCreate,
  history,
}: BoardToolbarProps) {
  const first = weeks[0];
  const last = weeks[weeks.length - 1];
  const undoText = history?.undoLabel ? `Rückgängig: ${history.undoLabel}` : undefined;
  const redoText = history?.redoLabel ? `Wiederherstellen: ${history.redoLabel}` : undefined;

  return (
    <Flex direction="column" gap={3} as="section" aria-label="Zeitraum und Filter">
      <Flex gap={3} align="center" wrap="wrap">
        <HStack spacing={1}>
          <IconButton
            aria-label={`${NAV_STEP_WEEKS} Wochen zurück`}
            icon={<ChevronLeftIcon boxSize={4} />}
            size="sm"
            variant="outline"
            colorScheme="gray"
            bg="white"
            onClick={() => onShift(-NAV_STEP_WEEKS)}
          />
          <Button size="sm" variant="outline" colorScheme="gray" bg="white" onClick={onToday} isDisabled={isCurrentRange}>
            Heute
          </Button>
          <IconButton
            aria-label={`${NAV_STEP_WEEKS} Wochen vor`}
            icon={<ChevronRightIcon boxSize={4} />}
            size="sm"
            variant="outline"
            colorScheme="gray"
            bg="white"
            onClick={() => onShift(NAV_STEP_WEEKS)}
          />
        </HStack>
        {first && last && (
          <Text fontSize="sm" color="gray.700" data-testid="visible-range" aria-live="polite">
            <Text as="span" fontWeight="semibold">
              KW {first.week} – KW {last.week}
            </Text>
            <Text as="span" color="gray.500">
              {' '}
              · {formatDate(first.start)} – {formatDate(last.end)}
            </Text>
          </Text>
        )}
        <HStack spacing={1} ml="auto">
          {history && (
            <>
              <Tooltip label={undoText ?? 'Nichts rückgängig zu machen'} hasArrow openDelay={200}>
                <IconButton
                  aria-label={undoText ?? 'Rückgängig'}
                  icon={<UndoIcon boxSize={4} />}
                  size="sm"
                  variant="ghost"
                  colorScheme="gray"
                  isDisabled={!history.canUndo}
                  onClick={history.onUndo}
                />
              </Tooltip>
              <Tooltip label={redoText ?? 'Nichts wiederherzustellen'} hasArrow openDelay={200}>
                <IconButton
                  aria-label={redoText ?? 'Wiederherstellen'}
                  icon={<RedoIcon boxSize={4} />}
                  size="sm"
                  variant="ghost"
                  colorScheme="gray"
                  isDisabled={!history.canRedo}
                  onClick={history.onRedo}
                />
              </Tooltip>
            </>
          )}
          {onCreate && (
            <Button size="sm" leftIcon={<PlusIcon boxSize={3.5} />} onClick={onCreate} ml={2}>
              Einsatz
            </Button>
          )}
        </HStack>
        <HStack spacing={2}>
          <Text fontSize="xs" color="gray.500" id="zoom-label">
            Spaltenbreite
          </Text>
          <ButtonGroup size="xs" isAttached variant="outline" colorScheme="gray" role="group" aria-labelledby="zoom-label">
            {COLUMN_WIDTHS.map((w) => (
              <Button
                key={w}
                aria-pressed={w === columnWidth}
                onClick={() => onColumnWidthChange(w)}
                bg={w === columnWidth ? 'gray.800' : 'white'}
                color={w === columnWidth ? 'white' : 'gray.700'}
                _hover={{ bg: w === columnWidth ? 'gray.700' : 'gray.50' }}
              >
                {ZOOM_LABELS[w]}
              </Button>
            ))}
          </ButtonGroup>
        </HStack>
      </Flex>

      <Flex gap={3} align="center" wrap="wrap">
        <InputGroup size="sm" w={{ base: 'full', md: '220px' }}>
          <InputLeftElement pointerEvents="none" color="gray.400">
            <SearchIcon boxSize={3.5} />
          </InputLeftElement>
          <Input
            type="search"
            bg="white"
            placeholder="Person suchen"
            aria-label="Person suchen"
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
          />
        </InputGroup>
        <Select
          size="sm"
          w="auto"
          minW="150px"
          bg="white"
          aria-label="Rolle filtern"
          value={filters.role}
          onChange={(e) => onFiltersChange({ role: e.target.value })}
        >
          <option value="">Alle Rollen</option>
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
        <Select
          size="sm"
          w="auto"
          minW="180px"
          bg="white"
          aria-label="Projekt filtern"
          value={filters.projectId}
          onChange={(e) => onFiltersChange({ projectId: e.target.value })}
        >
          <option value="">Alle Projekte</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <FormControl display="flex" alignItems="center" w="auto">
          <Switch
            id="board-only-free"
            size="sm"
            colorScheme="green"
            isChecked={filters.onlyFree}
            onChange={(e) => onFiltersChange({ onlyFree: e.target.checked, onlyOverbooked: false })}
          />
          <FormLabel htmlFor="board-only-free" mb={0} ml={2} fontSize="sm" fontWeight="normal" title={`≥ ${MIN_FREE_PERCENT} % frei in jeder der nächsten 4 Wochen`}>
            Nur mit freier Kapazität
          </FormLabel>
        </FormControl>
        <FormControl display="flex" alignItems="center" w="auto">
          <Switch
            id="board-show-inactive"
            size="sm"
            colorScheme="gray"
            isChecked={filters.showInactive}
            onChange={(e) => onFiltersChange({ showInactive: e.target.checked })}
          />
          <FormLabel htmlFor="board-show-inactive" mb={0} ml={2} fontSize="sm" fontWeight="normal">
            Inaktive zeigen
          </FormLabel>
        </FormControl>
        <HStack spacing={3} ml="auto">
          <Text fontSize="sm" color="gray.500" data-testid="row-count" aria-live="polite">
            {visibleCount} von {totalCount} Personen
          </Text>
          {hasActiveFilters(filters) && (
            <Button size="sm" variant="ghost" colorScheme="gray" onClick={onResetFilters}>
              Filter zurücksetzen
            </Button>
          )}
        </HStack>
      </Flex>
    </Flex>
  );
}
