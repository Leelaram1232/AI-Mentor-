import { create } from 'zustand';

const useDashboardStore = create((set) => ({
  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  mentorTopic: null,
  setMentorTopic: (topic) => set({ mentorTopic: topic }),

  examTopic: null,
  setExamTopic: (topic) => set({ examTopic: topic }),

  // Persistence for Learn Tab
  roadmap: null,
  setRoadmap: (data) => set({ roadmap: data }),
  bookmarks: [],
  setBookmarks: (data) => set({ bookmarks: data }),
  skillGap: null,
  setSkillGap: (data) => set({ skillGap: data }),
}));

export default useDashboardStore;
