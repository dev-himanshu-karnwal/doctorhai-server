import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string;
  loginType: string;
  loginValue: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    const secret = config.get<string>('jwt.secret');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
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
