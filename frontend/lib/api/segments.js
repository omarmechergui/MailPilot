export async function fetchSegments(page = 1, pageSize = 20) {
  const res = await fetch(`/api/v1/segments?page=${page}&pageSize=${pageSize}`);
  if (!res.ok) throw new Error('Failed to fetch segments');
  return res.json();
}

export async function getSegment(id) {
  const res = await fetch(`/api/v1/segments/${id}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'Failed to fetch segment');
  return json;
}

export async function createSegment(data) {
  const res = await fetch('/api/v1/segments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'Failed to create segment');
  return json;
}

export async function updateSegment(id, data) {
  const res = await fetch(`/api/v1/segments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'Failed to update segment');
  return json;
}

export async function deleteSegment(id) {
  const res = await fetch(`/api/v1/segments/${id}`, { method: 'DELETE' });
  if (res.status === 204) return true;
  const json = await res.json();
  throw new Error(json.error?.message || 'Failed to delete segment');
}

export async function previewSegment(data) {
  const res = await fetch('/api/v1/segments/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'Failed to preview segment');
  return json;
}

export async function applySegmentToCampaign(campaignId, segmentId) {
  const res = await fetch(`/api/v1/segments/apply/${campaignId}/${segmentId}`, {
    method: 'POST',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'Failed to apply segment');
  return json;
}
