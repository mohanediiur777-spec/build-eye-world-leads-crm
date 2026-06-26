'use client';

import useSWR from 'swr';
import { getLeads, getAgents, getCallLogs, getTeams, Lead, Agent, CallLog, Team } from '@/lib/googleSheets';

const fetcher = async (fetchFn: () => Promise<any>) => {
  const result = await fetchFn();
  return result.data;
};

export function useLeads() {
  const { data, error, isLoading, mutate } = useSWR(
    'leads',
    () => fetcher(() => getLeads()),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
      focusThrottleInterval: 300000,
    }
  );

  return {
    leads: data || [],
    isLoading,
    isError: !!error,
    mutate
  };
}

export function useAgents() {
  const { data, error, isLoading, mutate } = useSWR(
    'agents',
    () => fetcher(() => getAgents()),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
      focusThrottleInterval: 300000,
    }
  );

  return {
    agents: data || [],
    isLoading,
    isError: !!error,
    mutate
  };
}

export function useCallLogs() {
  const { data, error, isLoading, mutate } = useSWR(
    'callLogs',
    () => fetcher(() => getCallLogs()),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
      focusThrottleInterval: 300000,
    }
  );

  return {
    callLogs: data || [],
    isLoading,
    isError: !!error,
    mutate
  };
}

export function useTeams() {
  const { data, error, isLoading, mutate } = useSWR(
    'teams',
    () => fetcher(() => getTeams()),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
      focusThrottleInterval: 300000,
    }
  );

  return {
    teams: data || [],
    isLoading,
    isError: !!error,
    mutate
  };
}
