import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminService } from '@/lib/api/services/admin.service'
import { getApiErrorMessage } from '@/lib/api/error'
import { lookupKeys } from '@/hooks/queries/use-lookups'
import type {
  AdminCategoryInput,
  AdminCityInput,
  AdminCityListParams,
  AdminCountryInput,
  AdminStateInput,
  AdminVendorListParams,
} from '@/lib/api/types/admin.types'

/**
 * Admin data for vendors, categories and locations.
 * Every successful write also refreshes the public lookup caches (`lookups`), so the city and category pickers
 * across the app pick up the change without a reload.
 */
const keys = {
  vendors: (params: AdminVendorListParams) => ['admin-vendors', params] as const,
  vendorStats: () => ['admin-vendor-stats'] as const,
  categories: () => ['admin-categories'] as const,
  countries: () => ['admin-countries'] as const,
  states: (countryId?: string) => ['admin-states', countryId ?? 'all'] as const,
  cities: (params: AdminCityListParams) => ['admin-cities', params] as const,
}

function onFail(fallback: string) {
  return (error: unknown) => toast.error(getApiErrorMessage(error, fallback))
}

// ─── Vendors ─────────────────────────────────────────────────────────────────

export function useAdminVendors(params: AdminVendorListParams) {
  return useQuery({
    queryKey: keys.vendors(params),
    queryFn: () => adminService.listVendors(params),
    placeholderData: keepPreviousData,
  })
}

export function useAdminVendorStats() {
  return useQuery({ queryKey: keys.vendorStats(), queryFn: () => adminService.getVendorStats() })
}

export function useUpdateVendorStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminService.updateVendorStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] })
      queryClient.invalidateQueries({ queryKey: keys.vendorStats() })
      toast.success('Vendor status updated')
    },
    onError: onFail('Failed to update vendor'),
  })
}

export function useDeleteVendor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, permanent }: { id: string; permanent: boolean }) => adminService.deleteVendor(id, permanent),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] })
      queryClient.invalidateQueries({ queryKey: keys.vendorStats() })
      toast.success(variables.permanent ? 'Vendor permanently deleted' : 'Vendor archived and removed from the site')
    },
    onError: onFail('Failed to delete vendor'),
  })
}

// ─── Users ───────────────────────────────────────────────────────────────────

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('User deleted')
    },
    onError: onFail('Failed to delete user'),
  })
}

// ─── Categories ──────────────────────────────────────────────────────────────

export function useAdminCategories() {
  return useQuery({ queryKey: keys.categories(), queryFn: () => adminService.listCategories() })
}

function useRefreshCategories() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: keys.categories() })
    queryClient.invalidateQueries({ queryKey: lookupKeys.categories() })
  }
}

export function useCreateCategory() {
  const refresh = useRefreshCategories()
  return useMutation({
    mutationFn: (payload: AdminCategoryInput) => adminService.createCategory(payload),
    onSuccess: () => {
      refresh()
      toast.success('Category created')
    },
    onError: onFail('Failed to create category'),
  })
}

export function useUpdateCategory() {
  const refresh = useRefreshCategories()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<AdminCategoryInput> }) =>
      adminService.updateCategory(id, payload),
    onSuccess: () => {
      refresh()
      toast.success('Category updated')
    },
    onError: onFail('Failed to update category'),
  })
}

export function useDeleteCategory() {
  const refresh = useRefreshCategories()
  return useMutation({
    mutationFn: (id: string) => adminService.deleteCategory(id),
    onSuccess: () => {
      refresh()
      toast.success('Category deleted')
    },
    onError: onFail('Failed to delete category'),
  })
}

// ─── Locations ───────────────────────────────────────────────────────────────

export function useAdminCountries() {
  return useQuery({ queryKey: keys.countries(), queryFn: () => adminService.listCountries() })
}

export function useAdminStates(countryId?: string) {
  return useQuery({ queryKey: keys.states(countryId), queryFn: () => adminService.listStates(countryId) })
}

export function useAdminCities(params: AdminCityListParams) {
  return useQuery({
    queryKey: keys.cities(params),
    queryFn: () => adminService.listCities(params),
    placeholderData: keepPreviousData,
  })
}

function useRefreshLocations() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['admin-countries'] })
    queryClient.invalidateQueries({ queryKey: ['admin-states'] })
    queryClient.invalidateQueries({ queryKey: ['admin-cities'] })
    queryClient.invalidateQueries({ queryKey: lookupKeys.cities() })
  }
}

function useLocationMutation<TVars>(
  fn: (vars: TVars) => Promise<unknown>,
  success: string,
  failure: string,
) {
  const refresh = useRefreshLocations()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      refresh()
      toast.success(success)
    },
    onError: onFail(failure),
  })
}

export const useCreateCountry = () =>
  useLocationMutation((payload: AdminCountryInput) => adminService.createCountry(payload), 'Country added', 'Failed to add country')
export const useUpdateCountry = () =>
  useLocationMutation(
    ({ id, payload }: { id: string; payload: Partial<AdminCountryInput> }) => adminService.updateCountry(id, payload),
    'Country updated',
    'Failed to update country',
  )
export const useDeleteCountry = () =>
  useLocationMutation((id: string) => adminService.deleteCountry(id), 'Country deleted', 'Failed to delete country')

export const useCreateState = () =>
  useLocationMutation((payload: AdminStateInput) => adminService.createState(payload), 'State added', 'Failed to add state')
export const useUpdateState = () =>
  useLocationMutation(
    ({ id, payload }: { id: string; payload: Partial<AdminStateInput> }) => adminService.updateState(id, payload),
    'State updated',
    'Failed to update state',
  )
export const useDeleteState = () =>
  useLocationMutation((id: string) => adminService.deleteState(id), 'State deleted', 'Failed to delete state')

export const useCreateCity = () =>
  useLocationMutation((payload: AdminCityInput) => adminService.createCity(payload), 'City added', 'Failed to add city')
export const useUpdateCity = () =>
  useLocationMutation(
    ({ id, payload }: { id: string; payload: Partial<AdminCityInput> }) => adminService.updateCity(id, payload),
    'City updated',
    'Failed to update city',
  )
export const useDeleteCity = () =>
  useLocationMutation((id: string) => adminService.deleteCity(id), 'City deleted', 'Failed to delete city')
