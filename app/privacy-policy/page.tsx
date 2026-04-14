import type { Metadata } from "next";
import LegalDocShell from "@/components/LegalDocShell";

export const metadata: Metadata = {
  title: "Privacy Policy | Book&Pay",
  description:
    "How Book&Pay collects, uses, and protects personal information for customers, businesses, and staff.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDocShell title="Privacy Policy" effectiveDate="11/03/26">
      <h2>1. Overview</h2>
      <p>
        This Privacy Policy describes how Book&Pay (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses,
        processes, and protects personal information obtained from users of the Book&Pay reservation platform.
      </p>
      <p>
        The platform allows customers to discover businesses, schedule services, and make advance payments for
        appointments.
      </p>
      <p>This policy applies to all users of the service including:</p>
      <ul>
        <li>Customers</li>
        <li>Business administrators</li>
        <li>Business staff</li>
        <li>Visitors browsing the platform</li>
        <li>Users authenticating via third-party providers such as Google</li>
      </ul>
      <p>By using the platform, you consent to the practices described in this Privacy Policy.</p>

      <h2>2. Personal information we collect</h2>
      <p>We collect personal information necessary to operate the platform and provide reservation services.</p>

      <h3>2.1 Account information</h3>
      <p>When creating an account we may collect:</p>
      <ul>
        <li>Full name</li>
        <li>Email address</li>
        <li>Phone number</li>
        <li>User role (administrator, staff, customer)</li>
        <li>Business affiliation (if applicable)</li>
      </ul>
      <p>This information is used to create and manage user accounts.</p>

      <h3>2.2 Authentication information</h3>
      <p>Authentication may occur through:</p>
      <ul>
        <li>Email and password login</li>
        <li>OAuth authentication (Google Sign-In)</li>
      </ul>
      <p>Authentication data may include:</p>
      <ul>
        <li>Authentication provider identifiers</li>
        <li>Login timestamps</li>
        <li>Encrypted authentication tokens</li>
        <li>Password hashes (never stored in plain text)</li>
      </ul>
      <p>
        Authentication infrastructure may be handled through secure providers such as Supabase Authentication
        services.
      </p>

      <h3>2.3 Reservation information</h3>
      <p>When users schedule services we collect:</p>
      <ul>
        <li>Selected service</li>
        <li>Business associated with the reservation</li>
        <li>Appointment date and time</li>
        <li>Reservation status</li>
        <li>Reservation notes</li>
        <li>Reservation history</li>
      </ul>
      <p>This data allows businesses to manage appointments and fulfill booked services.</p>

      <h3>2.4 Payment information</h3>
      <p>Some reservations require advance payments.</p>
      <p>Payment processing may be handled through third-party providers such as Stripe.</p>
      <p>We may store limited payment metadata including:</p>
      <ul>
        <li>Transaction identifiers</li>
        <li>Payment status</li>
        <li>Payment method type</li>
        <li>Amount and currency</li>
        <li>Timestamp of payment</li>
      </ul>
      <p>Sensitive payment details (such as credit card numbers) are never stored by our platform.</p>

      <h3>2.5 Business profile information</h3>
      <p>Business administrators may provide additional information including:</p>
      <ul>
        <li>Business name</li>
        <li>Business phone number</li>
        <li>Business email address</li>
        <li>Business time zone</li>
        <li>Operating hours</li>
        <li>Services offered</li>
        <li>Service pricing</li>
        <li>Deposit requirements</li>
        <li>Business profile images</li>
      </ul>

      <h3>2.6 Technical information</h3>
      <p>We automatically collect certain technical information including:</p>
      <ul>
        <li>IP address</li>
        <li>Device information</li>
        <li>Browser type</li>
        <li>Operating system</li>
        <li>Request logs</li>
        <li>API usage logs</li>
      </ul>
      <p>This information helps us monitor performance and maintain platform security.</p>

      <h2>3. How we use personal data</h2>
      <p>Personal data may be used for the following purposes:</p>

      <h3>Platform operation</h3>
      <p>To enable core platform functionality such as:</p>
      <ul>
        <li>Account management</li>
        <li>Service reservations</li>
        <li>Business scheduling</li>
        <li>Payment processing</li>
      </ul>

      <h3>Communication</h3>
      <p>To send:</p>
      <ul>
        <li>Reservation confirmations</li>
        <li>Appointment reminders</li>
        <li>Support responses</li>
        <li>Security alerts</li>
      </ul>

      <h3>Platform improvement</h3>
      <p>To analyze usage patterns and improve the system.</p>

      <h3>Security</h3>
      <p>To detect fraudulent activity, unauthorized access, or abuse.</p>

      <h3>Legal compliance</h3>
      <p>To comply with legal obligations and regulatory requirements.</p>

      <h2>4. Data sharing</h2>
      <p>We do not sell personal data.</p>
      <p>Information may be shared only with:</p>

      <h3>Businesses using the platform</h3>
      <p>When a reservation is created, customer information may be shared with the business providing the service.</p>

      <h3>Service providers</h3>
      <p>Trusted providers assisting with:</p>
      <ul>
        <li>Cloud infrastructure</li>
        <li>Payment processing</li>
        <li>Authentication</li>
        <li>Analytics</li>
      </ul>

      <h3>Legal authorities</h3>
      <p>If required by law or legal processes.</p>

      <h2>5. Data security</h2>
      <p>We implement technical safeguards including:</p>
      <ul>
        <li>HTTPS encrypted communication</li>
        <li>Secure authentication tokens</li>
        <li>Controlled database access</li>
        <li>Role-based authorization</li>
        <li>Infrastructure security monitoring</li>
      </ul>
      <p>While we strive to protect personal information, no system can guarantee absolute security.</p>

      <h2>6. Data retention</h2>
      <p>
        Personal information is retained only for as long as necessary to provide services and comply with legal
        obligations.
      </p>
      <p>Inactive accounts may eventually be deleted or anonymized.</p>

      <h2>7. User rights</h2>
      <p>Depending on applicable regulations, users may have the right to:</p>
      <ul>
        <li>Access their personal data</li>
        <li>Correct inaccurate data</li>
        <li>Request deletion</li>
        <li>Restrict processing</li>
        <li>Request data portability</li>
      </ul>
      <p>
        Requests may be submitted through the contact or support channels made available in the application or on the
        Book&Pay website.
      </p>

      <h2>8. Cookies and tracking</h2>
      <p>The platform may use cookies to:</p>
      <ul>
        <li>Maintain authentication sessions</li>
        <li>Improve user experience</li>
        <li>Monitor system performance</li>
      </ul>
      <p>Users can manage cookies through browser settings.</p>

      <h2>9. Third-party services</h2>
      <p>The platform integrates third-party services including:</p>
      <ul>
        <li>Google OAuth for authentication</li>
        <li>Stripe for payment processing</li>
        <li>Cloud hosting infrastructure</li>
      </ul>
      <p>These services operate under their own privacy policies.</p>

      <h2>10. Children&apos;s privacy</h2>
      <p>The platform is not intended for individuals under the age of 13.</p>
      <p>We do not knowingly collect personal data from children.</p>

      <h2>11. Changes to this policy</h2>
      <p>We may update this Privacy Policy periodically.</p>
      <p>Users will be notified of significant changes through the platform or email.</p>
    </LegalDocShell>
  );
}
