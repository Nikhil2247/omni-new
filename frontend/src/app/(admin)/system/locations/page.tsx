'use client'

import { useEffect, useMemo, useState } from 'react'
import { Building2, Globe2, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  useAdminCities,
  useAdminCountries,
  useAdminStates,
  useCreateCity,
  useCreateCountry,
  useCreateState,
  useDeleteCity,
  useDeleteCountry,
  useDeleteState,
  useUpdateCity,
  useUpdateCountry,
  useUpdateState,
} from '@/hooks/queries/use-admin-catalog'
import { DataTable, FilterSelect, FormDialog, FormField, PageHeader, type DataColumn } from '@/components/dash'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AdminCity, AdminCountry, AdminState } from '@/lib/api/types/admin.types'

export default function SystemLocationsPage() {
  return (
    <div className="space-y-3">
      <PageHeader title="Locations" />
      <Tabs defaultValue="cities" className="space-y-3">
        <TabsList>
          <TabsTrigger value="cities">Cities</TabsTrigger>
          <TabsTrigger value="states">States</TabsTrigger>
          <TabsTrigger value="countries">Countries</TabsTrigger>
        </TabsList>
        <TabsContent value="cities">
          <CitiesTab />
        </TabsContent>
        <TabsContent value="states">
          <StatesTab />
        </TabsContent>
        <TabsContent value="countries">
          <CountriesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ActiveField({ checked, onChange, hint }: { checked: boolean; onChange: (v: boolean) => void; hint: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div>
        <p className="text-sm font-medium">Active</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

// ─── Cities ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50

function CitiesTab() {
  const [query, setQuery] = useState('')
  const [stateId, setStateId] = useState('all')
  const [page, setPage] = useState(1)

  useEffect(() => setPage(1), [query, stateId])

  const params = useMemo(
    () => ({ query: query.trim() || undefined, stateId: stateId === 'all' ? undefined : stateId, page, limit: PAGE_SIZE }),
    [query, stateId, page],
  )
  const { data, isLoading, isError, refetch } = useAdminCities(params)
  const { data: states } = useAdminStates()
  const createCity = useCreateCity()
  const updateCity = useUpdateCity()
  const deleteCity = useDeleteCity()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AdminCity | null>(null)
  const [name, setName] = useState('')
  const [formState, setFormState] = useState('')
  const [isActive, setIsActive] = useState(true)

  const openCreate = () => {
    setEditing(null)
    setName('')
    setFormState(stateId !== 'all' ? stateId : '')
    setIsActive(true)
    setOpen(true)
  }
  const openEdit = (city: AdminCity) => {
    setEditing(city)
    setName(city.name)
    setFormState(city.stateId)
    setIsActive(city.isActive)
    setOpen(true)
  }

  const rows = data?.data ?? []
  const stateOptions = states ?? []

  const columns: DataColumn<AdminCity>[] = [
    { id: 'name', header: 'City', label: 'City', cell: (c) => <span className="text-sm font-medium">{c.name}</span>, sortValue: (c) => c.name.toLowerCase(), exportValue: (c) => c.name },
    { id: 'state', header: 'State', label: 'State', cell: (c) => <span className="text-sm">{c.state?.name ?? '-'}</span>, exportValue: (c) => c.state?.name ?? '' },
    { id: 'country', header: 'Country', label: 'Country', cell: (c) => <span className="text-sm">{c.state?.country?.name ?? '-'}</span>, exportValue: (c) => c.state?.country?.name ?? '' },
    { id: 'used', header: 'Used by', label: 'Used by', cell: (c) => <span className="text-sm tabular-nums text-muted-foreground">{c._count?.addresses ?? 0} addresses</span>, sortValue: (c) => c._count?.addresses ?? 0, exportValue: (c) => c._count?.addresses ?? 0 },
    {
      id: 'active',
      header: 'Active',
      label: 'Active',
      cell: (c) => (
        <Switch
          checked={c.isActive}
          aria-label={`${c.name} active`}
          disabled={updateCity.isPending}
          onCheckedChange={(checked) => updateCity.mutate({ id: c.id, payload: { isActive: checked } })}
        />
      ),
      exportValue: (c) => (c.isActive ? 'Yes' : 'No'),
    },
  ]

  return (
    <>
      <DataTable
        data={rows}
        columns={columns}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        search={{ value: query, onChange: setQuery, placeholder: 'Search cities' }}
        filters={
          <FilterSelect
            label="State"
            value={stateId}
            onChange={setStateId}
            options={stateOptions.map((s) => ({ value: s.id, label: s.name }))}
          />
        }
        toolbarRight={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1 size-4" />
            Add city
          </Button>
        }
        rowActions={(city) => {
          const used = city._count?.addresses ?? 0
          return [
            { label: 'Edit city', icon: Pencil, onClick: () => openEdit(city) },
            {
              label: used > 0 ? 'Cannot delete: in use (deactivate instead)' : 'Delete city',
              icon: Trash2,
              danger: true,
              disabled: used > 0,
              confirm: { title: `Delete ${city.name}?`, description: 'This cannot be undone.', confirmLabel: 'Delete city' },
              onClick: () => deleteCity.mutateAsync(city.id),
            },
          ]
        }}
        serverPagination={{
          page: data?.meta?.page ?? page,
          pageSize: PAGE_SIZE,
          total: data?.meta?.total ?? rows.length,
          onPageChange: setPage,
        }}
        emptyTitle="No cities found"
        emptyIcon={MapPin}
        exportFilename="cities"
      />

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? `Edit ${editing.name}` : 'Add city'}
        description="Cities appear in vendor addresses, city pickers and the public city pages."
        submitLabel={editing ? 'Save changes' : 'Add city'}
        canSubmit={name.trim().length >= 2 && !!formState}
        loading={createCity.isPending || updateCity.isPending}
        onSubmit={async () => {
          const payload = { name: name.trim(), stateId: formState, isActive }
          if (editing) await updateCity.mutateAsync({ id: editing.id, payload })
          else await createCity.mutateAsync(payload)
        }}
      >
        <FormField label="City name" htmlFor="city-name">
          <Input id="city-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="State">
          <Select value={formState} onValueChange={setFormState}>
            <SelectTrigger>
              <SelectValue placeholder="Select a state" />
            </SelectTrigger>
            <SelectContent>
              {stateOptions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                  {s.country?.name ? ` (${s.country.name})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <ActiveField checked={isActive} onChange={setIsActive} hint="Inactive cities are hidden from pickers." />
      </FormDialog>
    </>
  )
}

// ─── States ──────────────────────────────────────────────────────────────────

function StatesTab() {
  const [countryId, setCountryId] = useState('all')
  const { data: countries } = useAdminCountries()
  const { data, isLoading, isError, refetch } = useAdminStates(countryId === 'all' ? undefined : countryId)
  const createState = useCreateState()
  const updateState = useUpdateState()
  const deleteState = useDeleteState()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AdminState | null>(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [formCountry, setFormCountry] = useState('')
  const [isActive, setIsActive] = useState(true)

  const openCreate = () => {
    setEditing(null)
    setName('')
    setCode('')
    setFormCountry(countryId !== 'all' ? countryId : '')
    setIsActive(true)
    setOpen(true)
  }
  const openEdit = (state: AdminState) => {
    setEditing(state)
    setName(state.name)
    setCode(state.code ?? '')
    setFormCountry(state.countryId)
    setIsActive(state.isActive)
    setOpen(true)
  }

  const rows = data ?? []
  const countryOptions = countries ?? []

  const columns: DataColumn<AdminState>[] = [
    { id: 'name', header: 'State', label: 'State', cell: (s) => <span className="text-sm font-medium">{s.name}</span>, sortValue: (s) => s.name.toLowerCase(), exportValue: (s) => s.name },
    { id: 'code', header: 'Code', label: 'Code', cell: (s) => <span className="text-sm text-muted-foreground">{s.code ?? '-'}</span>, exportValue: (s) => s.code ?? '' },
    { id: 'country', header: 'Country', label: 'Country', cell: (s) => <span className="text-sm">{s.country?.name ?? '-'}</span>, exportValue: (s) => s.country?.name ?? '' },
    { id: 'cities', header: 'Cities', label: 'Cities', cell: (s) => <span className="text-sm tabular-nums">{s._count?.cities ?? 0}</span>, sortValue: (s) => s._count?.cities ?? 0, exportValue: (s) => s._count?.cities ?? 0 },
    {
      id: 'active',
      header: 'Active',
      label: 'Active',
      cell: (s) => (
        <Switch
          checked={s.isActive}
          aria-label={`${s.name} active`}
          disabled={updateState.isPending}
          onCheckedChange={(checked) => updateState.mutate({ id: s.id, payload: { isActive: checked } })}
        />
      ),
      exportValue: (s) => (s.isActive ? 'Yes' : 'No'),
    },
  ]

  return (
    <>
      <DataTable
        data={rows}
        columns={columns}
        rowKey={(s) => s.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        filters={
          <FilterSelect
            label="Country"
            value={countryId}
            onChange={setCountryId}
            options={countryOptions.map((c) => ({ value: c.id, label: c.name }))}
          />
        }
        toolbarRight={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1 size-4" />
            Add state
          </Button>
        }
        rowActions={(state) => {
          const cities = state._count?.cities ?? 0
          return [
            { label: 'Edit state', icon: Pencil, onClick: () => openEdit(state) },
            {
              label: cities > 0 ? 'Cannot delete: has cities' : 'Delete state',
              icon: Trash2,
              danger: true,
              disabled: cities > 0,
              confirm: { title: `Delete ${state.name}?`, description: 'This cannot be undone.', confirmLabel: 'Delete state' },
              onClick: () => deleteState.mutateAsync(state.id),
            },
          ]
        }}
        defaultPageSize={25}
        emptyTitle="No states found"
        emptyIcon={Building2}
        exportFilename="states"
      />

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? `Edit ${editing.name}` : 'Add state'}
        submitLabel={editing ? 'Save changes' : 'Add state'}
        canSubmit={name.trim().length >= 2 && !!formCountry}
        loading={createState.isPending || updateState.isPending}
        onSubmit={async () => {
          const payload = { name: name.trim(), code: code.trim() || null, countryId: formCountry, isActive }
          if (editing) await updateState.mutateAsync({ id: editing.id, payload })
          else await createState.mutateAsync(payload)
        }}
      >
        <FormField label="State name" htmlFor="state-name">
          <Input id="state-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Code" htmlFor="state-code" hint="Optional, e.g. PB">
          <Input id="state-code" maxLength={10} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        </FormField>
        <FormField label="Country">
          <Select value={formCountry} onValueChange={setFormCountry}>
            <SelectTrigger>
              <SelectValue placeholder="Select a country" />
            </SelectTrigger>
            <SelectContent>
              {countryOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <ActiveField checked={isActive} onChange={setIsActive} hint="Inactive states are hidden from pickers." />
      </FormDialog>
    </>
  )
}

// ─── Countries ───────────────────────────────────────────────────────────────

function CountriesTab() {
  const { data, isLoading, isError, refetch } = useAdminCountries()
  const createCountry = useCreateCountry()
  const updateCountry = useUpdateCountry()
  const deleteCountry = useDeleteCountry()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AdminCountry | null>(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [code2, setCode2] = useState('')
  const [dialCode, setDialCode] = useState('')
  const [currency, setCurrency] = useState('')
  const [isActive, setIsActive] = useState(true)

  const openCreate = () => {
    setEditing(null)
    setName('')
    setCode('')
    setCode2('')
    setDialCode('')
    setCurrency('')
    setIsActive(true)
    setOpen(true)
  }
  const openEdit = (country: AdminCountry) => {
    setEditing(country)
    setName(country.name)
    setCode(country.code)
    setCode2(country.code2)
    setDialCode(country.dialCode ?? '')
    setCurrency(country.currency ?? '')
    setIsActive(country.isActive)
    setOpen(true)
  }

  const rows = data ?? []

  const columns: DataColumn<AdminCountry>[] = [
    { id: 'name', header: 'Country', label: 'Country', cell: (c) => <span className="text-sm font-medium">{c.name}</span>, sortValue: (c) => c.name.toLowerCase(), exportValue: (c) => c.name },
    { id: 'codes', header: 'ISO codes', label: 'ISO codes', cell: (c) => <span className="text-sm text-muted-foreground">{c.code2} / {c.code}</span>, exportValue: (c) => `${c.code2}/${c.code}` },
    { id: 'dial', header: 'Dial code', label: 'Dial code', cell: (c) => <span className="text-sm">{c.dialCode ?? '-'}</span>, exportValue: (c) => c.dialCode ?? '' },
    { id: 'currency', header: 'Currency', label: 'Currency', cell: (c) => <span className="text-sm">{c.currency ?? '-'}</span>, exportValue: (c) => c.currency ?? '' },
    { id: 'states', header: 'States', label: 'States', cell: (c) => <span className="text-sm tabular-nums">{c._count?.states ?? 0}</span>, sortValue: (c) => c._count?.states ?? 0, exportValue: (c) => c._count?.states ?? 0 },
    {
      id: 'active',
      header: 'Active',
      label: 'Active',
      cell: (c) => (
        <Switch
          checked={c.isActive}
          aria-label={`${c.name} active`}
          disabled={updateCountry.isPending}
          onCheckedChange={(checked) => updateCountry.mutate({ id: c.id, payload: { isActive: checked } })}
        />
      ),
      exportValue: (c) => (c.isActive ? 'Yes' : 'No'),
    },
  ]

  return (
    <>
      <DataTable
        data={rows}
        columns={columns}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        toolbarRight={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1 size-4" />
            Add country
          </Button>
        }
        rowActions={(country) => {
          const states = country._count?.states ?? 0
          return [
            { label: 'Edit country', icon: Pencil, onClick: () => openEdit(country) },
            {
              label: states > 0 ? 'Cannot delete: has states' : 'Delete country',
              icon: Trash2,
              danger: true,
              disabled: states > 0,
              confirm: { title: `Delete ${country.name}?`, description: 'This cannot be undone.', confirmLabel: 'Delete country' },
              onClick: () => deleteCountry.mutateAsync(country.id),
            },
          ]
        }}
        defaultPageSize={25}
        emptyTitle="No countries found"
        emptyIcon={Globe2}
        exportFilename="countries"
      />

      <FormDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? `Edit ${editing.name}` : 'Add country'}
        submitLabel={editing ? 'Save changes' : 'Add country'}
        canSubmit={name.trim().length >= 2 && code.trim().length === 3 && code2.trim().length === 2}
        loading={createCountry.isPending || updateCountry.isPending}
        onSubmit={async () => {
          const payload = {
            name: name.trim(),
            code: code.trim().toUpperCase(),
            code2: code2.trim().toUpperCase(),
            dialCode: dialCode.trim() || null,
            currency: currency.trim().toUpperCase() || null,
            isActive,
          }
          if (editing) await updateCountry.mutateAsync({ id: editing.id, payload })
          else await createCountry.mutateAsync(payload)
        }}
      >
        <FormField label="Country name" htmlFor="country-name">
          <Input id="country-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="ISO code (3 letters)" htmlFor="country-code" hint="e.g. IND">
            <Input id="country-code" maxLength={3} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          </FormField>
          <FormField label="ISO code (2 letters)" htmlFor="country-code2" hint="e.g. IN">
            <Input id="country-code2" maxLength={2} value={code2} onChange={(e) => setCode2(e.target.value.toUpperCase())} />
          </FormField>
          <FormField label="Dial code" htmlFor="country-dial" hint="e.g. +91">
            <Input id="country-dial" value={dialCode} onChange={(e) => setDialCode(e.target.value)} />
          </FormField>
          <FormField label="Currency" htmlFor="country-currency" hint="e.g. INR">
            <Input id="country-currency" maxLength={3} value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} />
          </FormField>
        </div>
        <ActiveField checked={isActive} onChange={setIsActive} hint="Inactive countries are hidden from pickers." />
      </FormDialog>
    </>
  )
}
