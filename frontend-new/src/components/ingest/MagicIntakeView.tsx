import React, { useState, useEffect } from "react";
import {
  Wand2,
  Sparkles,
  Building2,
  Tag,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Send,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Clock,
  User,
  Languages,
  Globe,
  FileCheck,
  Check,
  Edit3,
  Search,
  AlertCircle,
} from "lucide-react";
import { magicAnalyze, magicIngest, listInstitutionsAll } from "@/api/index";
import type { MagicAnalysisResult, MagicIngestResponse } from "@/types/ui";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

const PRESET_SCENARIOS = [
  {
    title: "🇮🇳 हिन्दी: छात्रावास रैगिंग व जानलेवा धमकी",
    languageTag: "Hindi (हिन्दी)",
    bureau: "STU (Student Welfare)",
    priority: "URGENT",
    college: "Apex Institute of Engineering & Technology",
    text: "मैं अपेक्स इंस्टीट्यूट ऑफ इंजीनियरिंग एंड टेक्नोलॉजी का प्रथम वर्ष का छात्र हूँ। छात्रावास में सीनियर छात्रों द्वारा हमारे साथ गंभीर मारपीट और रैगिंग की जा रही है। वार्डन को शिकायत करने पर हमें जान से मारने की धमकी दी गई है। कृपया तुरंत कार्रवाई करें।",
  },
  {
    title: "🇮🇳 தமிழ்: கூடுதல் கட்டணம் & சான்றிதழ் பிடிப்பு",
    languageTag: "Tamil (தமிழ்)",
    bureau: "FIN (Finance Bureau)",
    priority: "HIGH",
    college: "Vellore Metropolitan Tech",
    text: "நான் வேலூர் மெட்ரோபொலிட்டன் தொழில்நுட்பக் கல்லூரியின் முதலாமாண்டு மாணவன். கல்லூரி நிர்வாகம் அனுமதிக்கப்படாத கூடுதல் கட்டணம் மற்றும் நன்கொடை வசூலிக்கிறது. மேலும் எங்களது அசல் 12-ஆம் வகுப்பு சான்றிதழ்களை திருப்பித் தர மறுக்கிறது.",
  },
  {
    title: "🇮🇳 मराठी: 7th CPC प्राध्यापक वेतन थकबाकी",
    languageTag: "Marathi (मराठी)",
    bureau: "FDC (Faculty Grievance)",
    priority: "HIGH",
    college: "Pune Institute of Technology",
    text: "गेल्या ६ महिन्यांपासून आमच्या महाविद्यालयात प्राध्यापकांचे वेतन थकले आहे. AICTE आणि 7th CPC नियमांचे सर्रास उल्लंघन होत असून विचारणा केल्यास कामावरून काढून टाकण्याची धमकी दिली जाते.",
  },
  {
    title: "🇬🇧 English: Unauthorized Artificial Intelligence Program",
    languageTag: "English",
    bureau: "APPR (Approval Bureau)",
    priority: "MEDIUM",
    college: "National Institute of Science & Tech",
    text: "The college has admitted 120 students to an unapproved B.Tech in Artificial Intelligence without statutory AICTE Extension of Approval (EOA) for 2026. Laboratories lack GPU workstations and essential computing infrastructure.",
  },
];

export function MagicIntakeView() {
  const [grievanceText, setGrievanceText] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<MagicAnalysisResult | null>(null);
  const [ingestResponse, setIngestResponse] = useState<MagicIngestResponse | null>(null);

  // Institution Selection & Override states
  const [institutions, setInstitutions] = useState<Array<{ id: string; name: string; aicte_permanent_id: string; state: string; district: string }>>([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>("");
  const [isChangingCollege, setIsChangingCollege] = useState(false);
  const [collegeSearchQuery, setCollegeSearchQuery] = useState("");

  useEffect(() => {
    listInstitutionsAll()
      .then((data) => setInstitutions(data))
      .catch((err) => console.error("Failed to load institutions", err));
  }, []);

  const handleSelectScenario = (scenario: (typeof PRESET_SCENARIOS)[0]) => {
    setGrievanceText(scenario.text);
    setAnalysisResult(null);
    setIngestResponse(null);
    setSelectedInstitutionId("");
    setIsChangingCollege(false);
  };

  const handleAnalyze = async () => {
    if (!grievanceText.trim() || grievanceText.length < 15) {
      toast.error("Please enter a detailed grievance narrative (at least 15 characters).");
      return;
    }
    setIsAnalyzing(true);
    setIngestResponse(null);
    try {
      const res = await magicAnalyze(grievanceText);
      setAnalysisResult(res);
      if (res.extracted_college.id) {
        setSelectedInstitutionId(res.extracted_college.id);
        setIsChangingCollege(false);
      } else {
        setSelectedInstitutionId("");
        setIsChangingCollege(true); // Open selector so student can easily pick their college
      }
      toast.success("Zero-shot entity extraction & multilingual translation complete!");
    } catch (e: any) {
      toast.error(e?.message || "AI Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDocket = async () => {
    if (!grievanceText.trim()) return;
    setIsIngesting(true);
    try {
      const res = await magicIngest({
        grievance_text: grievanceText,
        student_name: studentName || undefined,
        student_email: studentEmail || undefined,
        student_phone: studentPhone || undefined,
        institution_id: selectedInstitutionId || undefined,
        auto_docket: true,
      });
      setIngestResponse(res);
      toast.success(`Complaint docketed successfully as ${res.case_reference_id}!`);
    } catch (e: any) {
      toast.error(e?.message || "Grievance docketing failed");
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="py-8 px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Wand2 className="h-6 w-6" />
            </span>
            <h1 className="font-serif text-2xl lg:text-3xl font-semibold text-ink tracking-tight">
              Magic Zero-Shot AI Intake &amp; Bhashini Localization
            </h1>
          </div>
          <p className="text-xs text-text-secondary mt-1 max-w-3xl">
            Autonomous Multilingual Ingestion Workbench. Integrates Digital India Bhashini ULCA NMT for 12+ Indian vernacular languages,
            executes zero-shot entity recognition (college, category, priority), and preserves original submissions under Section 65B legal evidence rules.
          </p>
        </div>
      </div>

      {/* Preset Indian Vernacular Scenarios */}
      <div className="space-y-2.5">
        <div className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
          <Languages className="h-3.5 w-3.5 text-indigo-500" />
          <span>Preset Vernacular Test Scenarios (Click to test NLP pipeline):</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PRESET_SCENARIOS.map((sc, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectScenario(sc)}
              className="text-left p-3 rounded-xl border border-rule/80 bg-white/70 dark:bg-[#0B0813]/70 hover:border-indigo-400 hover:bg-white dark:hover:bg-[#120D22] transition-all shadow-xs space-y-1.5"
            >
              <div className="text-xs font-semibold text-ink truncate">{sc.title}</div>
              <div className="flex items-center justify-between text-[10px] text-text-secondary">
                <Badge variant="outline" className="text-[9px] py-0 px-1">
                  {sc.bureau}
                </Badge>
                <span className="font-medium text-amber-600">{sc.priority}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Ingestion Workbench Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Form (6 cols) */}
        <div className="lg:col-span-6 bg-white/85 dark:bg-[#0B0813]/85 backdrop-blur-md border border-rule p-6 rounded-2xl shadow-xs space-y-5">
          <div className="space-y-1.5">
            <h3 className="font-serif text-base font-semibold text-ink flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              Raw Grievance Narrative
            </h3>
            <p className="text-xs text-text-secondary">
              Paste unstructured testimony in Hindi, Tamil, Marathi, Telugu, English, or any Indian vernacular language.
            </p>
          </div>

          <Textarea
            rows={7}
            placeholder="Describe the complaint in your preferred language..."
            value={grievanceText}
            onChange={(e) => setGrievanceText(e.target.value)}
            className="text-xs border-rule resize-none leading-relaxed"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-text-secondary">Complainant Name (Optional)</label>
              <Input
                placeholder="Student / Faculty Name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="h-8 text-xs border-rule"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-text-secondary">Complainant Email (Optional)</label>
              <Input
                placeholder="student@college.edu"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                className="h-8 text-xs border-rule"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-text-secondary">Phone (Optional)</label>
              <Input
                placeholder="+91 XXXXX XXXXX"
                value={studentPhone}
                onChange={(e) => setStudentPhone(e.target.value)}
                className="h-8 text-xs border-rule"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-rule/60 flex items-center justify-between gap-3">
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !grievanceText.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 px-4 gap-2 font-medium shadow-xs"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Running Zero-Shot NLP...
                </>
              ) : (
                <>
                  <Wand2 className="h-3.5 w-3.5" />
                  Analyze Grievance
                </>
              )}
            </Button>

            {analysisResult && !ingestResponse && (
              <Button
                onClick={handleDocket}
                disabled={isIngesting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-4 gap-2 font-medium shadow-xs"
              >
                {isIngesting ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Confirm &amp; Docket Case
              </Button>
            )}
          </div>
        </div>

        {/* Right Column: AI Extraction Output (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          {ingestResponse ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-6 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-emerald-900 dark:text-emerald-200">
                    Case Docketed Successfully!
                  </h3>
                  <div className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    Reference ID: {ingestResponse.case_reference_id}
                  </div>
                </div>
              </div>

              <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                {ingestResponse.docket_message}
              </p>

              <div className="pt-2 flex items-center gap-3">
                <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8">
                  <Link to="/cases/$id" params={{ id: ingestResponse.case_reference_id || "" }}>
                    Open Case Dossier
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setGrievanceText("");
                    setAnalysisResult(null);
                    setIngestResponse(null);
                  }}
                  className="text-xs h-8 border-emerald-300 text-emerald-900"
                >
                  Docket Another Grievance
                </Button>
              </div>
            </div>
          ) : analysisResult ? (
            <div className="bg-white/85 dark:bg-[#0B0813]/85 backdrop-blur-md border border-rule p-6 rounded-2xl shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-rule/60 pb-3">
                <h3 className="font-serif text-base font-semibold text-ink flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  AI Extraction Dossier
                </h3>
                <Badge variant="outline" className="text-indigo-600 border-indigo-200 text-[10px]">
                  Bhashini NMT Certified
                </Badge>
              </div>

              {/* Bhashini Multilingual Dual View */}
              {analysisResult.translation && analysisResult.translation.is_translated && (
                <div className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                      <FileCheck className="h-3.5 w-3.5 text-purple-600" />
                      Section 65B Certified English Translation:
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      From {analysisResult.translation.source_language_name}
                    </Badge>
                  </div>
                  <p className="text-purple-950 dark:text-purple-200 leading-relaxed font-serif italic">
                    &quot;{analysisResult.translation.translated_text}&quot;
                  </p>
                </div>
              )}

              {/* Extracted Entities Grid */}
              {/* Institution Verification & Override Card */}
              {(() => {
                const activeCollege = institutions.find((i) => i.id === selectedInstitutionId);
                const displayedCollegeName = activeCollege ? activeCollege.name : analysisResult.extracted_college.name;
                const displayedAicteId = activeCollege ? activeCollege.aicte_permanent_id : (analysisResult.extracted_college.aicte_permanent_id || "AICTE Affiliated");
                const displayedLocation = activeCollege ? `${activeCollege.district}, ${activeCollege.state}` : (analysisResult.extracted_college.state || "National Jurisdiction");
                const isConfidenceLow = !analysisResult.extracted_college.is_database_match || analysisResult.extracted_college.confidence < 0.85;
                const isOverridden = Boolean(selectedInstitutionId && selectedInstitutionId !== analysisResult.extracted_college.id);

                const filteredInstitutions = institutions.filter((inst) => {
                  if (!collegeSearchQuery.trim()) return true;
                  const q = collegeSearchQuery.toLowerCase();
                  return (
                    inst.name.toLowerCase().includes(q) ||
                    inst.aicte_permanent_id.toLowerCase().includes(q) ||
                    inst.state.toLowerCase().includes(q) ||
                    inst.district.toLowerCase().includes(q)
                  );
                });

                return (
                  <div className="space-y-2">
                    {isConfidenceLow && !isOverridden && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2.5">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-semibold">Verify Target Institution</p>
                          <p className="text-[11px] opacity-90 mt-0.5">
                            AI extracted this institution with partial confidence ({Math.round(analysisResult.extracted_college.confidence * 100)}%). If this is not your exact college (especially when submitting in Hindi/vernacular), click <strong>&quot;Change / Correct College&quot;</strong> below to pick the right registered college.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="p-3.5 rounded-xl border border-rule bg-surface/90 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                          Institution / College Affiliation
                        </div>
                        <div className="flex items-center gap-2">
                          {isOverridden ? (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 border-blue-300 text-[10px]">
                              User Verified
                            </Badge>
                          ) : isConfidenceLow ? (
                            <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-300 text-[10px]">
                              ⚠️ AI Deduction ({Math.round(analysisResult.extracted_college.confidence * 100)}%)
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 border-emerald-300 text-[10px]">
                              AI Match ({Math.round(analysisResult.extracted_college.confidence * 100)}%)
                            </Badge>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsChangingCollege(!isChangingCollege)}
                            className="h-6 px-2 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 gap-1"
                          >
                            <Edit3 className="h-3 w-3" />
                            {isChangingCollege ? "Close" : "Change / Correct College"}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <div className="font-semibold text-ink text-sm">
                          {displayedCollegeName}
                        </div>
                        <div className="text-[11px] text-text-secondary flex items-center gap-3 mt-0.5">
                          <span className="font-mono">AICTE: {displayedAicteId}</span>
                          <span>•</span>
                          <span>{displayedLocation}</span>
                        </div>
                      </div>

                      {/* Interactive College Picker Dropdown */}
                      {isChangingCollege && (
                        <div className="pt-2 border-t border-rule/60 space-y-2 mt-2">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-secondary" />
                            <Input
                              placeholder="Search AICTE colleges by name, city, state, or ID..."
                              value={collegeSearchQuery}
                              onChange={(e) => setCollegeSearchQuery(e.target.value)}
                              className="h-8 pl-8 text-xs border-rule"
                              autoFocus
                            />
                          </div>

                          <div className="max-h-48 overflow-y-auto space-y-1 pr-1 border border-rule/50 rounded-lg p-1 bg-surface-muted/30">
                            {filteredInstitutions.length === 0 ? (
                              <div className="p-3 text-center text-[11px] text-text-secondary">
                                No registered AICTE institutions found matching &quot;{collegeSearchQuery}&quot;
                              </div>
                            ) : (
                              filteredInstitutions.map((inst) => {
                                const isSelected = inst.id === selectedInstitutionId;
                                return (
                                  <button
                                    key={inst.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedInstitutionId(inst.id);
                                      setIsChangingCollege(false);
                                      toast.success(`Assigned to ${inst.name}`);
                                    }}
                                    className={`w-full text-left p-2 rounded-md transition-colors flex items-center justify-between text-xs ${
                                      isSelected
                                        ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800"
                                        : "hover:bg-surface-hover text-ink"
                                    }`}
                                  >
                                    <div>
                                      <div className="font-medium">{inst.name}</div>
                                      <div className="text-[10px] text-text-secondary">
                                        AICTE: {inst.aicte_permanent_id} • {inst.district}, {inst.state}
                                      </div>
                                    </div>
                                    {isSelected && <Check className="h-4 w-4 text-indigo-600 shrink-0" />}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Extracted Triage Grid (Bureau, Priority, Category) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {/* Bureau */}
                <div className="p-3 rounded-xl border border-rule bg-surface space-y-1">
                  <div className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Autonomous Bureau Routing
                  </div>
                  <div className="font-semibold text-purple-600 dark:text-purple-400">
                    {analysisResult.bureau_routing.bureau_name} ({analysisResult.bureau_routing.bureau_code})
                  </div>
                  <div className="text-[10px] text-text-secondary">
                    {Math.round(analysisResult.bureau_routing.confidence * 100)}% Confidence
                  </div>
                </div>

                {/* Priority */}
                <div className="p-3 rounded-xl border border-rule bg-surface space-y-1">
                  <div className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Assigned Priority &amp; SLA
                  </div>
                  <div className="font-semibold text-amber-600">
                    {analysisResult.priority_assignment.priority} Priority
                  </div>
                  <div className="text-[10px] text-text-secondary">
                    {analysisResult.priority_assignment.sla_hours}h Turnaround SLA
                  </div>
                </div>

                {/* Category */}
                <div className="p-3 rounded-xl border border-rule bg-surface space-y-1">
                  <div className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    Grievance Category
                  </div>
                  <div className="font-semibold text-ink">
                    {analysisResult.categorization.category}
                  </div>
                  <div className="text-[10px] text-text-secondary">
                    {Math.round(analysisResult.categorization.confidence * 100)}% Match
                  </div>
                </div>
              </div>

              {/* Rationale Insight */}
              <div className="p-3 rounded-xl border border-rule/80 text-xs space-y-1">
                <div className="text-[10px] text-text-secondary uppercase font-semibold">
                  Autonomous Statutory Rationale
                </div>
                <p className="text-text-secondary leading-relaxed">
                  {analysisResult.bureau_routing.routing_rationale}
                </p>
              </div>

              <Button
                onClick={handleDocket}
                disabled={isIngesting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 gap-2 font-medium shadow-xs"
              >
                {isIngesting ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Confirm AI Classification &amp; Docket Case
              </Button>
            </div>
          ) : (
            <div className="text-center py-20 bg-white/50 dark:bg-[#07050E]/50 border border-dashed border-rule rounded-2xl space-y-3">
              <div className="h-12 w-12 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center mx-auto">
                <Wand2 className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-base font-semibold text-ink">
                Extraction Preview Pending
              </h3>
              <p className="text-xs text-text-secondary max-w-sm mx-auto">
                Select one of the preset scenarios or paste freeform grievance text on the left, then click &quot;Analyze Grievance&quot;.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
