// ============================================================================
// CIRCUIT BREAKER SERVICE - Fault Tolerance Pattern
// ============================================================================
// Implements the Circuit Breaker pattern to prevent cascade failures
// States: CLOSED (normal) -> OPEN (failing) -> HALF_OPEN (testing)
// ============================================================================

import { Injectable, Logger } from '@nestjs/common';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  name: string;
  failureThreshold?: number; // Number of failures before opening
  successThreshold?: number; // Number of successes in half-open to close
  timeout?: number; // Time in ms before trying half-open
  volumeThreshold?: number; // Minimum calls before calculating failure rate
  failureRateThreshold?: number; // Percentage (0-100) failure rate to open
}

export interface CircuitBreakerStats {
  name: string;
  state: CircuitState;
  failures: number;
  successes: number;
  totalCalls: number;
  lastFailure?: Date;
  lastSuccess?: Date;
  lastStateChange: Date;
}

interface CircuitBreakerInstance {
  options: Required<CircuitBreakerOptions>;
  state: CircuitState;
  failures: number;
  successes: number;
  totalCalls: number;
  lastFailure?: Date;
  lastSuccess?: Date;
  lastStateChange: Date;
  halfOpenSuccesses: number;
  nextAttempt: number;
}

export class CircuitOpenError extends Error {
  constructor(
    public readonly circuitName: string,
    public readonly nextAttempt: Date,
  ) {
    super(
      `Circuit breaker '${circuitName}' is OPEN. Next attempt at ${nextAttempt.toISOString()}`,
    );
    this.name = 'CircuitOpenError';
  }
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly circuits = new Map<string, CircuitBreakerInstance>();

  private readonly defaultOptions: Omit<
    Required<CircuitBreakerOptions>,
    'name'
  > = {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 30000, // 30 seconds
    volumeThreshold: 10,
    failureRateThreshold: 50,
  };

  /**
   * Create or get a circuit breaker instance
   */
  getCircuit(options: CircuitBreakerOptions): CircuitBreakerInstance {
    const existing = this.circuits.get(options.name);

    if (existing) {
      return existing;
    }

    const circuit: CircuitBreakerInstance = {
      options: {
        ...this.defaultOptions,
        ...options,
      },
      state: CircuitState.CLOSED,
      failures: 0,
      successes: 0,
      totalCalls: 0,
      lastStateChange: new Date(),
      halfOpenSuccesses: 0,
      nextAttempt: 0,
    };

    this.circuits.set(options.name, circuit);
    this.logger.log(`Circuit breaker created: ${options.name}`);

    return circuit;
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    options: CircuitBreakerOptions,
    fn: () => Promise<T>,
    fallback?: () => Promise<T>,
  ): Promise<T> {
    const circuit = this.getCircuit(options);

    // Check if circuit is open
    if (circuit.state === CircuitState.OPEN) {
      if (Date.now() < circuit.nextAttempt) {
        // Still in timeout period
        if (fallback) {
          this.logger.debug(`Circuit ${options.name} OPEN, using fallback`);
          return fallback();
        }
        throw new CircuitOpenError(options.name, new Date(circuit.nextAttempt));
      }

      // Timeout expired, try half-open
      this.transitionTo(circuit, CircuitState.HALF_OPEN);
    }

    try {
      const result = await fn();
      this.onSuccess(circuit);
      return result;
    } catch (error) {
      this.onFailure(circuit);

      if (circuit.state === CircuitState.OPEN && fallback) {
        this.logger.debug(
          `Circuit ${options.name} OPEN after failure, using fallback`,
        );
        return fallback();
      }

      throw error;
    }
  }

  /**
   * Check if a circuit allows requests
   */
  isAvailable(name: string): boolean {
    const circuit = this.circuits.get(name);

    if (!circuit) return true;

    if (circuit.state === CircuitState.CLOSED) return true;

    if (circuit.state === CircuitState.HALF_OPEN) return true;

    // OPEN state - check if timeout has passed
    return Date.now() >= circuit.nextAttempt;
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(name: string): CircuitBreakerStats | null {
    const circuit = this.circuits.get(name);

    if (!circuit) return null;

    return {
      name,
      state: circuit.state,
      failures: circuit.failures,
      successes: circuit.successes,
      totalCalls: circuit.totalCalls,
      lastFailure: circuit.lastFailure,
      lastSuccess: circuit.lastSuccess,
      lastStateChange: circuit.lastStateChange,
    };
  }

  /**
   * Get all circuit breaker statistics
   */
  getAllStats(): CircuitBreakerStats[] {
    return Array.from(this.circuits.entries()).map(([name, circuit]) => ({
      name,
      state: circuit.state,
      failures: circuit.failures,
      successes: circuit.successes,
      totalCalls: circuit.totalCalls,
      lastFailure: circuit.lastFailure,
      lastSuccess: circuit.lastSuccess,
      lastStateChange: circuit.lastStateChange,
    }));
  }

  /**
   * Manually reset a circuit breaker to CLOSED state
   */
  reset(name: string): void {
    const circuit = this.circuits.get(name);

    if (circuit) {
      circuit.state = CircuitState.CLOSED;
      circuit.failures = 0;
      circuit.successes = 0;
      circuit.totalCalls = 0;
      circuit.halfOpenSuccesses = 0;
      circuit.lastStateChange = new Date();
      this.logger.log(`Circuit ${name} manually reset to CLOSED`);
    }
  }

  /**
   * Remove a circuit breaker
   */
  remove(name: string): void {
    this.circuits.delete(name);
    this.logger.log(`Circuit ${name} removed`);
  }

  private onSuccess(circuit: CircuitBreakerInstance): void {
    circuit.successes++;
    circuit.totalCalls++;
    circuit.lastSuccess = new Date();

    if (circuit.state === CircuitState.HALF_OPEN) {
      circuit.halfOpenSuccesses++;

      if (circuit.halfOpenSuccesses >= circuit.options.successThreshold) {
        this.transitionTo(circuit, CircuitState.CLOSED);
        circuit.failures = 0;
        circuit.halfOpenSuccesses = 0;
      }
    }
  }

  private onFailure(circuit: CircuitBreakerInstance): void {
    circuit.failures++;
    circuit.totalCalls++;
    circuit.lastFailure = new Date();

    if (circuit.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open goes back to open
      this.transitionTo(circuit, CircuitState.OPEN);
      circuit.nextAttempt = Date.now() + circuit.options.timeout;
      circuit.halfOpenSuccesses = 0;
      return;
    }

    if (circuit.state === CircuitState.CLOSED) {
      // Check if we should open the circuit
      const shouldOpen = this.shouldOpenCircuit(circuit);

      if (shouldOpen) {
        this.transitionTo(circuit, CircuitState.OPEN);
        circuit.nextAttempt = Date.now() + circuit.options.timeout;
      }
    }
  }

  private shouldOpenCircuit(circuit: CircuitBreakerInstance): boolean {
    // Check failure threshold
    if (circuit.failures >= circuit.options.failureThreshold) {
      return true;
    }

    // Check failure rate threshold (only if volume threshold met)
    if (circuit.totalCalls >= circuit.options.volumeThreshold) {
      const failureRate = (circuit.failures / circuit.totalCalls) * 100;

      if (failureRate >= circuit.options.failureRateThreshold) {
        return true;
      }
    }

    return false;
  }

  private transitionTo(
    circuit: CircuitBreakerInstance,
    newState: CircuitState,
  ): void {
    const oldState = circuit.state;
    circuit.state = newState;
    circuit.lastStateChange = new Date();

    this.logger.log(
      `Circuit ${circuit.options.name} transitioned: ${oldState} -> ${newState}`,
    );
  }
}
