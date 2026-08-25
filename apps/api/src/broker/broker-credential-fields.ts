import { BrokerType } from './enums/broker-type.enum';

export interface BrokerCredentialField {
  key: string;
  label: string;
  secret: boolean;
  mask?: (value: string) => string;
}

const maskAccountId = (accountId: string): string => {
  if (accountId.length <= 4) {
    return `${accountId.slice(0, 1)}***`;
  }
  return `${accountId.slice(0, 2)}***${accountId.slice(-2)}`;
};

export const BROKER_CREDENTIAL_FIELDS: Record<BrokerType, BrokerCredentialField[]> = {
  [BrokerType.Xtb]: [
    { key: 'accountId', label: 'Account ID', secret: false, mask: maskAccountId },
    { key: 'password', label: 'Password', secret: true },
  ],
};
