// Static, curated lists of large-cap tickers (Yahoo Finance symbols) used to
// seed the screener until a real ticker-discovery source is wired up.

export const US_TICKERS: string[] = [
  'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK-B', 'AVGO',
  'JPM', 'LLY', 'V', 'UNH', 'XOM', 'MA', 'HD', 'COST', 'PG', 'JNJ',
  'NFLX', 'BAC', 'CRM', 'ABBV', 'MRK', 'CVX', 'KO', 'AMD', 'PEP', 'ADBE',
  'WMT', 'TMO', 'ORCL', 'MCD', 'CSCO', 'ACN', 'ABT', 'LIN', 'DHR', 'IBM',
  'GE', 'WFC', 'PM', 'TXN', 'CAT', 'VZ', 'INTU', 'AMGN', 'QCOM', 'NOW',
  'ISRG', 'CMCSA', 'DIS', 'AXP', 'SPGI', 'UBER', 'BKNG', 'NEE', 'RTX', 'HON',
  'MS', 'T', 'LOW', 'UNP', 'PFE', 'AMAT', 'GS', 'SCHW', 'BLK', 'C',
  'ELV', 'SYK', 'TJX', 'BSX', 'GILD', 'MDT', 'ADI', 'VRTX', 'LMT', 'MMC',
  'PGR', 'CB', 'ETN', 'PLD', 'ADP', 'DE', 'MDLZ', 'REGN', 'BX', 'KLAC',
  'CI', 'SBUX', 'MU', 'SO', 'DUK', 'AMT', 'PANW', 'FI', 'ICE', 'ZTS',
];

export const EUROPE_TICKERS: string[] = [
  // France (.PA)
  'MC.PA', 'OR.PA', 'SAN.PA', 'TTE.PA', 'AI.PA', 'SU.PA', 'EL.PA', 'BNP.PA', 'AIR.PA', 'DG.PA',
  'CS.PA', 'RMS.PA', 'KER.PA', 'SGO.PA', 'SAF.PA',
  // Germany (.DE)
  'SAP.DE', 'SIE.DE', 'ALV.DE', 'DTE.DE', 'MBG.DE', 'BAS.DE', 'BAYN.DE', 'BMW.DE', 'VOW3.DE', 'MUV2.DE',
  'DB1.DE', 'ADS.DE', 'IFX.DE', 'DHL.DE', 'RWE.DE',
  // Switzerland (.SW)
  'NESN.SW', 'ROG.SW', 'NOVN.SW', 'ZURN.SW', 'ABBN.SW', 'CFR.SW', 'UBSG.SW', 'SIKA.SW',
  // United Kingdom (.L)
  'AZN.L', 'SHEL.L', 'HSBA.L', 'ULVR.L', 'BP.L', 'GSK.L', 'DGE.L', 'RIO.L', 'REL.L', 'BATS.L',
  'NG.L', 'LSEG.L', 'CPG.L', 'AAL.L', 'GLEN.L', 'VOD.L', 'LLOY.L', 'BARC.L', 'PRU.L', 'TSCO.L',
  // Netherlands (.AS)
  'ASML.AS', 'ADYEN.AS', 'HEIA.AS', 'AD.AS', 'PHIA.AS', 'INGA.AS',
  // Spain (.MC)
  'ITX.MC', 'SAN.MC', 'IBE.MC', 'BBVA.MC', 'TEF.MC', 'REP.MC', 'FER.MC', 'AMS.MC',
  // Italy (.MI)
  'ENI.MI', 'ISP.MI', 'ENEL.MI', 'UCG.MI', 'G.MI',
  // Nordics
  'NOVO-B.CO', 'DSV.CO', 'ORSTED.CO', 'VWS.CO', 'CARL-B.CO',
  'ATCO-A.ST', 'VOLV-B.ST', 'ERIC-B.ST', 'INVE-B.ST', 'SAND.ST', 'HM-B.ST', 'SEB-A.ST', 'SWED-A.ST', 'NDA-SE.ST', 'ASSA-B.ST',
  'EQNR.OL', 'TEL.OL', 'NHY.OL',
  'NOKIA.HE', 'SAMPO.HE', 'UPM.HE', 'KNEBV.HE', 'FORTUM.HE',
];

export const SCREENER_TICKERS: string[] = [...US_TICKERS, ...EUROPE_TICKERS];
