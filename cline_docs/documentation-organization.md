# Documentation Organization Plan

## Current Analysis

### Core Documentation (Keep & Update)
1. **Project Context**
   - ✅ productContext.md (Active)
   - ✅ systemPatterns.md (Active)
   - ✅ techContext.md (Active)
   - ❌ Projektbeschreibung.md (Redundant with productContext.md)

2. **Active Development**
   - ✅ activeContext.md (Active, frequently updated)
   - ✅ implementation-sequence.md (Active)
   - ✅ backlog-prioritization.md (Active)
   - ✅ testing-strategy.md (Active)
   - ❌ implementation-plan.md (Superseded by implementation-sequence.md)
   - ❌ implementation-progress.md (Merge into activeContext.md)

3. **Technical Specifications**
   - ✅ employee-management-spec.md (Active)
   - ✅ employee-system-migration.md (Active)
   - ✅ phase1-readiness.md (Active)
   - ❌ ressourcenplanung-technical-spec.md (Outdated)
   - ❌ ressourcenplanung-technical-spec-revised.md (Merge into employee-management-spec.md)

### Feature Documentation (Review & Consolidate)
1. **Timeline Feature**
   - ✅ timeline-component-design.md (Active)
   - ✅ timeline-technical-overview.md (Active)
   - ❌ timeline-implementation-sequence.md (Merge into implementation-sequence.md)
   - ❌ timeline-implementation-status.md (Merge into activeContext.md)
   - ❌ timeline-mvp-plan.md (Outdated)
   - ❌ timeline-summary.md (Redundant)
   - ❌ timeline-test-plan.md (Merge into testing-strategy.md)
   - ❌ timeline-user-guide.md (Move to docs/guides/)

2. **Assignment System**
   - ❌ assignment-implementation-priorities.md (Merge into backlog-prioritization.md)
   - ❌ assignment-next-steps.md (Merge into activeContext.md)
   - ❌ assignment-workflow.md (Move to docs/guides/)
   - ❌ project-assignment-integration.md (Merge into employee-management-spec.md)

3. **Workload Management**
   - ❌ workload-validation.md (Move to docs/technical/)
   - ❌ workload-visualization-status.md (Merge into activeContext.md)
   - ❌ workload-visualization-tests.md (Merge into testing-strategy.md)

### Migration & Updates (Archive)
- ❌ mui-to-chakra-migration.md (Archive)
- ❌ phase1-chakra-migration.md (Archive)
- ❌ meta-model-plan.md (Archive)
- ❌ mvp-architecture.md (Archive)
- ❌ mvp-plan.md (Archive)

### Testing & Analysis (Consolidate)
- ❌ backend-analysis-summary.md (Merge into techContext.md)
- ❌ ErrorAnalysis.md (Archive after issues resolved)
- ❌ test-data.md (Move to docs/testing/)
- ❌ test-fixes.md (Merge into activeContext.md)
- ❌ demo-test-plan.md (Merge into testing-strategy.md)

## Proposed Directory Structure

```
docs/
├── core/                     # Core project documentation
│   ├── context/             # Project context and patterns
│   ├── architecture/        # System architecture
│   └── requirements/        # Requirements and specifications
│
├── technical/               # Technical documentation
│   ├── specs/              # Technical specifications
│   ├── migrations/         # Migration plans
│   └── analysis/           # Technical analysis
│
├── features/               # Feature documentation
│   ├── employee/           # Employee management
│   ├── timeline/           # Timeline feature
│   └── workload/           # Workload management
│
├── guides/                 # User and developer guides
│   ├── user/              # End-user documentation
│   └── dev/               # Developer guides
│
├── testing/               # Testing documentation
│   ├── strategy/          # Test strategies
│   ├── data/             # Test data
│   └── results/          # Test results and analysis
│
└── archive/              # Archived documentation
```

## Migration Plan

1. **Phase 1: Create Directory Structure**
   ```bash
   mkdir -p docs/{core/{context,architecture,requirements},technical/{specs,migrations,analysis},features/{employee,timeline,workload},guides/{user,dev},testing/{strategy,data,results},archive}
   ```

2. **Phase 2: Move Active Files**
   - Move core documentation to docs/core/
   - Move technical specs to docs/technical/specs/
   - Move feature docs to docs/features/
   - Move guides to docs/guides/
   - Move test documentation to docs/testing/

3. **Phase 3: Consolidate Content**
   - Merge redundant timeline documentation
   - Consolidate assignment system docs
   - Update workload management docs
   - Merge test-related content

4. **Phase 4: Archive Old Content**
   - Move completed migration docs to archive
   - Archive outdated MVP plans
   - Archive old analysis documents

## File Status Summary

### Keep & Update (12 files)
- activeContext.md
- implementation-sequence.md
- backlog-prioritization.md
- testing-strategy.md
- employee-management-spec.md
- employee-system-migration.md
- phase1-readiness.md
- productContext.md
- systemPatterns.md
- techContext.md
- timeline-component-design.md
- timeline-technical-overview.md

### Consolidate (15 files)
- timeline-implementation-sequence.md
- timeline-implementation-status.md
- timeline-test-plan.md
- assignment-implementation-priorities.md
- assignment-next-steps.md
- project-assignment-integration.md
- workload-visualization-status.md
- workload-visualization-tests.md
- backend-analysis-summary.md
- test-fixes.md
- demo-test-plan.md
- implementation-progress.md
- ressourcenplanung-technical-spec.md
- ressourcenplanung-technical-spec-revised.md
- timeline-summary.md

### Move (6 files)
- timeline-user-guide.md
- assignment-workflow.md
- workload-validation.md
- test-data.md
- userStories.md
- requirements.md

### Archive (8 files)
- mui-to-chakra-migration.md
- phase1-chakra-migration.md
- meta-model-plan.md
- mvp-architecture.md
- mvp-plan.md
- ErrorAnalysis.md
- timeline-mvp-plan.md
- Projektbeschreibung.md

## Next Steps

1. Create new directory structure
2. Move active files to appropriate locations
3. Begin consolidation of related content
4. Archive outdated documentation
5. Update all cross-references
6. Verify documentation integrity
7. Update documentation index