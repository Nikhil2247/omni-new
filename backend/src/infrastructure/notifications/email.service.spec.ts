import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { EmailService } from './email.service';
import { CircuitBreakerService } from '../resilience/circuit-breaker.service';

// Sample data covering the variables each template uses
const sample: Record<string, Record<string, unknown>> = {
  welcome: {
    name: 'Asha',
    verificationUrl: 'https://omnicassion.com/verify-email?token=abc&x=1',
    dashboardUrl: 'https://omnicassion.com/dashboard',
    loginUrl: 'https://omnicassion.com/login',
  },
  'email-verification': {
    name: 'Asha',
    verificationUrl: 'https://omnicassion.com/verify-email?token=abc&x=1',
    expiresInHours: 24,
  },
  'password-reset': {
    name: 'Asha',
    resetUrl: 'https://omnicassion.com/reset-password?token=abc&x=1',
    expiresIn: '1 hour',
  },
  'event-confirmation': {
    name: 'Asha',
    eventName: 'Asha & Ravi Wedding',
    eventDate: '12 December 2026',
    eventLocation: 'Jaipur',
    orderNumber: 'ORD-1001',
    ticketCount: 2,
  },
  'ticket-confirmation': {
    name: 'Asha',
    eventName: 'Sangeet Night',
    eventDate: '11 December 2026',
    ticketDetails: [{ ticketType: 'VIP', quantity: 2, price: 'INR 2,000' }],
    qrCodeUrl: 'https://omnicassion.com/qr/abc.png',
    ticketDownloadUrl: 'https://omnicassion.com/tickets/abc',
  },
  'payment-receipt': {
    name: 'Asha',
    orderNumber: 'ORD-1001',
    amount: '4,000.00',
    currency: 'INR',
    paymentMethod: 'UPI',
    items: [{ description: 'VIP ticket', quantity: 2, price: '2,000.00' }],
    receiptUrl: 'https://omnicassion.com/receipts/1001',
  },
  'reminder-day-before': {
    name: 'Asha',
    eventName: 'Sangeet Night',
    eventDate: '11 December 2026, 7 PM',
    eventLocation: 'Jaipur',
  },
  'reminder-hour-before': {
    name: 'Asha',
    eventName: 'Sangeet Night',
    eventDate: '11 December 2026, 7 PM',
    eventLocation: 'Jaipur',
  },
  'reminder-week-before': {
    name: 'Asha',
    eventName: 'Sangeet Night',
    eventDate: '11 December 2026, 7 PM',
    eventLocation: 'Jaipur',
  },
  newsletter: {
    name: 'Asha',
    content: '<h2>Spring ideas</h2><p>Fresh inspiration for your event.</p>',
    unsubscribeUrl: 'https://omnicassion.com/unsubscribe/abc',
  },
  'wedding-partner-invite': {
    inviterName: 'Asha',
    displayName: 'Asha & Ravi',
    inviteUrl: 'https://omnicassion.com/invite/abc',
  },
  'claim-verification': {
    businessName: 'Rose Petal Decor',
    verificationCode: '482913',
    expiresIn: '15 minutes',
  },
  'claim-pending-review': {
    businessName: 'Rose Petal Decor',
    dashboardUrl: 'https://omnicassion.com/dashboard',
  },
  'claim-approved': {
    businessName: 'Rose Petal Decor',
    dashboardUrl: 'https://omnicassion.com/business',
    helpUrl: 'https://omnicassion.com/support',
    reviewNotes: 'Welcome aboard!',
  },
  'claim-rejected': {
    businessName: 'Rose Petal Decor',
    rejectionReason: 'Documents were unreadable.',
    supportUrl: 'https://omnicassion.com/support',
  },
  'claim-expired': { firstName: 'Asha', businessName: 'Rose Petal Decor' },
  'claim-expiry-warning': {
    firstName: 'Asha',
    businessName: 'Rose Petal Decor',
    daysRemaining: 3,
    dashboardUrl: 'https://omnicassion.com/dashboard',
  },
};

describe('EmailService templates', () => {
  let service: EmailService;

  beforeAll(async () => {
    const config = {
      get: (key: string, fallback?: unknown) => fallback,
    } as unknown as ConfigService;
    service = new EmailService(config, {} as CircuitBreakerService);

    // Load templates only - skip SMTP initialisation
    (service as any).registerHandlebarsHelpers();
    await (service as any).loadTemplates();
  });

  it('has a sample for every template on disk', () => {
    expect(service.getAvailableTemplates().sort()).toEqual(
      Object.keys(sample).sort(),
    );
  });

  it.each(Object.keys(sample))(
    'renders "%s" in the branded layout',
    (name) => {
      const result = service.render(name, sample[name]);

      expect(result).not.toBeNull();
      expect(result!.html).toContain('<!DOCTYPE html>');
      expect(result!.html).toContain('Omnicassion');
      expect(result!.html).toContain('support@omnicassion.com');
      expect(result!.html).not.toMatch(/\{\{|\}\}/);
      expect(result!.subject.length).toBeGreaterThan(0);
      expect(result!.subject).not.toMatch(/\{\{|&#x/);
      expect(result!.text).toBeDefined();
      expect(result!.text).not.toMatch(/\{\{|\}\}/);
    },
  );

  it('keeps URLs intact in plain-text parts', () => {
    const result = service.render('email-verification', {
      verificationUrl: 'https://omnicassion.com/verify?token=a&b=2',
    });
    expect(result!.text).toContain('https://omnicassion.com/verify?token=a&b=2');
  });

  it('degrades gracefully when optional variables are missing', () => {
    const result = service.render('welcome', {});
    expect(result!.subject).toBe('Welcome to Omnicassion!');
    expect(result!.html).toContain('Hello there,');
  });

  it('escapes user-provided values', () => {
    const result = service.render('claim-expired', {
      businessName: '<script>alert(1)</script>',
    });
    expect(result!.html).not.toContain('<script>alert(1)</script>');
  });

  it('wraps code-built content with renderLayout', () => {
    const html = service.renderLayout({
      title: 'Payment Failed',
      content: '<div class="content"><p>Hi</p></div>',
    });
    expect(html).toContain('<title>Payment Failed</title>');
    expect(html).toContain('<p>Hi</p>');
    expect(html).toContain('plan it. share it. celebrate it.');
  });

  it('returns null for unknown templates', () => {
    expect(service.render('does-not-exist')).toBeNull();
  });

  // Optional: EMAIL_PREVIEW_DIR=./tmp/email-previews npx jest email.service.spec
  const previewDir = process.env.EMAIL_PREVIEW_DIR;
  (previewDir ? it : it.skip)('writes HTML previews', () => {
    fs.mkdirSync(previewDir!, { recursive: true });
    for (const name of Object.keys(sample)) {
      const rendered = service.render(name, sample[name])!;
      fs.writeFileSync(path.join(previewDir!, `${name}.html`), rendered.html);
    }
  });
});
