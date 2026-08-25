import { BrokerType } from './enums/broker-type.enum';

export interface BrokerCredentialField {
  key: string;
  label: string;
  secret: boolean;
  mask?: (value: string) => string;
}

const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!domain) {
    return `${local.slice(0, 3)}***`;
  }
  return `${local.slice(0, 3)}***@${domain}`;
};

export const BROKER_CREDENTIAL_FIELDS: Record<BrokerType, BrokerCredentialField[]> = {
  [BrokerType.Xtb]: [
    { key: 'email', label: 'Email', secret: false, mask: maskEmail },
    { key: 'password', label: 'Password', secret: true },
  ],
};
