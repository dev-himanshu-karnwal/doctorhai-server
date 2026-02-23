import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../../config';
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
  constructor(appConfig: AppConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        extractJwtFromCookieOrBearer(appConfig.jwtCookieName),
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: appConfig.jwtSecret,
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
