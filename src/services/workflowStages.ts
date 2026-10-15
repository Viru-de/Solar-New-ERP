import { ProjectStage, WorkflowStageKey, StageStatus, UserRole, Priority, PhotoAttachment } from '../types/solar';

export type WorkflowProgressLevel =
  | 'NEW'
  | 'STAGE_2'
  | 'STAGE_4'
  | '68_PERCENT'
  | 'EARLY'
  | 'COMPLETED'
  | 'DELAYED';

interface StageBlueprint {
  stageKey: WorkflowStageKey;
  title: string;
  order: number;
  department: string;
  assignedRole: UserRole;
  assignedEmployeeId: string;
  assignedEmployeeName: string;
  priority: Priority;
  plannedDaysFromStart: number;
  checklistTitles: string[];
  description: string;
  demoPhotos?: PhotoAttachment[];
  demoComments?: string;
  demoApprovalBy?: string;
}

const STAGE_BLUEPRINTS: StageBlueprint[] = [
  {
    stageKey: 'site_survey',
    title: 'Site Survey',
    order: 1,
    department: 'Engineering',
    assignedRole: 'Site Survey Engineer',
    assignedEmployeeId: 'emp-3',
    assignedEmployeeName: 'Rajesh Kumar',
    priority: 'HIGH',
    plannedDaysFromStart: 2,
    description: 'Preliminary physical inspection, structural load estimation, shadow obstruction mapping, and grid interconnection feasibility.',
    checklistTitles: [
      'GPS coordinates & roof orientation verified',
      'Shadow analysis & obstacle mapping',
      'Electricity bill & sanctioned load audited',
      'Structural load bearing & slab condition check',
      'Cable routing distance to LT panel measured',
      'Site panoramic photos captured'
    ],
    demoComments: 'Site survey completed. Roof RCC is sound. 100 kW recommended with south orientation.',
    demoApprovalBy: 'Amit Sharma (PM)',
    demoPhotos: [
      {
        id: 'p-1',
        url: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=80&w=400',
        caption: 'Rooftop South view prior to installation',
        type: 'BEFORE',
        uploadedAt: '2026-08-14T11:40:00Z',
        uploadedBy: 'Rajesh Kumar',
        gpsCoordinates: '22.9868, 72.3789'
      },
      {
        id: 'p-2',
        url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&q=80&w=400',
        caption: 'LT panel room measurement inspection',
        type: 'DURING',
        uploadedAt: '2026-08-14T12:00:00Z',
        uploadedBy: 'Rajesh Kumar',
        gpsCoordinates: '22.9868, 72.3789'
      }
    ]
  },
  {
    stageKey: 'customer_confirmation',
    title: 'Customer Confirmation & Engineering Approval',
    order: 2,
    department: 'Sales & Engineering',
    assignedRole: 'Project Manager',
    assignedEmployeeId: 'emp-2',
    assignedEmployeeName: 'Amit Sharma',
    priority: 'HIGH',
    plannedDaysFromStart: 5,
    description: 'Detailed design sign-off, Single Line Diagram (SLD) acceptance, commercial contract execution, and advance milestone confirmation.',
    checklistTitles: [
      '3D Shadow Simulation & PVsyst report approved by client',
      'Single Line Diagram (SLD) signed off',
      'Quotation & Payment milestone contract executed',
      'Advance milestone payment confirmed',
      'BOM generation & procurement requisition raised'
    ],
    demoComments: '3D shadow simulation & SLD approved by client. Advance payment of ₹2,00,000 cleared.',
    demoApprovalBy: 'Amit Sharma (PM)'
  },
  {
    stageKey: 'civil_work',
    title: 'Civil Work',
    order: 3,
    department: 'Civil',
    assignedRole: 'Civil Team',
    assignedEmployeeId: 'emp-3',
    assignedEmployeeName: 'Rajesh Kumar',
    priority: 'HIGH',
    plannedDaysFromStart: 10,
    description: 'RCC pedestal casting, chemical anchoring, foundation structural curing, and roof membrane waterproofing verification.',
    checklistTitles: [
      'RCC foundation pedestal column layout marking',
      'Anchor bolt drilling and chemical anchoring',
      'Casting of RCC pedestals with M25 concrete grade',
      'Curing period of 7 days completed',
      'Waterproofing chemical coating around pedestals'
    ],
    demoComments: 'RCC foundation casting completed and cured. Waterproofing verified with zero leaks.',
    demoApprovalBy: 'Amit Sharma (PM)',
    demoPhotos: [
      {
        id: 'p-3',
        url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&q=80&w=400',
        caption: 'M25 RCC Pedestals with chemical waterproofing coat',
        type: 'DURING',
        uploadedAt: '2026-08-20T16:00:00Z',
        uploadedBy: 'Rajesh Kumar',
        gpsCoordinates: '22.9868, 72.3789'
      }
    ]
  },
  {
    stageKey: 'structure_fabrication',
    title: 'Structure Installation & Fabrication',
    order: 4,
    department: 'Structure',
    assignedRole: 'Structure Team',
    assignedEmployeeId: 'emp-6',
    assignedEmployeeName: 'Dinesh Yadav',
    priority: 'HIGH',
    plannedDaysFromStart: 15,
    description: 'Hot Dip Galvanized (HDG) column erection, rafters/purlins installation, tilt angle calibration, and high-tensile torque checks.',
    checklistTitles: [
      'Hot Dip Galvanized (HDG) steel column erection',
      'Rafters, purlins and bracing assembly',
      'Tilt angle verification with digital inclinometer (23° South)',
      'Torque tightening of high tensile grade 8.8 bolts',
      'Corrosion inspection and cold galvanizing spray applied'
    ],
    demoComments: 'HDG structure erected and torque inspected. 80-micron zinc coating confirmed.',
    demoApprovalBy: 'Amit Sharma (PM)',
    demoPhotos: [
      {
        id: 'p-4',
        url: 'https://images.unsplash.com/photo-1545208942-e1c9c916524b?auto=format&fit=crop&q=80&w=400',
        caption: 'HDG 80 Micron elevated structure assembled',
        type: 'DURING',
        uploadedAt: '2026-08-25T14:30:00Z',
        uploadedBy: 'Dinesh Yadav',
        gpsCoordinates: '22.9868, 72.3789'
      }
    ]
  },
  {
    stageKey: 'lightning_arrestor',
    title: 'Lightning Arrestor (LA)',
    order: 5,
    department: 'Electrical',
    assignedRole: 'Electrical Team',
    assignedEmployeeId: 'emp-8',
    assignedEmployeeName: 'Ankit Joshi',
    priority: 'MEDIUM',
    plannedDaysFromStart: 18,
    description: 'Early Streamer Emission (ESE) or conventional lightning protection terminal erection with dedicated down conductors.',
    checklistTitles: [
      'ESE / Conventional Lightning Mast installation at highest peak',
      'Dedicated 25x3 mm Copper / GI down conductor routing',
      'Insulator standoff clamping at 1 meter intervals',
      'Direct path to designated LA earthing pit without bends',
      'Strike counter and test link mounted'
    ],
    demoComments: 'Lightning mast erected with dedicated down conductor to earth pit.',
    demoApprovalBy: 'Amit Sharma (PM)'
  },
  {
    stageKey: 'cdc_earthing',
    title: 'CDC & Earthing Routing',
    order: 6,
    department: 'Electrical',
    assignedRole: 'Electrical Team',
    assignedEmployeeId: 'emp-8',
    assignedEmployeeName: 'Ankit Joshi',
    priority: 'HIGH',
    plannedDaysFromStart: 21,
    description: 'Continuous DC earthing routing, module frame bonding, tray grounding, and bimetallic transition washers.',
    checklistTitles: [
      'DC Cable trenching / UV-resistant conduit routing',
      'Dual earthing of module mounting structure with 25x3 strip',
      'Perforated cable trays with covers installed',
      'Inverter chassis body earthing interconnection',
      'Bimetallic washers used on aluminium-copper transitions'
    ],
    demoComments: 'Earthing strip continuous loop connected to all module tables.',
    demoApprovalBy: 'Amit Sharma (PM)'
  },
  {
    stageKey: 'earthing_pits',
    title: 'Chemical Earthing Pits',
    order: 7,
    department: 'Electrical',
    assignedRole: 'Electrical Team',
    assignedEmployeeId: 'emp-8',
    assignedEmployeeName: 'Ankit Joshi',
    priority: 'HIGH',
    plannedDaysFromStart: 24,
    description: 'Boring, electrode insertion, backfill compound filling, and earth resistance calibration to below 2 Ohms.',
    checklistTitles: [
      'Boring of 3-meter deep chemical earthing pits (4 Nos)',
      'Insertion of 50mm copper bonded / GI pipe electrode',
      'Backfilling with eco-friendly conductive compound (BFC)',
      'Civil inspection chamber & heavy duty pit covers installed',
      'Earth resistance measurement with digital earth tester (< 2 Ohm)'
    ],
    demoComments: 'All chemical earth pits measured below 1.4 Ohms with calibrated digital tester.',
    demoApprovalBy: 'Amit Sharma (PM)',
    demoPhotos: [
      {
        id: 'p-5',
        url: 'https://images.unsplash.com/photo-1559302504-64aae6ca6b6f?auto=format&fit=crop&q=80&w=400',
        caption: 'Chemical earth pit chamber with digital resistance test',
        type: 'AFTER',
        uploadedAt: '2026-08-30T17:00:00Z',
        uploadedBy: 'Ankit Joshi',
        gpsCoordinates: '22.9868, 72.3789'
      }
    ]
  },
  {
    stageKey: 'solar_installation',
    title: 'Solar Module Installation',
    order: 8,
    department: 'Installation',
    assignedRole: 'Installation Team',
    assignedEmployeeId: 'emp-7',
    assignedEmployeeName: 'Manoj Tiwari',
    priority: 'HIGH',
    plannedDaysFromStart: 28,
    description: 'Tier-1 Mono PERC Bifacial module clamping, string wiring, MC4 connector crimping, and Voc/Isc validation.',
    checklistTitles: [
      'Tier-1 Mono PERC Bifacial module inspection (zero micro-cracks)',
      'Module mounting with mid-clamps and end-clamps',
      'MC4 connector crimping with professional ratchet tool',
      'String Voc and Isc measurement with calibrated multimeter',
      'String cable dressing and UV zip-tying under modules'
    ],
    demoComments: 'Waaree 540Wp modules 80% clamped. String Voc measured at 642V DC.',
    demoPhotos: [
      {
        id: 'p-6',
        url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&q=80&w=400',
        caption: 'Solar panel string array mounting underway',
        type: 'DURING',
        uploadedAt: '2026-09-03T11:15:00Z',
        uploadedBy: 'Manoj Tiwari',
        gpsCoordinates: '22.9868, 72.3789'
      }
    ]
  },
  {
    stageKey: 'inverter_installation',
    title: 'Inverter Installation',
    order: 9,
    department: 'Electrical',
    assignedRole: 'Electrical Team',
    assignedEmployeeId: 'emp-8',
    assignedEmployeeName: 'Ankit Joshi',
    priority: 'HIGH',
    plannedDaysFromStart: 31,
    description: 'String inverter mounting, canopy weatherproofing, DC string terminations, and RS485 communication line routing.',
    checklistTitles: [
      'Wall / canopy mounting in well-ventilated shaded location',
      'DC cable landing with fuse terminal blocks',
      'AC output termination with heavy duty copper lugs',
      'Communication RS485 / Modbus cabling routed',
      'Inverter body and surge protection double earthing verified'
    ],
    demoComments: 'Sungrow 100kW Inverter fixed on weather canopy.'
  },
  {
    stageKey: 'meter_synchronisation',
    title: 'Meter Synchronisation & Discom Bi-Directional Meter',
    order: 10,
    department: 'Engineering & Liaisoning',
    assignedRole: 'Project Manager',
    assignedEmployeeId: 'emp-2',
    assignedEmployeeName: 'Amit Sharma',
    priority: 'HIGH',
    plannedDaysFromStart: 35,
    description: 'Discom liaisoning, bi-directional net meter testing, CT/PT inspection, sealing, and grid synchronisation paperwork.',
    checklistTitles: [
      'Discom Net Meter testing fee paid and laboratory report cleared',
      'Sub-division JE / AEE site joint inspection conducted',
      'Bi-directional electronic trivector meter installed',
      'Discom official seals applied on meter box and CT/PT',
      'Net metering connectivity certificate issued by Discom'
    ],
    demoComments: 'Discom meter inspection and bi-directional meter synchronization.'
  },
  {
    stageKey: 'inverter_wifi_pairing',
    title: 'Inverter WiFi / 4G Dongle Pairing & Cloud Setup',
    order: 11,
    department: 'Service',
    assignedRole: 'Service Manager',
    assignedEmployeeId: 'emp-11',
    assignedEmployeeName: 'Rohit Verma',
    priority: 'MEDIUM',
    plannedDaysFromStart: 37,
    description: 'Telemetry datalogger insertion, cloud monitoring platform onboarding, and customer mobile app setup.',
    checklistTitles: [
      'Inverter WiFi / 4G cellular datalogger dongle inserted',
      'Inverter connected to customer local WiFi / Cloud portal',
      'Cloud monitoring account registered for customer and ERP',
      'Real-time telemetry generation verified on mobile app',
      'Auto alert rules configured for inverter faults and low yield'
    ]
  },
  {
    stageKey: 'acdb_dcdb_fixing',
    title: 'ACDB + DCDB Fixing & Internal Wiring',
    order: 12,
    department: 'Electrical',
    assignedRole: 'Electrical Team',
    assignedEmployeeId: 'emp-8',
    assignedEmployeeName: 'Ankit Joshi',
    priority: 'HIGH',
    plannedDaysFromStart: 39,
    description: 'IP65 distribution box mounting, Type-II surge arrestor integration, busbar ferrule labeling, and cable glanding.',
    checklistTitles: [
      'IP65 DCDB mounted with Type-II DC SPD and fuses',
      'IP65 ACDB mounted with 4-Pole MCCB and Type-II AC SPD',
      'Internal busbar insulation and ferrule labeling',
      'Gland plate drilling and cable gland compression',
      'Earth continuity check across distribution boxes'
    ]
  },
  {
    stageKey: 'ac_side_electrical',
    title: 'AC Side Electrical Connection & LT Breaker Tapping',
    order: 13,
    department: 'Electrical',
    assignedRole: 'Electrical Team',
    assignedEmployeeId: 'emp-8',
    assignedEmployeeName: 'Ankit Joshi',
    priority: 'HIGH',
    plannedDaysFromStart: 41,
    description: 'Armoured cable pulling from inverter to main LT panel, phase sequence testing, and breaker integration.',
    checklistTitles: [
      'Customer LT panel breaker capacity check',
      '4-Core XLPE Armoured aluminium cable laying to LT panel',
      'Bi-directional generation meter CT installation',
      'Isolation switch / lockable safety disconnect installed',
      'Phase rotation (R-Y-B) sequence verified before breaker closing'
    ]
  },
  {
    stageKey: 'final_verification',
    title: 'Final Verification & CEIG / Safety Inspection',
    order: 14,
    department: 'Operations',
    assignedRole: 'Project Manager',
    assignedEmployeeId: 'emp-2',
    assignedEmployeeName: 'Amit Sharma',
    priority: 'HIGH',
    plannedDaysFromStart: 43,
    description: 'Statutory electrical inspector safety approval, anti-islanding trip tests, insulation Megger checks, and thermography.',
    checklistTitles: [
      'Chief Electrical Inspector to Govt (CEIG) drawings and safety approval',
      'Insulation resistance (Megger) test on AC and DC circuits',
      'Anti-islanding protection test (grid disconnect simulation)',
      'Thermal imaging survey for hotspots on modules and terminations',
      'Danger boards and statutory caution signs displayed'
    ]
  },
  {
    stageKey: 'final_handover',
    title: 'Final Handover & Commercial Commissioning',
    order: 15,
    department: 'Management',
    assignedRole: 'Project Manager',
    assignedEmployeeId: 'emp-2',
    assignedEmployeeName: 'Amit Sharma',
    priority: 'HIGH',
    plannedDaysFromStart: 45,
    description: 'Formal plant energization, performance handover dossier delivery, customer operations training, and project sign-off.',
    checklistTitles: [
      'Plant commissioning certificate signed with client',
      'Final invoice submitted & final payment receipt acknowledged',
      '25-year solar module performance warranty binder delivered',
      'Inverter 5-year replacement warranty certificate delivered',
      'Client maintenance training conducted'
    ]
  },
  {
    stageKey: 'service_amc',
    title: 'Service / AMC Handover',
    order: 16,
    department: 'Service',
    assignedRole: 'Service Manager',
    assignedEmployeeId: 'emp-11',
    assignedEmployeeName: 'Rohit Verma',
    priority: 'MEDIUM',
    plannedDaysFromStart: 48,
    description: 'Warranty activation, scheduled annual maintenance planning, emergency breakdown protocol, and generation monitoring.',
    checklistTitles: [
      'Service contract activated in ERP',
      'Annual maintenance visit calendar scheduled (Quarterly)',
      'Emergency breakdown helpline shared with client'
    ]
  }
];

/**
 * Builds the complete 16-stage solar installation workflow array.
 * STRICT ONE-STAGE-AT-A-TIME RULE:
 * For new projects ('NEW' or 'EARLY'), ONLY Stage 1 ('site_survey') is IN PROGRESS.
 * Stages 2 through 16 are strictly NOT STARTED (locked), with all checklist items unverified.
 */
export function buildStandardWorkflowStages(
  projectId: string,
  _projectCapacityKw: number = 10,
  progressLevel: WorkflowProgressLevel = 'NEW'
): ProjectStage[] {
  const isNew = progressLevel === 'NEW' || progressLevel === 'EARLY';
  const isStage2 = progressLevel === 'STAGE_2';
  const isStage4 = progressLevel === 'STAGE_4';
  const is68 = progressLevel === '68_PERCENT';
  const isDelayed = progressLevel === 'DELAYED';
  const isCompleted = progressLevel === 'COMPLETED';

  const todayStr = new Date().toISOString().split('T')[0];

  return STAGE_BLUEPRINTS.map((bp) => {
    let status: StageStatus = 'NOT STARTED';
    let isStageCompleted = false;
    let isStageInProgress = false;

    if (isNew) {
      // STRICT RULE: Only Stage 1 is IN PROGRESS. All subsequent stages are NOT STARTED.
      if (bp.order === 1) {
        status = 'IN PROGRESS';
        isStageInProgress = true;
      } else {
        status = 'NOT STARTED';
      }
    } else if (isStage2) {
      if (bp.order === 1) {
        status = 'COMPLETED';
        isStageCompleted = true;
      } else if (bp.order === 2) {
        status = 'IN PROGRESS';
        isStageInProgress = true;
      } else {
        status = 'NOT STARTED';
      }
    } else if (isStage4) {
      if (bp.order < 4) {
        status = 'COMPLETED';
        isStageCompleted = true;
      } else if (bp.order === 4) {
        status = 'IN PROGRESS';
        isStageInProgress = true;
      } else {
        status = 'NOT STARTED';
      }
    } else if (is68) {
      if (bp.order <= 7) {
        status = 'COMPLETED';
        isStageCompleted = true;
      } else if (bp.order === 8 || bp.order === 9) {
        status = 'IN PROGRESS';
        isStageInProgress = true;
      } else {
        status = 'NOT STARTED';
      }
    } else if (isDelayed) {
      if (bp.order <= 9) {
        status = 'COMPLETED';
        isStageCompleted = true;
      } else if (bp.order === 10) {
        status = 'OVERDUE';
        isStageInProgress = true;
      } else {
        status = 'NOT STARTED';
      }
    } else if (isCompleted) {
      if (bp.order <= 15) {
        status = 'COMPLETED';
        isStageCompleted = true;
      } else {
        status = 'APPROVED';
        isStageCompleted = true;
      }
    }

    // Build checklist items
    const checklist = bp.checklistTitles.map((title, idx) => {
      let completed = false;
      let completedAt: string | undefined = undefined;
      let completedBy: string | undefined = undefined;

      if (isStageCompleted) {
        completed = true;
        completedAt = '2026-08-16';
        completedBy = bp.assignedEmployeeName;
      } else if (isStageInProgress && is68 && bp.order === 8) {
        completed = idx < 3;
        completedAt = completed ? '2026-09-02' : undefined;
        completedBy = completed ? bp.assignedEmployeeName : undefined;
      } else if (isStageInProgress && is68 && bp.order === 9) {
        completed = idx < 1;
        completedAt = completed ? '2026-09-04' : undefined;
        completedBy = completed ? bp.assignedEmployeeName : undefined;
      } else {
        // STRICT RULE: All items NOT completed for new stages or fresh in-progress stages
        completed = false;
      }

      return {
        id: `chk-${bp.order}-${idx + 1}`,
        title,
        label: title,
        completed,
        completedAt,
        completedBy
      };
    });

    // Activities log
    const activities: { id: string; timestamp: string; user: string; role: string; action: string; details?: string }[] = [];
    if (isStageCompleted) {
      activities.push(
        {
          id: `${projectId}-act-${bp.order}-1`,
          timestamp: '2026-08-14 10:00 AM',
          user: bp.assignedEmployeeName,
          role: bp.assignedRole,
          action: `Completed all checklist verification items for "${bp.title}".`
        },
        {
          id: `${projectId}-act-${bp.order}-2`,
          timestamp: '2026-08-15 05:00 PM',
          user: bp.demoApprovalBy || 'Amit Sharma',
          role: 'Project Manager',
          action: `Approved "${bp.title}" and unlocked subsequent stage.`
        }
      );
    } else if (isStageInProgress) {
      activities.push({
        id: `${projectId}-act-${bp.order}-init`,
        timestamp: new Date().toLocaleString(),
        user: 'Workflow Automation',
        role: 'System',
        action: `Stage ${bp.order} ("${bp.title}") is currently active.`
      });
    }

    const startDate = isStageCompleted
      ? '2026-08-12'
      : isStageInProgress
      ? todayStr
      : undefined;

    const dueDate = isStageCompleted
      ? '2026-08-15'
      : isStageInProgress
      ? new Date(Date.now() + bp.plannedDaysFromStart * 86400000).toISOString().split('T')[0]
      : undefined;

    const completedDate = isStageCompleted ? '2026-08-15' : undefined;
    const approvedBy = isStageCompleted ? (bp.demoApprovalBy || 'Amit Sharma (PM)') : undefined;
    const approvalDate = isStageCompleted ? '2026-08-15' : undefined;

    const photos = isStageCompleted && bp.demoPhotos ? bp.demoPhotos : [];
    const documents = isStageCompleted && bp.order === 1 ? [
      {
        id: `doc-${bp.order}`,
        name: `Site_Survey_Report_${projectId}.pdf`,
        url: '#',
        fileType: 'pdf',
        sizeMb: 2.8,
        uploadedAt: '2026-08-14',
        uploadedBy: bp.assignedEmployeeName
      }
    ] : [];

    return {
      id: `${projectId}-stage-${bp.order}`,
      stageKey: bp.stageKey,
      title: bp.title,
      order: bp.order,
      department: bp.department,
      assignedRole: bp.assignedRole,
      assignedEmployeeId: bp.assignedEmployeeId,
      assignedEmployeeName: bp.assignedEmployeeName,
      assignedToName: bp.assignedEmployeeName,
      status,
      priority: bp.priority,
      startDate,
      dueDate,
      plannedEndDate: dueDate,
      completedDate,
      actualEndDate: completedDate,
      approvedBy,
      approvalDate,
      approvedAt: approvalDate,
      comments: isStageCompleted ? (bp.demoComments || '') : '',
      description: bp.description,
      checklist,
      photos,
      documents,
      activities
    };
  });
}
