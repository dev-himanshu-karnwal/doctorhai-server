import { UserEntity } from '../entities';
import { UserResponseDto } from '../dto';

export interface UserDocLike {
  _id: { toString(): string };
  email: string;
  name?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class UserMapper {
  static toDomain(doc: UserDocLike): UserEntity {
    return new UserEntity(
      doc._id.toString(),
      doc.email,
      doc.name ?? null,
      doc.createdAt,
      doc.updatedAt,
    );
  }

  static toResponse(entity: UserEntity): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = entity.id;
    dto.email = entity.email;
    dto.name = entity.name;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
