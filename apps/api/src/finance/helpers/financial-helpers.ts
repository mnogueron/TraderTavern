// fundamentalsTimeSeries rows carry an internal TYPE/date envelope plus
// dozens of module-specific fields; we only care about a handful, and only
// the fields we read are typed here (the rest are untyped in yahoo-finance2
// for these modules, see plan research notes).
export type FundamentalsTimeSeriesRow = {
  date: Date;
  totalRevenue?: number;
  EBIT?: number;
  EBITDA?: number;
  netIncome?: number;
  grossProfit?: number;
  operatingCashFlow?: number;
  freeCashFlow?: number;
  capitalExpenditure?: number;
  cashAndCashEquivalents?: number;
  totalDebt?: number;
  netDebt?: number;
  totalAssets?: number;
  currentAssets?: number;
  currentLiabilities?: number;
  longTermDebt?: number;
  retainedEarnings?: number;
  totalLiabilitiesNetMinorityInterest?: number;
  ordinarySharesNumber?: number;
  shareIssued?: number;
};

export type AnnualFinancialPeriodDraft = {
  periodEnd: Date;
  revenue?: number;
  ebitda?: number;
  netIncome?: number;
  operatingCashflow?: number;
  capex?: number;
  freeCashflow?: number;
  cash?: number;
  totalDebt?: number;
  netDebt?: number;
};

// Inputs for the Piotroski F-Score, gathered from the same annual
// financials/cash-flow/balance-sheet rows as AnnualFinancialPeriodDraft but
// kept separate since these fields aren't part of the public financial
// history feature (see ticker-financial-history.schema.ts).
export type PiotroskiPeriodDraft = {
  periodEnd: Date;
  netIncome?: number;
  totalAssets?: number;
  operatingCashflow?: number;
  longTermDebt?: number;
  currentAssets?: number;
  currentLiabilities?: number;
  grossProfit?: number;
  revenue?: number;
  sharesOutstanding?: number;
};

// Yahoo Finance doesn't expose a Piotroski F-Score in any quoteSummary or
// fundamentalsTimeSeries module, so it's always computed here from the two
// most recent annual periods rather than read directly from the API.
// Returns undefined if either period is missing a required figure.
export const computePiotroskiScore = (
  current: PiotroskiPeriodDraft,
  prior: PiotroskiPeriodDraft,
): number | undefined => {
  const {
    netIncome: netIncomeCur,
    totalAssets: totalAssetsCur,
    operatingCashflow: operatingCashflowCur,
    longTermDebt: longTermDebtCur,
    currentAssets: currentAssetsCur,
    currentLiabilities: currentLiabilitiesCur,
    grossProfit: grossProfitCur,
    revenue: revenueCur,
    sharesOutstanding: sharesOutstandingCur,
  } = current;
  const {
    netIncome: netIncomePrior,
    totalAssets: totalAssetsPrior,
    operatingCashflow: operatingCashflowPrior,
    longTermDebt: longTermDebtPrior,
    currentAssets: currentAssetsPrior,
    currentLiabilities: currentLiabilitiesPrior,
    grossProfit: grossProfitPrior,
    revenue: revenuePrior,
    sharesOutstanding: sharesOutstandingPrior,
  } = prior;

  if (
    netIncomeCur == null ||
    totalAssetsCur == null ||
    operatingCashflowCur == null ||
    longTermDebtCur == null ||
    currentAssetsCur == null ||
    currentLiabilitiesCur == null ||
    grossProfitCur == null ||
    revenueCur == null ||
    sharesOutstandingCur == null ||
    netIncomePrior == null ||
    totalAssetsPrior == null ||
    operatingCashflowPrior == null ||
    longTermDebtPrior == null ||
    currentAssetsPrior == null ||
    currentLiabilitiesPrior == null ||
    grossProfitPrior == null ||
    revenuePrior == null ||
    sharesOutstandingPrior == null ||
    totalAssetsCur === 0 ||
    totalAssetsPrior === 0 ||
    currentLiabilitiesCur === 0 ||
    currentLiabilitiesPrior === 0 ||
    revenueCur === 0 ||
    revenuePrior === 0
  ) {
    return undefined;
  }

  const roaCur = netIncomeCur / totalAssetsCur;
  const roaPrior = netIncomePrior / totalAssetsPrior;
  const leverageCur = longTermDebtCur / totalAssetsCur;
  const leveragePrior = longTermDebtPrior / totalAssetsPrior;
  const currentRatioCur = currentAssetsCur / currentLiabilitiesCur;
  const currentRatioPrior = currentAssetsPrior / currentLiabilitiesPrior;
  const grossMarginCur = grossProfitCur / revenueCur;
  const grossMarginPrior = grossProfitPrior / revenuePrior;
  const assetTurnoverCur = revenueCur / totalAssetsCur;
  const assetTurnoverPrior = revenuePrior / totalAssetsPrior;

  let score = 0;
  if (roaCur > 0) score += 1; // profitable
  if (operatingCashflowCur > 0) score += 1; // positive operating cash flow
  if (roaCur > roaPrior) score += 1; // improving profitability
  if (operatingCashflowCur > netIncomeCur) score += 1; // earnings quality
  if (leverageCur < leveragePrior) score += 1; // decreasing leverage
  if (currentRatioCur > currentRatioPrior) score += 1; // improving liquidity
  if (sharesOutstandingCur <= sharesOutstandingPrior) score += 1; // no dilution
  if (grossMarginCur > grossMarginPrior) score += 1; // improving margin
  if (assetTurnoverCur > assetTurnoverPrior) score += 1; // improving efficiency

  return score;
};

// Inputs for the Altman Z-Score, gathered from the same annual
// financials/balance-sheet rows as AnnualFinancialPeriodDraft but kept
// separate since these fields aren't part of the public financial history
// feature (see ticker-financial-history.schema.ts).
export type AltmanPeriodDraft = {
  periodEnd: Date;
  totalAssets?: number;
  currentAssets?: number;
  currentLiabilities?: number;
  retainedEarnings?: number;
  ebit?: number;
  revenue?: number;
  totalLiabilities?: number;
};

// Yahoo Finance doesn't expose an Altman Z-Score in any quoteSummary or
// fundamentalsTimeSeries module, so it's always computed here from the most
// recent annual period plus the current market cap. Returns undefined if any
// required figure is missing. Uses the original 1968 model (public
// manufacturing companies); scores for financials/non-manufacturers are
// directional rather than exact given how differently their balance sheets
// are structured.
export const computeAltmanZScore = (
  period: AltmanPeriodDraft,
  marketCap: number | undefined,
): number | undefined => {
  const {
    totalAssets,
    currentAssets,
    currentLiabilities,
    retainedEarnings,
    ebit,
    revenue,
    totalLiabilities,
  } = period;

  if (
    totalAssets == null ||
    currentAssets == null ||
    currentLiabilities == null ||
    retainedEarnings == null ||
    ebit == null ||
    revenue == null ||
    totalLiabilities == null ||
    marketCap == null ||
    totalAssets === 0 ||
    totalLiabilities === 0
  ) {
    return undefined;
  }

  const workingCapital = currentAssets - currentLiabilities;
  const x1 = workingCapital / totalAssets;
  const x2 = retainedEarnings / totalAssets;
  const x3 = ebit / totalAssets;
  const x4 = marketCap / totalLiabilities;
  const x5 = revenue / totalAssets;

  return 1.2 * x1 + 1.4 * x2 + 3.3 * x3 + 0.6 * x4 + 1.0 * x5;
};
