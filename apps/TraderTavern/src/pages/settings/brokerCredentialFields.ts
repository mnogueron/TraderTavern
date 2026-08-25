export type BrokerType = 'xtb';

export interface BrokerCredentialField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'password';
}

export const BROKER_LABELS: Record<BrokerType, string> = {
  xtb: 'XTB',
};

export const BROKER_CREDENTIAL_FIELDS: Record<BrokerType, BrokerCredentialField[]> = {
  xtb: [
    { key: 'accountId', label: 'Account ID', type: 'text' },
    { key: 'password', label: 'Password', type: 'password' },
  ],
};
