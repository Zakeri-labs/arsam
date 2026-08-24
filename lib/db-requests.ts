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
  queueName?: string; // e.g. 'جناب اماره' or counter name
  queueStatus?: 'waiting' | 'calling' | 'in_progress' | 'completed' | 'absent';
  calledAt?: string | null;   // when status changed to 'calling'
  servedAt?: string | null;   // when status changed to 'in_progress'
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
        queueName: row.queue_name || (row.source === 'qms' ? 'جناب اماره' : undefined),
        queueStatus: row.queue_status || (row.source === 'qms' ? 'waiting' : undefined),
        calledAt: row.called_at ?? null,
        servedAt: row.served_at ?? null,
      }));
    }
  } catch (error) {
    console.error('Error reading requests DB:', error);
  }
  return [];
}

/**
 * Fetch all requests (web + qms) that match a given phone number.
 * Used in QMS admin to show uploaded documents for a visitor.
 */
export async function getRequestsByPhone(phone: string): Promise<ServiceRequest[]> {
  try {
    // Normalize phone: try exact match and also without country code prefix
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .or(`phone.eq.${phone},phone.ilike.%${phone.replace(/^\+968\s?/, '')}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching requests by phone:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      description: row.description,
      serviceTitle: row.service_title,
      files: row.files || [],
      createdAt: row.created_at,
      queueNumber: row.queue_number ?? null,
      source: row.source || 'web',
      queueName: row.queue_name,
      queueStatus: row.queue_status,
      calledAt: row.called_at ?? null,
      servedAt: row.served_at ?? null,
    }));
  } catch (error) {
    console.error('Error in getRequestsByPhone:', error);
    return [];
  }
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

export async function updateRequestQueue(
  id: string,
  updates: { queueName?: string; queueStatus?: string }
): Promise<boolean> {
  try {
    const dbPayload: Record<string, any> = {};
    if (updates.queueName !== undefined)   dbPayload.queue_name   = updates.queueName;
    if (updates.queueStatus !== undefined) {
      dbPayload.queue_status = updates.queueStatus;
      // Record timestamps when status changes
      if (updates.queueStatus === 'calling')     dbPayload.called_at = new Date().toISOString();
      if (updates.queueStatus === 'in_progress') dbPayload.served_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('requests')
      .update(dbPayload)
      .eq('id', id);

    if (error) {
      console.error('Failed to update request queue in Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception in updateRequestQueue:', err);
    return false;
  }
}

export async function deleteRequest(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('requests')
      .delete({ count: 'exact' } as any)
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
