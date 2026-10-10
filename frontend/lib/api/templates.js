export async function fetchTemplates(page = 1, pageSize = 20) {
  const res = await fetch(`/api/v1/templates?page=${page}&pageSize=${pageSize}`);
  if (!res.ok) throw new Error('Failed to fetch templates');
  return res.json();
}

export async function getTemplate(id) {
  const res = await fetch(`/api/v1/templates/${id}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'Failed to fetch template');
  return json;
}

export async function createTemplate(data) {
  const res = await fetch('/api/v1/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'Failed to create template');
  return json;
}

export async function updateTemplate(id, data) {
  const res = await fetch(`/api/v1/templates/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'Failed to update template');
  return json;
}

export async function deleteTemplate(id) {
  const res = await fetch(`/api/v1/templates/${id}`, { method: 'DELETE' });
  if (res.status === 204) return true;
  const json = await res.json();
  throw new Error(json.error?.message || 'Failed to delete template');
}
