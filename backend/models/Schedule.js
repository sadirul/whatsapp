import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Schedule = sequelize.define('Schedule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  },
  group_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'groups', key: 'id' },
    onDelete: 'CASCADE',
  },
  template_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'templates', key: 'id' },
    onDelete: 'CASCADE',
  },
  scheduled_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'running', 'completed', 'failed', 'cancelled'),
    defaultValue: 'pending',
  },
  total_contacts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  sent_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  failed_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  executed_at: {
    type: DataTypes.DATE,
    allowNull: true,
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
}, {
  tableName: 'schedules',
  timestamps: true,
  underscored: true,
});

export default Schedule;
