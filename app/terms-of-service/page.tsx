import type { Metadata } from "next";
import LegalDocShell from "@/components/LegalDocShell";

export const metadata: Metadata = {
  title: "Terms of Service | Book&Pay",
  description: "Terms and conditions governing the use of the Book&Pay reservation and payments platform.",
};

export default function TermsOfServicePage() {
  return (
    <LegalDocShell title="Terms of Service" effectiveDate="11/03/26">
      <p>
        These Terms govern the use of the Book&Pay service. By using the platform you agree to these terms.
      </p>

      <h2>1. Description of service</h2>
      <p>The platform allows businesses to:</p>
      <ul>
        <li>Publish services</li>
        <li>Define availability schedules</li>
        <li>Manage reservations</li>
        <li>Receive advance payments</li>
      </ul>
      <p>Customers can:</p>
      <ul>
        <li>Discover businesses</li>
        <li>Book services</li>
        <li>Pay deposits</li>
        <li>Manage reservations</li>
      </ul>

      <h2>2. User responsibilities</h2>
      <p>Users agree to:</p>
      <ul>
        <li>Provide accurate information</li>
        <li>Use the platform legally</li>
        <li>Respect business policies</li>
        <li>Not misuse the system</li>
      </ul>
      <p>Businesses are responsible for the services they offer and fulfill.</p>

      <h2>3. Reservation policies</h2>
      <p>Reservations may include:</p>
      <ul>
        <li>Scheduled appointment time</li>
        <li>Deposit payment requirements</li>
        <li>Cancellation rules</li>
      </ul>
      <p>Each business may define its own reservation policies.</p>

      <h2>4. Payments</h2>
      <p>Payments may be processed through third-party providers.</p>
      <p>The platform does not store full payment card information.</p>
      <p>Businesses are responsible for refund policies unless otherwise specified.</p>

      <h2>5. Account security</h2>
      <p>Users are responsible for maintaining the confidentiality of their accounts and login credentials.</p>
      <p>Any unauthorized access must be reported immediately.</p>

      <h2>6. Limitation of liability</h2>
      <p>The platform acts only as a technology intermediary connecting customers and businesses.</p>
      <p>We are not responsible for:</p>
      <ul>
        <li>Service quality</li>
        <li>Appointment outcomes</li>
        <li>Disputes between customers and businesses</li>
      </ul>

      <h2>7. Platform availability</h2>
      <p>We strive to maintain reliable uptime but cannot guarantee uninterrupted service.</p>
      <p>Maintenance or technical issues may temporarily affect availability.</p>

      <h2>8. Termination</h2>
      <p>
        We reserve the right to suspend or terminate accounts that violate these terms or misuse the platform.
      </p>
    </LegalDocShell>
  );
}
