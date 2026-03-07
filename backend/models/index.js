import User from './User.js';
import Group from './Group.js';
import Contact from './Contact.js';
import Template from './Template.js';
import Schedule from './Schedule.js';
import ScheduleHistory from './ScheduleHistory.js';
import QueueJob from './QueueJob.js';
import sequelize from '../config/database.js';

// Associations
User.hasMany(Group, { foreignKey: 'user_id' });
Group.belongsTo(User, { foreignKey: 'user_id' });
Group.hasMany(Contact, { foreignKey: 'group_id' });
Contact.belongsTo(Group, { foreignKey: 'group_id' });
User.hasMany(Contact, { foreignKey: 'user_id' });
Contact.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Template, { foreignKey: 'user_id' });
Template.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Schedule, { foreignKey: 'user_id' });
Schedule.belongsTo(User, { foreignKey: 'user_id' });
Schedule.belongsTo(Group, { foreignKey: 'group_id' });
Group.hasMany(Schedule, { foreignKey: 'group_id' });
Schedule.belongsTo(Template, { foreignKey: 'template_id' });
Template.hasMany(Schedule, { foreignKey: 'template_id' });
Schedule.hasMany(ScheduleHistory, { foreignKey: 'schedule_id' });
ScheduleHistory.belongsTo(Schedule, { foreignKey: 'schedule_id' });
Schedule.hasOne(QueueJob, { foreignKey: 'schedule_id' });
QueueJob.belongsTo(Schedule, { foreignKey: 'schedule_id' });
ScheduleHistory.belongsTo(Contact, { foreignKey: 'contact_id' });
Contact.hasMany(ScheduleHistory, { foreignKey: 'contact_id' });

const models = {
  User,
  Group,
  Contact,
  Template,
  Schedule,
  ScheduleHistory,
  QueueJob,
  sequelize,
};

export { User, Group, Contact, Template, Schedule, ScheduleHistory, QueueJob, sequelize };
export default models;
