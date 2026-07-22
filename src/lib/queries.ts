import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type RunCreateRequest, type RunStatus, type RunView } from '@/lib/api'

const FINAL_STATUSES = new Set<RunStatus>(['completed', 'failed', 'cancelled'])

export function useConfig() {
  return useQuery({ queryKey: ['config'], queryFn: api.getConfig, staleTime: 5 * 60 * 1000 })
}

export function useRuns(options?: { refetch?: boolean }) {
  return useQuery({
    queryKey: ['runs'],
    queryFn: api.listRuns,
    refetchInterval: options?.refetch ? 5000 : false,
  })
}

export function useRun(runId: string | undefined) {
  return useQuery({
    queryKey: ['runs', runId],
    queryFn: () => api.getRun(runId!),
    enabled: !!runId,
    retry: false,
    refetchInterval: (query) => {
      const data = query.state.data as RunView | undefined
      if (!data || FINAL_STATUSES.has(data.status)) return false
      return 1500
    },
  })
}

export function useCreateRun() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: RunCreateRequest) => api.createRun(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['runs'] }),
  })
}

export function useCancelRun(runId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.cancelRun(runId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['runs', runId] })
      queryClient.invalidateQueries({ queryKey: ['runs'] })
    },
  })
}
