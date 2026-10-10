import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import prisma from '../db.js';
import config from '../config/index.js';

export class AuthService {
  static async initAdmin({ email, username, password, initToken }) {
    if (initToken !== config.adminInitToken) {
      throw new Error('Invalid initialization token.');
    }

    const existingAdmin = await prisma.admin.findFirst();
    if (existingAdmin) {
      throw new Error('Admin account already exists.');
    }

    const hashedPassword = await argon2.hash(password);

    const admin = await prisma.admin.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        password: hashedPassword,
      },
    });

    return { id: admin.id, email: admin.email, username: admin.username };
  }

  static async login({ identifier, password }) {
    const admin = await prisma.admin.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { username: identifier.toLowerCase() },
        ],
      },
    });

    if (!admin) {
      return null;
    }

    const isValid = await argon2.verify(admin.password, password);
    if (!isValid) {
      return null;
    }

    const token = jwt.sign(
      { id: admin.id, role: 'admin' },
      config.jwtSecret,
      { expiresIn: '1d' }
    );

    return {
      admin: { id: admin.id, email: admin.email, username: admin.username },
      token,
    };
  }

  static async getAdminById(id) {
    const admin = await prisma.admin.findUnique({
      where: { id },
      select: { id: true, email: true, username: true, createdAt: true },
    });
    return admin;
  }
}
