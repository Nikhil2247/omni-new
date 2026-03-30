// ============================================================================
// VALIDATION PIPE - Enhanced Input Validation
// ============================================================================
// Custom validation pipe with detailed error messages and transformation
// ============================================================================

import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';

export interface ValidationPipeOptions {
  whitelist?: boolean;
  forbidNonWhitelisted?: boolean;
  transform?: boolean;
  disableErrorMessages?: boolean;
  skipMissingProperties?: boolean;
}

@Injectable()
export class CustomValidationPipe implements PipeTransform<any> {
  private readonly logger = new Logger(CustomValidationPipe.name);
  private readonly options: ValidationPipeOptions;

  constructor(options: ValidationPipeOptions = {}) {
    this.options = {
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: false,
      skipMissingProperties: false,
      ...options,
    };
  }

  async transform(value: any, metadata: ArgumentMetadata) {
    const { metatype } = metadata;

    // Skip validation for undefined/null values (optional parameters)
    if (value === undefined || value === null) {
      return value;
    }

    // Skip validation for primitive types
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Transform plain object to class instance
    const object = plainToInstance(metatype, value, {
      enableImplicitConversion: true,
    });

    // Skip validation if plainToInstance returned undefined/null
    if (object === undefined || object === null) {
      return value;
    }

    // Validate the object
    const errors = await validate(object, {
      whitelist: this.options.whitelist,
      forbidNonWhitelisted: this.options.forbidNonWhitelisted,
      skipMissingProperties: this.options.skipMissingProperties,
    });

    if (errors.length > 0) {
      const formattedErrors = this.formatErrors(errors);
      this.logger.debug(
        `Validation failed: ${JSON.stringify(formattedErrors)}`,
      );

      throw new BadRequestException({
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }

    return this.options.transform ? object : value;
  }

  private toValidate(metatype: any): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatErrors(errors: ValidationError[]): Record<string, string[]> {
    const result: Record<string, string[]> = {};

    for (const error of errors) {
      this.extractErrors(error, result, '');
    }

    return result;
  }

  private extractErrors(
    error: ValidationError,
    result: Record<string, string[]>,
    prefix: string,
  ): void {
    const property = prefix ? `${prefix}.${error.property}` : error.property;

    if (error.constraints) {
      result[property] = Object.values(error.constraints);
    }

    if (error.children && error.children.length > 0) {
      for (const child of error.children) {
        this.extractErrors(child, result, property);
      }
    }
  }
}

// UUID validation pipe
@Injectable()
export class ParseUUIDPipe implements PipeTransform<string> {
  private readonly uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  transform(value: string, metadata: ArgumentMetadata): string {
    if (!this.uuidRegex.test(value)) {
      throw new BadRequestException(
        `Invalid UUID format for parameter: ${metadata.data || 'id'}`,
      );
    }
    return value;
  }
}

// Trim string pipe
@Injectable()
export class TrimStringsPipe implements PipeTransform {
  transform(value: any): any {
    if (typeof value === 'string') {
      return value.trim();
    }

    if (typeof value === 'object' && value !== null) {
      return this.trimObject(value);
    }

    return value;
  }

  private trimObject(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.transform(item));
    }

    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = this.transform(value);
    }
    return result;
  }
}
