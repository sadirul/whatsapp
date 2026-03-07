import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import customValidate from '../utils/customValidate.js';

export const getSettings = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: ['id', 'webhook_url', 'gemini_api_key', 'ai_auto_reply_enabled'],
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const hasGeminiKey = !!(user.gemini_api_key && user.gemini_api_key.trim());
    const geminiApiKeyMasked = hasGeminiKey
      ? '••••••••' + user.gemini_api_key.slice(-4)
      : '';

    return res.status(200).json({
      success: true,
      settings: {
        webhook_url: user.webhook_url || '',
        gemini_api_key: geminiApiKeyMasked,
        has_gemini_key: hasGeminiKey,
        ai_auto_reply_enabled: !!user.ai_auto_reply_enabled,
      },
    });
  } catch (error) {
    console.error('Get Settings Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { webhook_url, gemini_api_key, ai_auto_reply_enabled } = req.body;
    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updateData = {};

    if (webhook_url !== undefined) {
      const urlVal = typeof webhook_url === 'string' ? webhook_url.trim() : '';
      const validation = customValidate(
        { webhook_url: urlVal },
        { webhook_url: urlVal ? 'url' : 'string' }
      );
      if (!validation.status) {
        return res.status(400).json({ success: false, message: validation.message });
      }
      updateData.webhook_url = urlVal || null;
    }

    if (gemini_api_key !== undefined) {
      const keyVal = typeof gemini_api_key === 'string' ? gemini_api_key.trim() : '';
      if (keyVal && (keyVal.length < 10 || keyVal.startsWith('••••') || keyVal.includes('•'))) {
        return res.status(400).json({ success: false, message: 'Invalid Gemini API key' });
      }
      updateData.gemini_api_key = keyVal || null;
      if (!keyVal) {
        updateData.ai_auto_reply_enabled = false;
      } else if (ai_auto_reply_enabled !== undefined) {
        updateData.ai_auto_reply_enabled = !!ai_auto_reply_enabled;
      }
    } else if (ai_auto_reply_enabled !== undefined && user.gemini_api_key) {
      updateData.ai_auto_reply_enabled = !!ai_auto_reply_enabled;
    }

    await user.update(updateData);
    await user.reload();

    const hasGeminiKey = !!(user.gemini_api_key && user.gemini_api_key.trim());
    const geminiApiKeyMasked = hasGeminiKey
      ? '••••••••' + user.gemini_api_key.slice(-4)
      : '';

    return res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      settings: {
        webhook_url: user.webhook_url || '',
        gemini_api_key: geminiApiKeyMasked,
        has_gemini_key: hasGeminiKey,
        ai_auto_reply_enabled: !!user.ai_auto_reply_enabled,
      },
    });
  } catch (error) {
    console.error('Update Settings Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const validation = customValidate(
      { currentPassword, newPassword, confirmPassword },
      {
        currentPassword: 'required',
        newPassword: 'required|string|min:6',
        confirmPassword: 'required|same:newPassword',
      }
    );
    if (!validation.status) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change Password Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
