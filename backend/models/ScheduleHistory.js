import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ScheduleHistory = sequelize.define('ScheduleHistory', {
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
  contact_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'contacts', key: 'id' },
    onDelete: 'CASCADE',
  },
  mobile: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  contact_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('sent', 'failed'),
    allowNull: false,
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'schedule_histories',
  timestamps: false,
  underscored: true,
});

export default ScheduleHistory;
