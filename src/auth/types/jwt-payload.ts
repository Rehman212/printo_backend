export type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

export type JwtPayloadUser = {
  userId: string;
  email: string;
  role: string;
};
