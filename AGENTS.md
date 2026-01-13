# Backend Project Structure

```
core-platform-backend/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── common/           # Shared reusable code
│   ├── modules/          # Feature modules
│   ├── db/               # Database configuration
│   │   ├── db.config.ts
│   │   ├── migrations/
│   │   └── seeders/
│   ├── utils/            # Utility functions
│   │   └── __tests__/
│   └── index.d.ts
├── infra/                # Infrastructure (dockerfiles, nginx, entrypoints)
├── scripts/              # Build and utility scripts
├── test/                 # Test files (unit, integration, e2e)
├── certs/                # SSL certificates
├── volume/               # Docker volumes
└── logs/                 # Application logs
```

## Technology Stack

- **Framework**: NestJS 10
- **ORM**: MikroORM 6 with PostgreSQL
- **Testing**: Vitest with supertest
- **Authentication**: Better Auth (See `src/modules/auth`)
- **Validation**: class-validator + class-transformer
- **Logging**: Winston with daily rotation

## DO's

- Use enums over string literal union types
- Extract magic values to constants (SNAKE_CASE_CAPS)
- Follow NestJS conventions (Controller → Service → Repository pattern)
- Use MikroORM custom repositories extending `CustomSQLBaseRepository`
- Use `dayjs` for date manipulation
- Define entities in `src/common/entities` with `CustomBaseEntity` extension
- Use Swagger decorators with `@ApiProperty` on enum properties
- Extend `AbstractBaseSerializer` for response transformation
- Write tests using Vitest with `vitest-mock-extended`

## DONT's

- **DON'T** Add useless comments
- **DON'T** Skip tests when modifying features
- **DON'T** Use `any` type; use `unknown` if structure unknown
- **DON'T** Call `flush()` inside repositories; call in service layer
- **DON'T** Directly use MikroORM entity manager; use custom repositories
- **DON'T** Use string literal union types; use enums
- **DON'T** Put constants in types files; keep in helpers or constants file

## Naming Conventions

| Type         | Convention            | Example            |
| ------------ | --------------------- | ------------------ |
| Entities     | Singular, PascalCase  | `User`             |
| Entity Files | Plural, kebab-case    | `users.entity.ts`  |
| Classes      | PascalCase            | `UsersService`     |
| DTOs         | [Action][Entity]Dto   | `CreateUserDto`    |
| Responses    | PascalCase + Response | `UserResponse`     |
| Interfaces   | IPascalCase           | `IUser`            |
| Types        | TPascalCase           | `TUser`            |
| Enums        | EPascalCase           | `ERoles`           |
| Constants    | SNAKE_CASE_CAPS       | `MAX_USERS`        |
| Functions    | camelCase             | `helperFunction()` |

## Module Structure

Each feature module follows this pattern:

```
module-name/
├── module-name.module.ts
├── module-name.controller.ts
├── module-name.service.ts
├── module-name.repository.ts
├── module-name.dtos.ts
├── module-name.interfaces.ts
├── module-name.helpers.ts
├── module-name.constants.ts
└── adapters/   # External service adapters (optional)
```

## Testing Structure

```
test/
├── module-name/
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── e2e/            # End-to-end tests
└── utils/              # Test utilities and fixtures
```
