import { Group, Contact } from '../models/index.js';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('file');

/** Parse CSV text into array of objects */
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;
    const line = lines[i];
    for (let j = 0; j <= line.length; j++) {
      const c = line[j];
      if (c === '"') inQuotes = !inQuotes;
      else if ((c === ',' && !inQuotes) || c === undefined) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else current += c || '';
    }
    if (current) values.push(current.trim().replace(/^"|"$/g, ''));
    const obj = {};
    headers.forEach((h, idx) => (obj[h] = values[idx] || ''));
    rows.push(obj);
  }
  return rows;
}

/** Generate CSV from contacts */
function toCSV(contacts, includeGroup = true) {
  const headers = includeGroup ? ['group_name', 'name', 'mobile'] : ['name', 'mobile'];
  const rows = contacts.map((c) =>
    includeGroup
      ? [c.group?.name || '', c.name, c.mobile].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
      : [c.name, c.mobile].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
  );
  return [headers.join(','), ...rows].join('\r\n');
}

/** Sample CSV content - name, mobile only */
const SAMPLE_CSV = 'name,mobile\n"John Doe","919876543210"\n"Jane Smith","919876543211"\n"Bob Wilson","919876543212"';

export const getGroups = async (req, res) => {
  const groups = await Group.findAll({
    where: { user_id: req.userId },
    order: [['name', 'ASC']],
    include: [{ model: Contact, as: 'Contacts', attributes: ['id'] }],
  });
  const withCount = groups.map((g) => ({
    id: g.id,
    name: g.name,
    created_at: g.created_at,
    contact_count: g.Contacts?.length || 0,
  }));
  res.json({ success: true, groups: withCount });
};

export const createGroup = async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Group name is required' });
  }
  const group = await Group.create({ user_id: req.userId, name: name.trim() });
  res.status(201).json({ success: true, group });
};

export const updateGroup = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const group = await Group.findOne({ where: { id, user_id: req.userId } });
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Group name is required' });
  }
  await group.update({ name: name.trim() });
  res.json({ success: true, group });
};

export const deleteGroup = async (req, res) => {
  const { id } = req.params;
  const group = await Group.findOne({ where: { id, user_id: req.userId } });
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
  await group.destroy();
  res.json({ success: true, message: 'Group deleted' });
};

export const getContacts = async (req, res) => {
  const { group_id } = req.query;
  const where = { user_id: req.userId };
  if (group_id) where.group_id = group_id;
  const contacts = await Contact.findAll({
    where,
    include: [{ model: Group, as: 'Group', attributes: ['id', 'name'] }],
    order: [['name', 'ASC']],
  });
  res.json({ success: true, contacts });
};

export const createContact = async (req, res) => {
  const { group_id, name, mobile } = req.body;
  if (!group_id || !name?.trim() || !mobile?.trim()) {
    return res.status(400).json({ success: false, message: 'Group, name and mobile are required' });
  }
  const group = await Group.findOne({ where: { id: group_id, user_id: req.userId } });
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
  const mobileClean = String(mobile).replace(/\D/g, '');
  if (!mobileClean) {
    return res.status(400).json({ success: false, message: 'Valid mobile number is required' });
  }
  const contact = await Contact.create({
    user_id: req.userId,
    group_id,
    name: name.trim(),
    mobile: mobileClean,
  });
  res.status(201).json({ success: true, contact });
};

export const updateContact = async (req, res) => {
  const { id } = req.params;
  const { group_id, name, mobile } = req.body;
  const contact = await Contact.findOne({ where: { id, user_id: req.userId } });
  if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
  const updates = {};
  if (group_id) {
    const group = await Group.findOne({ where: { id: group_id, user_id: req.userId } });
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    updates.group_id = group_id;
  }
  if (name?.trim()) updates.name = name.trim();
  if (mobile?.trim()) {
    const mobileClean = String(mobile).replace(/\D/g, '');
    if (!mobileClean) return res.status(400).json({ success: false, message: 'Valid mobile number is required' });
    updates.mobile = mobileClean;
  }
  await contact.update(updates);
  res.json({ success: true, contact });
};

export const deleteContact = async (req, res) => {
  const { id } = req.params;
  const contact = await Contact.findOne({ where: { id, user_id: req.userId } });
  if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
  await contact.destroy();
  res.json({ success: true, message: 'Contact deleted' });
};

export const importContacts = async (req, res) => {
  const group_id = req.query.group_id || req.body?.group_id;
  if (!group_id) return res.status(400).json({ success: false, message: 'Select a group first' });

  const group = await Group.findOne({ where: { id: group_id, user_id: req.userId } });
  if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

  return new Promise((resolve, reject) => {
    upload(req, res, async (err) => {
      if (err) return reject(res.status(400).json({ success: false, message: 'File upload failed' }));
      const file = req.file;
      if (!file || !file.buffer) {
        return resolve(res.status(400).json({ success: false, message: 'No file uploaded' }));
      }
      const text = file.buffer.toString('utf-8');
      const rows = parseCSV(text);
      if (rows.length === 0) {
        return resolve(res.status(400).json({ success: false, message: 'No valid rows in CSV' }));
      }
      const nameCol = rows[0].name !== undefined ? 'name' : (rows[0].contact_name !== undefined ? 'contact_name' : Object.keys(rows[0])[0]);
      const mobileCol = rows[0].mobile !== undefined ? 'mobile' : (rows[0].phone !== undefined ? 'phone' : (rows[0].number !== undefined ? 'number' : Object.keys(rows[0])[1]));
      let created = 0;
      let skipped = 0;

      for (const row of rows) {
        const name = (row[nameCol] || '').trim();
        const mobile = String(row[mobileCol] || '').replace(/\D/g, '');

        if (!name || !mobile) {
          skipped++;
          continue;
        }

        const [, createdFlag] = await Contact.findOrCreate({
          where: { user_id: req.userId, group_id, mobile },
          defaults: { user_id: req.userId, group_id, name, mobile },
        });
        if (createdFlag) created++;
      }

      resolve(res.json({ success: true, imported: created, skipped, message: `Imported ${created} contacts, skipped ${skipped}` }));
    });
  });
};

export const exportContacts = async (req, res) => {
  const { group_id } = req.query;
  if (!group_id) return res.status(400).json({ success: false, message: 'Select a group first' });
  const where = { user_id: req.userId, group_id };
  const contacts = await Contact.findAll({
    where,
    include: [{ model: Group, as: 'Group', attributes: ['name'] }],
    order: [
      [{ model: Group, as: 'Group' }, 'name', 'ASC'],
      ['name', 'ASC'],
    ],
  });
  const csv = toCSV(contacts, false);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="contacts_export.csv"');
  res.send('\uFEFF' + csv);
};

export const downloadSample = async (req, res) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="contacts_sample.csv"');
  res.send('\uFEFF' + SAMPLE_CSV);
};
