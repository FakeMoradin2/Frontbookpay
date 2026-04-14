import type { Metadata } from "next";
import Link from "next/link";
import LegalDocShell from "@/components/LegalDocShell";

export const metadata: Metadata = {
  title: "Data Protection Notice | Book&Pay",
  description:
    "Data protection rights under GDPR and Mexican LFPDPPP for Book&Pay users.",
};

export default function DataProtectionPage() {
  return (
    <LegalDocShell title="Data protection notice" effectiveDate="11/03/26">
      <p>
        The platform is committed to complying with applicable data protection regulations including the General Data
        Protection Regulation (GDPR) where applicable, and the Mexican Federal Law on Protection of Personal Data Held
        by Private Parties (LFPDPPP).
      </p>
      <p>Users may exercise the following rights:</p>

      <h2>Access</h2>
      <p>Request a copy of personal data held by the platform.</p>

      <h2>Rectification</h2>
      <p>Correct inaccurate or incomplete information.</p>

      <h2>Cancellation</h2>
      <p>Request deletion of personal data where legally permitted.</p>

      <h2>Opposition</h2>
      <p>Object to certain types of processing.</p>

      <p className="mt-8">
        Requests may be submitted through the contact or support channels described in the{" "}
        <Link href="/privacy-policy" className="text-neutral-200 underline underline-offset-2 hover:text-white">
          Privacy Policy
        </Link>
        .
      </p>
    </LegalDocShell>
  );
}
