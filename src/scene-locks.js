export function lockTarget(project, id) {
  if (id === 'reference:plan') return project.reference;
  if (id === 'surface:floor') return project;
  return project.objects.find(o => o.id === id) || project.walls.find(w => w.id === id) || project.walls.flatMap(w => w.openings).find(o => o.id === id);
}

export function isLocked(project, id) {
  const parent = project.walls.find(w => w.openings.some(o => o.id === id));
  return !!(lockTarget(project, id)?.locked || parent?.locked);
}
