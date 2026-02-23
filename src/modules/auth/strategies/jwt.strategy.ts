import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';

export interface JwtPayload {
  sub: string;
  loginType: string;
  loginValue: string;
}

function extractJwtFromCookieOrBearer(
  cookieName: string,
): (req: Request) => string | null {
  return (req: Request): string | null => {
    if (req?.cookies?.[cookieName]) {
      return req.cookies[cookieName] as string;
    }
    const auth = req?.headers?.authorization;
    if (auth?.startsWith('Bearer ')) {
      return auth.slice(7);
    }
    return null;
  };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    const secret = config.get<string>('jwt.secret');
    const cookieName = config.get<string>('jwt.cookieName') ?? 'access_token';
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        extractJwtFromCookieOrBearer(cookieName),
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: secret ?? 'change-me-in-production-use-long-random-string',
    });
  }

  validate(payload: {
    sub: string;
    loginType?: string;
    loginValue?: string;
  }): JwtPayload {
    return {
      sub: payload.sub,
      loginType: payload.loginType ?? 'email',
      loginValue: payload.loginValue ?? '',
    };
  }
}
