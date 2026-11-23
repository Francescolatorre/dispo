import type { ReactNode } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { projectColorTokens } from '../../domain/projectColors';
import type { Project } from '../../domain/types';
import { hasActiveFilters, NAV_STEP_WEEKS, type BoardFilters, type Insights } from './boardModel';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon, SearchIcon, SlidersIcon } from './icons';
import { InsightChips } from './InsightChips';
import { COLUMN_WIDTHS, type ColumnWidth, type Density } from './layout';

const ZOOM_LABELS: Record<ColumnWidth, string> = { 56: 'S', 88: 'M', 128: 'L' };

export interface BoardToolbarProps {
  onShift: (weeks: number) => void;
  onToday: () => void;
  columnWidth: ColumnWidth;
  onColumnWidthChange: (width: ColumnWidth) => void;
  density: Density;
  onDensityChange: (density: Density) => void;
  filters: BoardFilters;
  onFiltersChange: (patch: Partial<BoardFilters>) => void;
  onResetFilters: () => void;
  roles: readonly string[];
  projects: readonly Project[];
  insights: Insights;
  onToggleOverbooked: () => void;
  onToggleFree: () => void;
}

const Divider = () => <Box aria-hidden w="1px" h="20px" bg="line" mx={1} display={{ base: 'none', lg: 'block' }} />;

/** Menu button of a single-choice filter; shows the choice and an × to clear it. */
function FilterMenu({
  label,
  ariaLabel,
  value,
  valueLabel,
  options,
  allLabel,
  onChange,
}: {
  label: string;
  ariaLabel: string;
  value: string;
  valueLabel?: string;
  options: ReadonlyArray<{ value: string; label: string; adornment?: ReactNode }>;
  allLabel: string;
  onChange: (value: string) => void;
}) {
  const active = Boolean(value);
  return (
    <ButtonGroup isAttached variant="outline" size="md">
      <Menu placement="bottom-start" isLazy>
        <MenuButton
          as={Button}
          aria-label={ariaLabel}
          rightIcon={<ChevronDownIcon boxSize="14px" color="gray.500" />}
          fontWeight={active ? 600 : 500}
          maxW="220px"
          bg={active ? 'accent.50' : 'white'}
          color={active ? 'accent.700' : 'gray.800'}
          borderColor={active ? 'accent.200' : 'gray.200'}
        >
          <Text as="span" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis" display="block">
            {active ? `${label}: ${valueLabel ?? value}` : label}
          </Text>
        </MenuButton>
        <MenuList maxH="320px" overflowY="auto">
          <MenuOptionGroup type="radio" value={value} onChange={(v) => onChange(String(v))}>
            <MenuItemOption value="">{allLabel}</MenuItemOption>
            {options.map((o) => (
              <MenuItemOption key={o.value} value={o.value}>
                <HStack spacing={2}>
                  {o.adornment}
                  <Text as="span">{o.label}</Text>
                </HStack>
              </MenuItemOption>
            ))}
          </MenuOptionGroup>
        </MenuList>
      </Menu>
      {active && (
        <IconButton
          aria-label={`${label}filter entfernen`}
          icon={<CloseIcon boxSize="12px" />}
          bg="accent.50"
          color="accent.700"
          borderColor="accent.200"
          onClick={() => onChange('')}
        />
      )}
    </ButtonGroup>
  );
}

/** One toolbar row: time | scope (search, filters, insight chips) | view (zoom, Ansicht). */
export function BoardToolbar({
  onShift,
  onToday,
  columnWidth,
  onColumnWidthChange,
  density,
  onDensityChange,
  filters,
  onFiltersChange,
  onResetFilters,
  roles,
  projects,
  insights,
  onToggleOverbooked,
  onToggleFree,
}: BoardToolbarProps) {
  const selectedProject = projects.find((p) => p.id === filters.projectId);
  return (
    <Flex as="section" aria-label="Zeitraum und Filter" gap={2} align="center" wrap="wrap" rowGap={2}>
      <ButtonGroup isAttached variant="outline" size="md">
        <Tooltip label={`${NAV_STEP_WEEKS} Wochen zurück`} openDelay={400}>
          <IconButton aria-label={`${NAV_STEP_WEEKS} Wochen zurück`} icon={<ChevronLeftIcon boxSize="16px" />} onClick={() => onShift(-NAV_STEP_WEEKS)} />
        </Tooltip>
        <Button onClick={onToday} px={3}>
          Heute
        </Button>
        <Tooltip label={`${NAV_STEP_WEEKS} Wochen vor`} openDelay={400}>
          <IconButton aria-label={`${NAV_STEP_WEEKS} Wochen vor`} icon={<ChevronRightIcon boxSize="16px" />} onClick={() => onShift(NAV_STEP_WEEKS)} />
        </Tooltip>
      </ButtonGroup>
      <Divider />

      <InputGroup w={{ base: '160px', '2xl': '200px' }}>
        <InputLeftElement pointerEvents="none" color="gray.500" h="32px">
          <SearchIcon boxSize="14px" />
        </InputLeftElement>
        <Input
          type="search"
          placeholder="Person suchen"
          aria-label="Person suchen"
          value={filters.search}
          onChange={(e) => onFiltersChange({ search: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && filters.search) {
              e.stopPropagation();
              onFiltersChange({ search: '' });
            }
          }}
        />
      </InputGroup>
      <FilterMenu
        label="Rolle"
        ariaLabel="Rolle filtern"
        value={filters.role}
        allLabel="Alle Rollen"
        options={roles.map((r) => ({ value: r, label: r }))}
        onChange={(role) => onFiltersChange({ role })}
      />
      <FilterMenu
        label="Projekt"
        ariaLabel="Projekt filtern"
        value={filters.projectId}
        valueLabel={selectedProject?.name}
        allLabel="Alle Projekte"
        options={projects.map((p) => ({
          value: p.id,
          label: p.name,
          adornment: <Box as="span" boxSize="8px" borderRadius="full" bg={projectColorTokens(p.color).edge} flexShrink={0} />,
        }))}
        onChange={(projectId) => onFiltersChange({ projectId })}
      />
      <InsightChips
        insights={insights}
        onlyOverbooked={filters.onlyOverbooked}
        onlyFree={filters.onlyFree}
        onToggleOverbooked={onToggleOverbooked}
        onToggleFree={onToggleFree}
      />
      {hasActiveFilters(filters) && (
        <Button variant="ghost" onClick={onResetFilters} px={2} color="accent.600">
          Filter zurücksetzen
        </Button>
      )}

      <HStack spacing={2} ml="auto">
        <Tooltip label="Spaltenbreite" openDelay={400}>
          <HStack
            role="group"
            aria-label="Spaltenbreite"
            spacing="2px"
            p="2px"
            h="32px"
            bg="gray.100"
            borderRadius="md"
          >
            {COLUMN_WIDTHS.map((w) => {
              const on = w === columnWidth;
              return (
                <Box
                  as="button"
                  type="button"
                  key={w}
                  aria-pressed={on}
                  onClick={() => onColumnWidthChange(w)}
                  h="28px"
                  minW="28px"
                  px={2}
                  fontSize="xs"
                  fontWeight={on ? 600 : 500}
                  borderRadius="calc(var(--chakra-radii-md) - 2px)"
                  bg={on ? 'white' : 'transparent'}
                  color={on ? 'gray.900' : 'gray.600'}
                  boxShadow={on ? 'xs' : undefined}
                  transition="background 150ms"
                  _hover={{ color: 'gray.900' }}
                  _focusVisible={{ boxShadow: 'outline' }}
                >
                  {ZOOM_LABELS[w]}
                </Box>
              );
            })}
          </HStack>
        </Tooltip>
        <Menu placement="bottom-end" closeOnSelect={false}>
          <MenuButton as={Button} variant="outline" leftIcon={<SlidersIcon boxSize="14px" />} rightIcon={<ChevronDownIcon boxSize="14px" color="gray.500" />}>
            Ansicht
          </MenuButton>
          <MenuList>
            <MenuOptionGroup title="Dichte" type="radio" value={density} onChange={(v) => onDensityChange(v as Density)}>
              <MenuItemOption value="comfort">Komfort</MenuItemOption>
              <MenuItemOption value="compact">Kompakt</MenuItemOption>
            </MenuOptionGroup>
            <MenuOptionGroup
              title="Personen"
              type="checkbox"
              value={filters.showInactive ? ['inactive'] : []}
              onChange={(v) => onFiltersChange({ showInactive: (v as string[]).includes('inactive') })}
            >
              <MenuItemOption value="inactive">Inaktive zeigen</MenuItemOption>
            </MenuOptionGroup>
          </MenuList>
        </Menu>
      </HStack>
    </Flex>
  );
}
