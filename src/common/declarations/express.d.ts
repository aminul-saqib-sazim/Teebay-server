declare global {
  namespace Express {
    interface IUser {
      id: string;
      email: string;
      name: string;
      emailVerified: boolean;
      image?: string | null;
      createdAt: Date;
      updatedAt: Date;
      firstName: string;
      lastName: string;
      state?: string | null;
      firstLoginAt?: Date | null;
    }

    interface ISession {
      id: string;
      token: string;
      userId: string;
      expiresAt: Date;
      createdAt: Date;
      updatedAt: Date;
      ipAddress?: string | null;
      userAgent?: string | null;
      activeOrganizationId?: string | null;
      activeOrganizationRole?: string | null;
    }

    interface Request {
      user?: IUser;
      session?: {
        user: IUser;
        session: ISession;
      };
    }
  }
}

export {};
