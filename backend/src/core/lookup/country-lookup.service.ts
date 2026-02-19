// ============================================================================
// COUNTRY LOOKUP SERVICE - Cached Country/State/City Data
// ============================================================================
// Provides fast lookup for geographic data with in-memory caching
// ============================================================================

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface CountryLookup {
  id: string;
  name: string;
  code: string;
  dialCode: string;
}

export interface StateLookup {
  id: string;
  name: string;
  code: string;
  countryId: string;
}

export interface CityLookup {
  id: string;
  name: string;
  stateId: string;
}

@Injectable()
export class CountryLookupService implements OnModuleInit {
  private readonly logger = new Logger(CountryLookupService.name);

  private countries: Map<string, CountryLookup> = new Map();
  private countriesByCode: Map<string, CountryLookup> = new Map();
  private states: Map<string, StateLookup> = new Map();
  private statesByCountry: Map<string, StateLookup[]> = new Map();
  private cities: Map<string, CityLookup> = new Map();
  private citiesByState: Map<string, CityLookup[]> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.loadAllData();
  }

  private async loadAllData(): Promise<void> {
    this.logger.log('Loading country/state/city lookup data...');

    try {
      // Load countries
      const countryRecords = await this.prisma.country.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });

      this.countries.clear();
      this.countriesByCode.clear();

      for (const country of countryRecords) {
        const lookup: CountryLookup = {
          id: country.id,
          name: country.name,
          code: country.code,
          dialCode: country.dialCode || '',
        };
        this.countries.set(country.id, lookup);
        this.countriesByCode.set(country.code.toUpperCase(), lookup);
      }

      // Load states
      const stateRecords = await this.prisma.state.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });

      this.states.clear();
      this.statesByCountry.clear();

      for (const state of stateRecords) {
        const lookup: StateLookup = {
          id: state.id,
          name: state.name,
          code: state.code || '',
          countryId: state.countryId,
        };
        this.states.set(state.id, lookup);

        const countryStates = this.statesByCountry.get(state.countryId) || [];
        countryStates.push(lookup);
        this.statesByCountry.set(state.countryId, countryStates);
      }

      // Load cities
      const cityRecords = await this.prisma.city.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });

      this.cities.clear();
      this.citiesByState.clear();

      for (const city of cityRecords) {
        const lookup: CityLookup = {
          id: city.id,
          name: city.name,
          stateId: city.stateId,
        };
        this.cities.set(city.id, lookup);

        const stateCities = this.citiesByState.get(city.stateId) || [];
        stateCities.push(lookup);
        this.citiesByState.set(city.stateId, stateCities);
      }

      this.logger.log(
        `Loaded ${this.countries.size} countries, ${this.states.size} states, ${this.cities.size} cities`,
      );
    } catch (error) {
      this.logger.error('Failed to load country lookup data', error);
    }
  }

  async refresh(): Promise<void> {
    await this.loadAllData();
  }

  // Country lookups
  getAllCountries(): CountryLookup[] {
    return Array.from(this.countries.values());
  }

  getCountryById(id: string): CountryLookup | undefined {
    return this.countries.get(id);
  }

  getCountryByCode(code: string): CountryLookup | undefined {
    return this.countriesByCode.get(code.toUpperCase());
  }

  // State lookups
  getAllStates(): StateLookup[] {
    return Array.from(this.states.values());
  }

  getStateById(id: string): StateLookup | undefined {
    return this.states.get(id);
  }

  getStatesByCountry(countryId: string): StateLookup[] {
    return this.statesByCountry.get(countryId) || [];
  }

  // City lookups
  getAllCities(): CityLookup[] {
    return Array.from(this.cities.values());
  }

  getCityById(id: string): CityLookup | undefined {
    return this.cities.get(id);
  }

  getCitiesByState(stateId: string): CityLookup[] {
    return this.citiesByState.get(stateId) || [];
  }

  // Combined lookup - get full location path
  getLocationPath(
    cityId: string,
  ): { city: string; state: string; country: string } | null {
    const city = this.cities.get(cityId);
    if (!city) return null;

    const state = this.states.get(city.stateId);
    if (!state) return null;

    const country = this.countries.get(state.countryId);
    if (!country) return null;

    return {
      city: city.name,
      state: state.name,
      country: country.name,
    };
  }

  // Validation
  isValidCountry(id: string): boolean {
    return this.countries.has(id);
  }

  isValidState(id: string, countryId?: string): boolean {
    const state = this.states.get(id);
    if (!state) return false;
    if (countryId && state.countryId !== countryId) return false;
    return true;
  }

  isValidCity(id: string, stateId?: string): boolean {
    const city = this.cities.get(id);
    if (!city) return false;
    if (stateId && city.stateId !== stateId) return false;
    return true;
  }
}
