export type WorkflowStatus =
  | 'draft'
  | 'in_progress'
  | 'in_review'
  | 'approved'
  | 'ready_for_dev';

export interface StatusMeta {
  label: string;
  color: { r: number; g: number; b: number };
  textColor: { r: number; g: number; b: number };
  hex: string;
}

export const STATUS_CONFIG: Record<WorkflowStatus, StatusMeta> = {
  draft: {
    label: 'Draft',
    color: { r: 0.55, g: 0.58, b: 0.63 }, // #8C94A0
    textColor: { r: 1, g: 1, b: 1 },
    hex: '#8C94A0',
  },
  in_progress: {
    label: 'In Progress',
    color: { r: 0.16, g: 0.5, b: 0.98 }, // #2980FA
    textColor: { r: 1, g: 1, b: 1 },
    hex: '#2980FA',
  },
  in_review: {
    label: 'In Review',
    color: { r: 0.96, g: 0.62, b: 0.05 }, // #F59E0B
    textColor: { r: 0.1, g: 0.1, b: 0.1 },
    hex: '#F59E0B',
  },
  approved: {
    label: 'Approved',
    color: { r: 0.55, g: 0.36, b: 0.96 }, // #8C5CF6
    textColor: { r: 1, g: 1, b: 1 },
    hex: '#8C5CF6',
  },
  ready_for_dev: {
    label: 'Ready for Dev',
    color: { r: 0.06, g: 0.72, b: 0.51 }, // #10B981
    textColor: { r: 1, g: 1, b: 1 },
    hex: '#10B981',
  },
};

export interface FrameStatusItem {
  id: string;
  name: string;
  status: WorkflowStatus;
  x: number;
  y: number;
}

// 메시지 액션 타입
export type PluginAction =
  | { type: 'CREATE_CONNECTORS'; label?: string; lineStyle?: 'solid' | 'dashed' }
  | { type: 'ADD_STEP_BADGES'; startNumber?: number }
  | { type: 'SET_STATUS'; status: WorkflowStatus }
  | { type: 'GET_STATUS_LIST' }
  | { type: 'FOCUS_FRAME'; nodeId: string }
  | { type: 'CREATE_TEMPLATE'; templateType: 'user_flow' | 'screen_spec' | 'feature_roadmap' };

export type CoreToUIMessage =
  | {
      type: 'SELECTION_CHANGED';
      count: number;
      names: string[];
      currentStatus?: WorkflowStatus;
    }
  | {
      type: 'STATUS_LIST_UPDATED';
      items: FrameStatusItem[];
    }
  | {
      type: 'TOAST';
      message: string;
      level: 'info' | 'success' | 'warning' | 'error';
    };
