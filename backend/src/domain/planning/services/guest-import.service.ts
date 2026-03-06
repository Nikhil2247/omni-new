// ============================================================================
// GUEST IMPORT SERVICE - CSV Bulk Import
// ============================================================================

import { Injectable, BadRequestException } from '@nestjs/common';
import { GuestlistRepository } from '../repositories/guestlist.repository';
import { generateRsvpToken } from '../utils/token-generator';

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
  guests: Array<{
    firstName: string;
    lastName?: string;
    status: 'imported' | 'skipped' | 'error';
    reason?: string;
  }>;
}

export interface ParsedGuest {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  plusOne?: number;
  dietaryReq?: string;
  notes?: string;
}

@Injectable()
export class GuestImportService {
  constructor(private readonly guestlistRepository: GuestlistRepository) {}

  /**
   * Parse CSV content and return array of guest data
   */
  parseCSV(content: string): ParsedGuest[] {
    const lines = content.trim().split('\n');
    if (lines.length < 2) {
      throw new BadRequestException('CSV file must contain header and at least one data row');
    }

    // Parse header
    const header = this.parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
    const requiredField = 'firstname';

    if (!header.includes(requiredField)) {
      throw new BadRequestException('CSV must contain "firstName" column');
    }

    // Map headers to indices
    const headerMap = {
      firstName: header.indexOf('firstname'),
      lastName: header.indexOf('lastname'),
      email: header.indexOf('email'),
      phone: header.indexOf('phone'),
      plusOne: header.indexOf('plusone'),
      dietaryReq: header.indexOf('dietaryreq'),
      notes: header.indexOf('notes'),
    };

    // Parse data rows
    const guests: ParsedGuest[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = this.parseCSVLine(line);
      const firstName = this.getValue(values, headerMap.firstName);

      if (!firstName) {
        continue; // Skip rows without firstName
      }

      guests.push({
        firstName,
        lastName: this.getValue(values, headerMap.lastName),
        email: this.getValue(values, headerMap.email),
        phone: this.getValue(values, headerMap.phone),
        plusOne: this.getNumberValue(values, headerMap.plusOne) || 0,
        dietaryReq: this.getValue(values, headerMap.dietaryReq),
        notes: this.getValue(values, headerMap.notes),
      });
    }

    return guests;
  }

  /**
   * Parse a single CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());

    return result;
  }

  private getValue(values: string[], index: number): string | undefined {
    if (index < 0 || index >= values.length) return undefined;
    const value = values[index]?.trim();
    return value || undefined;
  }

  private getNumberValue(values: string[], index: number): number | undefined {
    const value = this.getValue(values, index);
    if (!value) return undefined;
    const num = parseInt(value, 10);
    return isNaN(num) ? undefined : num;
  }

  /**
   * Import guests from CSV content into a guestlist
   */
  async importGuests(guestlistId: string, csvContent: string): Promise<ImportResult> {
    // Verify guestlist exists and get with guests for duplicate detection
    const guestlistWithGuests = await this.guestlistRepository.findWithGuests(guestlistId);
    if (!guestlistWithGuests) {
      throw new BadRequestException('Guestlist not found');
    }

    // Parse CSV
    const parsedGuests = this.parseCSV(csvContent);
    if (parsedGuests.length === 0) {
      throw new BadRequestException('No valid guests found in CSV');
    }

    // Get existing guests for duplicate detection
    const existingGuests = guestlistWithGuests.guests || [];
    const existingEmails = new Set(
      existingGuests.filter((g) => g.email).map((g) => g.email!.toLowerCase()),
    );
    const existingPhones = new Set(
      existingGuests.filter((g) => g.phone).map((g) => this.normalizePhone(g.phone!)),
    );

    const result: ImportResult = {
      imported: 0,
      skipped: 0,
      errors: [],
      guests: [],
    };

    // Process each guest
    for (const guest of parsedGuests) {
      try {
        // Check for duplicates
        const isDuplicateEmail =
          guest.email && existingEmails.has(guest.email.toLowerCase());
        const isDuplicatePhone =
          guest.phone && existingPhones.has(this.normalizePhone(guest.phone));

        if (isDuplicateEmail || isDuplicatePhone) {
          result.skipped++;
          result.guests.push({
            firstName: guest.firstName,
            lastName: guest.lastName,
            status: 'skipped',
            reason: isDuplicateEmail ? 'Duplicate email' : 'Duplicate phone',
          });
          continue;
        }

        // Create guest with guestlist connection
        await this.guestlistRepository.addGuest(guestlistId, {
          guestlist: { connect: { id: guestlistId } },
          firstName: guest.firstName,
          lastName: guest.lastName,
          email: guest.email,
          phone: guest.phone,
          plusOne: guest.plusOne || 0,
          dietaryReq: guest.dietaryReq,
          notes: guest.notes,
          rsvpToken: generateRsvpToken(),
        });

        result.imported++;
        result.guests.push({
          firstName: guest.firstName,
          lastName: guest.lastName,
          status: 'imported',
        });

        // Add to existing sets to prevent duplicates within same import
        if (guest.email) existingEmails.add(guest.email.toLowerCase());
        if (guest.phone) existingPhones.add(this.normalizePhone(guest.phone));
      } catch (error) {
        result.errors.push(`Failed to import ${guest.firstName}: ${error.message}`);
        result.guests.push({
          firstName: guest.firstName,
          lastName: guest.lastName,
          status: 'error',
          reason: error.message,
        });
      }
    }

    return result;
  }

  /**
   * Normalize phone number for comparison
   */
  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  /**
   * Generate CSV template content
   */
  generateTemplate(): string {
    const headers = ['firstName', 'lastName', 'email', 'phone', 'plusOne', 'dietaryReq', 'notes'];
    const example = [
      'John',
      'Doe',
      'john@example.com',
      '+1234567890',
      '1',
      'Vegetarian',
      'VIP Guest',
    ];

    return [headers.join(','), example.join(',')].join('\n');
  }
}
