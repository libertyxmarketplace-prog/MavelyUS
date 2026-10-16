import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const TICKETS_FILE = path.join(DATA_DIR, 'tickets.json');
const DESK_FILE = path.join(DATA_DIR, 'ticket_desk.json');
const PANELS_FILE = path.join(DATA_DIR, 'ticket_panels.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJsonFile(filePath, defaultData) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return defaultData;
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
  }
}

/* ==================== DESK STATUS STORAGE ==================== */

export function loadDeskData() {
  return readJsonFile(DESK_FILE, {
    status: 'online',
    disabledCategories: []
  });
}

export function saveDeskData(data) {
  writeJsonFile(DESK_FILE, data);
}

export function setDeskStatus(status) {
  const desk = loadDeskData();
  desk.status = status;
  saveDeskData(desk);
  return desk;
}

export function hasUserReadRules(userId) {
  const desk = loadDeskData();
  return Array.isArray(desk.rulesReadUsers) && desk.rulesReadUsers.includes(userId);
}

export function markUserReadRules(userId) {
  const desk = loadDeskData();
  if (!Array.isArray(desk.rulesReadUsers)) {
    desk.rulesReadUsers = [];
  }
  if (!desk.rulesReadUsers.includes(userId)) {
    desk.rulesReadUsers.push(userId);
    saveDeskData(desk);
  }
  return true;
}

export function isCategoryDisabled(categoryId) {
  const desk = loadDeskData();
  if (desk.status === 'closed') return true;
  return Array.isArray(desk.disabledCategories) && desk.disabledCategories.includes(categoryId);
}

export function closeCategory(categoryId) {
  const desk = loadDeskData();
  if (!Array.isArray(desk.disabledCategories)) desk.disabledCategories = [];
  if (!desk.disabledCategories.includes(categoryId)) {
    desk.disabledCategories.push(categoryId);
    saveDeskData(desk);
  }
  return desk;
}

export function openCategory(categoryId) {
  const desk = loadDeskData();
  if (!Array.isArray(desk.disabledCategories)) desk.disabledCategories = [];
  desk.disabledCategories = desk.disabledCategories.filter(c => c !== categoryId);
  saveDeskData(desk);
  return desk;
}

export function closeAllCategories() {
  const desk = loadDeskData();
  desk.disabledCategories = ['general', 'management'];
  saveDeskData(desk);
  return desk;
}

export function openAllCategories() {
  const desk = loadDeskData();
  desk.disabledCategories = [];
  saveDeskData(desk);
  return desk;
}

export function isReportStaffDisabled() {
  const desk = loadDeskData();
  return Boolean(desk.reportStaffDisabled);
}

export function setReportStaffDisabled(disabled) {
  const desk = loadDeskData();
  desk.reportStaffDisabled = Boolean(disabled);
  saveDeskData(desk);
  return desk;
}

/* ==================== PANEL MESSAGE STORAGE ==================== */

export function loadPanelsData() {
  return readJsonFile(PANELS_FILE, {
    panels: []
  });
}

export function savePanelsData(data) {
  writeJsonFile(PANELS_FILE, data);
}

export function addPanelRecord(channelId, messageId, bottomMessageId = null) {
  const data = loadPanelsData();
  if (!Array.isArray(data.panels)) data.panels = [];

  // Remove existing entry for same messageId if any
  data.panels = data.panels.filter(p => p.messageId !== messageId);
  data.panels.push({ channelId, messageId, bottomMessageId, createdAt: Date.now() });
  savePanelsData(data);
}

export function removePanelRecord(messageId) {
  const data = loadPanelsData();
  if (!Array.isArray(data.panels)) return;
  data.panels = data.panels.filter(p => p.messageId !== messageId);
  savePanelsData(data);
}

/* ==================== TICKETS STORAGE ==================== */

export function loadTicketsData() {
  return readJsonFile(TICKETS_FILE, {
    active: {},
    history: []
  });
}

export function saveTicketsData(data) {
  writeJsonFile(TICKETS_FILE, data);
}

export function getActiveTicket(channelId) {
  const data = loadTicketsData();
  return data.active?.[channelId] || null;
}

export function saveActiveTicket(channelId, ticketInfo) {
  const data = loadTicketsData();
  if (!data.active) data.active = {};
  data.active[channelId] = {
    ...ticketInfo,
    updatedAt: Date.now()
  };
  saveTicketsData(data);
  return data.active[channelId];
}

export function deleteActiveTicket(channelId) {
  const data = loadTicketsData();
  if (data.active && data.active[channelId]) {
    delete data.active[channelId];
    saveTicketsData(data);
  }
}

export function archiveTicket(ticketRecord) {
  const data = loadTicketsData();
  if (!Array.isArray(data.history)) data.history = [];
  data.history.push({
    ...ticketRecord,
    archivedAt: Date.now()
  });
  if (data.active && data.active[ticketRecord.channelId]) {
    delete data.active[ticketRecord.channelId];
  }
  saveTicketsData(data);
}

export function updateArchivedReason(channelId, newReason) {
  const data = loadTicketsData();
  if (!Array.isArray(data.history)) return false;
  const ticket = data.history.find(h => h.channelId === channelId);
  if (ticket) {
    ticket.closeReason = newReason;
    ticket.reasonUpdatedAt = Date.now();
    saveTicketsData(data);
    return ticket;
  }
  return false;
}
