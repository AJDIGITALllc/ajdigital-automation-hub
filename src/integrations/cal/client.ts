/**
 * Cal.com API Client
 * 
 * Node.js/TypeScript client for Cal.com API v2
 * https://cal.com/docs/api-reference/v2/introduction
 */

const CAL_API_KEY = process.env.CAL_API_KEY ?? '';
const CAL_API_BASE_URL = process.env.CAL_API_BASE_URL ?? 'https://api.cal.com';
const CAL_API_VERSION = process.env.CAL_API_VERSION ?? '2024-01-01';

/**
 * Generic Cal.com API request
 */
async function calRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  if (!CAL_API_KEY) {
    throw new Error('CAL_API_KEY environment variable is required');
  }

  const url = `${CAL_API_BASE_URL}${path}`;
  
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${CAL_API_KEY}`,
      'Content-Type': 'application/json',
      'cal-api-version': CAL_API_VERSION,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Cal API error ${res.status} (${res.statusText}): ${body}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Cal.com Event Type (simplified response shape)
 */
export interface CalEventType {
  id: number;
  title: string;
  slug: string;
  description?: string;
  lengthInMinutes: number;
  lengthInMinutesOptions?: number[];
  hidden?: boolean;
  metadata?: Record<string, any>;
  [key: string]: any;
}

/**
 * Cal.com Booking (simplified response shape)
 */
export interface CalBooking {
  id: number;
  uid: string;
  eventTypeId: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: 'accepted' | 'pending' | 'cancelled' | 'rejected';
  attendees: Array<{
    name: string;
    email: string;
    timeZone: string;
  }>;
  [key: string]: any;
}

/**
 * Cal.com API client
 */
export const CalApi = {
  /**
   * Get event type by slug
   * https://cal.com/docs/api-reference/v2/event-types/find-all-event-types
   */
  async getEventTypeBySlug(slug: string): Promise<CalEventType | undefined> {
    const response = await calRequest<{ data: CalEventType[] }>(
      `/v2/event-types?slug=${encodeURIComponent(slug)}`
    );
    
    return response.data?.[0];
  },

  /**
   * List all event types
   * https://cal.com/docs/api-reference/v2/event-types/find-all-event-types
   */
  async listEventTypes(): Promise<CalEventType[]> {
    const response = await calRequest<{ data: CalEventType[] }>('/v2/event-types');
    return response.data ?? [];
  },

  /**
   * Create a new event type
   * https://cal.com/docs/api-reference/v2/event-types/create-an-event-type
   */
  async createEventType(payload: {
    title: string;
    slug: string;
    description?: string;
    lengthInMinutes: number;
    lengthInMinutesOptions?: number[];
    hidden?: boolean;
    metadata?: Record<string, any>;
    [key: string]: any;
  }): Promise<CalEventType> {
    const response = await calRequest<{ data: CalEventType }>('/v2/event-types', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    return response.data;
  },

  /**
   * Update an existing event type
   * https://cal.com/docs/api-reference/v2/event-types/update-an-event-type
   */
  async updateEventType(
    id: number,
    payload: {
      title?: string;
      slug?: string;
      description?: string;
      lengthInMinutes?: number;
      lengthInMinutesOptions?: number[];
      hidden?: boolean;
      metadata?: Record<string, any>;
      [key: string]: any;
    }
  ): Promise<CalEventType> {
    const response = await calRequest<{ data: CalEventType }>(`/v2/event-types/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    
    return response.data;
  },

  /**
   * Delete an event type
   * https://cal.com/docs/api-reference/v2/event-types/delete-an-event-type
   */
  async deleteEventType(id: number): Promise<void> {
    await calRequest<void>(`/v2/event-types/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Create a booking programmatically
   * https://cal.com/docs/api-reference/v2/bookings/create-a-booking
   */
  async createBooking(payload: {
    eventTypeId: number;
    start: string; // ISO 8601
    end: string;   // ISO 8601
    attendees: Array<{
      name: string;
      email: string;
      timeZone: string;
    }>;
    meetingUrl?: string;
    metadata?: Record<string, any>;
    [key: string]: any;
  }): Promise<CalBooking> {
    const response = await calRequest<{ data: CalBooking }>('/v2/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    return response.data;
  },

  /**
   * Get booking by ID
   * https://cal.com/docs/api-reference/v2/bookings/get-a-booking
   */
  async getBooking(id: number): Promise<CalBooking> {
    const response = await calRequest<{ data: CalBooking }>(`/v2/bookings/${id}`);
    return response.data;
  },

  /**
   * Cancel a booking
   * https://cal.com/docs/api-reference/v2/bookings/cancel-a-booking
   */
  async cancelBooking(
    id: number,
    reason?: string
  ): Promise<CalBooking> {
    const response = await calRequest<{ data: CalBooking }>(`/v2/bookings/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    
    return response.data;
  },

  /**
   * Reschedule a booking
   * https://cal.com/docs/api-reference/v2/bookings/reschedule-a-booking
   */
  async rescheduleBooking(
    id: number,
    payload: {
      start: string; // ISO 8601
      end: string;   // ISO 8601
      reschedulingReason?: string;
    }
  ): Promise<CalBooking> {
    const response = await calRequest<{ data: CalBooking }>(`/v2/bookings/${id}/reschedule`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    return response.data;
  },
};

/**
 * Helper: Create booking from Whop purchase
 * 
 * Use this when a Whop purchase should auto-create a Cal booking
 */
export async function createBookingFromPurchase(input: {
  eventTypeId: number;
  start: string; // ISO 8601
  end: string;   // ISO 8601
  name: string;
  email: string;
  timeZone: string;
  metadata?: Record<string, any>;
}): Promise<CalBooking> {
  const booking = await CalApi.createBooking({
    eventTypeId: input.eventTypeId,
    start: input.start,
    end: input.end,
    attendees: [
      {
        name: input.name,
        email: input.email,
        timeZone: input.timeZone,
      },
    ],
    metadata: input.metadata,
  });

  console.log(`[Cal] Created booking ${booking.uid} for ${input.email}`);
  return booking;
}
