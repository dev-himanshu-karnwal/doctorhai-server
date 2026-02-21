# ============================================================

# CURSOR RULES — NestJS + MongoDB + Mongoose Modular Monolith

# Production-Grade Application Standards

# ============================================================

# ─────────────────────────────────────────────

# 0. PHILOSOPHY & MINDSET

# ─────────────────────────────────────────────

- Every line of code must justify its existence.
- Optimize for readability first, performance second, cleverness never.
- Write code as if the next maintainer is a senior engineer who will review every decision.
- Prefer boring, explicit, well-named code over terse, implicit, "clever" code.
- Fail loudly in development; gracefully in production.
- **Prefer event-driven communication** between modules and for side effects to keep coupling minimal and boundaries clear.

# ─────────────────────────────────────────────

# 1. ARCHITECTURE — MODULAR MONOLITH

# ─────────────────────────────────────────────

## 1.1 Core Principle

The application is a **Modular Monolith**: a single deployable unit composed of
strongly-bounded, loosely-coupled feature modules. Each module is self-contained
and could, in theory, be extracted into a microservice with minimal refactoring.

## 1.2 Top-Level Directory Structure

```
src/
├── app.module.ts                  # Root module — only imports feature modules
├── main.ts                        # Bootstrap only
├── common/                        # Shared kernel (NO business logic)
│   ├── constants/
│   ├── decorators/
│   ├── dto/                       # Shared DTOs (pagination, cursor, etc.)
│   ├── enums/
│   ├── events/                    # Typed event payloads (event-driven boundaries)
│   ├── exceptions/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── interfaces/
│   ├── middlewares/
│   ├── pipes/
│   └── utils/
├── config/                        # Configuration modules (typed)
│   ├── app.config.ts
│   ├── database.config.ts
│   └── ...
├── database/                      # Mongoose setup
│   ├── database.module.ts
│   ├── schemas/                   # Shared or base schemas (if any)
│   └── ...
├── modules/                       # Feature modules (bounded contexts)
│   ├── auth/
│   ├── users/
│   ├── [domain]/
│   └── ...
└── infra/                         # Infrastructure concerns
    ├── cache/
    ├── queue/
    ├── mail/
    └── storage/
```

## 1.3 Feature Module Internal Structure

Every feature module MUST follow this layout exactly:

```
modules/[feature]/
├── [feature].module.ts
├── [feature].controller.ts
├── [feature].repository.ts        # Data-access layer
├── services/                        # Business logic
│   └── [feature].service.ts
│   └── [sub-feature].service.ts
├── dto/
│   ├── create-[feature].dto.ts
│   ├── update-[feature].dto.ts
│   └── [feature]-response.dto.ts
├── entities/
│   └── [feature].entity.ts        # Domain entity (plain class, not Mongoose document)
├── interfaces/
│   └── [feature]-service.interface.ts
├── mappers/
│   └── [feature].mapper.ts        # Mongoose document ↔ Domain entity
├── enums/
│   └── [feature].enum.ts
├── events/                        # Domain events (if applicable)
├── guards/                        # Module-specific guards
```

## 1.4 Layer Responsibilities

| Layer      | File              | Responsibility                                              |
| ---------- | ----------------- | ----------------------------------------------------------- |
| Controller | `*.controller.ts` | HTTP boundary only: parse request, call service, return DTO |
| Service    | `*.service.ts`    | Business logic, orchestration, domain rules                 |
| Repository | `*.repository.ts` | Data access; abstracts Mongoose; returns domain entities    |
| Mapper     | `*.mapper.ts`     | Converts between Mongoose documents and domain entities     |
| DTO        | `dto/*.dto.ts`    | Input/output contracts; validated with class-validator      |
| Entity     | `entities/*.ts`   | Pure domain object; no Mongoose document types outside repo |

**RULES:**

- Controllers MUST NOT contain business logic.
- Services MUST NOT import Mongoose document types directly — only domain entities.
- Repositories MUST NOT contain business logic.
- **No cross-module direct service injection** — use events (preferred) or a shared interface; events keep modules independent and reduce coupling.
- Modules expose only what's in their `exports` array.

# ─────────────────────────────────────────────

# 2. SOLID PRINCIPLES — STRICT ENFORCEMENT

# ─────────────────────────────────────────────

## S — Single Responsibility Principle

- One class = one reason to change.
- Services handle ONE domain concern. If a service exceeds ~200 lines(excluding comments), extract a sub-service.
- A method does ONE thing. If it needs a comment to explain what it does, extract it.

## O — Open/Closed Principle

- Extend behavior via new classes, not by modifying existing ones.
- Use strategies, decorators, and composition instead of if/else chains on type checks.
- Example: payment processors, notification channels, export formats → Strategy pattern.

## L — Liskov Substitution Principle

- Subtypes must be substitutable for their base types without altering correctness.
- Never override a method with behavior that violates the parent's contract.
- Prefer composition over inheritance.

## I — Interface Segregation Principle

- Define narrow interfaces. Never force a class to implement methods it doesn't use.
- Split large interfaces into role-specific ones.
- Example: `IReadableRepository` + `IWritableRepository` rather than one fat `IRepository`.

## D — Dependency Inversion Principle

- High-level modules depend on abstractions, not concretions.
- Every service MUST depend on an interface, not a concrete class.
- Register interface tokens in the module providers using `useClass`.

```typescript
// ✅ Correct
@Injectable()
export class OrderService {
  constructor(
    @Inject(ORDER_REPOSITORY_TOKEN)
    private readonly orderRepo: IOrderRepository,
  ) {}
}

// ❌ Wrong
@Injectable()
export class OrderService {
  constructor(private readonly orderRepo: OrderRepository) {} // concrete
}
```

# ─────────────────────────────────────────────

# 3. DRY — DON'T REPEAT YOURSELF

# ─────────────────────────────────────────────

- Extract any logic used in 2+ places into `/common/*` or a shared service.
- Use generic base classes (e.g., `BaseRepository<T>`) for standard CRUD patterns.
- Share validation logic via reusable class-validator decorators in `common/decorators/`.
- Use `@ApiProperty()` inheritance from a `BaseResponseDto` to avoid DTO duplication.
- Define error messages and string constants in `common/constants/` — never inline.
- Use TypeScript generics aggressively to remove type-level duplication.

```typescript
// ✅ Generic Base Repository
export abstract class BaseRepository<T, CreateInput, UpdateInput> {
  constructor(protected readonly model: Model<Document>) {}

  abstract findById(id: string): Promise<T | null>;
  abstract create(data: CreateInput): Promise<T>;
  abstract update(id: string, data: UpdateInput): Promise<T>;
  abstract delete(id: string): Promise<void>;
}
```

# ─────────────────────────────────────────────

# 4. DESIGN PATTERNS — MANDATORY

# ─────────────────────────────────────────────

## 4.1 Repository Pattern

- ALL database access goes through a repository.
- Repositories return domain entities, NEVER raw Mongoose documents.
- Repositories accept/return plain domain types, never DTOs.

## 4.2 Mapper Pattern

- Every module has a mapper that converts Mongoose documents ↔ domain entities ↔ response DTOs.
- Mappers are pure functions (static methods or a dedicated class).

```typescript
export class UserMapper {
  static toDomain(doc: UserDocument): UserEntity { ... }
  static toResponse(entity: UserEntity): UserResponseDto { ... }
  static toMongooseCreate(dto: CreateUserDto): Record<string, unknown> { ... }
}
```

## 4.3 Strategy Pattern

- Use for interchangeable algorithms (e.g., auth strategies, payment providers, exporters).
- Define a common interface; inject via token; select at runtime.

## 4.4 Factory Pattern

- Use factory methods/classes to construct complex domain objects or service instances.
- Never put construction logic inside a constructor.

## 4.5 Decorator Pattern

- Leverage NestJS custom decorators for cross-cutting concerns (auth, roles, current user).
- Prefer decorators over repeating guard logic inline.

## 4.6 Event-Driven Architecture — PREFERRED FOR DECOUPLING

- **Default to events** wherever one module or layer needs to react to something another did. Prefer event-driven over direct calls to minimize coupling.
- Cross-module communication **MUST** use NestJS `EventEmitter2` events, **NOT** direct service injection. Never import another feature’s service (e.g. `UserService` in `OrderModule`) — emit an event and let subscribers react.
- **Within a module**, use events for: side effects (e.g. send email, invalidate cache), async follow-ups, or when the same action triggers multiple independent flows. Keeps the core flow simple and side effects decoupled.
- **Event contracts**: Define typed event payloads in `common/events/` (or module `events/` for module-internal). Use past-tense, dot-notation names: `order.created`, `user.registered`, `payment.completed`.
- **Fire-and-forget**: Emitters must not depend on handler results. Handlers run asynchronously; do not use events as RPC. For request/response, keep a direct call within the same module or use CQRS.
- **Single responsibility per handler**: One handler = one reaction. Multiple handlers for the same event are fine (e.g. `order.created` → send email, update analytics, notify warehouse).

```typescript
// common/events/order.events.ts
export class OrderCreatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly totalCents: number,
  ) {}
}

// In OrderService (OrderModule)
this.eventEmitter.emit('order.created', new OrderCreatedEvent(order.id, order.userId, order.totalCents));

// In NotificationModule — no import of OrderModule/OrderService
@OnEvent('order.created')
async handleOrderCreated(event: OrderCreatedEvent): Promise<void> {
  await this.notificationService.sendOrderConfirmation(event.orderId, event.userId);
}

// In AnalyticsModule — same event, different handler
@OnEvent('order.created')
async handleOrderCreatedForAnalytics(event: OrderCreatedEvent): Promise<void> {
  await this.analyticsService.trackOrderCreated(event);
}
```

## 4.7 CQRS (where complexity warrants)

- For complex domains, use `@nestjs/cqrs` with Commands, Queries, and Handlers.
- Queries never mutate state. Commands never return query results.

## 4.8 Guard Pattern

- Authentication: `JwtAuthGuard` (global)
- Authorization: `RolesGuard` + `@Roles()` decorator
- Ownership: `OwnershipGuard` where applicable
- Never inline auth checks inside service methods.

# ─────────────────────────────────────────────

# 5. MONGOOSE + MONGODB RULES

# ─────────────────────────────────────────────

## 5.1 Mongoose Module & Connection

- Use `MongooseModule.forRootAsync()` in the root database module with config from `ConfigService`.
- Register feature schemas with `MongooseModule.forFeature([{ name: 'User', schema: UserSchema }])` in each feature module (or a shared database module that re-exports models).

```typescript
// database/database.module.ts
@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('database.uri'),
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
```

## 5.2 Schema Rules

- Every schema MUST have: `_id` (Mongoose default) — use `Schema.Types.ObjectId` for references.
- Every schema MUST have: `createdAt` and `updatedAt` (use `timestamps: true`).
- Use `collection: 'collection_name'` in schema options to explicitly name MongoDB collections.
- Soft-delete schemas use `deletedAt: Date` (optional). NEVER use hard deletes in production.
- Index all fields used in queries: `schema.index({ field: 1 })`. Use `unique: true` on natural unique keys.

```typescript
export const UserSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'users' },
);
UserSchema.index({ email: 1 });
```

## 5.3 Query Rules

- NEVER use `findOne()` without `sort()` when order matters — results are otherwise non-deterministic.
- NEVER use `deleteMany()` without an explicit filter (protect against accidents).
- Use `.select()` to limit returned fields and `.lean()` for read-only queries (returns plain objects, avoids Mongoose document overhead).
- Use **sessions** for multi-step writes that must be atomic. Wrap in try/catch; re-throw domain exceptions.
- Repositories must implement soft-delete: always add `{ deletedAt: null }` to query filters.

```typescript
// ✅ Correct soft-delete filter
async findAll(): Promise<UserEntity[]> {
  const docs = await this.userModel
    .find({ deletedAt: null })
    .sort({ createdAt: -1 })
    .select('id email name createdAt')
    .lean()
    .exec();
  return docs.map(UserMapper.toDomain);
}
```

## 5.4 Transactions (Mongoose sessions)

```typescript
async transferFunds(from: string, to: string, amount: number): Promise<void> {
  const session = await this.connection.startSession();
  session.startTransaction();
  try {
    await this.accountModel.updateOne(
      { _id: from },
      { $inc: { balance: -amount } },
      { session },
    );
    await this.accountModel.updateOne(
      { _id: to },
      { $inc: { balance: amount } },
      { session },
    );
    await session.commitTransaction();
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
}
```

# ─────────────────────────────────────────────

# 6. NESTJS CONVENTIONS & RULES

# ─────────────────────────────────────────────

## 6.1 Modules

- Every feature module is `@Module({ imports, controllers, providers, exports })`.
- `AppModule` ONLY imports feature modules + global infra modules. No providers in AppModule.
- Use `forRoot()`/`forRootAsync()` for configurable infrastructure modules.
- Use `forFeature()` for module-scoped registrations (queues, etc.).

## 6.2 Controllers

```typescript
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: IUserService) {}

  @Get(':id')
  @ApiOkResponse({ type: UserResponseDto })
  async findOne(
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<UserResponseDto> {
    return this.userService.findById(id);
  }
}
```

Rules:

- Always annotate with `@ApiTags`, `@ApiOkResponse`, `@ApiBearerAuth` (Swagger).
- Use custom pipes for param transformation (e.g., `ParseObjectIdPipe`).
- Return DTOs, not entities.
- Use `@HttpCode(HttpStatus.X)` explicitly for non-200 responses.
- Prefix all routes with the resource name.

## 6.3 Services

- Services implement an interface (`IUserService`).
- Services throw domain exceptions — NEVER return null to signal failure.
- Services MUST be stateless. No instance state between requests.
- Keep methods focused: one public method = one use case.

## 6.4 Dependency Injection Tokens

```typescript
// common/constants/injection-tokens.ts
export const USER_REPOSITORY_TOKEN = Symbol('IUserRepository');
export const MAIL_SERVICE_TOKEN = Symbol('IMailService');
```

## 6.5 Configuration

- Use `@nestjs/config` with Joi schema validation.
- Never access `process.env` directly outside config files.
- Create a typed config service per domain using `ConfigService.get<T>()`.
- All configs must have defaults and be validated at startup.

```typescript
// config/app.config.ts
export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
}));
```

# ─────────────────────────────────────────────

# 7. DTOs & VALIDATION

# ─────────────────────────────────────────────

- All DTOs use `class-validator` + `class-transformer`.
- All DTOs extend `BaseDto` if they share common fields.
- Apply `@Transform` for sanitization (trim strings, lowercase emails).
- Use `@Type()` for nested objects.
- Enable global `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true, transform: true`.

```typescript
// main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }),
);
```

```typescript
export class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  name?: string;
}
```

## Pagination DTO (shared)

```typescript
export class PaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit: number = 20;
}

export class PaginatedResponseDto<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
```

# ─────────────────────────────────────────────

# 8. ERROR HANDLING

# ─────────────────────────────────────────────

## 8.1 Domain Exceptions

Create domain-specific exceptions extending NestJS HTTP exceptions:

```typescript
// common/exceptions/not-found.exception.ts
export class ResourceNotFoundException extends NotFoundException {
  constructor(resource: string, id: string) {
    super(`${resource} with id '${id}' was not found`);
  }
}

export class BusinessRuleViolationException extends UnprocessableEntityException {
  constructor(message: string) {
    super(message);
  }
}
```

## 8.2 Global Exception Filter

- Implement a `GlobalExceptionFilter` that catches ALL unhandled exceptions.
- Log full error context (stack, request id, user id, path).
- Return a consistent error response shape:

```json
{
  "statusCode": 404,
  "message": "User with id 'abc' was not found",
  "error": "Not Found",
  "requestId": "uuid",
  "timestamp": "ISO-8601"
}
```

## 8.3 Rules

- NEVER expose internal stack traces or Mongoose/DB errors to clients in production.
- NEVER swallow errors silently (`catch (e) {}`).
- ALWAYS log errors with context before re-throwing or returning.
- Use `try/catch` only at repository/infra layer boundaries.
- Let exceptions propagate naturally through service → controller → filter.

# ─────────────────────────────────────────────

# 9. SECURITY

# ─────────────────────────────────────────────

- Use `helmet()` globally.
- Use `@nestjs/throttler` for rate limiting (configure per-route for sensitive endpoints).
- Sanitize all user input. Never pass raw user strings to queries.
- Use `bcrypt` (cost ≥ 12) for password hashing. NEVER `md5`, `sha1`, plain text.
- JWT: short-lived access tokens (15min), refresh tokens with rotation + family invalidation.
- Store refresh tokens hashed in DB.
- Never log passwords, tokens, PII, or secrets.
- Validate and whitelist `ObjectId` params with a `ParseObjectIdPipe`.
- CORS: Whitelist origins explicitly. Never use `origin: '*'` in production.
- Set appropriate content-security-policy headers via helmet.

```typescript
// common/pipes/parse-object-id.pipe.ts
@Injectable()
export class ParseObjectIdPipe implements PipeTransform {
  transform(value: string): string {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(`'${value}' is not a valid ObjectId`);
    }
    return value;
  }
}
```

# ─────────────────────────────────────────────

# 10. AUTHENTICATION & AUTHORIZATION

# ─────────────────────────────────────────────

- Use `@nestjs/passport` with `passport-jwt`.
- Global `JwtAuthGuard` applied at module level — opt-out with `@Public()` decorator.
- Role-based access control via `@Roles(Role.ADMIN)` + `RolesGuard`.
- Current user injected via `@CurrentUser()` decorator.

```typescript
// common/decorators/public.decorator.ts
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// common/decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload =>
    ctx.switchToHttp().getRequest().user,
);

// common/decorators/roles.decorator.ts
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

# ─────────────────────────────────────────────

# 11. LOGGING

# ─────────────────────────────────────────────

- Use a structured logger (e.g., `winston` via `nest-winston` or `pino` via `nestjs-pino`).
- Every log entry MUST include: `level`, `message`, `requestId`, `timestamp`, `context`.
- Log at appropriate levels: `error` (failures), `warn` (unexpected but recoverable), `info` (lifecycle events), `debug` (dev only).
- Never use `console.log` in production code.
- Inject `Logger` from `@nestjs/common` in every service with its class name as context.
- Implement a `LoggingInterceptor` to log all incoming requests and outgoing responses.

```typescript
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  async findById(id: string): Promise<UserEntity> {
    this.logger.debug(`Finding user by id: ${id}`);
    const user = await this.userRepo.findById(id);
    if (!user) throw new ResourceNotFoundException('User', id);
    return user;
  }
}
```

# ─────────────────────────────────────────────

# 12. TESTING — MANDATORY COVERAGE

# ─────────────────────────────────────────────

## 12.1 Strategy

| Test Type   | Tool                                   | Target Coverage                   |
| ----------- | -------------------------------------- | --------------------------------- |
| Unit        | Jest + ts-jest                         | Services, mappers, utils — 90%+   |
| Integration | Jest + Mongoose (in-memory or test DB) | Repositories                      |
| E2E         | Jest + supertest                       | Controller → DB happy + sad paths |

## 12.2 Rules

- Every service method has at least one unit test (happy path + each exception path).
- Mock ALL external dependencies (repositories, external services) using Jest mocks.
- Use factory functions to generate test data — never hardcode fixture objects inline.
- Tests MUST be deterministic. No `Math.random()`, no real timers, no external calls.
- Use `beforeEach` to reset mocks: `jest.clearAllMocks()`.
- Name tests descriptively: `describe('UserService.findById')` → `it('should throw ResourceNotFoundException when user does not exist')`.

```typescript
describe('UserService', () => {
  let service: UserService;
  let mockRepo: jest.Mocked<IUserRepository>;

  beforeEach(async () => {
    mockRepo = { findById: jest.fn(), create: jest.fn(), ... } as any;
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: USER_REPOSITORY_TOKEN, useValue: mockRepo },
      ],
    }).compile();
    service = module.get(UserService);
  });

  describe('findById', () => {
    it('should return user entity when found', async () => {
      mockRepo.findById.mockResolvedValue(userEntityFactory());
      const result = await service.findById('valid-id');
      expect(result).toBeDefined();
      expect(mockRepo.findById).toHaveBeenCalledWith('valid-id');
    });

    it('should throw ResourceNotFoundException when user not found', async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.findById('missing-id')).rejects.toThrow(ResourceNotFoundException);
    });
  });
});
```

# ─────────────────────────────────────────────

# 13. API DESIGN & SWAGGER

# ─────────────────────────────────────────────

- RESTful conventions: `GET /resources`, `POST /resources`, `GET /resources/:id`, `PATCH /resources/:id`, `DELETE /resources/:id`.
- Use `PATCH` for partial updates (not `PUT`).
- Version the API via URI prefix: `/api/v1/`.
- All endpoints documented with `@ApiTags`, `@ApiOperation`, `@ApiOkResponse`, `@ApiBadRequestResponse`, `@ApiNotFoundResponse`, `@ApiBearerAuth`.
- Use `@ApiProperty({ example: '...' })` on all DTO fields.
- Swagger enabled in non-production environments only.
- Return 201 for resource creation, 200 for reads/updates, 204 for deletes.

# ─────────────────────────────────────────────

# 14. INTERCEPTORS & PIPES (GLOBAL)

# ─────────────────────────────────────────────

Register globally in `main.ts`:

```typescript
app.useGlobalFilters(new GlobalExceptionFilter(logger));
app.useGlobalInterceptors(
  new RequestIdInterceptor(),    // Attach uuid to every request
  new LoggingInterceptor(logger),
  new TransformInterceptor(),    // Wrap responses in { data, meta }
  new TimeoutInterceptor(30_000),
);
app.useGlobalPipes(new ValidationPipe({ ... }));
app.useGlobalGuards(new JwtAuthGuard(reflector));
```

## TransformInterceptor Response Shape

```json
{
  "data": { ... },
  "meta": { "requestId": "uuid", "timestamp": "ISO-8601" }
}
```

# ─────────────────────────────────────────────

# 15. REUSABILITY PATTERNS

# ─────────────────────────────────────────────

## 15.1 Generic CRUD Service Base

```typescript
export abstract class BaseCrudService<Entity, CreateDto, UpdateDto> {
  constructor(protected readonly repo: IBaseRepository<Entity, CreateDto, UpdateDto>) {}

  async findAll(pagination: PaginationDto): Promise<PaginatedResponseDto<Entity>> { ... }
  async findById(id: string): Promise<Entity> { ... }
  async create(dto: CreateDto): Promise<Entity> { ... }
  async update(id: string, dto: UpdateDto): Promise<Entity> { ... }
  async softDelete(id: string): Promise<void> { ... }
}
```

## 15.2 Reusable Decorators

- `@Public()` — skip auth guard
- `@Roles(...roles)` — RBAC
- `@CurrentUser()` — inject user from JWT
- `@ApiPaginatedResponse(Dto)` — Swagger paginated schema
- `@ParseObjectId()` — param decorator with validation

## 15.3 Utility Functions (common/utils/)

- `paginate(items, total, dto): PaginatedResponseDto` — standardize pagination
- `toObjectId(id: string): ObjectId` — safe conversion
- `exclude<T, K>(obj: T, keys: K[]): Omit<T, K>` — omit sensitive fields
- `sleep(ms: number): Promise<void>` — testing and retry utilities

# ─────────────────────────────────────────────

# 16. HEALTH & OBSERVABILITY

# ─────────────────────────────────────────────

- Implement `/health` endpoint using `@nestjs/terminus`.
- Check: database connectivity, disk space, memory heap.
- Expose metrics via `@willsoto/nestjs-prometheus` or OpenTelemetry.
- Track: request count, response time (p50/p95/p99), error rate, queue depth.
- `/health` and `/metrics` endpoints must be excluded from auth and rate limiting.

# ─────────────────────────────────────────────

# 17. ENVIRONMENT & DEPLOYMENT

# ─────────────────────────────────────────────

- Required env vars validated at startup via Joi — app MUST NOT start with missing config.
- `NODE_ENV` values: `development`, `test`, `production`.
- Use `.env.example` with all keys (no values). Never commit `.env`.
- Multi-stage `Dockerfile`: `builder` → `production`. Non-root user in production image.
- `docker-compose.yml` for local dev with MongoDB + Mongo Express.
- Graceful shutdown: handle `SIGTERM` / `SIGINT`, drain in-flight requests, close DB connections.

```typescript
// main.ts
const app = await NestFactory.create(AppModule);
app.enableShutdownHooks();
app.setGlobalPrefix('api/v1');
```

# ─────────────────────────────────────────────

# 18. CODE STYLE & NAMING CONVENTIONS

# ─────────────────────────────────────────────

| Element        | Convention              | Example                   |
| -------------- | ----------------------- | ------------------------- |
| Files          | kebab-case              | `user-profile.service.ts` |
| Classes        | PascalCase              | `UserProfileService`      |
| Interfaces     | PascalCase + `I` prefix | `IUserRepository`         |
| Variables      | camelCase               | `currentUser`             |
| Constants      | UPPER_SNAKE_CASE        | `MAX_RETRY_ATTEMPTS`      |
| Enums          | PascalCase              | `UserRole.ADMIN`          |
| DI Tokens      | UPPER_SNAKE_CASE        | `USER_REPOSITORY_TOKEN`   |
| DB Collections | snake_case (plural)     | `user_profiles`           |
| REST endpoints | kebab-case (plural)     | `/api/v1/user-profiles`   |
| Events         | dot.notation            | `order.created`           |
| Test files     | `*.spec.ts`             | `user.service.spec.ts`    |

## Linting & Formatting

- ESLint with `@typescript-eslint` strict rules.
- Prettier for formatting. Enforce via pre-commit hooks (husky + lint-staged).
- `@typescript-eslint/no-explicit-any`: ERROR — never use `any`.
- `@typescript-eslint/explicit-function-return-type`: ERROR on public methods.
- `no-console`: ERROR in production code.
- `eqeqeq`: ERROR — always use `===`.

# ─────────────────────────────────────────────

# 19. GIT & COMMIT CONVENTIONS

# ─────────────────────────────────────────────

- Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.
- Branch naming: `feature/`, `fix/`, `hotfix/`, `chore/`.
- No direct commits to `main` or `develop`. All changes via pull request.
- PR must: pass all tests, pass lint, have at least 1 approval.
- Squash merge only (clean linear history).

# ─────────────────────────────────────────────

# 20. WHAT IS STRICTLY FORBIDDEN

# ─────────────────────────────────────────────

❌ `any` TypeScript type — use `unknown` and narrow it.
❌ Direct Mongoose document types outside the repository layer.
❌ Direct `process.env` access outside config files.
❌ `console.log` in application code.
❌ Business logic in controllers or repositories.
❌ Cross-module direct service injection — use event-driven communication (EventEmitter2) instead.
❌ Hard-deleting records without explicit domain justification.
❌ Returning Mongoose/DB errors or stack traces to API consumers.
❌ Committing secrets, `.env` files, or credentials.
❌ Skipping tests for "simple" methods — all public methods need tests.
❌ TODO comments without a linked issue.
❌ Mutable shared state between requests.
❌ `findOne()` without `sort()` when order matters.
❌ Empty catch blocks.
❌ `==` instead of `===`.
❌ Inline magic strings or numbers — always use constants or enums.

# ─────────────────────────────────────────────

# 21. QUICK CHECKLIST — BEFORE EVERY PR

# ─────────────────────────────────────────────

- [ ] All new classes implement an interface.
- [ ] No Mongoose document types leak outside repositories.
- [ ] Mapper converts Mongoose document ↔ entity ↔ DTO correctly.
- [ ] All new endpoints have Swagger decorators.
- [ ] All new services have unit tests (happy + error paths).
- [ ] No `any` types introduced.
- [ ] No direct `process.env` access.
- [ ] All new config keys added to `.env.example`.
- [ ] Error handling delegates to domain exceptions.
- [ ] Soft-delete filter applied in all repository queries.
- [ ] No business logic in controllers.
- [ ] Cross-module communication is event-driven only (no direct service injection).
- [ ] Lint passes: `npm run lint`.
- [ ] Tests pass: `npm run test`.
- [ ] Build passes: `npm run build`.
