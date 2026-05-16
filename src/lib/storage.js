import { supabase } from './supabaseClient';

/**
 * Storage utility that seamlessly switches between Supabase (Auth) 
 * and LocalStorage (Guest Mode).
 */

const LOCAL_STORAGE_KEY = 'merridian_guest_data';

const getLocalData = () => {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  return data ? JSON.parse(data) : { sessions: [], canvases: [], documents: [] };
};

const saveLocalData = (data) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
};

export const storage = {
  // --- Sessions & Messages ---
  
  async getSessions(session) {
    if (session) {
      const { data, error } = await supabase
        .from('sessions')
        .select('id, title, messages(id, role, content, created_at)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data.map(s => ({
        ...s,
        messages: s.messages ? s.messages.sort((a,b) => new Date(a.created_at) - new Date(b.created_at)) : []
      }));
    } else {
      return getLocalData().sessions;
    }
  },

  async createSession(session, title) {
    if (session) {
      const { data, error } = await supabase
        .from('sessions')
        .insert([{ title, user_id: session.user.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const local = getLocalData();
      const newSession = {
        id: `local-${Date.now()}`,
        title,
        messages: [],
        created_at: new Date().toISOString()
      };
      local.sessions.unshift(newSession);
      saveLocalData(local);
      return newSession;
    }
  },

  async saveMessage(session, sessionId, role, content) {
    if (session) {
      const { error } = await supabase
        .from('messages')
        .insert([{ session_id: sessionId, role, content }]);
      if (error) throw error;
    } else {
      const local = getLocalData();
      const sIdx = local.sessions.findIndex(s => s.id === sessionId);
      if (sIdx !== -1) {
        local.sessions[sIdx].messages.push({
          id: `msg-${Date.now()}`,
          role,
          content,
          created_at: new Date().toISOString()
        });
        saveLocalData(local);
      }
    }
  },

  async deleteSession(session, sessionId) {
    if (session) {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', session.user.id);
      if (error) throw error;
    } else {
      const local = getLocalData();
      local.sessions = local.sessions.filter(s => s.id !== sessionId);
      saveLocalData(local);
    }
  },

  // --- Canvases ---

  async getCanvas(session) {
    if (session) {
      const { data, error } = await supabase
        .from('canvases')
        .select('*')
        .eq('user_id', session.user.id)
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is 'no rows'
      return data;
    } else {
      return getLocalData().canvases[0];
    }
  },

  async updateCanvas(session, canvasId, updates) {
    if (session) {
      const { error } = await supabase
        .from('canvases')
        .update(updates)
        .eq('id', canvasId)
        .eq('user_id', session.user.id);
      if (error) throw error;
    } else {
      const local = getLocalData();
      if (local.canvases.length === 0) {
        local.canvases.push({ id: 'local-canvas', nodes: [], edges: [] });
      }
      local.canvases[0] = { ...local.canvases[0], ...updates };
      saveLocalData(local);
    }
  },

  async createInitialCanvas(session) {
    if (session) {
      const { data, error } = await supabase
        .from('canvases')
        .insert([{ nodes: [], edges: [], user_id: session.user.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const local = getLocalData();
      const newCanvas = { id: 'local-canvas', nodes: [], edges: [] };
      local.canvases = [newCanvas];
      saveLocalData(local);
      return newCanvas;
    }
  },

  // --- Documents ---

  async getDocuments(session) {
    if (session) {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      const local = getLocalData();
      return local.documents || [];
    }
  },

  async saveDocument(session, title, content) {
    if (session) {
      const { data, error } = await supabase
        .from('documents')
        .insert([{ user_id: session.user.id, title, content }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const local = getLocalData();
      if (!local.documents) local.documents = [];
      const newDoc = {
        id: `local-doc-${Date.now()}`,
        title,
        content,
        created_at: new Date().toISOString()
      };
      local.documents.unshift(newDoc);
      saveLocalData(local);
      return newDoc;
    }
  },

  async deleteDocument(session, docId) {
    if (session) {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId)
        .eq('user_id', session.user.id);
      if (error) throw error;
    } else {
      const local = getLocalData();
      if (local.documents) {
        local.documents = local.documents.filter(d => d.id !== docId);
        saveLocalData(local);
      }
    }
  },

  async migrateGuestData(session) {
    if (!session) return;
    const local = getLocalData();
    if (local.sessions.length === 0 && local.canvases.length === 0) return;

    // 1. Migrate Sessions & Messages
    for (const s of local.sessions) {
      const { data: newSess, error: sErr } = await supabase
        .from('sessions')
        .insert([{ title: s.title, user_id: session.user.id }])
        .select()
        .single();
      
      if (!sErr && newSess && s.messages.length > 0) {
        const msgs = s.messages.map(m => ({
          session_id: newSess.id,
          role: m.role,
          content: m.content,
          created_at: m.created_at
        }));
        await supabase.from('messages').insert(msgs);
      }
    }

    // 2. Migrate Canvas
    if (local.canvases.length > 0) {
      const c = local.canvases[0];
      // Check if user already has a canvas
      const { data: existing } = await supabase.from('canvases').select('id').eq('user_id', session.user.id).limit(1).single();
      if (existing) {
        await supabase.from('canvases').update({ nodes: c.nodes, edges: c.edges }).eq('id', existing.id);
      } else {
        await supabase.from('canvases').insert([{ nodes: c.nodes, edges: c.edges, user_id: session.user.id }]);
      }
    }

    // 3. Migrate Documents
    if (local.documents && local.documents.length > 0) {
      for (const doc of local.documents) {
        await supabase.from('documents').insert([{
          user_id: session.user.id,
          title: doc.title,
          content: doc.content
        }]);
      }
    }

    // 4. Clear local storage
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }
};
