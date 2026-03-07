import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  api_key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  whatsapp_status: {
    type: DataTypes.ENUM('connected', 'disconnected'),
    defaultValue: 'disconnected',
  },
  webhook_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  gemini_api_key: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ai_auto_reply_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
});

export default User;
