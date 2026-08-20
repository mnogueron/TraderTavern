import { Role } from '../../shared/role.enum';

export type JwtPayload = {
  sub: string;
  role: Role;
};
