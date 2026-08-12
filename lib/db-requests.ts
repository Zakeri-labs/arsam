import { supabase } from './supabase';

export interface RequestFile {
  name: string;
  size: number; // in bytes
  url?: string; // Web accessible download URL
}

export interface ServiceRequest {
  id: string;
  name: string;
  phone: string;
  description: string;
  serviceTitle: string;
  files: RequestFile[];
  createdAt: string; // ISO date string
  queueNumber?: number | null; // Queue number for QMS requests
  source?: string; // 'web' | 'qms'
}

export async function getRequests(): Promise<ServiceRequest[]> {
  try {
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error reading requests DB from Supabase:', error);
      return [];
    }

    if (data) {
      return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        phone: row.phone,
        description: row.description,
        serviceTitle: row.service_title,
        files: row.files || [],
        createdAt: row.created_at,
        queueNumber: row.queue_number ?? null,
        source: row.source || 'web',
      }));
    }
  } catch (error) {
    console.error('Error reading requests DB:', error);
  }
  return [];
}

export async function addRequest(request: Omit<ServiceRequest, 'id' | 'createdAt'>): Promise<ServiceRequest> {
  const newRequest = {
    id: 'req_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36),
    name: request.name,
    phone: request.phone,
    description: request.description,
    service_title: request.serviceTitle,
    files: request.files,
    created_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabase.from('requests').insert([newRequest]);
    if (error) {
      console.error('Failed to add request to Supabase:', error);
      throw error;
    }
  } catch (err) {
    console.error('Exception in addRequest:', err);
    throw err;
  }

  return {
    ...request,
    id: newRequest.id,
    createdAt: newRequest.created_at,
  };
}

export async function deleteRequest(id: string): Promise<boolean> {
  try {
    const { error, count } = await supabase
      .from('requests')
      .delete({ count: 'exact' })
      .eq('id', id);

    if (error) {
      console.error('Failed to delete request from Supabase:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Exception in deleteRequest:', err);
    return false;
  }
}
