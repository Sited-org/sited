import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Booking {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  business_name: string;
  business_type: string;
  business_location: string;
  booking_date: string;
  booking_time: string;
  booking_type: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
  google_calendar_event_id: string | null;
  zoom_meeting_id: string | null;
  zoom_meeting_url: string | null;
  zoom_join_url: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarConfig {
  meeting_duration_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  available_days: number[];
  available_hours_start: string;
  available_hours_end: string;
  google_calendar_connected: boolean;
  google_calendar_id: string | null;
  timezone: string;
}

const defaultConfig: CalendarConfig = {
  meeting_duration_minutes: 20,
  buffer_before_minutes: 5,
  buffer_after_minutes: 10,
  available_days: [1, 2, 3, 4, 5],
  available_hours_start: "09:00",
  available_hours_end: "17:00",
  google_calendar_connected: false,
  google_calendar_id: null,
  timezone: "Australia/Sydney",
};

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [calendarConfig, setCalendarConfig] = useState<CalendarConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('booking_date', { ascending: true });

    if (error) {
      console.error('Error fetching bookings:', error);
    } else {
      setBookings((data || []) as Booking[]);
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'calendar_config')
      .maybeSingle();

    if (!error && data?.setting_value) {
      setCalendarConfig({ ...defaultConfig, ...(data.setting_value as unknown as CalendarConfig) });
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchBookings(), fetchConfig()]);
      setLoading(false);
    };
    load();
  }, [fetchBookings, fetchConfig]);

  const updateBookingStatus = async (id: string, status: string) => {
    const update: Record<string, unknown> = { status };
    if (status === 'cancelled') update.cancelled_at = new Date().toISOString();

    const { error } = await supabase.from('bookings').update(update).eq('id', id);
    if (error) {
      toast.error('Failed to update booking');
      return false;
    }
    toast.success(`Booking ${status}`);
    await fetchBookings();
    return true;
  };

  const updateCalendarConfig = async (config: Partial<CalendarConfig>) => {
    const newConfig = { ...calendarConfig, ...config };
    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('system_settings')
      .update({
        setting_value: newConfig as unknown as import('@/integrations/supabase/types').Json,
        updated_by: userData.user?.id,
      })
      .eq('setting_key', 'calendar_config');

    if (error) {
      toast.error('Failed to update calendar settings');
      return false;
    }
    setCalendarConfig(newConfig);
    toast.success('Calendar settings updated');
    return true;
  };

  return {
    bookings,
    calendarConfig,
    loading,
    updateBookingStatus,
    updateCalendarConfig,
    refreshBookings: fetchBookings,
  };
}
