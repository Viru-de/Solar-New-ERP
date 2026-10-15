import React, { useState } from 'react';
import { ProjectStage, UserRole } from '../../types/solar';
import { StatusBadge } from '../common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { getCurrentGPSPosition } from '../../services/gps';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Calendar,
  User,
  Camera,
  FileText,
  MessageSquare,
  Send,
  Lock,
  Unlock,
  CheckSquare,
  Square,
  Upload,
  MapPin,
  Clock,
  ThumbsUp,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface StageCardProps {
  stage: ProjectStage;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdateStage: (stageKey: string, updates: Partial<ProjectStage>) => void;
  customerName: string;
  customerPhone: string;
  projectTitle: string;
  isLocked?: boolean;
  previousStageTitle?: string;
  stageIndex?: number;
}

export const StageCard: React.FC<StageCardProps> = ({
  stage,
  isExpanded,
  onToggleExpand,
  onUpdateStage,
  customerName,
  customerPhone,
  projectTitle,
  isLocked = false,
  previousStageTitle,
  stageIndex
}) => {
  const { currentUser, canApproveStage } = useAuth();
  const { openWhatsAppModal, showToast } = useApp();
  const [newNote, setNewNote] = useState('');
  const [isCapturingGPS, setIsCapturingGPS] = useState(false);

  const completedChecklistCount = stage.checklist.filter(item => item.completed).length;
  const isAllChecklistDone = stage.checklist.length > 0 && completedChecklistCount === stage.checklist.length;

  const handleToggleChecklist = (itemId: string) => {
    if (isLocked) {
      showToast(`Stage "${stage.title}" is locked. Complete Stage ${stage.order - 1}${previousStageTitle ? ` (${previousStageTitle})` : ''} first.`, 'warning');
      return;
    }

    const updatedChecklist = stage.checklist.map(item => {
      if (item.id === itemId) {
        const nextState = !item.completed;
        return {
          ...item,
          completed: nextState,
          completedBy: nextState ? currentUser.name : undefined,
          completedAt: nextState ? new Date().toISOString() : undefined
        };
      }
      return item;
    });

    onUpdateStage(stage.stageKey, { checklist: updatedChecklist });
    showToast(`Checklist item updated`, 'info');
  };

  const handleSimulatePhotoUpload = async () => {
    if (isLocked) {
      showToast(`Cannot upload photo: Stage "${stage.title}" is locked until Stage ${stage.order - 1} is completed.`, 'warning');
      return;
    }

    setIsCapturingGPS(true);
    const gps = await getCurrentGPSPosition();
    setIsCapturingGPS(false);

    // Simulated high-quality solar site photo
    const samplePhotos = [
      'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&q=80',
      'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&q=80',
      'https://images.unsplash.com/photo-1559302504-64aae6ca6b6f?w=600&q=80',
      'https://images.unsplash.com/photo-1545208942-e1c9c916524b?w=600&q=80'
    ];
    const randomUrl = samplePhotos[Math.floor(Math.random() * samplePhotos.length)];

    const newPhoto = {
      id: `photo-${Date.now()}`,
      url: randomUrl,
      caption: `Field Verification: ${stage.title}`,
      uploadedBy: currentUser.name,
      uploadedAt: new Date().toISOString(),
      gpsCoordinates: `${gps.latitude}, ${gps.longitude} (${gps.locationName})`
    };

    const updatedPhotos = [...stage.photos, newPhoto];
    onUpdateStage(stage.stageKey, { photos: updatedPhotos });
    showToast(`Photo captured with GPS coordinates (${gps.latitude}°, ${gps.longitude}°)`, 'success');
  };

  const handleAddNote = () => {
    if (isLocked) {
      showToast(`Cannot add note: Stage "${stage.title}" is locked.`, 'warning');
      return;
    }
    if (!newNote.trim()) return;
    const noteEntry = `${currentUser.name} (${new Date().toLocaleDateString('en-GB')}, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}): ${newNote.trim()}`;
    const updatedNotes = stage.notes ? `${stage.notes}\n\n${noteEntry}` : noteEntry;
    onUpdateStage(stage.stageKey, { notes: updatedNotes });
    setNewNote('');
    showToast('Field notes appended to stage record', 'success');
  };

  const handleMarkCompleted = () => {
    if (isLocked) {
      showToast(`Cannot complete stage: Stage "${stage.title}" is locked until Stage ${stage.order - 1} is finished.`, 'warning');
      return;
    }

    if (stage.checklist.length > 0 && completedChecklistCount < stage.checklist.length) {
      showToast(`Validation Required: Please complete all ${stage.checklist.length} checklist items before completing this stage. (${completedChecklistCount}/${stage.checklist.length} checked)`, 'warning');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    onUpdateStage(stage.stageKey, {
      status: 'COMPLETED',
      actualEndDate: today,
      completedDate: today
    });
    showToast(`Stage "${stage.title}" marked as COMPLETED! Next stage unlocked.`, 'success');
  };

  const handleRequestApproval = () => {
    if (isLocked) {
      showToast(`Cannot submit for review: Stage "${stage.title}" is locked.`, 'warning');
      return;
    }

    if (stage.checklist.length > 0 && completedChecklistCount < stage.checklist.length) {
      showToast(`Validation Required: Complete all ${stage.checklist.length} checklist items before submitting for PM approval. (${completedChecklistCount}/${stage.checklist.length} checked)`, 'warning');
      return;
    }

    onUpdateStage(stage.stageKey, {
      status: 'UNDER REVIEW'
    });
    showToast(`Approval requested for "${stage.title}". Notified Project Manager.`, 'info');
  };

  const handleApproveStage = () => {
    if (isLocked) {
      showToast(`Cannot approve stage: Stage "${stage.title}" is locked until Stage ${stage.order - 1} is finished.`, 'warning');
      return;
    }

    if (stage.checklist.length > 0 && completedChecklistCount < stage.checklist.length) {
      showToast(`Validation Required: All ${stage.checklist.length} checklist items must be verified before approving this stage. (${completedChecklistCount}/${stage.checklist.length} checked)`, 'warning');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    onUpdateStage(stage.stageKey, {
      status: 'COMPLETED',
      approvedBy: currentUser.name,
      approvedAt: today,
      approvalDate: today,
      actualEndDate: today,
      completedDate: today,
      approvalRemarks: `Approved by ${currentUser.role} ${currentUser.name}. Ready for subsequent execution phase.`
    });
    showToast(`Stage "${stage.title}" approved by ${currentUser.name}! Next stage unlocked.`, 'success');
  };

  const handleReopenStage = () => {
    onUpdateStage(stage.stageKey, {
      status: 'IN PROGRESS'
    });
    showToast(`Stage "${stage.title}" reopened for modifications. Subsequent stages reset to locked.`, 'warning');
  };

  return (
    <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
      isLocked
        ? 'border-slate-200 bg-slate-50/50 opacity-90'
        : stage.status === 'COMPLETED'
        ? 'border-emerald-200 bg-white'
        : stage.status === 'IN PROGRESS'
        ? 'border-amber-400 bg-white shadow-sm ring-1 ring-amber-400/30'
        : 'border-slate-200 bg-white'
    }`}>
      {/* Accordion Header Bar */}
      <div
        onClick={onToggleExpand}
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 select-none transition-colors"
      >
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {/* Order Badge */}
          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 transition-transform ${
            isLocked
              ? 'bg-slate-100 text-slate-400 border border-slate-200'
              : stage.status === 'COMPLETED'
              ? 'bg-emerald-600 text-white'
              : stage.status === 'IN PROGRESS'
              ? 'bg-amber-500 text-white'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}>
            {isLocked ? (
              <Lock className="w-4 h-4 text-slate-400" />
            ) : stage.status === 'COMPLETED' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              stage.order
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={`text-sm sm:text-base font-bold truncate ${isLocked ? 'text-slate-600' : 'text-slate-900'}`}>
                {stage.title}
              </h3>
              {isLocked ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  <Lock className="w-3 h-3 text-slate-400" />
                  Locked (Stage {stage.order})
                </span>
              ) : (
                <StatusBadge status={stage.status} size="sm" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1 font-medium">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{stage.assignedToName} ({stage.assignedRole})</span>
              </span>

              {stage.plannedEndDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Target: {stage.plannedEndDate}</span>
                </span>
              )}

              <span className="text-slate-400 font-medium">
                Checklist: {completedChecklistCount}/{stage.checklist.length}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-2">
          {/* Progress Pill */}
          <div className="hidden md:flex items-center gap-2 bg-slate-100 px-2.5 py-1 rounded-full text-xs font-semibold text-slate-600">
            <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${isLocked ? 'bg-slate-300' : stage.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${stage.checklist.length ? (completedChecklistCount / stage.checklist.length) * 100 : stage.status === 'COMPLETED' ? 100 : 0}%` }}
              />
            </div>
            <span>{stage.checklist.length ? Math.round((completedChecklistCount / stage.checklist.length) * 100) : stage.status === 'COMPLETED' ? 100 : 0}%</span>
          </div>

          <button className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-400">
            {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-700" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expanded Accordion Body */}
      {isExpanded && (
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/40 space-y-6 animate-in fade-in duration-150">
          {isLocked && (
            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start sm:items-center gap-2.5 text-xs text-amber-900">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
              <span>
                <strong>Sequential Workflow Active:</strong> This stage is currently locked. Complete <strong>Stage {stage.order - 1}{previousStageTitle ? ` (${previousStageTitle})` : ''}</strong> first to unlock downstream actions and completion.
              </span>
            </div>
          )}

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {stage.description}
          </p>

          {/* Checklist Section */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-amber-500" />
                <span>Verification Checklist ({completedChecklistCount}/{stage.checklist.length})</span>
              </h4>
              <span className="text-[11px] text-slate-500">Click to toggle item completion</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
              {stage.checklist.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  role="checkbox"
                  aria-checked={item.completed}
                  onClick={() => handleToggleChecklist(item.id)}
                  className="p-3 flex items-start gap-3 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleChecklist(item.id);
                    }}
                    className="mt-0.5 shrink-0 text-slate-400 hover:text-amber-600 focus:outline-hidden"
                    aria-label={`Toggle ${item.label || item.title}`}
                  >
                    {item.completed ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300" />
                    )}
                  </button>
                  <div className="flex-1">
                    <span className={`text-xs font-medium ${item.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {item.label || item.title}
                    </span>
                    {item.completed && item.completedBy && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Verified by {item.completedBy}
                        {item.completedAt && !isNaN(new Date(item.completedAt).getTime()) && (
                          <> at {new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Photo & GPS Geo-Tagged Field Evidence */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-blue-500" />
                <span>Site Photos & GPS Coordinate Verification ({stage.photos.length})</span>
              </h4>
              <button
                onClick={handleSimulatePhotoUpload}
                disabled={isCapturingGPS}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-amber-500" />
                <span>{isCapturingGPS ? 'Locating GPS...' : 'Capture Site Photo'}</span>
              </button>
            </div>

            {stage.photos.length === 0 ? (
              <div className="p-6 bg-white rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                No site photos uploaded for this stage yet. Click "Capture Site Photo" to record evidence with live GPS metadata.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stage.photos.map(p => (
                  <div key={p.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs group">
                    <div className="relative h-32 w-full overflow-hidden bg-slate-100">
                      <img
                        src={p.url}
                        alt={p.caption}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded-sm font-mono flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-amber-400" />
                        <span className="truncate max-w-[120px]">{p.gpsCoordinates || 'GPS Tagged'}</span>
                      </div>
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-bold text-slate-800 truncate">{p.caption}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                        <span>By {p.uploadedBy}</span>
                        <span>{new Date(p.uploadedAt).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stage Approval & Sign-off Details */}
          {(stage.approvedBy || stage.status === 'UNDER REVIEW') && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <ThumbsUp className="w-4 h-4 text-amber-600" />
                <span>Stage Approval Log</span>
              </div>
              {stage.approvedBy ? (
                <p className="text-xs text-amber-800">
                  Formally approved by <span className="font-bold">{stage.approvedBy}</span> on {stage.approvedAt}.
                  <br />
                  <span className="italic text-[11px] text-amber-700">{stage.approvalRemarks}</span>
                </p>
              ) : (
                <p className="text-xs text-amber-800">
                  Submission awaiting Admin formal sign-off.
                </p>
              )}
            </div>
          )}

          {/* Stage Notes / Work Log */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Field Engineering Notes & Log</span>
            </h4>

            {stage.notes && (
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed mb-3">
                {stage.notes}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddNote(); }}
                placeholder="Type operational field notes or inspection remark..."
                className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
              <button
                onClick={handleAddNote}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors shrink-0"
              >
                Add Note
              </button>
            </div>
          </div>

          {/* Operational Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2">
              {/* WhatsApp Milestone Update */}
              <button
                onClick={() =>
                  openWhatsAppModal(customerPhone, customerName, 'INSTALLATION_UPDATE', {
                    projectTitle,
                    stageTitle: stage.title
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp Client Update</span>
              </button>

              {stage.status === 'COMPLETED' && (
                <button
                  onClick={handleReopenStage}
                  className="inline-flex items-center gap-1 px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-medium transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reopen Stage</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isLocked ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium select-none">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Locked: Finish Stage {stage.order - 1} first</span>
                </div>
              ) : stage.status !== 'COMPLETED' ? (
                <>
                  {canApproveStage() ? (
                    <button
                      onClick={handleApproveStage}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Complete Stage</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleRequestApproval}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit for PM Approval</span>
                      </button>

                      <button
                        onClick={handleMarkCompleted}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs"
                      >
                        <span>Direct Complete</span>
                      </button>
                    </>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
