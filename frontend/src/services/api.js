import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

export const api = {
  // Projects
  getProjects: () => axios.get(`${API_BASE}/projects/`),
  createProject: (data) => axios.post(`${API_BASE}/projects/`, data),
  getProject: (id) => axios.get(`${API_BASE}/projects/${id}`),
  deleteProject: (id) => axios.delete(`${API_BASE}/projects/${id}`),

  // Chapters
  getChapters: (projectId) => axios.get(`${API_BASE}/chapters/${projectId}`),
  createChapter: (projectId, data) => axios.post(`${API_BASE}/chapters/${projectId}`, data),
  getChapter: (chapterId) => axios.get(`${API_BASE}/chapters/single/${chapterId}`),
  updateChapter: (chapterId, data) => axios.put(`${API_BASE}/chapters/${chapterId}`, data),
  deleteChapter: (chapterId) => axios.delete(`${API_BASE}/chapters/${chapterId}`),

  // Entities
  getEntities: (projectId, entityType) => {
    const params = entityType ? `?entity_type=${entityType}` : '';
    return axios.get(`${API_BASE}/entities/${projectId}${params}`);
  },
  getEntityMentions: (entityId) => axios.get(`${API_BASE}/entities/${entityId}/mentions`),
  updateEntity: (entityId, data) => axios.put(`${API_BASE}/entities/${entityId}`, data),
  deleteEntity: (entityId) => axios.delete(`${API_BASE}/entities/${entityId}`),
  findDuplicates: (projectId) => axios.get(`${API_BASE}/entities/duplicates/${projectId}`),
  mergeEntities: (keepId, mergeIds) => axios.post(`${API_BASE}/entities/merge`, null, {
    params: { keep_id: keepId, merge_ids: mergeIds.join(',') }
  }),

  // AI Assistant
  askAssistant: (projectId, question, rebuildKb = false) => 
    axios.post(`${API_BASE}/assistant/${projectId}/ask`, { 
      question, 
      rebuild_kb: rebuildKb 
    }),
  rebuildKnowledgeBase: (projectId) => 
    axios.post(`${API_BASE}/assistant/${projectId}/rebuild-kb`),

  // Version Control
  getChapterVersions: (chapterId) => axios.get(`${API_BASE}/chapters/${chapterId}/versions`),
  getVersionContent: (versionId) => axios.get(`${API_BASE}/chapters/version/${versionId}`),
  createChapterVersion: (chapterId, summary) => 
    axios.post(`${API_BASE}/chapters/${chapterId}/create-version`, null, {
      params: { change_summary: summary }
    }),
  restoreVersion: (chapterId, versionId) => 
    axios.post(`${API_BASE}/chapters/${chapterId}/restore-version/${versionId}`),
};