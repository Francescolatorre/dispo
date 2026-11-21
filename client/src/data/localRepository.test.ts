import { LocalRepository, STORAGE_KEY, type StorageLike } from './localRepository';
import { NotFoundError } from './repository';

class MemoryStorage implements StorageLike {
  map = new Map<string, string>();
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
}

const TODAY = '2026-11-21';

describe('LocalRepository', () => {
  it('seeds on first use and persists under the versioned key', async () => {
    const storage = new MemoryStorage();
    const repo = new LocalRepository({ storage, today: TODAY });
    expect(await repo.listEmployees()).toHaveLength(14);
    expect(STORAGE_KEY).toBe('dispo.v1');
    const stored = JSON.parse(storage.getItem(STORAGE_KEY) as string);
    expect(stored.version).toBe(1);
    expect(stored.employees).toHaveLength(14);
  });

  it('loads existing data instead of reseeding', async () => {
    const storage = new MemoryStorage();
    const first = new LocalRepository({ storage, today: TODAY });
    await first.createEmployee({ name: 'Neu', role: 'QA', seniority: 'junior', capacity: 1, active: true });
    const second = new LocalRepository({ storage, today: TODAY });
    expect((await second.listEmployees()).map((e) => e.name)).toContain('Neu');
  });

  it('reseeds when the stored payload is corrupt', async () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, '{not json');
    const repo = new LocalRepository({ storage, today: TODAY });
    expect(await repo.listProjects()).toHaveLength(7);
  });

  it('works without storage and reset() reseeds', async () => {
    const repo = new LocalRepository({ storage: null, today: TODAY });
    await repo.deleteEmployee('emp-01');
    expect(await repo.listEmployees()).toHaveLength(13);
    await repo.reset();
    expect(await repo.listEmployees()).toHaveLength(14);
  });

  it('returns copies, not internal references', async () => {
    const repo = new LocalRepository({ storage: null, today: TODAY });
    const [e] = await repo.listEmployees();
    e.name = 'mutated';
    expect((await repo.listEmployees())[0].name).not.toBe('mutated');
  });

  it('supports CRUD with generated ids', async () => {
    let n = 0;
    const repo = new LocalRepository({ storage: null, today: TODAY, generateId: (p) => `${p}-new-${(n += 1)}` });
    const p = await repo.createProject({ name: 'X', color: 'cyan', start: '2026-12-01', end: '2026-12-31', status: 'planned' });
    expect(p.id).toBe('prj-new-1');
    const a = await repo.createAssignment({
      employeeId: 'emp-01',
      projectId: p.id,
      start: '2026-12-01',
      end: '2026-12-11',
      allocation: 20,
      role: 'Reviewer',
    });
    expect(a.id).toBe('asg-new-2');
    expect(await repo.updateAssignment(a.id, { allocation: 30, start: undefined })).toMatchObject({
      allocation: 30,
      start: '2026-12-01',
      role: 'Reviewer',
    });
    const cleared = await repo.updateAssignment(a.id, { role: null });
    expect('role' in cleared).toBe(false);
    expect(await repo.updateProject(p.id, { status: 'active' })).toMatchObject({ status: 'active', name: 'X' });
    expect(await repo.updateEmployee('emp-01', { capacity: 0.5 })).toMatchObject({ id: 'emp-01', capacity: 0.5 });
    await repo.deleteAssignment(a.id);
    expect(await repo.listAssignments({ projectId: p.id })).toEqual([]);
  });

  it('filters assignments by employee, project and overlapping date range', async () => {
    const repo = new LocalRepository({ storage: null, today: TODAY });
    const all = await repo.listAssignments();
    expect(all).toHaveLength(30);
    const anna = await repo.listAssignments({ employeeId: 'emp-01' });
    expect(anna.every((a) => a.employeeId === 'emp-01')).toBe(true);
    const audit = await repo.listAssignments({ projectId: 'prj-03' });
    expect(audit.every((a) => a.projectId === 'prj-03')).toBe(true);
    // Far future: only long-running assignments overlap.
    const future = await repo.listAssignments({ from: '2027-03-01', to: '2027-03-07' });
    expect(future.length).toBeGreaterThan(0);
    expect(future.every((a) => a.start <= '2027-03-07' && a.end >= '2027-03-01')).toBe(true);
    expect(await repo.listAssignments({ to: '2020-01-01' })).toEqual([]);
  });

  it('cascades assignment deletion when deleting employees and projects', async () => {
    const repo = new LocalRepository({ storage: null, today: TODAY });
    await repo.deleteEmployee('emp-04');
    expect(await repo.listAssignments({ employeeId: 'emp-04' })).toEqual([]);
    const before = (await repo.listAssignments()).length;
    const prj2 = (await repo.listAssignments({ projectId: 'prj-02' })).length;
    await repo.deleteProject('prj-02');
    expect(await repo.listAssignments()).toHaveLength(before - prj2);
  });

  it('throws NotFoundError for unknown ids', async () => {
    const repo = new LocalRepository({ storage: null, today: TODAY });
    await expect(repo.updateEmployee('nope', { name: 'x' })).rejects.toBeInstanceOf(NotFoundError);
    await expect(repo.deleteProject('nope')).rejects.toBeInstanceOf(NotFoundError);
    await expect(repo.deleteAssignment('nope')).rejects.toThrow('assignment "nope" not found');
  });
});
