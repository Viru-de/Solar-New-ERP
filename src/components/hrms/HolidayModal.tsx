import React, { useState, useEffect } from 'react';
import { HolidayRecord, HolidayType } from '../../types/solar';
import { X, Calendar, Save, AlertCircle, Sparkles, Building2, Tag, FileText } from 'lucide-react';

interface HolidayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (holiday: HolidayRecord) => void;
  holidayToEdit?: HolidayRecord | null;
  currentUserName?: string;
}

const HOLIDAY_TYPES: { value: HolidayType; label: string; description: string; badgeColor: string }[] = [
  {
    value: 'NATIONAL',
    label: 'National Holiday',
    description: 'Statutory public holiday observed countrywide (e.g., Republic Day, Independence Day)',
    badgeColor: 'bg-rose-50 text-rose-800 border-rose-200'
  },
  {
    value: 'FESTIVAL',
    label: 'Festival Holiday',
    description: 'Major religious or cultural festival celebration (e.g., Diwali, Holi, Eid)',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  {
    value: 'REGIONAL',
    label: 'Regional Holiday',
    description: 'State-specific or local regional gazetted holiday (e.g., Gujarat Day, Bestu Varas)',
    badgeColor: 'bg-sky-50 text-sky-800 border-sky-200'
  },
  {
    value: 'COMPANY',
    label: 'Company Holiday',
    description: 'Corporate milestone, Foundation Day, or SolarPulse annual event',
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200'
  },
  {
    value: 'OPTIONAL',
    label: 'Optional / Floating',
    description: 'Restricted holiday from which workforce can choose allotted floating leaves',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  }
];

const ALL_DEPARTMENTS = [
  'Management',
  'Operations',
  'Engineering',
  'Sales',
  'Civil',
  'Structure',
  'Installation',
  'Electrical',
  'Service',
  'HR',
  'Finance'
];

export const HolidayModal: React.FC<HolidayModalProps> = ({
  isOpen,
  onClose,
  onSave,
  holidayToEdit,
  currentUserName = 'HR Administrator'
}) => {
  const isEditing = Boolean(holidayToEdit);

  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().slice(0, 10),
    type: 'FESTIVAL' as HolidayType,
    description: '',
    isOptional: false,
    allDeptsSelected: true,
    selectedDepartments: [] as string[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (holidayToEdit) {
      const depts = holidayToEdit.applicableDepartments || ['All Departments'];
      const isAll = depts.includes('All Departments') || depts.length === 0;

      setFormData({
        name: holidayToEdit.name || '',
        date: holidayToEdit.date || new Date().toISOString().slice(0, 10),
        type: holidayToEdit.type || 'FESTIVAL',
        description: holidayToEdit.description || '',
        isOptional: Boolean(holidayToEdit.isOptional),
        allDeptsSelected: isAll,
        selectedDepartments: isAll ? [] : depts
      });
    } else {
      setFormData({
        name: '',
        date: new Date().toISOString().slice(0, 10),
        type: 'FESTIVAL',
        description: '',
        isOptional: false,
        allDeptsSelected: true,
        selectedDepartments: []
      });
    }
    setErrors({});
  }, [holidayToEdit, isOpen]);

  if (!isOpen) return null;

  const handleToggleDepartment = (dept: string) => {
    if (formData.allDeptsSelected) {
      // Switching from all to specific
      setFormData(prev => ({
        ...prev,
        allDeptsSelected: false,
        selectedDepartments: [dept]
      }));
      return;
    }

    setFormData(prev => {
      const exists = prev.selectedDepartments.includes(dept);
      let updated: string[];
      if (exists) {
        updated = prev.selectedDepartments.filter(d => d !== dept);
      } else {
        updated = [...prev.selectedDepartments, dept];
      }

      // If all are selected, toggle back to allDeptsSelected
      if (updated.length === ALL_DEPARTMENTS.length) {
        return {
          ...prev,
          allDeptsSelected: true,
          selectedDepartments: []
        };
      }

      return {
        ...prev,
        selectedDepartments: updated
      };
    });
  };

  const handleToggleAllDepartments = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      allDeptsSelected: checked,
      selectedDepartments: checked ? [] : [ALL_DEPARTMENTS[0]]
    }));
  };

  const handleTypeChange = (newType: HolidayType) => {
    setFormData(prev => ({
      ...prev,
      type: newType,
      isOptional: newType === 'OPTIONAL' ? true : prev.isOptional
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Holiday title is required.';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Holiday title must be at least 3 characters.';
    }

    if (!formData.date) {
      newErrors.date = 'Holiday observance date is required.';
    }

    if (!formData.allDeptsSelected && formData.selectedDepartments.length === 0) {
      newErrors.departments = 'Select at least one applicable department or check "All Departments".';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const now = new Date().toISOString();
      const applicableDepts = formData.allDeptsSelected
        ? ['All Departments']
        : formData.selectedDepartments;

      const record: HolidayRecord = {
        id: holidayToEdit ? holidayToEdit.id : `hol-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: formData.name.trim(),
        date: formData.date,
        type: formData.type,
        description: formData.description.trim() || undefined,
        isOptional: formData.isOptional || formData.type === 'OPTIONAL',
        applicableDepartments: applicableDepts,
        createdAt: holidayToEdit ? holidayToEdit.createdAt : now,
        updatedAt: now,
        createdBy: holidayToEdit?.createdBy || currentUserName
      };

      onSave(record);
      onClose();
    } catch {
      setErrors({ form: 'Failed to save holiday record. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="holiday-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 scale-100 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 id="holiday-modal-title" className="text-base font-bold text-white flex items-center gap-2">
                {isEditing ? 'Edit Holiday Record' : 'Add New Calendar Holiday'}
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {isEditing ? 'Update' : 'Admin Portal'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Official calendar holiday schedule for SolarPulse workforce and project field teams
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errors.form && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          {/* Holiday Name & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="holiday-name" className="block text-xs font-bold text-slate-700 mb-1">
                Holiday Title / Occasion <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="holiday-name"
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Diwali (Deepavali), Independence Day"
                  className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 transition-all ${
                    errors.name ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-amber-500'
                  }`}
                />
              </div>
              {errors.name && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="holiday-date" className="block text-xs font-bold text-slate-700 mb-1">
                Observance Date <span className="text-rose-500">*</span>
              </label>
              <input
                id="holiday-date"
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 transition-all ${
                  errors.date ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-amber-500'
                }`}
              />
              {errors.date && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.date}</p>}
            </div>
          </div>

          {/* Holiday Category / Type Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Holiday Classification Type <span className="text-rose-500">*</span></span>
              <span className="text-[11px] text-slate-400 font-normal">Select the governing category</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {HOLIDAY_TYPES.map(t => {
                const isSelected = formData.type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => handleTypeChange(t.value)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">{t.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${t.badgeColor}`}>
                        {t.value}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                      {t.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional / Floating Holiday Checkbox */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
            <input
              id="is-optional-holiday"
              type="checkbox"
              checked={formData.isOptional || formData.type === 'OPTIONAL'}
              onChange={e => setFormData({ ...formData, isOptional: e.target.checked })}
              className="w-4 h-4 mt-0.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
            />
            <label htmlFor="is-optional-holiday" className="text-xs cursor-pointer select-none">
              <span className="font-bold text-slate-900 block">
                Restricted / Floating Optional Holiday
              </span>
              <span className="text-[11px] text-slate-500">
                If checked, this holiday is marked as optional. Employees can elect whether to take this day off under their annual floating leave entitlement, while project sites remain open.
              </span>
            </label>
          </div>

          {/* Department Applicability */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Department Applicability</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.allDeptsSelected}
                  onChange={handleToggleAllDepartments}
                  className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <span>All Departments (Company-wide)</span>
              </label>
            </div>

            {!formData.allDeptsSelected && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <p className="text-[11px] text-slate-500">
                  Select which departments this holiday applies to (unselected departments will operate on normal work schedules):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_DEPARTMENTS.map(dept => {
                    const isSelected = formData.selectedDepartments.includes(dept);
                    return (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => handleToggleDepartment(dept)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                          isSelected
                            ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {dept}
                      </button>
                    );
                  })}
                </div>
                {errors.departments && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.departments}</p>
                )}
              </div>
            )}
          </div>

          {/* Description / Observance Details */}
          <div>
            <label htmlFor="holiday-description" className="block text-xs font-bold text-slate-700 mb-1">
              Description / Special Guidelines <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              id="holiday-description"
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Office closure details, emergency field dispatch protocols, or gate shutdown notice..."
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 transition-all resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : isEditing ? 'Update Holiday' : 'Save Holiday Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
