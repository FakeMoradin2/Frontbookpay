import { enAgenda } from "./segments/en.agenda";
import { enAuth } from "./segments/en.auth";
import { enBook } from "./segments/en.book";
import { enBusinesses } from "./segments/en.businesses";
import { enClient } from "./segments/en.client";
import { enCommon } from "./segments/en.common";
import { enDashboard } from "./segments/en.dashboard";
import { enLanding } from "./segments/en.landing";
import { enPages } from "./segments/en.pages";
import { enPricing } from "./segments/en.pricing";
import { enReschedule } from "./segments/en.reschedule";

export const en: Record<string, string> = {
  ...enCommon,
  ...enLanding,
  ...enAuth,
  ...enDashboard,
  ...enClient,
  ...enBusinesses,
  ...enPricing,
  ...enPages,
  ...enAgenda,
  ...enReschedule,
  ...enBook,
};
