"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslation } from "@/contexts/LocaleContext";

function IconStore(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-neutral-200" {...props}>
      <rect x="3.5" y="9" width="17" height="11" rx="1.5" ry="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 9L6.8 4.8c.2-.6.8-1 1.4-1h7.6c.6 0 1.1.4 1.4 1L19 9" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 14h3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconScissors(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-neutral-200" {...props}>
      <circle cx="6.5" cy="7" r="2.3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="6.5" cy="17" r="2.3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 6l8-4M10 18l8 4M9 12l10-1" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconClock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-neutral-200" {...props}>
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconBlock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-neutral-200" {...props}>
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7.5 7.5l9 9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconCalendar(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-neutral-200" {...props}>
      <rect x="3.5" y="5.5" width="17" height="15" rx="1.5" ry="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 4v3M16 4v3M4 10h16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="8" y="12.5" width="3" height="3" rx="0.7" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function IconCard(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-neutral-200" {...props}>
      <rect x="3.5" y="6" width="17" height="12" rx="1.7" ry="1.7" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 9h16" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 14.5h3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconUsers(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-neutral-200" {...props}>
      <circle cx="9" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.8 18c.5-2.9 2.8-4.7 5.2-4.7s4.7 1.8 5.2 4.7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14.8 18c.3-2 1.6-3.4 3.4-3.9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

type DashboardCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  href?: string;
  disabled?: boolean;
};

function DashboardCard({ title, description, icon, href, disabled }: DashboardCardProps) {
  const className =
    "flex flex-col items-start rounded-2xl border border-neutral-800 bg-[#050505] px-6 py-5 text-left transition hover:border-neutral-600 hover:bg-[#090909]";
  const content = (
    <>
      <div className="mb-4 text-neutral-200">{icon}</div>
      <div className="mb-1 text-sm font-medium text-neutral-50">{title}</div>
      <p className="text-xs text-neutral-400">{description}</p>
    </>
  );

  if (disabled) {
    return (
      <div className={`${className} cursor-not-allowed opacity-60 hover:border-neutral-800 hover:bg-[#050505]`}>
        {content}
      </div>
    );
  }

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

export default function DashboardPage() {
  const { t } = useTranslation();

  return (
    <>
      <section className="mb-7 md:mb-8">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{t("dashboard.home.title")}</h1>
        <p className="mt-1 text-xs text-neutral-400 md:text-sm">{t("dashboard.home.subtitle")}</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <DashboardCard
          title={t("dashboard.home.card.business.title")}
          description={t("dashboard.home.card.business.desc")}
          icon={<IconStore className="h-6 w-6 text-neutral-100" />}
          href="/dashboard/business"
        />
        <DashboardCard
          title={t("dashboard.home.card.services.title")}
          description={t("dashboard.home.card.services.desc")}
          icon={<IconScissors className="h-6 w-6 text-neutral-100" />}
          href="/dashboard/services"
        />
        <DashboardCard
          title={t("dashboard.home.card.schedules.title")}
          description={t("dashboard.home.card.schedules.desc")}
          icon={<IconClock className="h-6 w-6 text-neutral-100" />}
          href="/dashboard/schedules"
        />
        <DashboardCard
          title={t("dashboard.home.card.blocked.title")}
          description={t("dashboard.home.card.blocked.desc")}
          icon={<IconBlock className="h-6 w-6 text-neutral-100" />}
          href="/dashboard/blocked"
        />
        <DashboardCard
          title={t("dashboard.home.card.staff.title")}
          description={t("dashboard.home.card.staff.desc")}
          icon={<IconUsers className="h-6 w-6 text-neutral-100" />}
          href="/dashboard/staff"
        />
        <DashboardCard
          title={t("dashboard.home.card.agenda.title")}
          description={t("dashboard.home.card.agenda.desc")}
          icon={<IconCalendar className="h-6 w-6 text-neutral-100" />}
          href="/dashboard/agenda"
        />
        <DashboardCard
          title={t("dashboard.home.card.payments.title")}
          description={t("dashboard.home.card.payments.desc")}
          icon={<IconCard className="h-6 w-6 text-neutral-100" />}
          href="/dashboard/payments"
        />
      </section>
    </>
  );
}
