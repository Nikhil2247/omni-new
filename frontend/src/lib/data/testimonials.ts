export interface Testimonial {
  /** What the customer said, in their own words. */
  quote: string
  /** First name only. */
  name: string
  city: string
  /** For example "Wedding" or "Reception". */
  event: string
}

/**
 * Add real customer quotes here, with the customer's permission.
 * While this list is empty, the home page Trust section shows only the "how we verify vendors" explainer.
 */
export const TESTIMONIALS: Testimonial[] = []
