import mongoose, { Connection } from 'mongoose';
import * as bcrypt from 'bcryptjs';

export type DataSource = Connection;

export async function createDataSource(): Promise<DataSource> {
  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/doctorhai';
  const conn = mongoose.createConnection(uri);
  await conn.asPromise();
  return conn;
}

export async function closeDataSource(conn: DataSource): Promise<void> {
  await conn.close();
}

interface SeedPermission {
  key: string;
  description?: string | null;
}

interface SeedRole {
  name: string;
  description?: string | null;
  isSystem?: boolean;
  permissionKeys?: string[];
}

function getOrCreateModel<T>(
  conn: DataSource,
  name: string,
  schema: mongoose.Schema,
): mongoose.Model<T> {
  return (conn.models[name] ?? conn.model(name, schema)) as mongoose.Model<T>;
}

export async function seedPermissions(
  conn: DataSource,
  data: SeedPermission[],
): Promise<void> {
  const mod =
    (await import('../../../modules/auth/schemas/permission.schema')) as {
      PermissionSchema: mongoose.Schema;
    };
  const Permission = getOrCreateModel(conn, 'Permission', mod.PermissionSchema);
  for (const item of data) {
    await Permission.findOneAndUpdate(
      { key: item.key },
      { $set: { key: item.key, description: item.description ?? null } },
      { upsert: true, new: true },
    );
  }
}

export async function seedRoles(
  conn: DataSource,
  data: SeedRole[],
): Promise<void> {
  const roleMod =
    (await import('../../../modules/auth/schemas/role.schema')) as {
      RoleSchema: mongoose.Schema;
    };
  const permMod =
    (await import('../../../modules/auth/schemas/permission.schema')) as {
      PermissionSchema: mongoose.Schema;
    };
  const Role = getOrCreateModel(conn, 'Role', roleMod.RoleSchema);
  const Permission = getOrCreateModel(
    conn,
    'Permission',
    permMod.PermissionSchema,
  );
  for (const item of data) {
    let permissionIds: mongoose.Types.ObjectId[] = [];
    if (item.permissionKeys?.length) {
      const perms = await Permission.find({
        key: { $in: item.permissionKeys },
      });
      permissionIds = perms.map((p) => p._id);
    }
    await Role.findOneAndUpdate(
      { name: item.name },
      {
        $set: {
          name: item.name,
          description: item.description ?? null,
          isSystem: item.isSystem ?? false,
          permissions: permissionIds,
        },
      },
      { upsert: true, new: true },
    );
  }
}

export async function seedSuperadmin(
  conn: DataSource,
  data: { name: string; email: string; password: string },
  bcryptRounds = 12,
): Promise<void> {
  const userMod =
    (await import('../../../modules/users/schemas/user.schema')) as {
      UserSchema: mongoose.Schema;
    };
  const accountMod =
    (await import('../../../modules/auth/schemas/account.schema')) as {
      AccountSchema: mongoose.Schema;
    };
  const roleMod =
    (await import('../../../modules/auth/schemas/role.schema')) as {
      RoleSchema: mongoose.Schema;
    };
  const User = getOrCreateModel(conn, 'User', userMod.UserSchema);
  const Account = getOrCreateModel(conn, 'Account', accountMod.AccountSchema);
  const Role = getOrCreateModel(conn, 'Role', roleMod.RoleSchema);

  const superadminRole = await Role.findOne({ name: 'superadmin' });
  if (!superadminRole) {
    throw new Error('superadmin role not found - run seedRoles first');
  }

  await User.findOneAndUpdate(
    { email: data.email },
    { $set: { email: data.email, name: data.name } },
    { upsert: true, new: true },
  );

  const passwordHash = (await bcrypt.hash(
    data.password,
    bcryptRounds,
  )) as string;
  await Account.findOneAndUpdate(
    { loginType: 'email', loginValue: data.email },
    {
      $set: {
        loginType: 'email',
        loginValue: data.email,
        passwordHash,
        isActive: true,
        roles: [
          {
            roleId: superadminRole._id,
            grantedBy: null,
            grantedAt: new Date(),
          },
        ],
      },
    },
    { upsert: true, new: true },
  );
}
