import { Flex } from '@chakra-ui/react';
import { PlanningBoard } from '../features/board';

/** Fills the viewport (main has 16 px top / 24 px bottom padding) so only the board scrolls. */
export const PlanningPage = () => (
  <Flex direction="column" h="calc(100vh - 40px)" minH="480px">
    <PlanningBoard />
  </Flex>
);
