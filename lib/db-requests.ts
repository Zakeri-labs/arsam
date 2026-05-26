import fs from 'fs';
import path from 'path';

export interface RequestFile {
  name: string;
  size: number; // in bytes
}

export interface ServiceRequest {
  id: string;
  name: string;
  phone: string;
  description: string;
  serviceTitle: string;
  files: RequestFile[];
  createdAt: string; // ISO date string
}

const REQ_PATH = path.join(process.cwd(), 'lib', 'requests.json');

export function getRequests(): ServiceRequest[] {
  try {
    if (fs.existsSync(REQ_PATH)) {
      const data = fs.readFileSync(REQ_PATH, 'utf8');
      return JSON.parse(data) as ServiceRequest[];
    }
  } catch (error) {
    console.error('Error reading requests DB:', error);
  }
  return [];
}

export function saveRequests(requests: ServiceRequest[]): boolean {
  try {
    const dir = path.dirname(REQ_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(REQ_PATH, JSON.stringify(requests, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Failed to save requests DB:', error);
    return false;
  }
}

export function addRequest(request: Omit<ServiceRequest, 'id' | 'createdAt'>): ServiceRequest {
  const requests = getRequests();
  const newRequest: ServiceRequest = {
    ...request,
    id: 'req_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36),
    createdAt: new Date().toISOString()
  };

  requests.unshift(newRequest); // Add to beginning (latest first)
  saveRequests(requests);
  return newRequest;
}

export function deleteRequest(id: string): boolean {
  const requests = getRequests();
  const filtered = requests.filter(r => r.id !== id);
  if (filtered.length === requests.length) return false;
  return saveRequests(filtered);
}
