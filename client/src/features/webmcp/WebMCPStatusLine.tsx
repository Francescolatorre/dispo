import { Box, Text, Tooltip, useBreakpointValue } from '@chakra-ui/react';
import { useWebMCPToolCount } from './status';

const LABEL = 'KI-Werkzeuge aktiv (WebMCP)';

/** Sidebar footer line, shown only while the planning tools are registered with the browser. */
export const WebMCPStatusLine = () => {
  const count = useWebMCPToolCount();
  // Same breakpoint as the sidebar: below 1280 px it is a 56 px icon rail.
  const collapsed = useBreakpointValue({ base: true, xl: false }, { ssr: false }) ?? false;
  if (count === 0) return null;
  const detail = `${count} Planungswerkzeuge für KI-Assistenten im Browser registriert`;
  return (
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
  );
};
