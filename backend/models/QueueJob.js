import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const QueueJob = sequelize.define('QueueJob', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  schedule_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'schedules', key: 'id' },
    onDelete: 'CASCADE',
  },
  job_type: {
    type: DataTypes.STRING(50),
    defaultValue: 'schedule',
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled'),
    defaultValue: 'pending',
  },
  execute_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  max_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 3,
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  error_message: {
    type: DataTypes.TEXT,
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
  tableName: 'queue_jobs',
  timestamps: true,
  underscored: true,
});

export default QueueJob;
