import { AuthService } from '../services/auth.service.js';
import config from '../config/index.js';

export class AuthController {
  static async initAdmin(req, res, next) {
    try {
      const admin = await AuthService.initAdmin(req.body);
      res.status(201).json({ success: true, data: admin });
    } catch (error) {
      if (error.message === 'Admin account already exists.' || error.message === 'Invalid initialization token.') {
        return res.status(403).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const result = await AuthService.login(req.body);
      
      if (!result) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }

      // Set HttpOnly cookie
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      res.status(200).json({ success: true, data: result.admin });
    } catch (error) {
      next(error);
    }
  }

  static async logout(_req, res) {
    res.clearCookie('token');
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  }

  static async me(req, res, next) {
    try {
      const adminId = req.user.id;
      const admin = await AuthService.getAdminById(adminId);
      
      if (!admin) {
        return res.status(401).json({ success: false, message: 'Admin not found.' });
      }

      res.status(200).json({ success: true, data: admin });
    } catch (error) {
      next(error);
    }
  }
}
