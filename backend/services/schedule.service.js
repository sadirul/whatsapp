import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pkg from 'whatsapp-web.js';
const { MessageMedia } = pkg;
import { User, Group, Contact, Template, Schedule, ScheduleHistory } from '../models/index.js';
import { getWhatsAppClient, removeClient } from './whatsapp.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const formatChatId = (number) => (number.includes('@') ? number : `${number}@c.us`);

/** Execute a schedule: send template to all contacts in the group */
export async function executeSchedule(scheduleId) {
  const schedule = await Schedule.findOne({
    where: { id: scheduleId },
    include: [
      { model: Group, as: 'Group' },
      { model: Template, as: 'Template' },
      { model: User, as: 'User' },
    ],
  });
  if (!schedule) return null;
  if (['completed', 'failed', 'cancelled'].includes(schedule.status)) return schedule;

  const { User: user, Group: group, Template: template } = schedule;
  if (!user || !group || !template) return null;

  if (user.whatsapp_status !== 'connected') {
    await schedule.update({
      status: 'failed',
      error_message: 'WhatsApp is not connected',
      executed_at: new Date(),
    });
    return schedule;
  }

  const contacts = await Contact.findAll({
    where: { group_id: schedule.group_id, user_id: schedule.user_id },
  });
  if (contacts.length === 0) {
    await schedule.update({
      status: 'completed',
      total_contacts: 0,
      sent_count: 0,
      failed_count: 0,
      executed_at: new Date(),
    });
    return schedule;
  }

  await schedule.update({
    status: 'running',
    total_contacts: contacts.length,
    executed_at: new Date(),
  });

  let client;
  try {
    const result = await getWhatsAppClient(schedule.user_id);
    client = result.client;
    if (!client?.info) {
      throw new Error('WhatsApp session expired');
    }
  } catch (err) {
    await schedule.update({
      status: 'failed',
      error_message: err.message || 'Failed to get WhatsApp client',
    });
    return schedule;
  }

  let sentCount = 0;
  let failedCount = 0;

  for (const contact of contacts) {
    const chatId = formatChatId(contact.mobile);
    try {
      if (template.type === 'text') {
        await client.sendMessage(chatId, template.message || '');
      } else if (template.type === 'media') {
        const filePath = path.join(__dirname, '..', template.file_path);
        if (!fs.existsSync(filePath)) {
          throw new Error('Template file not found');
        }
        const fileBuffer = fs.readFileSync(filePath);
        const ext = path.extname(template.file_name || '').toLowerCase();
        const mimeMap = {
          '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif',
          '.webp': 'image/webp', '.pdf': 'application/pdf', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg',
        };
        const mimetype = mimeMap[ext] || 'application/octet-stream';
        const media = new MessageMedia(mimetype, fileBuffer.toString('base64'), template.file_name);
        await client.sendMessage(chatId, media, { caption: template.caption || '' });
      } else if (template.type === 'media_url') {
        const media = await MessageMedia.fromUrl(template.media_url, { unsafeMime: true });
        await client.sendMessage(chatId, media, { caption: template.caption || '' });
      }
      sentCount++;
      await ScheduleHistory.create({
        schedule_id: schedule.id,
        contact_id: contact.id,
        mobile: contact.mobile,
        contact_name: contact.name,
        status: 'sent',
        sent_at: new Date(),
      });
    } catch (err) {
      failedCount++;
      await ScheduleHistory.create({
        schedule_id: schedule.id,
        contact_id: contact.id,
        mobile: contact.mobile,
        contact_name: contact.name,
        status: 'failed',
        error_message: err.message || 'Send failed',
        sent_at: new Date(),
      });
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  await schedule.update({
    status: 'completed',
    sent_count: sentCount,
    failed_count: failedCount,
  });
  return schedule;
}
