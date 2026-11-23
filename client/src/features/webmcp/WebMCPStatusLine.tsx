import { Box, Text, Tooltip, VisuallyHidden, useBreakpointValue } from '@chakra-ui/react';
import { useWebMCPToolCount } from './status';

const LABEL = 'KI-Werkzeuge aktiv (WebMCP)';

/**
 * Text for agents that read the page as DOM/text (e.g. browser extensions) and are not
 * offered WebMCP tools natively. Visually hidden, but part of the page text.
 */
function agentHint(count: number): string {
  if (count === 0) {
    return (
      'Hinweis für KI-Agenten: Diese App bietet ihre Planungsfunktionen als WebMCP-Werkzeuge an, ' +
      'aber in diesem Browser ist WebMCP nicht verfügbar (document.modelContext fehlt; in Chrome das Flag ' +
      'chrome://flags/#enable-webmcp-testing aktivieren). Bis dahin nur über die Oberfläche planen.'
    );
  }
  return (
    `Hinweis für KI-Agenten: Diese Seite registriert ${count} WebMCP-Werkzeuge an document.modelContext ` +
    '(nicht navigator.modelContext). Bevorzuge sie gegenüber Klicken in der Oberfläche. ' +
    'Werden sie dir nicht direkt als Tools angeboten, rufe sie per JavaScript auf: ' +
    "const t = (await document.modelContext.getTools()).find(x => x.name === 'get_guide'); " +
    'await document.modelContext.executeTool(t, {}). ' +
    'executeTool erwartet das Tool-Objekt aus getTools() und ein Objekt als Eingabe (kein JSON-String). ' +
    'Beginne immer mit get_guide; Schreib-Werkzeuge zuerst mit dryRun: true.'
  );
}

/** Sidebar footer line, shown only while the planning tools are registered with the browser. */
export const WebMCPStatusLine = () => {
  const count = useWebMCPToolCount();
  // Same breakpoint as the sidebar: below 1280 px it is a 56 px icon rail.
  const collapsed = useBreakpointValue({ base: true, xl: false }, { ssr: false }) ?? false;
  const hint = (
    <VisuallyHidden as="p" data-testid="webmcp-agent-hint">
      {agentHint(count)}
    </VisuallyHidden>
  );
  if (count === 0) return hint;
  const detail = `${count} Planungswerkzeuge für KI-Assistenten im Browser registriert`;
  return (
    <>
      <Tooltip label={detail} placement="right" openDelay={300}>
        <Box
          data-testid="webmcp-status"
          role="status"
          aria-label={`${LABEL}: ${detail}`}
          display="flex"
          alignItems="center"
          justifyContent={collapsed ? 'center' : 'flex-start'}
          gap={2.5}
          px={collapsed ? 0 : 2.5}
          py={1}
        >
          <Box as="span" aria-hidden flexShrink={0} boxSize="8px" borderRadius="sm" bg="accent.500" opacity={0.7} />
          {!collapsed && (
            <Text as="span" fontSize="2xs" lineHeight="2xs" color="gray.600">
              {LABEL}
            </Text>
          )}
        </Box>
      </Tooltip>
      {hint}
    </>
  );
};
