import { UnprocessableEntityException } from '@nestjs/common';

export class BusinessRuleViolationException extends UnprocessableEntityException {
  constructor(message: string) {
    super(message);
  }
}
