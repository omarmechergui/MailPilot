export async function fetchCampaigns(page = 1, pageSize = 20, status = '') {
  const url = new URL('/api/v1/campaigns', window.location.origin);
  url.searchParams.append('page', page);
  url.searchParams.append('pageSize', pageSize);
  if (status) {
    url.searchParams.append('status', status);
  }
  const res = await fetch(url.pathname + url.search);
  if (!res.ok) throw new Error('Failed to fetch campaigns');
  return res.json();
}

export async function createCampaign(data) {
  const res = await fetch('/api/v1/campaigns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'Failed to create campaign');
  return json;
}

export async function getCampaign(id) {
  const res = await fetch(`/api/v1/campaigns/${id}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'Failed to fetch campaign');
  return json;
}

export async function updateCampaign(id, data) {
  const res = await fetch(`/api/v1/campaigns/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'Failed to update campaign');
  return json;
}

export async function deleteCampaign(id) {
  const res = await fetch(`/api/v1/campaigns/${id}`, {
    method: 'DELETE',
  });
  if (res.status === 204) return true;
  const json = await res.json();
  throw new Error(json.error?.message || 'Failed to delete campaign');
}

export async function getEligibleContacts(id, page = 1, search = '') {
  const url = new URL(`/api/v1/campaigns/${id}/eligible-contacts`, window.location.origin);
  url.searchParams.append('page', page);
  if (search) url.searchParams.append('search', search);
  const res = await fetch(url.pathname + url.search);
  if (!res.ok) throw new Error('Failed to fetch eligible contacts');
  return res.json();
}

export async function getRecipients(id, page = 1) {
  const res = await fetch(`/api/v1/campaigns/${id}/recipients?page=${page}`);
  if (!res.ok) throw new Error('Failed to fetch recipients');
  return res.json();
}

export async function addRecipients(id, contactIds) {
  const res = await fetch(`/api/v1/campaigns/${id}/recipients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contactIds }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'Failed to add recipients');
  return json;
}

export async function removeRecipient(id, recipientId) {
  const res = await fetch(`/api/v1/campaigns/${id}/recipients/${recipientId}`, {
    method: 'DELETE',
  });
  if (res.status === 204) return true;
  const json = await res.json();
  throw new Error(json.error?.message || 'Failed to remove recipient');
}

export async function clearRecipients(id) {
  const res = await fetch(`/api/v1/campaigns/${id}/recipients`, {
    method: 'DELETE',
  });
  if (res.status === 204) return true;
  const json = await res.json();
  throw new Error(json.error?.message || 'Failed to clear recipients');
}

export async function sendCampaign(id) {
  const res = await fetch(`/api/v1/campaigns/${id}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirm: true }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'Failed to send campaign');
  return json;
}

export async function getCampaignStatus(id) {
  const res = await fetch(`/api/v1/campaigns/${id}/status`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'Failed to fetch campaign status');
  return json;
}
