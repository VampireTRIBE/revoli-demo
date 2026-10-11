export interface ConsumerMonthRow {
  year: number; month: number; label: string; firstTimePurchasers: number; deltaVsPreviousMonth: number | null;
  monthlyBuyers: number; observedRepeatBuyers: number; observedRepeatPercent: number; partial: boolean;
}
export interface ConsumerCohortRow {
  cohort: string; cohortSize: number; repeatByMonth: Array<number | null>; totalRepeatObserved: number; repeatPercent: number;
}
export interface ConsumerDashboard {
  filter: { year: number; month: number };
  periodLabel: string; partial: boolean; sourceFile: string;
  cards: {
    customerBase: number | null; newCustomerIntake: number | null; intakeDelta: number | null;
    repeatBuyingShare: number | null; considerationWindow: number; visitorRetention: null; trueRepeatAndValue: null;
  };
  series: ConsumerMonthRow[]; cohorts: ConsumerCohortRow[];
  biggestMover: ConsumerMonthRow | null;
  aligned: Array<{ year: number; month: number; label: string; mediaSpendAed: number | null; firstTimePurchasers: number }>;
  limitations: string[];
}
