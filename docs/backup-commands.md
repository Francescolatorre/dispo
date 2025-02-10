# Documentation Backup Commands

Execute these commands in order to create backup branches before starting the documentation reorganization.

## 1. Ensure Clean Working Directory
```bash
# Check status
git status

# If there are changes, either commit or stash them
git add .
git commit -m "chore: save current changes before documentation backup"
```

## 2. Create Current Structure Backup
```bash
# Create and switch to backup branch
git checkout -b docs/current-structure

# Add all documentation files
git add cline_docs/

# Commit the backup
git commit -m "docs: backup current documentation structure"

# Tag the backup for easy reference
git tag -a docs-structure-backup-v1.0 -m "Complete documentation structure backup"
```

## 3. Create Memory Bank Backup
```bash
# Switch back to main
git checkout main

# Create Memory Bank backup branch
git checkout -b docs/memory-bank-backup

# Add Memory Bank files
git add cline_docs/productContext.md \
      cline_docs/activeContext.md \
      cline_docs/systemPatterns.md \
      cline_docs/techContext.md \
      cline_docs/progress.md

# Commit Memory Bank files
git commit -m "docs: backup Memory Bank files"

# Tag Memory Bank backup
git tag -a memory-bank-backup-v1.0 -m "Memory Bank files backup"
```

## 4. Verify Backups
```bash
# List branches
git branch

# List tags
git tag -l

# Verify current structure backup
git checkout docs/current-structure
ls -la cline_docs/

# Verify Memory Bank backup
git checkout docs/memory-bank-backup
ls -la cline_docs/
```

## 5. Return to Main Branch
```bash
# Switch back to main branch
git checkout main
```

## Verification Checklist

After executing the commands, verify:

1. Current Structure Backup
   - [ ] Branch `docs/current-structure` exists
   - [ ] All documentation files present
   - [ ] Tag `docs-structure-backup-v1.0` exists
   - [ ] Files are complete and readable

2. Memory Bank Backup
   - [ ] Branch `docs/memory-bank-backup` exists
   - [ ] All Memory Bank files present
   - [ ] Tag `memory-bank-backup-v1.0` exists
   - [ ] Files are complete and readable

3. General Checks
   - [ ] All branches accessible
   - [ ] All tags present
   - [ ] No uncommitted changes
   - [ ] Main branch clean

## Recovery Commands

If needed, restore from backups:

### Restore Complete Structure
```bash
# Restore entire documentation structure
git checkout docs/current-structure -- cline_docs/
```

### Restore Memory Bank Files
```bash
# Restore Memory Bank files only
git checkout docs/memory-bank-backup -- cline_docs/productContext.md \
                                      cline_docs/activeContext.md \
                                      cline_docs/systemPatterns.md \
                                      cline_docs/techContext.md \
                                      cline_docs/progress.md
```

## Next Steps

After successful backup verification:
1. Create reorganization branch
2. Begin documentation restructuring
3. Test Memory Bank functionality
4. Proceed with migration plan

Remember: These backups provide a safety net for the reorganization process. Do not delete the backup branches until the migration is complete and verified.