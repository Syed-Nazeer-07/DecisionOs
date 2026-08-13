import { supabase } from './supabase'

let _cache = {}
let _userId = null
let _lastSyncedState = {}

export const supabaseProvider = {
  read() {
    return _cache
  },
  
  write(records) {
    _cache = records
    if (!_userId) return
    
    const toUpsert = []
    const currentIds = new Set(Object.keys(records))
    
    // Find modified or new
    for (const d of Object.values(records)) {
      const stateStr = JSON.stringify(d)
      if (_lastSyncedState[d.id] !== stateStr) {
        toUpsert.push({
          id: d.id,
          user_id: _userId,
          title: d.title,
          nodes: d.nodes,
          viewport: d.viewport,
          nodecount: d.nodeCount,
          created_at: new Date(d.createdAt).toISOString(),
          updated_at: new Date(d.updatedAt).toISOString()
        })
        _lastSyncedState[d.id] = stateStr
      }
    }
    
    // Find deletions
    const deletedIds = Object.keys(_lastSyncedState).filter(id => !currentIds.has(id))
    
    // Handle deletes
    if (deletedIds.length > 0) {
      supabase.from('decisions').delete().in('id', deletedIds).then(({ error }) => {
        if (!error) {
          deletedIds.forEach(id => delete _lastSyncedState[id])
        }
      })
    }
    
    // Handle upserts
    if (toUpsert.length > 0) {
      supabase.from('decisions').upsert(toUpsert).then(({ error }) => {
        if (error) {
          console.error('Cloud sync failed:', error)
          // If it failed, delete from _lastSyncedState so we try again next time
          toUpsert.forEach(row => delete _lastSyncedState[row.id])
        }
      })
    }
  }
}

export async function initSupabaseStore(user) {
  _userId = user.id
  _cache = {}
  _lastSyncedState = {}
  
  const { data, error } = await supabase
    .from('decisions')
    .select('*')
    .eq('user_id', user.id)
    
  if (error) {
    console.error('Error fetching cloud decisions:', error)
    return {}
  }
  
  const fetched = {}
  data.forEach(d => {
    fetched[d.id] = {
      id: d.id,
      title: d.title,
      createdAt: new Date(d.created_at).getTime(),
      updatedAt: new Date(d.updated_at).getTime(),
      nodeCount: d.nodecount ?? (d.nodes || []).filter(n => !n.isPlaceholder).length,
      nodes: d.nodes || [],
      viewport: d.viewport
    }
    _lastSyncedState[d.id] = JSON.stringify(fetched[d.id])
  })
  
  _cache = fetched
  return fetched
}

export function clearSupabaseStore() {
  _cache = {}
  _userId = null
  _lastSyncedState = {}
}

export function mergeLocalToCloud(localRecords) {
  for (const id in localRecords) {
    if (!_cache[id]) {
      _cache[id] = localRecords[id]
    }
  }
}
